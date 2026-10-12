import { test, expect, type Page, type Locator } from '@playwright/test';

async function confirmedAction(page: Page, path: RegExp, control: Locator, method = 'POST') {
  const response = page.waitForResponse(
    (r) => path.test(new URL(r.url()).pathname) && r.request().method() === method,
  );
  await control.click();
  const result = await response;
  expect(result.status()).toBe(200);
  return result.json();
}

test.use({ baseURL: 'http://127.0.0.1:4330' });
test('Gmail approval UI → actual controller/SQLite → fictional mailbox, immutable preview and explicit send', async ({
  page,
}) => {
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const uploadResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/cv') && r.request().method() === 'POST',
  );
  await page.getByLabel('Dodaj CV PDF').setInputFiles({
    name: 'Fictional_CV.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nFictional CV\n%%EOF'),
  });
  const saved = await uploadResponse;
  expect(saved.status()).toBe(200);
  const cv = await saved.json();
  const cvRow = page
    .locator('p')
    .filter({ has: page.getByText('Fictional_CV.pdf', { exact: true }) });
  await confirmedAction(
    page,
    new RegExp(`/api/cv/${cv.id}/approve$`),
    cvRow.getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true }),
  );
  await expect(cvRow).toContainText('zatwierdzone');
  const profile = await page.evaluate(async () => (await fetch('/api/profile')).json());
  expect(profile.cvs.find((c: any) => c.id === cv.id).approved_at).toBeTruthy();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await page.getByLabel('CV do wysyłki Gmail').selectOption(cv.id);
  await expect(page.getByLabel('CV do wysyłki Gmail')).toHaveValue(cv.id);
  await confirmedAction(
    page,
    /\/api\/gmail\/preview$/,
    page.getByRole('button', { name: 'Podgląd testu do siebie', exact: true }),
  );
  const preview = page.getByRole('dialog', { name: 'Podgląd wysyłki Gmail' });
  await expect(preview).toContainText('Do: owner@example.test');
  await expect(preview).toContainText('Fictional_CV.pdf');
  const send = preview.getByRole('button', { name: 'Wyślij test do siebie', exact: true });
  await expect(send).toBeDisabled();
  const file = page.waitForEvent('download');
  await preview.getByRole('button', { name: 'Pobierz mail z CV (EML)', exact: true }).click();
  expect((await file).suggestedFilename()).toBe('JobHunter-podglad.eml');
  await preview.getByRole('checkbox').check();
  await confirmedAction(page, /\/api\/gmail\/approve$/, send);
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Edytuj szkic', exact: true }).click();
  const text = page.getByLabel('Treść wiadomości');
  await text.fill((await text.inputValue()) + ' Tekst przejrzany w fikcyjnym teście.');
  await confirmedAction(
    page,
    /\/api\/drafts\/[^/]+$/,
    page.getByRole('button', { name: 'Zapisz nową wersję', exact: true }),
    'PATCH',
  );
  await expect(
    page.getByText('Zapisano nową wersję. Zgoda wymaga ponowienia.', { exact: true }),
  ).toBeVisible();
  await confirmedAction(
    page,
    /\/api\/gmail\/drafts\/[^/]+\/verify$/,
    page.getByRole('button', { name: 'Sprawdź zgodność treści', exact: true }),
  );
  await expect(
    page.getByText('Sprawdzono zgodność treści z materiałami i źródłami.', { exact: true }),
  ).toBeVisible();
  await confirmedAction(
    page,
    /\/api\/drafts\/[^/]+\/review$/,
    page.getByRole('button', { name: 'Oznacz jako przejrzany', exact: true }),
  );
  await expect(
    page.getByText('Zapisano przegląd; bez zgody na wysyłkę.', { exact: true }),
  ).toBeVisible();
  await confirmedAction(
    page,
    /\/api\/gmail\/history$/,
    page.getByRole('button', { name: 'Sprawdź historię wybranych firm', exact: true }),
  );
  await expect(
    page.getByText('Fixture Company: historia sprawdzona', { exact: true }),
  ).toBeVisible();
  await confirmedAction(
    page,
    /\/api\/gmail\/preview$/,
    page.getByRole('button', { name: 'Podgląd wiadomości do firm (1)', exact: true }),
  );
  await expect(preview).toContainText('Do: hr@fixture.example.test');
  await expect(preview).toContainText('Tekst przejrzany w fikcyjnym teście.');
  await preview.getByRole('checkbox').check();
  await page.screenshot({ path: 'test-results/gmail-approval-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/gmail-approval-mobile.png', fullPage: true });
  await confirmedAction(
    page,
    /\/api\/gmail\/approve$/,
    preview.getByRole('button', { name: 'Wyślij te wiadomości (1)', exact: true }),
  );
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(2);
  await confirmedAction(
    page,
    /\/api\/gmail\/outbox\/[^/]+\/replies$/,
    page.getByRole('button', { name: 'Odczytaj odpowiedzi w tym wątku', exact: true }),
  );
  await expect(page.getByRole('button', { name: 'Odpowiedzi', exact: true })).toHaveCount(0);
  const replies = await page.evaluate(async () => await (await fetch('/api/replies')).json());
  expect(
    replies.some((r: any) => r.body === 'Fikcyjna odpowiedź <script>nie uruchamiaj</script>'),
  ).toBe(true);
  expect(await page.locator('script').count()).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(2);
  await page.getByLabel('CV do wysyłki Gmail').selectOption(cv.id);
  await confirmedAction(
    page,
    /\/api\/gmail\/preview$/,
    page.getByRole('button', { name: 'Podgląd krótkiego testu bez CV', exact: true }),
  );
  await expect(preview).toContainText('Bez załącznika');
  await expect(preview).not.toContainText('Fictional_CV.pdf');
  await expect(preview).toContainText('Wiadomość testowa');
  const shortSend = preview.getByRole('button', { name: 'Wyślij test do siebie', exact: true });
  await expect(shortSend).toBeDisabled();
  await preview.getByRole('checkbox').check();
  await confirmedAction(page, /\/api\/gmail\/approve$/, shortSend);
  await expect(page.getByText('Potwierdzona w Wysłanych', { exact: true })).toHaveCount(3);
});
