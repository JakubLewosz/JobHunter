import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
test('pełny proces UI → backend → SQLite → mock → raport', async ({ page }) => {
  const launch = JSON.parse(
    readFileSync(join(process.env.JOBHUNTER_E2E_DIR!, 'demo', 'launch.json'), 'utf8'),
  );
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(launch.url);
  await expect(
    page.getByRole('heading', { name: 'Twój kolejny krok zaczyna się tutaj.' }),
  ).toBeVisible();
  await expect(page.getByText('SYMULACJA · ZERO PRAWDZIWYCH WYSYŁEK')).toBeVisible();
  await page.getByRole('button', { name: 'Sprawdź profil', exact: true }).click();
  await page.getByRole('button', { name: 'Zatwierdź profil demo', exact: true }).click();
  await page.getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.getByRole('button', { name: 'Uruchom cykl demo', exact: true }).click();
  await page.getByRole('button', { name: 'Wiadomości', exact: false }).first().click();
  await expect(page.getByText('5 szkiców · 5 do sprawdzenia')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Wybierz Aurora Code' }).check();
  await page.getByRole('button', { name: 'Zatwierdź i symuluj wysyłkę (1)' }).click();
  await page.getByRole('button', { name: 'Odpowiedzi', exact: true }).click();
  await expect(page.getByText('Propozycja mock: Zainteresowanie.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Potwierdź klasyfikację', exact: true }).click();
  await page.getByRole('button', { name: 'Firmy i oferty', exact: true }).click();
  await page.getByRole('button', { name: 'Odrzucone', exact: true }).click();
  await expect(page.getByText('Meridian Systems', { exact: true })).toBeVisible();
  await expect(page.getByText('Campus Dev', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Raporty', exact: true }).click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Markdown', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/JobHunter-demo-.+\.md/);
  const report = readFileSync((await download.path())!, 'utf8');
  expect(report).toContain('sent: 1');
  expect(report).toContain('interested: 1');
  expect(report).toContain('rekrutacja@aurora.example.invalid');
  await page.getByRole('button', { name: 'Dzisiaj', exact: true }).click();
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  expect(
    await page.locator('body').evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test('HTML w szkicu jest wyświetlany jako tekst; mutacja bez CSRF jest blokowana', async ({
  page,
}) => {
  const launch = JSON.parse(
    readFileSync(join(process.env.JOBHUNTER_E2E_DIR!, 'demo', 'launch.json'), 'utf8'),
  );
  await page.goto(launch.url);
  const result = await page.evaluate(async () => {
    const session = await fetch('/api/session').then((r) => r.json());
    const response = await fetch('/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    return { status: response.status, hasCsrf: !!session.csrf };
  });
  expect(result.status).toBe(403);
  expect(result.hasCsrf).toBe(true);
  await page.getByRole('button', { name: 'Wiadomości', exact: false }).first().click();
  await page.getByText('Flowbyte Studio', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Edytuj szkic', exact: true }).click();
  const body = page.getByRole('textbox', { name: 'Treść wiadomości', exact: true });
  await body.fill((await body.inputValue()) + '\n<img src=x onerror="window.injectionRan=true">');
  await page.getByRole('button', { name: 'Zapisz nową wersję', exact: true }).click();
  await expect(body).toHaveValue(/<img src=x/);
  expect(await page.evaluate(() => (window as any).injectionRan)).toBeUndefined();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
});
test('timeout w UI jest rozstrzygany bez ponownej wysyłki', async ({ page }) => {
  const launch = JSON.parse(
    readFileSync(join(process.env.JOBHUNTER_E2E_DIR!, 'demo', 'launch.json'), 'utf8'),
  );
  await page.goto(launch.url);
  await page.getByRole('button', { name: 'Kampania', exact: true }).click();
  await page.getByLabel('Scenariusz adaptera').selectOption('TIMEOUT_AFTER_SEND');
  await page.getByRole('button', { name: 'Wiadomości', exact: false }).first().click();
  await page.getByRole('checkbox', { name: 'Wybierz Vector Labs' }).check();
  await page.getByRole('button', { name: 'Zatwierdź i symuluj wysyłkę (1)' }).click();
  await page.getByRole('button', { name: 'Raporty', exact: true }).click();
  await expect(page.getByText('Niepewny wynik', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rozstrzygnij', exact: true }).click();
  await expect(page.getByText('Niepewny wynik', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Kampania', exact: true }).click();
  await page.getByRole('button', { name: 'Wznów sender demo', exact: true }).click();
  await page.getByLabel('Scenariusz adaptera').selectOption('NORMAL');
});
test('import CSV pokazuje podgląd i zapisuje sugestię w historii', async ({ page }) => {
  const launch = JSON.parse(
    readFileSync(join(process.env.JOBHUNTER_E2E_DIR!, 'demo', 'launch.json'), 'utf8'),
  );
  await page.goto(launch.url);
  await page.getByRole('button', { name: 'Firmy i oferty', exact: true }).click();
  await page.getByRole('button', { name: 'Import historii CSV', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Treść historii CSV' })
    .fill(
      'company,status,domain,email\nE2E Studio,SUGGESTED,e2e.example.invalid,hr@e2e.example.invalid',
    );
  await page.getByRole('button', { name: 'Podgląd importu', exact: true }).click();
  await expect(page.getByText('Nowy rekord', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Importuj zatwierdzony plik', exact: true }).click();
  await page.getByRole('button', { name: 'Historia', exact: true }).click();
  await expect(page.getByText('E2E Studio', { exact: true })).toBeVisible();
});
