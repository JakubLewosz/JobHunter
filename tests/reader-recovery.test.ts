import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';
import { FixtureRunner } from './research-fixture.js';
test('reader probe: persisted failure survives process, successful bounded probe stays stopped and permits conscious Start', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-recovery-')),
    store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const reader = new PublicSourceReader({
      resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
      transport: async () => ({
        status: 200,
        contentType: 'text/html',
        body: '<p>Complete synthetic public probe.</p>',
      }),
    }),
    runner = new FixtureRunner();
  const service = new ResearchJobHunter(store, { reader, runner });
  service.approveProfile();
  await service.probe('search');
  store.set('readerRecoveryRequired', true);
  await assert.rejects(() => service.startDay(), { code: 'READER_ENVIRONMENT' });
  const restarted = new ResearchJobHunter(store, { reader, runner });
  await assert.rejects(() => restarted.startDay(), { code: 'READER_ENVIRONMENT' });
  assert.equal(
    (await restarted.probeReader(['https://one.example.test/', 'https://two.example.test/'])).ok,
    true,
  );
  assert.equal(restarted.state().stopped, true);
  assert.equal(store.get<any>('researchDay', {}).active ?? false, false);
  await restarted.startDay();
  assert.equal(store.get<any>('researchDay', {}).active, true);
  await restarted.stopWorker();
});
test('Stop aborts explicit recovery; unsuccessful probe never removes the required recovery flag', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-recovery-stop-')),
    store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let ready!: () => void;
  const started = new Promise<void>((r) => (ready = r));
  const reader = new PublicSourceReader({
    resolve: async () => [{ address: '93.184.216.34', family: 4 }] as any,
    transport: async (_url: any, _ip: any, signal: any) => {
      ready();
      await new Promise<void>((r) => signal.addEventListener('abort', () => r(), { once: true }));
      signal.throwIfAborted();
      return {} as any;
    },
  });
  const service = new ResearchJobHunter(store, { reader, runner: new FixtureRunner() });
  store.set('readerRecoveryRequired', true);
  const probe = service.probeReader(['https://one.example.test/', 'https://two.example.test/']);
  await started;
  service.control('stop');
  await probe.catch(() => {});
  assert.equal(store.get('readerRecoveryRequired', false), true);
  assert.equal(service.state().stopped, true);
});
