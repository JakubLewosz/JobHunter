import { test, expect } from '@playwright/test';
test.use({ baseURL: 'http://127.0.0.1:4330' });
test('Browser transport settings require explicit consent, show offline executor and do not start sending', async ({
  page,
}) => {
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Połączenia', exact: true }).click();
  const baseline = await page.evaluate(async () => {
    const { csrf } = await (await fetch('/api/session')).json();
    const stopped = await fetch('/api/stop', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
      body: '{}',
    });
    if (!stopped.ok) throw Error('Fixture Stop failed');
    return (await (await fetch('/api/gmail/state')).json()).outbox.length;
  });
  const transport = page.getByLabel('Transport wiadomości', { exact: true });
  await expect(transport).toHaveValue('GMAIL_API');
  await transport.selectOption('GMAIL_BROWSER');
  const save = page.getByRole('button', { name: 'Zapisz sposób wysyłki', exact: true });
  await expect(save).toBeDisabled();
  await page.getByRole('checkbox', { name: /Zezwalam wykonawcy/ }).check();
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/gmail/transport') && r.request().method() === 'POST',
  );
  await save.click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText('Wykonawca: niepołączony.', { exact: false })).toBeVisible();
  let state = await page.evaluate(async () => await (await fetch('/api/gmail/state')).json());
  expect(state.sendTransport).toBe('GMAIL_BROWSER');
  expect(state.paused).toBe(true);
  expect(state.outbox).toHaveLength(baseline);
  expect(state.sendReady).toBe(false);
  await transport.selectOption('GMAIL_API');
  const restored = page.waitForResponse(
    (r) => r.url().endsWith('/api/gmail/transport') && r.request().method() === 'POST',
  );
  await save.click();
  expect((await restored).status()).toBe(200);
  state = await page.evaluate(async () => await (await fetch('/api/gmail/state')).json());
  expect(state.sendTransport).toBe('GMAIL_API');
  expect(state.outbox).toHaveLength(baseline);
});
