import { test, expect } from '@playwright/test';
test('AUTO_POLICY: Start, continuous policy send, history, Pause, Stop and handoff', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET' && request.url().includes('/api/'))
      requests.push(new URL(request.url()).pathname);
  });
  await page.goto('http://127.0.0.1:4331/#access=auto-e2e-token');
  await expect(
    page.getByRole('button', { name: 'Start — szukaj i wysyłaj', exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Odpowiedzi', exact: true })).toHaveCount(0);
  expect(requests).not.toContain('/api/replies');
  expect(requests).not.toContain('/api/reports');
  const blocked = await page.evaluate(async () => {
    const session = await (await fetch('/api/session')).json();
    const r = await fetch('/api/gmail/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
      body: '{}',
    });
    return { status: r.status, body: await r.json() };
  });
  expect(blocked.status).toBe(409);
  expect(blocked.body.code).toBe('AUTO_POLICY_ONLY');
  await page.getByRole('button', { name: 'Start — szukaj i wysyłaj', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pracuje', exact: true })).toBeVisible();
  const advance = () =>
    page.evaluate(async () => {
      const session = await (await fetch('/api/session')).json();
      const response = await fetch('/api/fixture/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
        body: '{}',
      });
      return response.json();
    });
  expect((await advance()).posts).toBe(1);
  await expect(page.getByText('Pierwsze wiadomości', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/auto-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Historia firm', exact: true }).click();
  await expect(page.getByLabel('Szukaj firmy')).toBeVisible();
  await page.getByLabel('Szukaj firmy').fill('Fixture Company');
  const company = page
    .locator('details')
    .filter({ has: page.getByText('Fixture Company', { exact: true }) });
  await company.locator('summary').click();
  await expect(company).toContainText('biuro@fixture.example.test');
  await expect(company).toContainText('Czy w Państwa zespole');
  await expect(company.getByRole('link', { name: 'Źródło', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Praca programu', exact: true }).click();
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Wznów — szukaj i wysyłaj', exact: true }),
  ).toBeEnabled();
  expect((await advance()).posts).toBe(1);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Zatrzymany', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Polityka automatycznej sesji', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/auto-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Praca programu', exact: true }).click();
  await page
    .getByRole('button', { name: 'Stop i przekaż historię drugiemu urządzeniu', exact: true })
    .click();
  await expect(page.getByText('Historia: Historia przekazana', { exact: true })).toBeVisible();
});
