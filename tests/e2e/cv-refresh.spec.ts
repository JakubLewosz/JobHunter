import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test.use({ baseURL: 'http://127.0.0.1:4330' });

async function upload(page: Page, name: string) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/cv') && r.request().method() === 'POST',
  );
  await page.getByLabel('Dodaj CV PDF').setInputFiles({
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\nFictional ${name}\n%%EOF`),
  });
  const saved = await response;
  expect(saved.status()).toBe(200);
  const cv = await saved.json();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return cv;
}

async function profile(page: Page) {
  return page.evaluate(async () => (await fetch('/api/profile')).json());
}

function cvRow(page: Page, name: string) {
  return page.locator('p').filter({ has: page.getByText(name, { exact: true }) });
}

async function approve(page: Page, cv: { id: string; file_name: string }) {
  const response = page.waitForResponse((r) => r.url().endsWith(`/api/cv/${cv.id}/approve`));
  await cvRow(page, cv.file_name)
    .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
    .click();
  expect((await response).status()).toBe(200);
  await expect(cvRow(page, cv.file_name)).toContainText('zatwierdzone');
  expect((await profile(page)).cvs.find((c: any) => c.id === cv.id).approved_at).toBeTruthy();
}

async function freezePolling(page: Page) {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
}

test('CV approval completed after navigation updates Gmail options without reload', async ({
  page,
}) => {
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const cv = await upload(page, 'Navigation_CV.pdf'),
    entered = Promise.withResolvers<void>(),
    release = Promise.withResolvers<void>(),
    approvalUrl = `**/api/cv/${cv.id}/approve`;
  await page.route(approvalUrl, async (route) => {
    entered.resolve();
    await release.promise;
    await route.continue();
  });
  let status: number | null = null;
  try {
    const response = page.waitForResponse((r) => r.url().endsWith(`/api/cv/${cv.id}/approve`));
    await cvRow(page, cv.file_name)
      .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
      .click();
    await entered.promise;
    await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
    const select = page.getByLabel('CV do wysyłki Gmail');
    await expect(select).toBeVisible();
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveCount(0);
    expect((await profile(page)).cvs.find((c: any) => c.id === cv.id).approved_at).toBeNull();
    release.resolve();
    status = (await response).status();
    expect(status).toBe(200);
    expect((await profile(page)).cvs.find((c: any) => c.id === cv.id).approved_at).toBeTruthy();
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveText(cv.file_name);
    await select.selectOption(cv.id);
    await expect(select).toHaveValue(cv.id);
  } catch (error) {
    const directory = mkdtempSync(join(tmpdir(), 'jobhunter-cv-diagnostic-'));
    writeFileSync(
      join(directory, 'result.json'),
      JSON.stringify(
        {
          cvId: cv.id,
          approvalStatus: status,
          profile: await profile(page),
          options: await page
            .getByLabel('CV do wysyłki Gmail')
            .locator('option')
            .evaluateAll((options) =>
              options.map((option) => ({
                value: (option as HTMLOptionElement).value,
                text: option.textContent,
              })),
            ),
        },
        null,
        2,
      ),
    );
    throw error;
  } finally {
    release.resolve();
    await page.unroute(approvalUrl);
  }
});

test('CV upload completed after navigation refreshes profile but does not approve the file', async ({
  page,
}) => {
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const entered = Promise.withResolvers<void>(),
    release = Promise.withResolvers<void>();
  await page.route('**/api/cv', async (route) => {
    entered.resolve();
    await release.promise;
    await route.continue();
  });
  try {
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/cv') && r.request().method() === 'POST',
    );
    await page.getByLabel('Dodaj CV PDF').setInputFiles({
      name: 'Late_Upload.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nLate upload\n%%EOF'),
    });
    await entered.promise;
    await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
    await expect(page.getByLabel('CV do wysyłki Gmail')).toBeVisible();
    const refreshed = page.waitForResponse(
      async (r) =>
        r.url().endsWith('/api/profile') &&
        (await r.json()).cvs.some((c: any) => c.file_name === 'Late_Upload.pdf'),
    );
    release.resolve();
    const saved = await response;
    expect(saved.status()).toBe(200);
    const cv = await saved.json();
    expect(
      (await (await refreshed).json()).cvs.find((c: any) => c.id === cv.id).approved_at,
    ).toBeNull();
    await expect(
      page.getByLabel('CV do wysyłki Gmail').locator(`option[value="${cv.id}"]`),
    ).toHaveCount(0);
  } finally {
    release.resolve();
    await page.unroute('**/api/cv');
  }
});

for (const failure of ['denied', 'network'] as const)
  test(`CV approval ${failure} shows an error and never publishes an approved option`, async ({
    page,
  }) => {
    await page.goto('/#access=gmail-e2e-token');
    await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
    const cv = await upload(page, `Failed_${failure}.pdf`);
    await page.route(`**/api/cv/${cv.id}/approve`, async (route) => {
      if (failure === 'network') await route.abort('failed');
      else
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Fikcyjna odmowa zatwierdzenia CV.' }),
        });
    });
    await cvRow(page, cv.file_name)
      .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
      .click();
    await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
    await expect(
      page.getByText(
        failure === 'network' ? 'Failed to fetch' : 'Fikcyjna odmowa zatwierdzenia CV.',
        { exact: true },
      ),
    ).toBeVisible();
    expect((await profile(page)).cvs.find((c: any) => c.id === cv.id).approved_at).toBeNull();
    await expect(
      page.getByLabel('CV do wysyłki Gmail').locator(`option[value="${cv.id}"]`),
    ).toHaveCount(0);
  });

test('older profile response cannot overwrite CV approval or a selection preserved through polling', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const cv = await upload(page, 'Old_Response.pdf');
  await freezePolling(page);
  const entered = Promise.withResolvers<void>(),
    release = Promise.withResolvers<void>(),
    finished = Promise.withResolvers<void>();
  let first = true;
  await page.route('**/api/profile', async (route) => {
    if (!first) return route.continue();
    first = false;
    const snapshot = await route.fetch();
    expect((await snapshot.json()).cvs.find((c: any) => c.id === cv.id).approved_at).toBeNull();
    entered.resolve();
    await release.promise;
    await route.fulfill({ response: snapshot });
    finished.resolve();
  });
  try {
    await page.clock.runFor(2100);
    await entered.promise;
    const response = page.waitForResponse((r) => r.url().endsWith(`/api/cv/${cv.id}/approve`));
    await cvRow(page, cv.file_name)
      .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
      .click();
    await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
    expect((await response).status()).toBe(200);
    const select = page.getByLabel('CV do wysyłki Gmail');
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveText(cv.file_name);
    await select.selectOption(cv.id);
    const stale = page.waitForResponse(
      async (r) =>
        r.url().endsWith('/api/profile') &&
        (await r.json()).cvs.find((c: any) => c.id === cv.id)?.approved_at === null,
    );
    release.resolve();
    await finished.promise;
    await (await stale).finished();
    await page.clock.runFor(100);
    await expect(select).toHaveValue(cv.id);
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveText(cv.file_name);
    const poll = page.waitForResponse((r) => r.url().endsWith('/api/drafts'));
    await page.clock.runFor(2100);
    await poll;
    await expect(select).toHaveValue(cv.id);
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveText(cv.file_name);
  } finally {
    release.resolve();
    await page.unroute('**/api/profile');
  }
});

test('newer load inherits profile invalidation when the mutation refresh is still pending', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const cv = await upload(page, 'Superseded_Refresh.pdf');
  await freezePolling(page);
  const approvalEntered = Promise.withResolvers<void>(),
    approvalRelease = Promise.withResolvers<void>(),
    refreshEntered = Promise.withResolvers<void>(),
    refreshRelease = Promise.withResolvers<void>();
  let pending = true;
  await page.route(`**/api/cv/${cv.id}/approve`, async (route) => {
    approvalEntered.resolve();
    await approvalRelease.promise;
    await route.continue();
  });
  await page.route('**/api/profile', async (route) => {
    if (!pending) return route.continue();
    pending = false;
    const response = await route.fetch();
    expect((await response.json()).cvs.find((c: any) => c.id === cv.id).approved_at).toBeTruthy();
    refreshEntered.resolve();
    await refreshRelease.promise;
    await route.fulfill({ response });
  });
  try {
    const response = page.waitForResponse((r) => r.url().endsWith(`/api/cv/${cv.id}/approve`));
    await cvRow(page, cv.file_name)
      .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
      .click();
    await approvalEntered.promise;
    await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
    await expect(page.getByLabel('CV do wysyłki Gmail')).toBeVisible();
    approvalRelease.resolve();
    expect((await response).status()).toBe(200);
    await refreshEntered.promise;
    const replacement = page.waitForResponse((r) => r.url().endsWith('/api/profile'));
    await page.clock.runFor(2100);
    expect(
      (await (await replacement).json()).cvs.find((c: any) => c.id === cv.id).approved_at,
    ).toBeTruthy();
    await expect(
      page.getByLabel('CV do wysyłki Gmail').locator(`option[value="${cv.id}"]`),
    ).toHaveText(cv.file_name);
    refreshRelease.resolve();
  } finally {
    approvalRelease.resolve();
    refreshRelease.resolve();
    await page.unroute('**/api/profile');
    await page.unroute(`**/api/cv/${cv.id}/approve`);
  }
});

test('multiple CVs keep exact approval and selection; changing CV invalidates preview and consent', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/#access=gmail-e2e-token');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  const a = await upload(page, 'Choice_A.pdf'),
    b = await upload(page, 'Choice_B.pdf');
  await approve(page, b);
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  const select = page.getByLabel('CV do wysyłki Gmail');
  await expect(select.locator(`option[value="${a.id}"]`)).toHaveCount(0);
  await select.selectOption(b.id);
  await freezePolling(page);
  const resources: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET') resources.push(new URL(request.url()).pathname);
  });
  const poll = page.waitForResponse((r) => r.url().endsWith('/api/drafts'));
  await page.clock.runFor(2100);
  await poll;
  await expect(select).toHaveValue(b.id);
  expect(resources).not.toContain('/api/profile');
  expect(resources).not.toContain('/api/companies');
  expect(resources).not.toContain('/api/replies');
  await page.getByRole('button', { name: 'Moje materiały', exact: true }).click();
  await approve(page, a);
  await page.getByRole('button', { name: 'Wiadomości', exact: true }).click();
  await select.selectOption(b.id);
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/api/gmail/preview') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Podgląd testu do siebie', exact: true }).click();
  const saved = await response;
  expect(saved.status()).toBe(200);
  expect((await saved.json()).cv_id).toBe(b.id);
  const preview = page.getByRole('dialog', { name: 'Podgląd wysyłki Gmail' });
  await expect(preview).toContainText(b.file_name);
  await preview.getByRole('checkbox').check();
  await expect(
    preview.getByRole('button', { name: 'Wyślij test do siebie', exact: true }),
  ).toBeEnabled();
  await select.selectOption(a.id);
  await expect(preview).toHaveCount(0);
  await expect(select).toHaveValue(a.id);
  // Preparing a preview never creates an approval, outbox packet or provider POST.
  expect(
    (await page.evaluate(async () => (await fetch('/api/gmail/state')).json())).outbox,
  ).toHaveLength(0);
});

test('AUTO settings refresh a CV approved after leaving settings without changing policy or starting sends', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4331/#access=auto-e2e-token');
  await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
  await page.getByText('Moje materiały i CV', { exact: true }).click();
  const cv = await upload(page, 'Auto_Navigation.pdf'),
    entered = Promise.withResolvers<void>(),
    release = Promise.withResolvers<void>();
  const before = await page.evaluate(async () => (await fetch('/api/dashboard')).json());
  await page.route(`**/api/cv/${cv.id}/approve`, async (route) => {
    entered.resolve();
    await release.promise;
    await route.continue();
  });
  try {
    const response = page.waitForResponse((r) => r.url().endsWith(`/api/cv/${cv.id}/approve`));
    await cvRow(page, cv.file_name)
      .getByRole('button', { name: 'Przejrzałem — zatwierdź CV', exact: true })
      .click();
    await entered.promise;
    await page.getByRole('button', { name: 'Praca programu', exact: true }).click();
    const refreshed = page.waitForResponse(
      async (r) =>
        r.url().endsWith('/api/profile') &&
        !!(await r.json()).cvs.find((c: any) => c.id === cv.id)?.approved_at,
    );
    release.resolve();
    expect((await response).status()).toBe(200);
    await refreshed;
    await expect(
      page.getByText('CV zatwierdzone do przygotowania załącznika. Bez wysyłki.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ustawienia', exact: true }).click();
    const select = page.getByLabel('Zatwierdzone CV');
    await expect(select.locator(`option[value="${cv.id}"]`)).toHaveText(cv.file_name);
    await select.selectOption(cv.id);
    await expect(select).toHaveValue(cv.id);
    const after = await page.evaluate(async () => (await fetch('/api/dashboard')).json());
    expect(after.state.auto.policy.cvId).toBe(before.state.auto.policy.cvId);
    expect(after.state.stopped).toBe(true);
  } finally {
    release.resolve();
    await page.unroute(`**/api/cv/${cv.id}/approve`);
  }
});
