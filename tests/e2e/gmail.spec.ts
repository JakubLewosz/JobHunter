import { test, expect } from '@playwright/test';
test.use({ baseURL: 'http://127.0.0.1:4330' });
test('Gmail approval UI → actual controller/SQLite → fictional mailbox, immutable preview and explicit send', async ({
  page,
}) => {
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  await page.getByLabel('Dodaj CV PDF').setInputFiles({
    name: 'Fictional_CV.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nFictional CV\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true }).click();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await page.getByLabel('CV do wysyłki Gmail').selectOption({ label: 'Fictional_CV.pdf' });
  await page.getByRole('button', { name: 'Podgląd testu do siebie', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Podgląd wysyłki Gmail' });
  await expect(preview).toContainText('Do: owner@example.test');
  await expect(preview).toContainText('Fictional_CV.pdf');
  const send = preview.getByRole('button', { name: 'Wyślij test do siebie', exact: true });
  await expect(send).toBeDisabled();
  const file = page.waitForEvent('download');
  await preview.getByRole('button', { name: 'Pobierz mail z CV (EML)', exact: true }).click();
  expect((await file).suggestedFilename()).toBe('JobHunter-podglad.eml');
  await preview.getByRole('checkbox').check();
  await send.click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Edytuj szkic', exact: true }).click();
  const text = page.getByLabel('Treść wiadomości');
  await text.fill((await text.inputValue()) + ' Tekst przejrzany w fikcyjnym teście.');
  await page.getByRole('button', { name: 'Zapisz nową wersję', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź zgodność treści', exact: true }).click();
  await page.getByRole('button', { name: 'Oznacz jako przejrzany', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź historię wybranych firm', exact: true }).click();
  await expect(
    page.getByText('Fixture Company: historia sprawdzona', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Podgląd wiadomości do firm (1)', exact: true }).click();
  await expect(preview).toContainText('Do: hr@fixture.example.test');
  await expect(preview).toContainText('Tekst przejrzany w fikcyjnym teście.');
  await preview.getByRole('checkbox').check();
  await page.screenshot({ path: 'test-results/gmail-approval-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/gmail-approval-mobile.png', fullPage: true });
  await preview.getByRole('button', { name: 'Wyślij te wiadomości (1)', exact: true }).click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Odczytaj odpowiedzi w tym wątku', exact: true }).click();
  await page.getByRole('button', { name: 'Odpowiedzi', exact: true }).click();
  await expect(
    page.getByText('Fikcyjna odpowiedź <script>nie uruchamiaj</script>', { exact: true }),
  ).toBeVisible();
  expect(await page.locator('script').count()).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(2);
  await page.getByLabel('CV do wysyłki Gmail').selectOption({ label: 'Fictional_CV.pdf' });
  await page.getByRole('button', { name: 'Podgląd krótkiego testu bez CV', exact: true }).click();
  await expect(preview).toContainText('Bez załącznika');
  await expect(preview).not.toContainText('Fictional_CV.pdf');
  await expect(preview).toContainText('Wiadomość testowa');
  const shortSend = preview.getByRole('button', { name: 'Wyślij test do siebie', exact: true });
  await expect(shortSend).toBeDisabled();
  await preview.getByRole('checkbox').check();
  await shortSend.click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(3);
});
