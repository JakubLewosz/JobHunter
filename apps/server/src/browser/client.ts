import { connect } from 'node:net';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { tmpdir, platform } from 'node:os';
import { randomUUID } from 'node:crypto';
import { browserDescriptorName } from './contracts.js';
import type {
  BrowserPayload,
  BrowserReceipt,
  ComposeObservation,
  BrowserExecutionScope,
} from './contracts.js';

// Private JobHunter IPC, NOT the Codex/panel launch token, cookies or OAuth store.
// Credentials stay inside this client; neither the descriptor nor payload is logged.
export class BrowserExecutorClient {
  private workerId = randomUUID();
  private backendSecret?: string;
  private scope?: BrowserExecutionScope;
  constructor(private profileDir: string) {}
  private async request(
    op: string,
    data: Record<string, unknown> = {},
    signal?: AbortSignal,
    onDispatch?: () => void,
  ): Promise<any> {
    signal?.throwIfAborted();
    const profile = resolve(this.profileDir);
    let d: any;
    try {
      d = JSON.parse(readFileSync(join(profile, browserDescriptorName), 'utf8'));
    } catch (e: any) {
      throw Error(e?.code === 'ENOENT' ? 'BROWSER_BACKEND_CLOSED' : 'BROWSER_DESCRIPTOR');
    }
    if (
      typeof d.secret !== 'string' ||
      !/^[a-f0-9]{64}$/.test(d.secret) ||
      typeof d.address !== 'string' ||
      !(platform() === 'win32'
        ? /^\\\\\.\\pipe\\jobhunter-browser-[a-f0-9-]+$/.test(d.address)
        : dirname(d.address) === realpathSync(tmpdir()) &&
          /^jh-[a-f0-9]{16}\.sock$/u.test(basename(d.address)))
    )
      throw Error('BROWSER_DESCRIPTOR');
    if (this.backendSecret && this.backendSecret !== d.secret)
      throw Error('BROWSER_SESSION_CHANGED');
    this.backendSecret ??= d.secret;
    return new Promise((resolve, reject) => {
      const socket = connect(d.address);
      let response = '',
        finished = false;
      const aborted = () => socket.destroy(Error('BROWSER_CANCELLED'));
      signal?.addEventListener('abort', aborted, { once: true });
      if (signal?.aborted) aborted();
      socket.setEncoding('utf8');
      socket.setTimeout(10000, () => {
        socket.destroy();
        reject(Error('BROWSER_TIMEOUT'));
      });
      socket.on('error', (e: any) =>
        reject(
          Error(
            ['ENOENT', 'ECONNREFUSED', 'ECONNRESET', 'EPIPE'].includes(e.code)
              ? 'BROWSER_BACKEND_CLOSED'
              : 'BROWSER_CONNECTION',
          ),
        ),
      );
      socket.on('connect', () => {
        if (signal?.aborted) return aborted();
        try {
          onDispatch?.();
          socket.write(
            JSON.stringify({ secret: d.secret, workerId: this.workerId, op, ...data }) + '\n',
          );
        } catch {
          aborted();
        }
      });
      socket.on('data', (chunk) => {
        response += chunk;
        if (Buffer.byteLength(response) > 200000) {
          socket.destroy();
          reject(Error('BROWSER_RESPONSE_LIMIT'));
        }
      });
      socket.on('end', () => {
        finished = true;
        try {
          const v = JSON.parse(response);
          if (!v.ok) throw Error(/^[A-Z_]+$/.test(v.code) ? v.code : 'BROWSER_REQUEST');
          resolve(v.result);
        } catch (e) {
          reject(e instanceof SyntaxError ? Error('BROWSER_PROTOCOL') : e);
        }
      });
      socket.on('close', () => {
        signal?.removeEventListener('abort', aborted);
        if (!finished) reject(Error('BROWSER_BACKEND_CLOSED'));
      });
    });
  }
  async attach() {
    const state = await this.request('attach');
    this.scope ??= state.scope;
    return state;
  }
  probe(signal?: AbortSignal) {
    return this.request('attach', {}, signal);
  }
  nightflow(
    command: 'attach' | 'start' | 'poll' | 'ackResult',
    target?: unknown,
    signal?: AbortSignal,
    onDispatch?: () => void,
  ) {
    return this.request('nightflow', { command, target }, signal, onDispatch);
  }
  release() {
    return this.request('release');
  }
  next(scope = this.scope): Promise<BrowserPayload | null> {
    if (JSON.stringify(scope) !== JSON.stringify(this.scope))
      return Promise.reject(Error('BROWSER_SESSION_CHANGED'));
    return this.request('next', { scope });
  }
  authorize(jobId: string, observation: ComposeObservation, scope = this.scope) {
    return this.request('authorize', { jobId, observation, scope });
  }
  check(jobId: string, scope = this.scope) {
    return this.request('check', { jobId, scope });
  }
  complete(jobId: string, receipt: BrowserReceipt) {
    return this.request('complete', { jobId, receipt });
  }
  fail(jobId: string) {
    return this.request('fail', { jobId });
  }
}
