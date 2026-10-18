import { Store } from '../../apps/server/src/db.js';
import { GmailJobHunter } from '../../apps/server/src/gmail/service.js';
import { acquireProfileLock } from '../../apps/server/src/backend-lock.js';
import { FixtureGmail } from '../gmail-fixture.js';
import { FixtureReader, FixtureRunner } from '../research-fixture.js';
if (process.env.JOBHUNTER_FIXTURE_CHILD !== '1') throw Error('FIXTURE_REQUIRED');
const dir = process.argv[2],
  lock = acquireProfileLock(dir),
  store = new Store(dir),
  gateway = new FixtureGmail();
store.assertExclusive = lock.assert;
const service = new GmailJobHunter(store, {
  gateway,
  accountInfo: () => gateway.info,
  reader: new FixtureReader(),
  runner: new FixtureRunner(),
});
service.approveProfile();
await service.importURL('https://fixture.example.test/careers');
await service.tick();
const draft = service.draftRows()[0];
service.reviewDraft(draft.id, draft.version);
const cv = service.uploadCV(
  'Synthetic.pdf',
  Buffer.from('%PDF-1.4\nfixture\n%%EOF').toString('base64'),
);
service.approveCV(cv.id);
await service.setSendTransport({
  transport: 'GMAIL_BROWSER',
  confirmed: true,
  outgoingViewConsent: true,
});
await service.browserDelivery.listen();
process.on('message', async (value) => {
  if ((value as any)?.op !== 'prepare') return;
  const p = await service.prepareDelivery({
    drafts: [{ id: draft.id, version: draft.version }],
    cvId: cv.id,
    kind: 'SELF_TEST',
  });
  await service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
  void service.dispatchOne();
  while (!store.one("SELECT id FROM browser_deliveries WHERE state='WAITING'"))
    await new Promise((r) => setTimeout(r, 5));
  process.send?.('WAITING');
});
process.send?.('READY');
