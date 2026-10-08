import { test, expect } from '@playwright/test';
test.use({ baseURL: 'http://127.0.0.1:4329' });
test('RESEARCH_ONLY UI → real backend/SQLite → offline providers → saved draft, edit/copy, no send', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#access=research-e2e-token');
  await expect(page.getByText('RESEARCH_ONLY', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Połączenia', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź połączenie z Codexem', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Test Codexa');
  await page.getByRole('button', { name: 'Sprawdź wyszukiwanie', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Test wyszukiwania');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  await page.getByLabel('Dodaj CV PDF').setInputFiles({
    name: 'Fictional_CV.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nFictional CV\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true }).click();
  await expect(page.getByText('Maksimum', { exact: true })).toHaveCount(0);
  await expect(page.getByText('identity', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Wiadomość bazowa')).toContainText('Nazywam się Jakub Lewosz');
  await page.screenshot({ path: 'test-results/personal-materials.png', fullPage: true });
  await page
    .getByRole('button', { name: 'Zapisz i zatwierdź moje materiały', exact: true })
    .click();
  await page.getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.getByRole('button', { name: 'Test na godzinę', exact: true }).click();
  await expect(page.getByText('Test do ', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await expect(page.getByLabel('Treść wiadomości')).toContainText('Junior PHP Laravel');
  await page.getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.getByRole('button', { name: 'Pauza', exact: true }).click();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await page.getByRole('button', { name: 'Wygeneruj nową wersję', exact: true }).click();
  await expect(page.getByLabel('Przywróć wersję').locator('option[value="2"]')).toHaveCount(1);
  await page.getByText('Podgląd maila z CV', { exact: true }).click();
  await page.getByLabel('Adres nadawcy do podglądu').fill('owner@example.test');
  await page.getByLabel('CV do podglądu').selectOption({ label: 'Fictional_CV.pdf' });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz podgląd EML z CV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('JobHunter-podglad.eml');
  await expect(page.getByRole('button', { name: /symuluj wysyłkę/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Kopiuj temat', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Kandydatura PHP Laravel');
  await page.getByRole('button', { name: 'Edytuj szkic', exact: true }).click();
  await page
    .getByLabel('Treść wiadomości')
    .fill('Tekst ręcznie przejrzany przez fikcyjnego użytkownika. To szkic bez zgody na wysyłkę.');
  await page.getByRole('button', { name: 'Zapisz nową wersję', exact: true }).click();
  await page.getByRole('button', { name: 'Oznacz jako przejrzany', exact: true }).click();
  await page.reload();
  await expect(page.getByText('RESEARCH_ONLY', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await expect(page.getByLabel('Treść wiadomości')).toContainText('ręcznie przejrzany');
  const forbidden = await page.evaluate(async () => {
    const session = await (await fetch('/api/session')).json();
    return (
      await fetch('/api/drafts/approve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf },
        body: JSON.stringify({ drafts: [{ id: 'fake', version: 1 }] }),
      })
    ).status;
  });
  expect(forbidden).toBe(409);
  await page.getByRole('button', { name: 'Firmy i oferty', exact: true }).click();
  await page.getByRole('button', { name: 'Szczegóły Fixture Company', exact: true }).click();
  await expect(page.getByText('Wymagania i dowody')).toBeVisible();
  await page.getByRole('button', { name: 'Zamknij szczegóły', exact: true }).click();
  await page.getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.screenshot({ path: 'test-results/research-simple-desktop.png', fullPage: true });
  await page.getByText('Szczegóły pracy i źródła', { exact: true }).click();
  await expect(page.getByText('DRAFTS_READY · COMPLETED').first()).toBeVisible();
  await page.getByText('Fixture Company careers · READ', { exact: true }).click();
  await expect(page.getByText('SHA-256:', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'test-results/research-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/research-mobile.png', fullPage: true });
});
