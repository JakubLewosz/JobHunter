import { createApp } from '../apps/server/src/app.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { join } from 'node:path';
const { app } = await createApp({
  dir: join(process.env.JOBHUNTER_E2E_DIR!, 'research-only'),
  port: 4329,
  mode: 'RESEARCH_ONLY',
  launchToken: 'research-e2e-token',
  researchOptions: { runner: new FixtureRunner(), reader: new FixtureReader() },
});
await app.listen({ host: '127.0.0.1', port: 4329 });
process.once('SIGTERM', () => void app.close().then(() => process.exit(0)));
