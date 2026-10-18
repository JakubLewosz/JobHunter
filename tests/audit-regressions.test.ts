import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';
import {
  analysisSchema,
  validateAnalysis,
  contactEligibility,
} from '../apps/server/src/research/contracts.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import {
  GmailBrowserExecutor,
  serveBrowserDeliveries,
} from '../apps/server/src/browser/executor.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';
import { setup as autoSetup } from './auto-fixture.js';
const diagnostic = (t: TestContext, id: string, data: any) =>
  t.diagnostic(JSON.stringify({ audit: id, ...data }));
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};
const sourceReader = (html: string) =>
  new PublicSourceReader({
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => ({ status: 200, contentType: 'text/html', body: html }),
  });
const activity =
  '<p>Fixture Company. Tworzymy aplikacje webowe, automatyzacje i integracje API.</p>';
async function decision(html: string, email: string, kind = 'GENERAL') {
  const source = await sourceReader(activity + html).read('https://fixture.example.test/');
  const runner = new FixtureRunner();
  runner.prospect = true;
  const a: any = (
    await runner.run(
      'Wydobądź firmę Dane: ' + JSON.stringify([{ id: source.id, url: source.final_url }]),
      analysisSchema,
    )
  ).value;
  a.contact = {
    email,
    kind,
    proof: {
      sourceId: source.id,
      quote: kind === 'RECRUITMENT' ? 'Rekrutacja ' + email : email,
      explanation: 'Synthetic literal proof',
    },
  };
  try {
    const verified = validateAnalysis(a, [source]);
    return { source, decision: contactEligibility(verified, [source]) };
  } catch {
    return { source, decision: { allowed: false, reason: 'UNVERIFIED_SOURCE' } };
  }
}
async function mailFixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-audit-mail-')),
    store = new Store(dir),
    gateway = new FixtureGmail();
  const runner = new FixtureRunner(),
    reader = new FixtureReader(),
    service = new GmailJobHunter(store, {
      gateway,
      accountInfo: () => gateway.info,
      runner,
      reader,
    });
  t.after(async () => {
    await service.browserDelivery.close();
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const draft = service.draftRows()[0];
  assert.ok(draft);
  service.reviewDraft(draft.id, draft.version);
  const cv = service.uploadCV(
    'Synthetic.pdf',
    Buffer.from('%PDF-1.4\nfictional\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  return { dir, store, gateway, service, draft, cv };
}
const counts = (f: any) => ({
  stopped: f.service.state().stopped,
  senderPaused: f.store.get('gmailSenderPaused', true),
  memoryAuthority: (f.service as any).sessionEnabled ?? null,
  activeApprovals: f.store.one('SELECT count(*) n FROM draft_approvals WHERE revoked_at IS NULL')!
    .n,
  outbox: f.store.all('SELECT status,count(*) n FROM outbox GROUP BY status'),
  attempts: f.store.all('SELECT state,count(*) n FROM send_attempts GROUP BY state'),
  posts: f.gateway.posts.length,
});
test('A01 identity: blocked name C001 combined with domain C002 must conflict', async (t) => {
  const f = await autoSetup(t, true, false, false, true);
  const a = f.service.findOrCreateCompany('Synthetic Company A', null).company;
  const b = f.service.findOrCreateCompany('Synthetic Company B', 'b.example.test').company;
  f.service.suppress(a.id, 'OPT_OUT', 'Synthetic block', 'user');
  let chosen: any,
    error: string | null = null;
  try {
    chosen = f.service.findKnownCompany('Synthetic Company A', 'b.example.test');
  } catch (e: any) {
    error = e.code;
  }
  diagnostic(t, 'A01', {
    chosen: chosen?.id === a.id ? 'C001' : chosen?.id === b.id ? 'C002' : null,
    error,
    blockedC001: true,
  });
  assert.equal(error, 'COMPANY_IDENTITY_CONFLICT');
});
for (const reversed of [false, true])
  test('A02 table billing label ' + (reversed ? 'before' : 'after') + ' address', async (t) => {
    const email = 'kontakt@fixture.example.test',
      label = '<td>Faktury i rozliczenia</td>',
      cell = '<td>' + email + '</td>';
    const r = await decision(
      '<table><tr>' + (reversed ? label + cell : cell + label) + '</tr></table>',
      email,
    );
    diagnostic(t, 'A02', {
      reversed,
      allowed: r.decision.allowed,
      contextHasBilling: JSON.parse(r.source.address_contexts!).some((c: any) =>
        /Faktury/.test(c.text),
      ),
    });
    assert.equal(r.decision.allowed, false);
  });
test('A02 separate valid HR remains eligible next to billing table', async (t) => {
  const r = await decision(
    '<section><h2>Rekrutacja</h2>hr@fixture.example.test</section><table><tr><td>kontakt@fixture.example.test</td><td>Faktury i rozliczenia</td></tr></table>',
    'hr@fixture.example.test',
    'RECRUITMENT',
  );
  diagnostic(t, 'A02-HR', { allowed: r.decision.allowed });
  assert.equal(r.decision.allowed, true);
});
test('A03 refusal beyond stored text limit must not authorize contact', async (t) => {
  const html =
    '<section>Kontakt ogólny kontakt@fixture.example.test</section><p>' +
    'x'.repeat(101000) +
    '</p><p>Nie przyjmujemy kandydatur</p>';
  const r = await decision(html, 'kontakt@fixture.example.test');
  diagnostic(t, 'A03', {
    status: r.source.status,
    textLength: r.source.text.length,
    refusalRetained: r.source.text.includes('Nie przyjmujemy'),
    allowed: r.decision.allowed,
    hasCompletenessField: 'complete' in r.source || 'truncated' in r.source,
  });
  assert.equal(r.decision.allowed, false);
});
test('A04 reader recovers in the same instance after three synthetic TLS failures', async (t) => {
  let healthy = false,
    calls = 0;
  const options = {
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async () => {
      calls++;
      if (!healthy)
        throw Object.assign(new Error('Synthetic TLS'), {
          code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
        });
      return { status: 200, contentType: 'text/html', body: '<p>Synthetic healthy transport</p>' };
    },
  };
  const reader = new PublicSourceReader(options),
    states = [];
  for (const host of ['a', 'b', 'c'])
    states.push((await reader.read('https://' + host + '.example.test/')).status);
  healthy = true;
  const probe = await reader.recover([
    'https://probe.example.test/',
    'https://probe2.example.test/',
  ]);
  assert.equal(probe.ok, true);
  const recovered = await reader.read('https://d.example.test/'),
    callsAfterSame = calls;
  const fresh = await new PublicSourceReader(options).read('https://e.example.test/');
  diagnostic(t, 'A04', {
    states,
    sameInstance: recovered.status,
    callsBeforeFresh: callsAfterSame,
    newInstance: fresh.status,
    totalTransportCalls: calls,
  });
  assert.equal(recovered.status, 'READ');
});
test('A05 short cycle budget should finish cycle while long session remains active', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-audit-budget-')),
    store = new Store(dir),
    runner = new FixtureRunner(),
    reader = new FixtureReader();
  let time = Date.now();
  const service = new ResearchJobHunter(store, { runner, reader, clock: () => new Date(time) });
  t.after(async () => {
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  await service.probe('search');
  await service.startDay('Synthetic search', 8);
  const original = AbortSignal.timeout,
    controller = new AbortController();
  let budget: number | null = null;
  store.exec(
    'UPDATE research_run_config SET elapsed_ms=(SELECT duration_minutes*60000 FROM campaigns WHERE id=?) - 500',
    'research',
  );
  (AbortSignal as any).timeout = (ms: number) => {
    budget = ms;
    return controller.signal;
  };
  runner.beforeCall = async () => {
    time += 1000;
    controller.abort(new DOMException('Synthetic cycle budget', 'TimeoutError'));
  };
  try {
    await service.tick();
  } finally {
    (AbortSignal as any).timeout = original;
  }
  const w = store.get<any>('researchDay', {});
  diagnostic(t, 'A05', {
    budgetMs: budget,
    active: w.active,
    paused: service.state().paused,
    stopped: service.state().stopped,
    finalReason: w.finalReason,
    deadlineStillInFuture: Date.parse(w.expiresAt) > time,
    runError: store.one('SELECT error FROM runs')?.error,
  });
  assert.equal(w.active, true);
});
test('A06 manual approval awaiting account cannot create live approval after Stop', async (t) => {
  const f = await mailFixture(t),
    p = await f.service.prepareDelivery({
      drafts: [{ id: f.draft.id, version: f.draft.version }],
      cvId: f.cv.id,
      kind: 'SELF_TEST',
    });
  const entered = deferred(),
    release = deferred();
  f.gateway.account = async () => {
    entered.resolve();
    await release.promise;
    return f.gateway.info;
  };
  let approvalError: string | null = null;
  const approving = f.service
    .approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true })
    .catch((e: any) => {
      approvalError = e.code ?? e.message;
    });
  await entered.promise;
  f.service.control('stop');
  const afterStop = counts(f);
  release.resolve();
  await approving;
  const afterApproval = counts(f);
  await f.service.dispatchOne();
  const afterDispatch = counts(f);
  diagnostic(t, 'A06', { approvalError, afterStop, afterApproval, afterDispatch });
  assert.equal(afterDispatch.posts, 0);
  assert.equal(afterApproval.activeApprovals, 0);
});
test('A06 manual SQLite failure during Stop while approval awaits account', async (t) => {
  const f = await mailFixture(t),
    p = await f.service.prepareDelivery({
      drafts: [{ id: f.draft.id, version: f.draft.version }],
      cvId: f.cv.id,
      kind: 'SELF_TEST',
    });
  const entered = deferred(),
    release = deferred();
  f.gateway.account = async () => {
    entered.resolve();
    await release.promise;
    return f.gateway.info;
  };
  let approvalError: string | null = null,
    stopError: string | null = null;
  const approving = f.service
    .approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true })
    .catch((e: any) => {
      approvalError = e.code ?? e.message;
    });
  await entered.promise;
  const exec = f.store.exec.bind(f.store);
  f.store.exec = () => {
    throw Error('SYNTHETIC_DATABASE_WRITE_FAILURE');
  };
  try {
    f.service.control('stop');
  } catch (e: any) {
    stopError = e.message;
  } finally {
    f.store.exec = exec;
  }
  const afterStop = counts(f);
  release.resolve();
  await approving;
  await f.service.dispatchOne();
  diagnostic(t, 'A06-MANUAL-SQLITE', {
    stopError,
    approvalError,
    afterStop,
    afterDispatch: counts(f),
  });
  assert.equal(f.gateway.posts.length, 0);
});
test('A06 AUTO waiting in inherited approval preserves revoked memory authority', async (t) => {
  const f = await autoSetup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  const entered = deferred(),
    release = deferred();
  let held = false;
  const account = f.gateway.account;
  f.gateway.account = async () => {
    if (!held && f.store.one('SELECT id FROM gmail_previews WHERE approved_at IS NULL')) {
      held = true;
      entered.resolve();
      await release.promise;
    }
    return account();
  };
  const dispatch = f.service.dispatchOne();
  await Promise.race([
    entered.promise,
    new Promise((_, rej) => setTimeout(() => rej(Error('SYNTHETIC_HOLD_NOT_REACHED')), 10000)),
  ]);
  f.service.control('stop');
  const afterStop = counts(f);
  release.resolve();
  await dispatch;
  await f.service.dispatchOne();
  diagnostic(t, 'A06-AUTO', { held, afterStop, afterDispatch: counts(f) });
  assert.equal(f.gateway.posts.length, 0);
  assert.equal((f.service as any).sessionEnabled, false);
});
test('A06 SQLite failure during Stop still revokes AUTO before final POST gate', async (t) => {
  const f = await autoSetup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  f.advance();
  const exec = f.store.exec.bind(f.store);
  let stopError: string | null = null,
    authorityAfterFailure: any = null;
  f.gateway.beforePost = async () => {
    f.store.exec = () => {
      throw Error('SYNTHETIC_DATABASE_WRITE_FAILURE');
    };
    try {
      f.service.control('stop');
    } catch (e: any) {
      stopError = e.message;
    } finally {
      authorityAfterFailure = (f.service as any).sessionEnabled;
      f.store.exec = exec;
    }
  };
  await f.service.dispatchOne();
  diagnostic(t, 'A06-SQLITE', { stopError, authorityAfterFailure, ...counts(f) });
  assert.equal(authorityAfterFailure, false);
  assert.equal(f.gateway.posts.length, 0);
});
test('A07 actual loss of only synthetic profile lock blocks final gate', async (t) => {
  const f = await autoSetup(t, true, false, false, true),
    lock = acquireProfileLock(f.dir);
  const path = join(f.dir, 'profile.lock', 'owner.json'),
    owner = readFileSync(path);
  let observedCode: string | null = null;
  f.store.assertExclusive = () => {
    try {
      lock.assert();
    } catch (e: any) {
      observedCode = e.code;
      throw e;
    }
  };
  try {
    await f.service.startAuto();
    await f.service.tick();
    f.advance();
    f.gateway.beforePost = async () => {
      writeFileSync(path, JSON.stringify({ pid: process.pid, instance: 'synthetic-lost' }));
    };
    await f.service.dispatchOne();
    diagnostic(t, 'A07', { observedCode, ...counts(f) });
  } finally {
    writeFileSync(path, owner);
    lock.release();
    f.store.assertExclusive = () => {};
  }
  assert.equal(observedCode, 'PROFILE_LOCK_LOST');
  assert.equal(f.gateway.posts.length, 0);
});
const observation = (p: any) => ({
  url: 'https://mail.google.com/mail/u/0/#inbox',
  composeId: 'synthetic-compose',
  sender: p.sender,
  to: [p.recipient],
  cc: [],
  bcc: [],
  subject: p.subject,
  body: p.body,
  attachments: p.attachment ? [{ name: p.attachment.name, complete: true }] : [],
});
for (const phase of [
  'idle',
  'completed',
  'CLAIMED',
  'COMMITTING',
  'CHECK_GRANTED',
  'CLICKED',
  'RECEIPT',
] as const)
  test('A08 full synthetic browser IPC close ' + phase, async (t) => {
    const f = await mailFixture(t);
    await f.service.setSendTransport({
      transport: 'GMAIL_BROWSER',
      confirmed: true,
      outgoingViewConsent: true,
    });
    await f.service.browserDelivery.listen();
    const client = new BrowserExecutorClient(f.dir);
    await client.attach();
    let dispatch: Promise<any> | null = null,
      actions = 0,
      claimed: any = null;
    if (phase !== 'idle') {
      const p = await f.service.prepareDelivery({
        drafts: [{ id: f.draft.id, version: f.draft.version }],
        cvId: f.cv.id,
        kind: 'SELF_TEST',
      });
      await f.service.approveDelivery({
        previewId: p.id,
        previewHash: p.previewHash,
        confirmed: true,
      });
      dispatch = f.service.dispatchOne();
      for (
        let i = 0;
        i < 200 && !f.store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'");
        i++
      )
        await new Promise((r) => setTimeout(r, 5));
      assert.ok(f.store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'"));
    }
    const next = client.next.bind(client),
      authorize = client.authorize.bind(client),
      complete = client.complete.bind(client),
      check = client.check.bind(client);
    client.check = async (jobId: string) => {
      const result = await check(jobId);
      if (phase === 'CHECK_GRANTED') await f.service.browserDelivery.close();
      return result;
    };
    client.next = async () => {
      const p = await next();
      claimed = p;
      if (phase === 'idle' && !p) await f.service.browserDelivery.close();
      return p;
    };
    client.authorize = async (...args: any[]) => {
      const r = await authorize(args[0], args[1]);
      if (phase === 'COMMITTING') await f.service.browserDelivery.close();
      return r;
    };
    client.complete = async (...args: any[]) => {
      const r = await complete(args[0], args[1]);
      if (phase === 'completed') {
        await dispatch;
        await f.service.browserDelivery.close();
      }
      return r;
    };
    const prepare = GmailBrowserExecutor.prototype.prepare,
      click = GmailBrowserExecutor.prototype.clickSend,
      receipt = GmailBrowserExecutor.prototype.receipt;
    GmailBrowserExecutor.prototype.prepare = async function (p: any) {
      if (phase === 'CLAIMED') await f.service.browserDelivery.close();
      return observation(p);
    };
    GmailBrowserExecutor.prototype.clickSend = async function (_o: any, before: any) {
      await before();
      actions++;
      if (phase === 'CLICKED' || phase === 'RECEIPT') await f.service.browserDelivery.close();
    };
    GmailBrowserExecutor.prototype.receipt = async function () {
      const attempt = f.store.one(
        'SELECT mime FROM send_attempts WHERE outbox_id=?',
        claimed.outboxId,
      )!;
      f.gateway.sentMessages.push({
        id: 'abcdef0123456789',
        threadId: 'synthetic-thread',
        labels: ['SENT'],
        from: [claimed.sender],
        to: [claimed.recipient],
        subject: claimed.subject,
        messageId: '<synthetic@example.test>',
        at: new Date().toISOString(),
        body: '',
        category: 'UNCLEAR',
        raw: attempt.mime,
      });
      return {
        acknowledged: true,
        url: 'https://mail.google.com/mail/u/0/#sent',
        candidateId: 'abcdef0123456789',
      };
    };
    let exception: string | null = null,
      result: any = null;
    try {
      result = await serveBrowserDeliveries(client, {} as any, 3000);
    } catch (e: any) {
      exception = e.code ?? e.message;
    } finally {
      GmailBrowserExecutor.prototype.prepare = prepare;
      GmailBrowserExecutor.prototype.clickSend = click;
      GmailBrowserExecutor.prototype.receipt = receipt;
      await f.service.browserDelivery.close();
      if (dispatch) await dispatch;
    }
    diagnostic(t, 'A08', {
      phase,
      exception,
      result,
      actions,
      browserState: f.store.one('SELECT state FROM browser_deliveries')?.state ?? null,
      ...counts(f),
    });
    assert.equal(exception, null);
    assert.equal(
      actions,
      ['completed', 'CHECK_GRANTED', 'CLICKED', 'RECEIPT'].includes(phase) ? 1 : 0,
    );
    if (phase === 'CLAIMED')
      assert.equal(f.store.one('SELECT state FROM send_attempts')?.state, 'FAILED_NOT_SENT');
    if (['COMMITTING', 'CHECK_GRANTED', 'CLICKED', 'RECEIPT'].includes(phase))
      assert.equal(f.store.one('SELECT state FROM send_attempts')?.state, 'SEND_UNKNOWN');
  });
