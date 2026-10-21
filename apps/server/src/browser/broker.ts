import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type Server } from 'node:net';
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  realpathSync,
  unlinkSync,
  lstatSync,
  chmodSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { localFixtureOrigin } from '../testing/local-fixture-origin.js';
import { Store } from '../db.js';
import { DomainError, hash, id } from '../util.js';
import { inspectMime, decodeSubject } from '../gmail/inspection.js';
import type { FrozenMessage } from '../providers.js';
import {
  browserDescriptorName,
  browserReceiptSchema,
  composeObservationSchema,
  executionScopeSchema,
  type BrowserExecutionScope,
  type BrowserPayload,
  type BrowserSendResult,
} from './contracts.js';

type Pending = {
  scope: BrowserExecutionScope;
  payload: BrowserPayload;
  guard: () => void;
  resolve: (v: BrowserSendResult) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
export class BrowserDeliveryBroker {
  private pending = new Map<string, Pending>();
  private worker: { id: string; seen: number } | null = null;
  private server?: Server;
  private secret = randomBytes(32).toString('hex');
  private backendId = id();
  private manualGeneration = id();
  private scope(): BrowserExecutionScope {
    const context = this.store.get<any>('browserExecutionContext', null);
    return context?.state === 'RUNNING'
      ? {
          kind: 'BATCH',
          backendId: this.backendId,
          generation: context.generation ?? context.sessionId,
          sessionId: context.sessionId,
          batchId: context.batchId,
        }
      : { kind: 'MANUAL', backendId: this.backendId, generation: this.manualGeneration };
  }
  private assertScope(raw?: unknown, pending?: Pending) {
    const current = this.scope();
    // Compatibility for direct manual callers only. IPC always supplies scope.
    const expected =
      raw === undefined && current.kind === 'MANUAL' ? current : executionScopeSchema.parse(raw);
    if (
      JSON.stringify(expected) !== JSON.stringify(current) ||
      (pending && JSON.stringify(pending.scope) !== JSON.stringify(expected))
    )
      throw new DomainError('BROWSER_SESSION_CHANGED', 'Zakres wykonawcy zmienił się.');
  }
  private descriptor?: string;
  constructor(
    private store: Store,
    private options: {
      clock?: () => number;
      timeoutMs?: number;
      allowFixture?: boolean;
      fixtureOrigin?: string;
    } = {},
  ) {
    if (options.fixtureOrigin) localFixtureOrigin(options.fixtureOrigin);
    // Never resume a UI action after process loss. COMMITTING means it may have clicked.
    store.exec(
      "UPDATE browser_deliveries SET state=CASE WHEN state='COMMITTING' THEN 'SEND_UNKNOWN' ELSE 'FAILED_NOT_SENT' END,updated_at=? WHERE state IN ('WAITING','CLAIMED','COMMITTING')",
      this.now(),
    );
  }
  private time() {
    return this.options.clock?.() ?? Date.now();
  }
  private now() {
    return new Date(this.time()).toISOString();
  }
  status() {
    return {
      connected: !!this.worker && this.time() - this.worker.seen < 45000,
      listening: !!this.server,
      pending: this.pending.size,
      backendId: this.backendId,
      scope: this.scope(),
      execution: this.store.get('browserExecutionContext', null),
    };
  }
  attach(workerId: string) {
    if (!/^[a-zA-Z0-9-]{8,100}$/.test(workerId))
      throw new DomainError('BROWSER_WORKER', 'Nieprawidłowy wykonawca.');
    if (this.worker?.id === workerId && !this.status().connected)
      throw new DomainError('BROWSER_LEASE_EXPIRED', 'Połączenie wykonawcy wygasło.');
    if (this.status().connected && this.worker!.id !== workerId)
      throw new DomainError('BROWSER_BUSY', 'Jeden wykonawca przeglądarki jest już podłączony.');
    this.worker = { id: workerId, seen: this.time() };
    return this.status();
  }
  private assertWorker(workerId: string) {
    if (!this.status().connected || this.worker?.id !== workerId)
      throw new DomainError('BROWSER_WORKER', 'Połączenie wykonawcy wygasło.');
    this.worker.seen = this.time();
  }
  release(workerId: string) {
    if (this.worker?.id !== workerId)
      throw new DomainError('BROWSER_WORKER', 'To nie jest własny lease.');
    for (const jobId of this.pending.keys())
      if (
        this.store.one('SELECT worker_id FROM browser_deliveries WHERE id=?', jobId)?.worker_id ===
        workerId
      )
        this.fail(jobId);
    this.worker = null;
    return { released: true };
  }
  private assertURL(value: string) {
    const u = new URL(value);
    if (this.options.fixtureOrigin) {
      if (u.origin !== this.options.fixtureOrigin)
        throw new DomainError('BROWSER_ORIGIN', 'Inna strona testowa.');
      return;
    }
    if (
      u.origin !== 'https://mail.google.com' &&
      !(this.options.allowFixture && u.hostname === '127.0.0.1')
    )
      throw new DomainError('BROWSER_ORIGIN', 'Nie jest to dozwolony widok Gmaila.');
  }
  async send(input: FrozenMessage, sender: string, guard: () => void) {
    if (!this.status().connected)
      throw new DomainError(
        'FAILED_NOT_SENT',
        'Podłącz wykonawcę Codexa przed wysyłką przez przeglądarkę.',
      );
    try {
      guard();
    } catch {
      throw new DomainError(
        'FAILED_NOT_SENT',
        'Odwołano prawo przed przekazaniem akcji przeglądarce.',
      );
    }
    const attempt = this.store.one(
      'SELECT * FROM send_attempts WHERE message_id=?',
      input.messageId,
    );
    if (
      !attempt ||
      attempt.state !== 'SENDING' ||
      attempt.mime_hash !== hash(input.mime) ||
      attempt.account_email !== sender ||
      attempt.recipient !== input.recipient
    )
      throw new DomainError('FAILED_NOT_SENT', 'Brak zgodnej rezerwacji wysyłki.');
    if (this.store.one('SELECT id FROM browser_deliveries WHERE outbox_id=?', attempt.outbox_id))
      throw new DomainError('SEND_UNKNOWN', 'Ta próba ma już zapis przeglądarki; nie ponawiaj.');
    const mime = inspectMime(input.mime);
    const plain = mime.parts.filter((p) => p.type === 'text/plain' && !p.filename);
    const pdfs = mime.parts.filter((p) => p.type === 'application/pdf');
    if (plain.length !== 1 || pdfs.length > 1)
      throw new DomainError('FAILED_NOT_SENT', 'Nieprawidłowy materiał wiadomości.');
    const jobId = id();
    let attachment: BrowserPayload['attachment'] = null;
    if (pdfs.length) {
      const dir = join(this.store.dir, 'browser-artifacts', jobId);
      mkdirSync(dir, { recursive: true, mode: 0o700 });
      const name = pdfs[0].filename;
      if (!name || basename(name) !== name || /[\\/\x00-\x1f]/u.test(name))
        throw new DomainError('FAILED_NOT_SENT', 'Nieprawidłowa nazwa załącznika.');
      const path = join(dir, name);
      writeFileSync(path, pdfs[0].bytes, { flag: 'wx', mode: 0o600 });
      attachment = { path, name, sha256: hash(pdfs[0].bytes), bytes: pdfs[0].bytes.length };
    }
    const content = {
      id: jobId,
      outboxId: attempt.outbox_id as string,
      sender,
      recipient: input.recipient,
      subject: decodeSubject(mime.headers.subject[0]),
      body: plain[0].text!.replace(/\r\n/g, '\n'),
      attachment,
    };
    const payload: BrowserPayload = { ...content, payloadHash: hash(JSON.stringify(content)) };
    this.store.exec(
      "INSERT INTO browser_deliveries (id,outbox_id,state,payload_hash,payload_json,created_at,updated_at) VALUES (?,?, 'WAITING',?,?,?,?)",
      jobId,
      attempt.outbox_id,
      payload.payloadHash,
      JSON.stringify(payload),
      this.now(),
      this.now(),
    );
    return new Promise<BrowserSendResult>((resolve, reject) => {
      const timer = setTimeout(() => this.fail(jobId), this.options.timeoutMs ?? 10 * 60000);
      this.pending.set(jobId, { payload, guard, resolve, reject, timer, scope: this.scope() });
    });
  }
  claim(workerId: string, scope?: unknown) {
    this.assertWorker(workerId);
    this.assertScope(scope);
    const row = this.store.one(
      "SELECT * FROM browser_deliveries WHERE state='WAITING' ORDER BY created_at LIMIT 1",
    );
    if (!row) return null;
    const pending = this.pending.get(row.id);
    if (!pending)
      throw new DomainError('BROWSER_STALE', 'Zadanie nie należy do bieżącego procesu.');
    this.assertScope(scope, pending);
    try {
      pending.guard();
    } catch {
      this.fail(row.id);
      return null;
    }
    this.store.exec(
      "UPDATE browser_deliveries SET state='CLAIMED',worker_id=?,updated_at=? WHERE id=? AND state='WAITING'",
      workerId,
      this.now(),
      row.id,
    );
    return pending.payload;
  }
  authorize(workerId: string, jobId: string, raw: unknown, scope?: unknown) {
    this.assertWorker(workerId);
    const row = this.store.one('SELECT * FROM browser_deliveries WHERE id=?', jobId);
    const p = this.pending.get(jobId);
    if (!p || row?.state !== 'CLAIMED' || row.worker_id !== workerId)
      throw new DomainError('BROWSER_STALE', 'Brak aktualnej zgody na tę akcję.');
    this.assertScope(scope, p);
    const o = composeObservationSchema.parse(raw),
      expected = p.payload;
    this.assertURL(o.url);
    if (
      o.sender.toLowerCase() !== expected.sender.toLowerCase() ||
      o.to.length !== 1 ||
      o.to[0].toLowerCase() !== expected.recipient.toLowerCase() ||
      o.cc.length ||
      o.bcc.length ||
      o.subject !== expected.subject ||
      o.body.replace(/\r\n/g, '\n') !== expected.body ||
      o.attachments.length !== (expected.attachment ? 1 : 0) ||
      o.attachments.some((a) => !a.complete || a.name !== expected.attachment?.name)
    )
      throw new DomainError(
        'BROWSER_CONTENT_CHANGED',
        'Pola Gmaila nie odpowiadają zatwierdzonej wiadomości.',
      );
    if (
      expected.attachment &&
      hash(readFileSync(expected.attachment.path)) !== expected.attachment.sha256
    )
      throw new DomainError('CV_CHANGED', 'Plik do przesłania zmienił się.');
    p.guard();
    this.store.exec(
      "UPDATE browser_deliveries SET state='COMMITTING',compose_id=?,committed_at=?,updated_at=? WHERE id=? AND state='CLAIMED'",
      o.composeId,
      this.now(),
      this.now(),
      jobId,
    );
    return { authorized: true as const, jobId, payloadHash: expected.payloadHash };
  }
  check(workerId: string, jobId: string, scope?: unknown) {
    this.assertWorker(workerId);
    const row = this.store.one('SELECT * FROM browser_deliveries WHERE id=?', jobId),
      p = this.pending.get(jobId);
    if (
      !p ||
      row?.state !== 'COMMITTING' ||
      row.worker_id !== workerId ||
      row.click_granted_at ||
      this.time() - Date.parse(row.committed_at) > 30000
    )
      throw new DomainError('BROWSER_STALE', 'Uprawnienie do akcji wygasło.');
    this.assertScope(scope, p);
    p.guard();
    this.store.exec(
      'UPDATE browser_deliveries SET click_granted_at=?,updated_at=? WHERE id=?',
      this.now(),
      this.now(),
      jobId,
    );
    return { authorized: true as const };
  }
  complete(workerId: string, jobId: string, raw: unknown) {
    this.assertWorker(workerId);
    const row = this.store.one('SELECT * FROM browser_deliveries WHERE id=?', jobId),
      p = this.pending.get(jobId);
    if (!p || row?.state !== 'COMMITTING' || row.worker_id !== workerId || !row.click_granted_at)
      throw new DomainError('BROWSER_STALE', 'Ta próba została już zakończona lub przerwana.');
    const receipt = browserReceiptSchema.parse(raw);
    this.assertURL(receipt.url);
    this.store.exec(
      "UPDATE browser_deliveries SET state='ACKNOWLEDGED',receipt_json=?,updated_at=? WHERE id=?",
      JSON.stringify(receipt),
      this.now(),
      jobId,
    );
    clearTimeout(p.timer);
    this.pending.delete(jobId);
    p.resolve({ id: receipt.candidateId, threadId: null, confirmed: false });
    return { recorded: true };
  }
  fail(jobId: string) {
    const p = this.pending.get(jobId);
    if (!p) return;
    const row = this.store.one('SELECT state FROM browser_deliveries WHERE id=?', jobId);
    // Cleanup must never downgrade an already uncertain/accepted persisted result.
    const unknown = !row || ['COMMITTING', 'SEND_UNKNOWN', 'ACKNOWLEDGED'].includes(row.state);
    this.store.exec(
      'UPDATE browser_deliveries SET state=?,updated_at=? WHERE id=?',
      unknown ? 'SEND_UNKNOWN' : 'FAILED_NOT_SENT',
      this.now(),
      jobId,
    );
    clearTimeout(p.timer);
    this.pending.delete(jobId);
    p.reject(
      new DomainError(
        unknown ? 'SEND_UNKNOWN' : 'FAILED_NOT_SENT',
        unknown
          ? 'Niepewny wynik akcji przeglądarki. Nie ponawiaj.'
          : 'Nie rozpoczęto akcji Wyślij w przeglądarce.',
      ),
    );
  }
  cancel() {
    for (const jobId of this.pending.keys()) this.fail(jobId);
  }
  async listen() {
    if (this.server) return;
    const address =
      process.platform === 'win32'
        ? `\\\\.\\pipe\\jobhunter-browser-${id()}`
        : join(realpathSync(tmpdir()), `jh-${randomBytes(8).toString('hex')}.sock`);
    const descriptor = join(realpathSync(this.store.dir), browserDescriptorName);
    // The profile lock ensures a single backend. Only remove an ordinary stale descriptor.
    if (existsSync(descriptor)) {
      if (!lstatSync(descriptor).isFile() || lstatSync(descriptor).isSymbolicLink())
        throw new DomainError('BROWSER_DESCRIPTOR', 'Nieprawidłowy plik połączenia wykonawcy.');
      unlinkSync(descriptor);
    }
    this.server = createServer((socket) => {
      let data = '',
        processed = false;
      socket.setEncoding('utf8');
      socket.setTimeout(10000, () => socket.destroy());
      socket.on('error', () => {});
      socket.on('data', (chunk) => {
        if (processed) return;
        data += chunk;
        if (Buffer.byteLength(data) > 200000) {
          socket.destroy();
          return;
        }
        if (!data.includes('\n')) return;
        processed = true;
        try {
          const req = JSON.parse(data.slice(0, data.indexOf('\n')));
          const supplied = Buffer.from(typeof req.secret === 'string' ? req.secret : '');
          const wanted = Buffer.from(this.secret);
          if (supplied.length !== wanted.length || !timingSafeEqual(supplied, wanted))
            throw Error('AUTH');
          let result: unknown;
          switch (req.op) {
            case 'attach':
              result = this.attach(req.workerId);
              break;
            case 'next':
              result = this.claim(req.workerId, executionScopeSchema.parse(req.scope));
              break;
            case 'release':
              result = this.release(req.workerId);
              break;
            case 'authorize':
              result = this.authorize(
                req.workerId,
                req.jobId,
                req.observation,
                executionScopeSchema.parse(req.scope),
              );
              break;
            case 'check':
              result = this.check(req.workerId, req.jobId, executionScopeSchema.parse(req.scope));
              break;
            case 'complete':
              result = this.complete(req.workerId, req.jobId, req.receipt);
              break;
            case 'fail':
              this.assertWorker(req.workerId);
              if (
                this.store.one('SELECT worker_id FROM browser_deliveries WHERE id=?', req.jobId)
                  ?.worker_id !== req.workerId
              )
                throw Error('WORKER');
              this.fail(req.jobId);
              result = { recorded: true };
              break;
            default:
              throw Error('OPERATION');
          }
          socket.end(JSON.stringify({ ok: true, result }) + '\n');
        } catch (e) {
          socket.end(
            JSON.stringify({
              ok: false,
              code: e instanceof DomainError ? e.code : 'BROWSER_REQUEST',
            }) + '\n',
          );
        }
      });
    });
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(address, resolve);
    });
    if (process.platform !== 'win32') chmodSync(address, 0o600);
    this.descriptor = descriptor;
    try {
      writeFileSync(this.descriptor, JSON.stringify({ address, secret: this.secret }), {
        mode: 0o600,
        flag: 'wx',
      });
    } catch (e) {
      await this.close();
      throw e;
    }
  }
  async close() {
    this.cancel();
    this.worker = null;
    if (this.server) await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    this.server = undefined;
    if (this.descriptor && existsSync(this.descriptor)) {
      try {
        if (JSON.parse(readFileSync(this.descriptor, 'utf8')).secret === this.secret)
          unlinkSync(this.descriptor);
      } catch {}
    }
  }
}
