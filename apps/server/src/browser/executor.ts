import { readFileSync } from 'node:fs';
import { hash } from '../util.js';
import { BrowserExecutorClient } from './client.js';
import type {
  BrowserPayload,
  ComposeObservation,
  BrowserReceipt,
  BrowserExecutionScope,
} from './contracts.js';
import { setTimeout as delay } from 'node:timers/promises';
import { localFixtureOrigin } from '../testing/local-fixture-origin.js';

// Fence every browser action, including actions after file chooser/evaluate awaits.
function cancellable<T extends object>(target: T, signal?: AbortSignal): T {
  return new Proxy(target, {
    get(object, property) {
      const value = Reflect.get(object, property);
      if (typeof value === 'function')
        return (...args: unknown[]) => {
          signal?.throwIfAborted();
          const result = Reflect.apply(value, object, args);
          if (result instanceof Promise)
            return result.then((next) => {
              signal?.throwIfAborted();
              return next && typeof next === 'object' ? cancellable(next, signal) : next;
            });
          return result && typeof result === 'object' ? cancellable(result, signal) : result;
        };
      return value && typeof value === 'object' ? cancellable(value, signal) : value;
    },
  });
}

// Uses only the browser tool's documented page/locator/filechooser surface.
// No CDP, browser profile/cookie access, script-driven clicks or page network calls.
type Locator = {
  fill(v: string): Promise<void>;
  press(v: string): Promise<void>;
  click(): Promise<void>;
  getByRole(role: string, options: { name: string | RegExp; exact?: boolean }): Locator;
};
export type BrowserTab = {
  url(): Promise<string | undefined>;
  playwright: {
    evaluate<T>(fn: () => T): Promise<T>;
    getByRole(role: string, options: { name: string | RegExp; exact?: boolean }): Locator;
    getByLabel(name: string, options?: { exact?: boolean }): Locator;
    locator(selector: string): Locator;
    waitForEvent(event: 'filechooser'): Promise<{ setFiles(paths: string[]): Promise<void> }>;
  };
};
export class GmailBrowserExecutor {
  private tab: BrowserTab;
  constructor(
    tab: BrowserTab,
    private signal?: AbortSignal,
    private fixtureOrigin?: string,
  ) {
    if (fixtureOrigin) localFixtureOrigin(fixtureOrigin);
    this.tab = cancellable(tab, signal);
  }
  private async assertPage() {
    const u = new URL((await this.tab.url()) ?? '');
    if (u.origin !== (this.fixtureOrigin ?? 'https://mail.google.com'))
      throw Error('GMAIL_LOGIN_REQUIRED');
  }
  async observe(): Promise<ComposeObservation> {
    await this.assertPage();
    return this.tab.playwright.evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter(
        (e) => e.getClientRects().length,
      );
      if (dialogs.length !== 1) throw Error('GMAIL_COMPOSE_AMBIGUOUS');
      const d = dialogs[0];
      const field = (name: string) =>
        d.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? '';
      const addresses = (kind: string) => {
        const section = d.querySelector(`[name="${kind}"]`);
        if (!section) return [];
        return [
          ...new Set(
            Array.from(
              section.querySelectorAll<HTMLElement>('[email],[role="option"][data-hovercard-id]'),
            )
              .map((x) => x.getAttribute('email') ?? x.getAttribute('data-hovercard-id')!)
              .filter(Boolean),
          ),
        ];
      };
      const known = [...addresses('to'), ...addresses('cc'), ...addresses('bcc')];
      // Collapsed Gmail headers repeat the already committed chip outside its field.
      if (
        Array.from(d.querySelectorAll('[email],[role="option"][data-hovercard-id]')).some(
          (e) =>
            !e.closest('[name="to"],[name="cc"],[name="bcc"]') &&
            !known.includes(e.getAttribute('email') ?? e.getAttribute('data-hovercard-id') ?? ''),
        )
      )
        throw Error('GMAIL_RECIPIENT_LAYOUT');
      // Never infer that an unresolved combobox is a committed recipient chip.
      const visibleInputs = Array.from(
        d.querySelectorAll<HTMLInputElement>('input[role="combobox"]'),
      ).filter((e) => e.getClientRects().length && e.value.trim());
      if (visibleInputs.length) throw Error('GMAIL_RECIPIENT_UNCOMMITTED');
      const body = d.querySelector<HTMLElement>('[role="textbox"][contenteditable="true"]');
      if (!body) throw Error('GMAIL_BODY_MISSING');
      const attachments = Array.from(
        d.querySelectorAll<HTMLElement>('[data-browser-attachment],.dL'),
      ).map((e) => ({
        name:
          e.getAttribute('data-browser-attachment') ??
          e.querySelector<HTMLElement>('.vI')?.textContent?.trim() ??
          '',
        complete:
          !!e.querySelector('input[name="attach"]') &&
          !e.querySelector('[role="progressbar"]') &&
          e.getAttribute('aria-busy') !== 'true',
      }));
      const accountLabels = Array.from(document.querySelectorAll('[aria-label]'))
        .map((e) => e.getAttribute('aria-label')!)
        .filter((s) => /^(Konto Google:|Google Account:)/u.test(s));
      const defaultAccount = accountLabels.length === 1 ? accountLabels[0] : '';
      // Gmail only shows a From row when an alternate sender is available.
      // An unexpected From row with no selected value is not safe to infer.
      if (
        !field('from') &&
        d.querySelector('[name="from"]:not(input),[aria-label="Od"],[aria-label="From"]')
      )
        throw Error('GMAIL_FROM_AMBIGUOUS');
      const sender =
        (field('from') || defaultAccount).match(
          /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
        )?.[0] ?? '';
      const to = addresses('to');
      return {
        url: location.href,
        composeId: field('composeid'),
        sender,
        to,
        cc: addresses('cc'),
        bcc: addresses('bcc'),
        subject: field('subjectbox'),
        body: body.innerText.replace(/\r\n/g, '\n'),
        attachments,
      };
    });
  }
  async prepare(payload: BrowserPayload) {
    await this.assertPage();
    const staleAck = await this.tab.playwright.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[role="alert"],[role="status"]')).some(
        (e) =>
          e.getClientRects().length && /Wiadomość została wysłana|Message sent/u.test(e.innerText),
      ),
    );
    if (staleAck) throw Error('GMAIL_PREVIOUS_ACK_VISIBLE');
    const existing = await this.tab.playwright.evaluate(
      () =>
        Array.from(document.querySelectorAll('[role="dialog"]')).filter(
          (e) => e.getClientRects().length,
        ).length,
    );
    if (existing !== 0) throw Error('GMAIL_EXISTING_COMPOSE');
    const controls = await this.tab.playwright.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[role="button"],button'))
        .filter(
          (e) => e.getClientRects().length && ['Utwórz', 'Compose'].includes(e.innerText.trim()),
        )
        .map((e) => e.innerText.trim()),
    );
    if (controls.length !== 1) throw Error('GMAIL_COMPOSE_MISSING');
    await this.tab.playwright.getByRole('button', { name: controls[0], exact: true }).click();
    const shape = await this.tab.playwright.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))
        .filter((e) => e.getClientRects().length)
        .map((d) => ({
          recipient: d.querySelector('input[role="combobox"]')?.getAttribute('aria-label'),
          body: d
            .querySelector('[role="textbox"][contenteditable="true"]')
            ?.getAttribute('aria-label'),
          subject: d.querySelector('input[name="subjectbox"]')?.getAttribute('aria-label'),
          attach: Array.from(d.querySelectorAll('[role="button"],button'))
            .map((e) => e.getAttribute('aria-label'))
            .find((x) => x === 'Dołącz pliki' || x === 'Attach files'),
        })),
    );
    if (shape.length !== 1 || !shape[0].recipient || !shape[0].body || !shape[0].subject)
      throw Error('GMAIL_LAYOUT_CHANGED');
    const fields = shape[0];
    const blank = await this.observe();
    if (
      blank.sender.toLowerCase() !== payload.sender.toLowerCase() ||
      blank.to.length ||
      blank.cc.length ||
      blank.bcc.length ||
      blank.attachments.length ||
      blank.subject ||
      blank.body.trim()
    )
      throw Error('GMAIL_NONEMPTY_COMPOSE');
    await this.tab.playwright
      .getByRole('combobox', { name: fields.recipient!, exact: true })
      .fill(payload.recipient);
    await this.tab.playwright
      .getByRole('combobox', { name: fields.recipient!, exact: true })
      .press('Enter');
    await this.tab.playwright.getByLabel(fields.subject!, { exact: true }).fill(payload.subject);
    await this.tab.playwright
      .getByRole('textbox', { name: fields.body!, exact: true })
      .fill(payload.body);
    if (payload.attachment) {
      if (
        !fields.attach ||
        hash(readFileSync(payload.attachment.path)) !== payload.attachment.sha256
      )
        throw Error('CV_CHANGED');
      const chooser = this.tab.playwright.waitForEvent('filechooser');
      // The event can resolve/abort before the click promise settles. Attach a
      // rejection handler now; the awaited chooser below still propagates it.
      void chooser.catch(() => {});
      await this.tab.playwright.getByRole('button', { name: fields.attach, exact: true }).click();
      await (await chooser).setFiles([payload.attachment.path]);
    }
    // Observation-only waiting: never repeat an upload or a click.
    for (let n = 0; n < 40; n++) {
      const observation = await this.observe();
      if (
        !payload.attachment ||
        (observation.attachments.length === 1 && observation.attachments[0].complete)
      )
        return observation;
      await delay(250, undefined, { signal: this.signal });
    }
    throw Error('GMAIL_ATTACHMENT_TIMEOUT');
  }
  async clickSend(expected: ComposeObservation, beforeClick?: () => Promise<unknown>) {
    const current = await this.observe();
    if (JSON.stringify(current) !== JSON.stringify(expected)) throw Error('GMAIL_COMPOSE_CHANGED');
    const controls = await this.tab.playwright.evaluate(() =>
      Array.from(
        document.querySelectorAll('[role="dialog"] [role="button"],[role="dialog"] button'),
      )
        .filter((e) => e.getClientRects().length)
        .map((e) => e.getAttribute('aria-label'))
        .filter((s): s is string => !!s && /^(Wyślij|Send)(\s|$)/u.test(s)),
    );
    if (controls.length !== 1) throw Error('GMAIL_SEND_AMBIGUOUS');
    await beforeClick?.();
    this.signal?.throwIfAborted();
    await this.tab.playwright.getByRole('button', { name: controls[0], exact: true }).click();
  }
  async receipt(): Promise<BrowserReceipt> {
    await this.assertPage();
    let result: {
      acknowledged: true;
      url: string;
      candidateId: string | null;
      view: string | null;
    } | null = null;
    for (let n = 0; n < 40 && !result; n++) {
      result = await this.tab.playwright.evaluate(() => {
        const notifications = Array.from(
          document.querySelectorAll<HTMLElement>('[role="alert"],[role="status"]'),
        ).filter((e) => e.getClientRects().length);
        const sent = notifications.find((e) =>
          /Wiadomość została wysłana|Message sent/u.test(e.innerText),
        );
        if (!sent) return null;
        // May be absent. Never manufacture an API ID from a URL or decimal UI ID.
        const candidates = Array.from(
          sent.querySelectorAll<HTMLElement>('[data-legacy-message-id]'),
        )
          .map((e) => e.getAttribute('data-legacy-message-id')!)
          .filter((x) => /^[a-f0-9]{8,40}$/.test(x));
        const links = Array.from(sent.querySelectorAll<HTMLElement>('a,[role="link"]'))
          .filter(
            (e) =>
              e.getClientRects().length &&
              /^(Wyświetl wiadomość|View message)$/u.test(e.innerText.trim()),
          )
          .map((e) => e.innerText.trim());
        return {
          acknowledged: true as const,
          url: location.href,
          candidateId: candidates.length === 1 ? candidates[0] : null,
          view: links.length === 1 ? links[0] : null,
        };
      });
      if (!result) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!result) throw Error('GMAIL_ACK_MISSING');
    if (result.candidateId || !result.view)
      return { acknowledged: true, url: result.url, candidateId: result.candidateId };
    // Only follow the link belonging to this fresh send acknowledgement. Never
    // search the inbox for a similar message or consume arbitrary visible IDs.
    await this.tab.playwright
      .locator('[role="alert"],[role="status"]')
      .getByRole('link', { name: result.view, exact: true })
      .click();
    await this.assertPage();
    const ownIds = await this.tab.playwright.evaluate(() => {
      if (
        Array.from(document.querySelectorAll('[role="dialog"]')).some(
          (e) => e.getClientRects().length,
        )
      )
        return [];
      return Array.from(
        document.querySelectorAll<HTMLElement>('[role="main"] [data-legacy-message-id]'),
      )
        .filter((e) => e.getClientRects().length)
        .map((e) => e.getAttribute('data-legacy-message-id')!)
        .filter((x) => /^[a-f0-9]{8,40}$/.test(x));
    });
    return {
      acknowledged: true,
      url: (await this.tab.url())!,
      candidateId: ownIds.length === 1 ? ownIds[0] : null,
    };
  }
}

