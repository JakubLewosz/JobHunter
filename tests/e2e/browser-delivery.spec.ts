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
import { withNightflow } from '../../apps/server/src/nightflow-entry.js';
import { ActiveTaskNightflowBrowserHost } from '../../apps/server/src/nightflow-browser-host.js';
import { NightflowCoordinator } from '../../apps/server/src/nightflow.js';
import { autoPolicySchema } from '../../apps/server/src/auto-policy.js';
import { runLocalHostFixture } from '../../scripts/nightflow-host-fixture.mjs';

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
for (const scenario of ['complete', 'stop', 'executor-loss', 'lost-ack'])
  test('public nightflow entry on own localhost page: ' + scenario, async ({ page }) => {
    test.setTimeout(90000);
    await page.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
    );
    const handle = {
      ...tab(page),
      goto: (url: string) => page.goto(url),
      close: () => page.close(),
    };
    if (scenario === 'lost-ack') {
      const get = handle.playwright.getByRole;
      handle.playwright.getByRole = (role, options) => {
        const locator = get(role, options);
        if (role === 'button' && String(options.name).startsWith('Wyślij')) {
          const click = locator.click.bind(locator);
          locator.click = async () => {
            await click();
            throw Error('SYNTHETIC_ACK_LOST');
          };
        }
        return locator;
      };
    }
    const report = await runLocalHostFixture({
      tab: handle,
      taskId: 'node-e2e-owned-task',
      scenario,
    });
    expect(report.level).toBe('NODE_PUBLIC_ENTRY_LOCAL_PAGE');
    expect(report.result.attempts).toBeLessThanOrEqual(1);
    expect(Object.values(report.cleanup).every(Boolean)).toBe(true);
    if (scenario === 'complete') {
      expect(report.result.state).toBe('COMPLETED');
      expect(report.result.browserActions).toBe(1);
      await expect(page.locator('#click-count')).toHaveText('1');
    } else if (scenario === 'stop') {
      expect(report.result.state).toBe('STOPPED');
      expect(report.result.browserActions).toBe(0);
      expect(report.samples.some((s: any) => s.stop?.acknowledgement === 'AUTHORITY_REVOKED')).toBe(
        true,
      );
    } else {
      expect(report.result.state).not.toBe('COMPLETED');
      if (scenario === 'lost-ack') {
        expect(report.result.browserActions).toBe(1);
        expect(report.result.attemptStates).toEqual([{ state: 'SEND_UNKNOWN', n: 1 }]);
        expect(report.result.deliveryStates).toEqual([{ state: 'SEND_UNKNOWN', n: 1 }]);
        await expect(page.locator('#click-count')).toHaveText('1');
      }
    }
  });
async function fixturePage(page: Page, query = '') {
  await page.route('**/*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.goto('https://mail.google.com/mail/u/0/' + query);
}
test('nightflow active-task adapter → same services → scoped IPC → fictional browser, one action and closed report', async ({
  page,
}) => {
  await fixturePage(page, '?no-id');
  const dir = mkdtempSync(join(tmpdir(), 'jh-nightflow-browser-'));
  try {
    await withNightflow({ dir, fixture: true }, async (_coordinator, service, original) => {
      const policy = service.policyConfig()!;
      await service.setSendTransport({
        transport: 'GMAIL_BROWSER',
        confirmed: true,
        outgoingViewConsent: true,
      });
      await service.browserDelivery.listen();
      const host = new ActiveTaskNightflowBrowserHost(dir, 'synthetic-active-task', tab(page));
      await host.initialize();
      service.configurePolicy(
        Object.fromEntries(Object.keys(autoPolicySchema.shape).map((key) => [key, policy[key]])),
      );
      const coordinator = new NightflowCoordinator(service.store, service, {
        installation: original.installation,
        host,
        clock: () => new Date('2026-10-18T10:00:00Z'),
      });
      const plan = { ...original, discovery: false, binding: service.nightflowBinding() };
      coordinator.savePlan(plan, true);
      // Time advances only in the fixture sender clock, not by waiting a minute.
      service.store.set('autoNextSendAt', '2020-01-01T00:00:00Z');
      const start = service.activateNightflowBatch.bind(service);
      service.activateNightflowBatch = async (...args) => {
        await start(...args);
        service.store.set('autoNextSendAt', '2020-01-01T00:00:00Z');
      };
      const result = await coordinator.start(plan.id);
      expect(result.state).toBe('COMPLETED');
      expect(result.counts?.sent).toBe(1);
      expect(service.store.one('SELECT count(*) n FROM send_attempts')!.n).toBe(1);
      await expect(page.locator('#click-count')).toHaveText('1');
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
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
test('Browser cancellation at upload and after final check starts no send action', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'jh-abort-upload-')),
    path = join(dir, 'Fixture.pdf'),
    bytes = Buffer.from('%PDF-fictional');
  writeFileSync(path, bytes);
  const payload: BrowserPayload = {
    id: 'fixture',
    outboxId: 'fixture',
    sender: 'owner@example.test',
    recipient: 'qa@example.test',
    subject: 'Synthetic',
    body: 'Synthetic only',
    attachment: { path, name: 'Fixture.pdf', sha256: hash(bytes), bytes: bytes.length },
    payloadHash: 'synthetic',
  };
  try {
    await fixturePage(page);
    const abort = new AbortController(),
      browser = tab(page);
    const chooser = browser.playwright.waitForEvent;
    browser.playwright.waitForEvent = async (event) => {
      const result = await chooser(event);
      abort.abort();
      return result;
    };
    await expect(
      new GmailBrowserExecutor(browser, abort.signal).prepare(payload),
    ).rejects.toThrow();
    await expect(page.locator('#click-count')).toHaveText('0');
    await fixturePage(page);
    const beforeClick = new AbortController(),
      driver = new GmailBrowserExecutor(tab(page), beforeClick.signal);
    const observation = await driver.prepare(payload);
    await expect(
      driver.clickSend(observation, async () => {
        beforeClick.abort();
      }),
    ).rejects.toThrow();
    await expect(page.locator('#click-count')).toHaveText('0');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
