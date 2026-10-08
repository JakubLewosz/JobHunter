import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.JOBHUNTER_E2E_DIR ??= mkdtempSync(join(tmpdir(), 'jobhunter-e2e-'));
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4328',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1050 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm start',
      url: 'http://127.0.0.1:4328/api/health',
      reuseExistingServer: false,
      timeout: 20000,
      env: {
        JOBHUNTER_PORT: '4328',
        JOBHUNTER_DATA_DIR: process.env.JOBHUNTER_E2E_DIR!,
        JOBHUNTER_MODE: 'DEMO',
      },
    },
    {
      command: 'node --import tsx tests/research-server.ts',
      url: 'http://127.0.0.1:4329/api/health',
      reuseExistingServer: false,
      timeout: 20000,
      env: { JOBHUNTER_E2E_DIR: process.env.JOBHUNTER_E2E_DIR! },
    },
    {
      command: 'node --import tsx tests/gmail-server.ts',
      url: 'http://127.0.0.1:4330/api/health',
      reuseExistingServer: false,
      timeout: 20000,
      env: { JOBHUNTER_E2E_DIR: process.env.JOBHUNTER_E2E_DIR! },
    },
  ],
});