export async function connectBrowserExecutor(profileDir: string) {
  const client = new BrowserExecutorClient(profileDir);
  await client.attach();
  return client;
}
export async function runBrowserDelivery(
  client: BrowserExecutorClient,
  tab: BrowserTab,
  options: { scope?: BrowserExecutionScope; signal?: AbortSignal; fixtureOrigin?: string } = {},
) {
  let payload: BrowserPayload | null = null,
    heartbeat: ReturnType<typeof setInterval> | undefined,
    uncertain = false;
  try {
    options.signal?.throwIfAborted();
    const state = await client.attach();
    options.signal?.throwIfAborted();
    const scope = options.scope ?? state.scope;
    if (JSON.stringify(scope) !== JSON.stringify(state.scope))
      throw Error('BROWSER_SESSION_CHANGED');
    payload = await client.next(scope);
    options.signal?.throwIfAborted();
    if (!payload) return { status: 'IDLE' };
    heartbeat = setInterval(() => void client.attach().catch(() => {}), 10000);
    const driver = new GmailBrowserExecutor(tab, options.signal, options.fixtureOrigin);
    const observation = await driver.prepare(payload);
    options.signal?.throwIfAborted();
    await client.authorize(payload.id, observation, scope);
    uncertain = true;
    options.signal?.throwIfAborted();
    await driver.clickSend(observation, async () => {
      options.signal?.throwIfAborted();
      await client.check(payload!.id, scope);
      options.signal?.throwIfAborted();
    }); // one action only; no catch-and-click-again.
    await client.complete(payload.id, await driver.receipt());
    return { status: 'RECORDED', jobId: payload.id };
  } catch (e) {
    if (payload) await client.fail(payload.id).catch(() => {});
    const code =
      e instanceof Error && /^[A-Z_]{1,80}$/u.test(e.message) ? e.message : 'BROWSER_ACTION_FAILED';
    return { status: 'STOPPED', jobId: payload?.id, code, uncertain };
  } finally {
    clearInterval(heartbeat);
  }
}

// Run only in an active Codex browser task. No background login, autostart or
// independent browser daemon is installed. A caller chooses a bounded duration.
export async function serveBrowserDeliveries(
  client: BrowserExecutorClient,
  tab: BrowserTab,
  durationMs: number,
) {
  if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > 60000)
    throw Error('BROWSER_DURATION');
  const deadline = Date.now() + durationMs;
  let completed = 0;
  while (Date.now() < deadline) {
    const result = await runBrowserDelivery(client, tab);
    if (result.status === 'STOPPED')
      return { status: 'STOPPED', completed, code: result.code, uncertain: result.uncertain };
    if (result.status === 'RECORDED') completed++;
    else await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return { status: 'WAITING', completed };
}
