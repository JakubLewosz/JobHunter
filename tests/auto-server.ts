import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';
const root = process.env.JOBHUNTER_E2E_DIR!;
const gateway = new FixtureGmail(),
  runner = new FixtureRunner(),
  reader = new FixtureReader();
runner.prospect = reader.prospect = true;
let time = Date.now();
const { app, service: base } = await createApp({
  dir: join(root, 'auto-data'),
  port: 4331,
  mode: 'AUTO_POLICY',
  worker: false,
  launchToken: 'auto-e2e-token',
  researchOptions: { runner, reader, clock: () => new Date(time) },
  gmailOptions: { gateway, accountInfo: () => gateway.info },
});
const service = base as AutoPolicyJobHunter;
service.approveProfile();
const cv = service.uploadCV(
  'Fictional_CV.pdf',
  Buffer.from('%PDF-1.4\nFictional CV\n%%EOF').toString('base64'),
);
service.approveCV(cv.id);
await service.probe('codex');
await service.probe('search');
service.configurePolicy({
  senderEmail: gateway.info.email,
  cvId: cv.id,
  contactKinds: ['RECRUITMENT', 'GENERAL'],
  contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
  searchScope: 'Firmy działające w Polsce, web i automatyzacje',
  sessionLimit: null,
  dailyLimit: null,
  sendIntervalSeconds: 60,
  researchIntervalSeconds: 60,
  confirmed: true,
  targetedHistoryConsent: true,
});
await service.configureLocalHistory({ confirmedHistory: true, confirmedSingleWorkstation: true });
for (const key of ['claim', 'assertOwner', 'checkpoint', 'status'] as const)
  (service.historySync as any)[key] = () => {
    throw new Error('UNEXPECTED_HISTORY_GIT');
  };
app.post('/api/fixture/advance', async () => {
  time += 61000;
  await service.tick();
  await service.dispatchOne();
  return { posts: gateway.posts.length };
});
await app.listen({ host: '127.0.0.1', port: 4331 });
process.once('SIGTERM', () => void app.close().then(() => process.exit(0)));
