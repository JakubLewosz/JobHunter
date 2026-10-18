import { test, expect, type Page } from '@playwright/test';
test.use({ baseURL: 'http://127.0.0.1:4332' });
async function advance(page: Page) {
  return page.evaluate(async () => {
    const { csrf } = await (await fetch('/api/session')).json();
    return (
      await fetch('/api/fixture/advance', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: '{}',
      })
    ).json();
  });
}
test('research → saved library → closed batch → approve scope → Start/Stop/resume → completion', async ({
  page,
}) => {
  await page.goto('/#access=auto-e2e-token');
  await page.getByRole('button', { name: 'Otwórz bibliotekę i partie', exact: true }).click();
  await page.getByRole('button', { name: 'Start researchu bez wysyłki', exact: true }).click();
  expect((await advance(page)).posts).toBe(0);
  await expect(page.getByText(/Zapisane szkice: 1/)).toBeVisible();
  await page.getByRole('button', { name: 'Stop', exact: true }).first().click();
  await page.getByRole('checkbox', { name: /Fixture Company/ }).check();
  await page.getByRole('button', { name: 'Przygotuj zamkniętą partię (1)', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Podsumowanie partii' });
  await expect(summary.getByRole('heading')).toContainText('PREPARED');
  await summary.getByRole('checkbox', { name: /Zatwierdzam ten zakres/ }).check();
  await summary.getByRole('button', { name: 'Zatwierdź zakres partii', exact: true }).click();
  await summary
    .getByRole('button', { name: 'Start / wznów pozostałe pozycje partii', exact: true })
    .click();
  await summary.getByRole('button', { name: 'Stop', exact: true }).click();
  expect((await advance(page)).posts).toBe(0);
  await page.reload();
  await page.getByRole('button', { name: 'Otwórz bibliotekę i partie', exact: true }).click();
  await expect(summary.getByRole('heading')).toContainText('STOPPED');
  await summary
    .getByRole('button', { name: 'Start / wznów pozostałe pozycje partii', exact: true })
    .click();
  expect((await advance(page)).posts).toBe(1);
  await expect(summary.getByRole('heading')).toContainText('COMPLETED');
  await expect(summary).toContainText('niepewne: 0');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
