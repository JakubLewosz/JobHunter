import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
test('full IPC: abrupt own backend process loss and restart reject stale worker and preserve uncertain reservation', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-browser-crash-'));
  const child = fork(join(process.cwd(), 'tests/fixtures/browser-crash-child.ts'), [dir], {
    execArgv: ['--import', 'tsx'],
    windowsHide: true,
    env: { ...process.env, JOBHUNTER_FIXTURE_CHILD: '1' },
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  let store: Store | undefined,
    service: GmailJobHunter | undefined,
    lock: ReturnType<typeof acquireProfileLock> | undefined;
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const end = once(child, 'exit');
      child.kill('SIGKILL');
      await end;
    }
    await service?.browserDelivery.close();
    await service?.stopWorker();
    store?.close();
    lock?.release();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const message = () =>
    Promise.race([
      once(child, 'message').then(([m]) => m),
      once(child, 'exit').then(() => {
        throw Error('FIXTURE_EXIT');
      }),
    ]);
  assert.equal(await message(), 'READY');
  const client = new BrowserExecutorClient(dir);
  await client.attach();
  const pending = message();
  child.send({ op: 'prepare' });
  assert.equal(await pending, 'WAITING');
  const p = (await client.next())!;
  assert.ok(p);
  await client.authorize(p.id, {
    url: 'https://mail.google.com/mail/u/0/#inbox',
    composeId: 'synthetic',
    sender: p.sender,
    to: [p.recipient],
    cc: [],
    bcc: [],
    subject: p.subject,
    body: p.body,
    attachments: p.attachment ? [{ name: p.attachment.name, complete: true }] : [],
  });
  await client.check(p.id);
  const exited = once(child, 'exit');
  child.kill('SIGKILL');
  await exited;
  await assert.rejects(() => client.next(), /BROWSER_BACKEND_CLOSED/);
  lock = acquireProfileLock(dir);
  store = new Store(dir);
  store.assertExclusive = lock.assert;
  const gateway = new FixtureGmail();
  service = new GmailJobHunter(store, {
    gateway,
    accountInfo: () => gateway.info,
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  await service.browserDelivery.listen();
  await assert.rejects(() => client.attach(), /BROWSER_SESSION_CHANGED/);
  assert.equal(store.one('SELECT state FROM send_attempts')!.state, 'SEND_UNKNOWN');
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
  await service.dispatchOne();
  assert.equal(gateway.posts.length, 0);
});
