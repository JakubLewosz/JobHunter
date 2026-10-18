import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { acquireProfileLock } from '../apps/server/src/backend-lock.js';
import { setup } from './auto-fixture.js';
async function manual(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-manual-authority-')),
    store = new Store(dir),
    gateway = new FixtureGmail(),
    service = new GmailJobHunter(store, {
      gateway,
      accountInfo: () => gateway.info,
      reader: new FixtureReader(),
      runner: new FixtureRunner(),
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
  const d = service.draftRows()[0];
  service.reviewDraft(d.id, d.version);
  const cv = service.uploadCV(
    'Synthetic.pdf',
    Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  return { dir, store, service, gateway, cv, d };
}
for (const mode of ['manual', 'AUTO'] as const)
  for (const transport of ['GMAIL_API', 'GMAIL_BROWSER'] as const)
    for (const reserved of [false, true])
      test(`physical synthetic profile lock loss ${mode} ${transport} reserved=${reserved} prevents transport action`, async (t) => {
        const f = mode === 'AUTO' ? await setup(t, false, false, false, true) : await manual(t),
          lock = acquireProfileLock(f.dir),
          ownerPath = join(f.dir, 'profile.lock', 'owner.json'),
          owner = readFileSync(ownerPath);
        f.store.assertExclusive = lock.assert;
        t.after(() => {
          if (existsSync(ownerPath)) {
            writeFileSync(ownerPath, owner);
            lock.release();
          }
        });
        if (transport === 'GMAIL_BROWSER') {
          await f.service.setSendTransport({
            transport,
            confirmed: true,
            outgoingViewConsent: true,
          });
          f.service.browserDelivery.attach('synthetic-worker');
        }
        if (mode === 'AUTO') {
          const auto = f as Awaited<ReturnType<typeof setup>>;
          auto.service.configurePolicy(auto.policy);
          await auto.service.startAuto();
          await auto.service.tick();
          auto.advance();
        } else {
          const m = f as Awaited<ReturnType<typeof manual>>,
            p = await m.service.prepareDelivery({
              drafts: [{ id: m.d.id, version: m.d.version }],
              cvId: m.cv.id,
              kind: 'SELF_TEST',
            });
          await m.service.approveDelivery({
            previewId: p.id,
            previewHash: p.previewHash,
            confirmed: true,
          });
        }
        const gates = (f.service as any).gates.bind(f.service);
        let lost = false;
        (f.service as any).gates = (o: any, a: any, r = false) => {
          if (r === reserved && !lost) {
            lost = true;
            writeFileSync(
              ownerPath,
              JSON.stringify({ pid: process.pid, instance: 'synthetic-other-owner' }),
            );
          }
          return gates(o, a, r);
        };
        await f.service.dispatchOne();
        assert.equal(lost, true);
        assert.equal(f.gateway.posts.length, 0);
        assert.equal(f.service.deliveryAuthority().enabled, false);
        if (mode === 'AUTO') assert.equal((f.service as any).sessionEnabled, false);
        assert.equal(f.store.one('SELECT count(*) n FROM usage_ledger')!.n, reserved ? 1 : 0);
        assert.equal(
          f.store.one(
            "SELECT count(*) n FROM browser_deliveries WHERE state IN ('COMMITTING','ACKNOWLEDGED')",
          )!.n,
          0,
        );
        writeFileSync(ownerPath, owner);
      });
