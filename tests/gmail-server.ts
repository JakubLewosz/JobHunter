import { createApp } from '../apps/server/src/app.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { FixtureGmail } from './gmail-fixture.js';
import { join } from 'node:path';
const gateway = new FixtureGmail();
gateway.thread = async (threadId: string) => {
  const own = gateway.sentMessages.find((m) => m.threadId === threadId)!;
  return [
    own,
    {
      ...own,
      id: 'fixture-reply',
      messageId: '<reply@fixture.example.test>',
      from: ['hr@fixture.example.test'],
      to: ['owner@example.test'],
      labels: ['INBOX'],
      subject: 'Re: ' + own.subject,
      body: 'Fikcyjna odpowiedź <script>nie uruchamiaj</script>',
      category: 'UNCLEAR',
    },
  ];
};
const { app, service } = await createApp({
  dir: join(process.env.JOBHUNTER_E2E_DIR!, 'gmail-delivery'),
  port: 4330,
  mode: 'APPROVAL_REQUIRED',
  launchToken: 'gmail-e2e-token',
  researchOptions: { runner: new FixtureRunner(), reader: new FixtureReader() },
  gmailOptions: { gateway, accountInfo: () => gateway.info },
});
service.approveProfile();
await (service as GmailJobHunter).importURL('https://fixture.example.test/careers');
await service.tick();
await app.listen({ host: '127.0.0.1', port: 4330 });
process.once('SIGTERM', () => void app.close().then(() => process.exit(0)));
