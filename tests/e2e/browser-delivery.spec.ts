import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  GmailBrowserExecutor,
  runBrowserDelivery,
  type BrowserTab,
} from '../../apps/server/src/browser/executor.js';
import { BrowserExecutorClient } from '../../apps/server/src/browser/client.js';
import { Store } from '../../apps/server/src/db.js';
import { GmailJobHunter } from '../../apps/server/src/gmail/service.js';
import { FixtureRunner, FixtureReader } from '../research-fixture.js';
import { FixtureGmail } from '../gmail-fixture.js';
import { hash } from '../../apps/server/src/util.js';
import type { BrowserPayload } from '../../apps/server/src/browser/contracts.js';

const html = readFileSync('tests/fixtures/gmail-compose.html', 'utf8');
function tab(page: Page): BrowserTab {
  return {
    url: async () => page.url(),
    playwright: {
      evaluate: (fn) => page.evaluate(fn),
      getByRole: (role, options) => page.getByRole(role as any, options),
      getByLabel: (name, options) => page.getByLabel(name, options),
      locator: (selector) => page.locator(selector),
      waitForEvent: async () => {
        const chooser = await page.waitForEvent('filechooser');
        return { setFiles: (files) => chooser.setFiles(files) };
      },
    },
  };
}
async function fixturePage(page: Page, query = '') {
  await page.route('**/*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.goto('https://mail.google.com/mail/u/0/' + query);
}
test('Browser executor → private IPC → real controller/SQLite → fictional UI, one click and no API post', async ({
  page,
}) => {
  await fixturePage(page);
  const dir = mkdtempSync(join(tmpdir(), 'jh-ui-browser-')),
    store = new Store(dir),
    gateway = new FixtureGmail();
  const service = new GmailJobHunter(store, {
    gateway,
    accountInfo: () => gateway.info,
    runner: new FixtureRunner(),
    reader: new FixtureReader(),
  });
  try {
    service.approveProfile();
    await service.importURL('https://fixture.example.test/careers');
    await service.tick();
    const d = service.draftRows()[0];
    service.reviewDraft(d.id, d.version);
    const cv = service.uploadCV(
      'Fixture.pdf',
      Buffer.from('%PDF-1.4\nfictional\n%%EOF').toString('base64'),
    );
    service.approveCV(cv.id);
    await service.setSendTransport({
      transport: 'GMAIL_BROWSER',
      confirmed: true,
      outgoingViewConsent: true,
    });
    await service.browserDelivery.listen();
    const client = new BrowserExecutorClient(dir);
    await client.attach();
    const p = await service.prepareDelivery({
      drafts: [{ id: d.id, version: d.version }],
      cvId: cv.id,
      kind: 'SELF_TEST',
    });
    await service.approveDelivery({ previewId: p.id, previewHash: p.previewHash, confirmed: true });
    const dispatch = service.dispatchOne();
    await expect
      .poll(() => store.one('SELECT state FROM browser_deliveries')?.state)
      .toBe('WAITING');
    const result = await runBrowserDelivery(client, tab(page));
    expect(result.status).toBe('RECORDED');
    await dispatch;
    await expect(page.locator('#click-count')).toHaveText('1');
    expect(gateway.posts).toHaveLength(0);
    expect(service.outboxRows()[0].status).toBe('SENT_PROVIDER'); // no fictional API receipt was supplied
    expect(store.one('SELECT state FROM browser_deliveries')!.state).toBe('ACKNOWLEDGED');
    expect(store.all('SELECT * FROM send_attempts')).toHaveLength(1);
    await runBrowserDelivery(client, tab(page));
    await expect(page.locator('#click-count')).toHaveText('1');
  } finally {
    await service.browserDelivery.close();
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test('Browser DOM: live layout, attachment completion, exact compose binding, no unrelated receipt IDs', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-ui-fields-')),
    path = join(dir, 'Fictional.pdf'),
    bytes = Buffer.from('%PDF-fictional');
  writeFileSync(path, bytes);
  const payload: BrowserPayload = {
    id: 'test',
    outboxId: 'test',
    sender: 'owner@example.test',
    recipient: 'qa@example.test',
    subject: 'Próba Łączności',
    body: 'Dzień dobry,\n\nTylko fikcyjna treść.\nPozdrawiam',
    attachment: { path, name: 'Fictional.pdf', sha256: hash(bytes), bytes: bytes.length },
    payloadHash: 'fixture',
  };
  try {
    await fixturePage(page, '?no-id');
    const driver = new GmailBrowserExecutor(tab(page));
    const observed = await driver.prepare(payload);
    expect(observed.to).toEqual([payload.recipient]);
    expect(observed.sender).toBe(payload.sender);
    expect(observed.body).toBe(payload.body);
    expect(observed.attachments).toEqual([{ name: 'Fictional.pdf', complete: true }]);
    await page.getByLabel('Temat', { exact: true }).fill('Tampered');
    await expect(driver.clickSend(observed)).rejects.toThrow('GMAIL_COMPOSE_CHANGED');
    await expect(page.locator('#click-count')).toHaveText('0');
    await page.getByLabel('Temat', { exact: true }).fill(payload.subject);
    await expect(
      driver.clickSend(observed, async () => {
        throw Error('STOPPED');
      }),
    ).rejects.toThrow('STOPPED');
    await expect(page.locator('#click-count')).toHaveText('0');
    await driver.clickSend(observed);
    expect((await driver.receipt()).candidateId).toBeNull();
    await page.reload();
    await page.getByRole('button', { name: 'Utwórz', exact: true }).click();
    await expect(driver.prepare(payload)).rejects.toThrow('GMAIL_EXISTING_COMPOSE');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('Browser receipt follows only the fresh own-message link and does not retry a click', async ({
  page,
}) => {
  await fixturePage(page, '?view');
  const driver = new GmailBrowserExecutor(tab(page));
  const payload: BrowserPayload = {
    id: 'test',
    outboxId: 'test',
    sender: 'owner@example.test',
    recipient: 'qa@example.test',
    subject: 'Fikcyjna próba',
    body: 'Tylko test',
    attachment: null,
    payloadHash: 'fixture',
  };
  const observed = await driver.prepare(payload);
  await driver.clickSend(observed);
  const receipt = await driver.receipt();
  expect(receipt.candidateId).toBe('abcdef0123456789');
  await expect(page.locator('#click-count')).toHaveText('1');
  await expect(driver.prepare(payload)).rejects.toThrow('GMAIL_PREVIOUS_ACK_VISIBLE');
});
