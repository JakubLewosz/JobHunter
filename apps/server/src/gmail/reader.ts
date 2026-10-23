import addressparser from 'nodemailer/lib/addressparser/index.js';
import { z } from 'zod';
import { DomainError } from '../util.js';
import { GmailMailProvider } from './client.js';
import { gmailCredentials, gmailReadScope, nativeSecretStore, type AccountInfo } from './oauth.js';
import { readAccountPolicy, assertAccountPolicy } from './account-policy.js';
import { setupInfo } from './oauth.js';
import { join } from 'node:path';
import type { FrozenMessage } from '../providers.js';
import { textFromHTML } from '../research/fetcher.js';
import { inspectMime, decodeSubject, maxMimeBytes } from './inspection.js';
import { priorResponseCheck } from '../prior-applications.js';
import { readSendAs, type SendAsRead } from './send-as.js';
export { decodeSubject } from './inspection.js';

export interface GmailMessage {
  id: string;
  threadId: string;
  labels: string[];
  from: string[];
  to: string[];
  subject: string;
  messageId: string;
  at: string;
  body: string;
  category: string;
  raw?: Buffer; // Full MIME only for consented reconciliation; never the truncated reply body.
  priorContactCheck?: 'CLEAR' | 'OPT_OUT' | 'UNKNOWN';
}
export interface SentQuery {
  messageId: string;
  providerId?: string | null;
  includeRaw?: boolean; // Browser receipts require exact payload, only inside the consented scope.
  scope?: {
    accountSubject: string;
    accountEmail: string;
    recipient: string;
    after: number;
    before: number;
  };
}
export interface GmailGateway {
  account(): Promise<AccountInfo>;
  sendAs?(expected: AccountInfo, signal?: AbortSignal): Promise<SendAsRead>;
  marker(expected?: AccountInfo): Promise<string>;
  scan(
    query: string,
    page: (messages: GmailMessage[], next: string | null) => void,
    expected?: AccountInfo,
    options?: { priorApplicationsBefore: string; email: string; domains: string[] },
  ): Promise<void>;
  thread(id: string): Promise<GmailMessage[]>;
  sent(input: SentQuery): Promise<GmailMessage[]>;
  send(
    input: FrozenMessage,
    account: AccountInfo,
    beforeSend: () => void,
  ): Promise<{ id: string | null; threadId: string | null; confirmed: boolean }>;
}
const providerId = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9_-]+$/);
const headersSchema = z
  .array(z.object({ name: z.string().max(200), value: z.string().max(20000) }))
  .max(200);
function addresses(text: string) {
  return addressparser(text, { flatten: true }).map((a) => a.address.toLowerCase());
}
export function parseGmailMessage(
  raw: unknown,
  full = false,
  inspectPriorResponse = false,
): GmailMessage {
  const m = z
    .object({
      id: providerId,
      threadId: providerId,
      labelIds: z.array(z.string()).default([]),
      internalDate: z.string().regex(/^\d+$/),
      payload: z.object({ headers: headersSchema, mimeType: z.string().optional() }).passthrough(),
    })
    .parse(raw);
  const header = (name: string) =>
    m.payload.headers
      .filter((h) => h.name.toLowerCase() === name.toLowerCase())
      .map((h) => h.value)
      .join(', ');
  if (m.payload.headers.filter((h) => h.name.toLowerCase() === 'message-id').length > 1)
    throw new DomainError('GMAIL_MESSAGE', 'Niejednoznaczny identyfikator wiadomości.');
  const timestamp = Number(m.internalDate);
  if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > 8640000000000000)
    throw new DomainError('GMAIL_MESSAGE', 'Nieprawidłowa data wiadomości.');
  const from = addresses(header('From'));
  const to = addresses([header('To'), header('Cc'), header('Bcc')].filter(Boolean).join(', '));
  let body = '';
  let html = '';
  let complete = true;
  let textSeen = false;
  const visit = (part: any, depth = 0) => {
    if (part.filename) return; // No attachment extraction or download.
    if (depth > 15) {
      complete = false;
      return;
    }
    if (part.mimeType === 'text/plain' && !part.filename && typeof part.body?.data === 'string') {
      textSeen = true;
      if (!/^[a-zA-Z0-9_-]*={0,2}$/.test(part.body.data) || part.body.data.length % 4 === 1)
        complete = false;
      if (part.body.data.length <= 48000) {
        const decoded = Buffer.from(part.body.data, 'base64url').toString('utf8');
        if (decoded.includes('\uFFFD')) complete = false;
        if (body.length + decoded.length > 16000) complete = false;
        body += decoded.slice(0, 16000 - body.length);
      } else complete = false;
    }
    if (
      part.mimeType === 'text/html' &&
      !part.filename &&
      typeof part.body?.data === 'string' &&
      part.body.data.length <= 48000
    ) {
      textSeen = true;
      if (!/^[a-zA-Z0-9_-]*={0,2}$/.test(part.body.data) || part.body.data.length % 4 === 1)
        complete = false;
      const decoded = Buffer.from(part.body.data, 'base64url').toString('utf8');
      if (decoded.includes('\uFFFD')) complete = false;
      if (html.length + decoded.length > 16000) complete = false;
      html += decoded.slice(0, 16000 - html.length);
    }
    if (
      (part.mimeType === 'text/plain' || part.mimeType === 'text/html') &&
      (typeof part.body?.data !== 'string' || part.body.data.length > 48000)
    )
      complete = false;
    if (Array.isArray(part.parts)) {
      if (part.parts.length > 50) complete = false;
      for (const child of part.parts.slice(0, 50)) visit(child, depth + 1);
    }
  };
  if (full) visit(m.payload);
  if (!body && html) body = textFromHTML(html).slice(0, 16000);
  const category =
    /mailer-daemon|postmaster/i.test(from.join(' ')) || m.payload.mimeType === 'multipart/report'
      ? 'BOUNCE'
      : (header('Auto-Submitted') && header('Auto-Submitted').toLowerCase() !== 'no') ||
          /auto_reply|auto-reply/i.test(header('Precedence'))
        ? 'AUTORESPONDER'
        : 'UNCLEAR';
  return {
    id: m.id,
    threadId: m.threadId,
    labels: m.labelIds,
    from,
    to,
    subject: decodeSubject(header('Subject')),
    messageId: header('Message-ID').trim(),
    at: new Date(timestamp).toISOString(),
    body,
    category,
    ...(inspectPriorResponse
      ? {
          priorContactCheck: priorResponseCheck(
            `${decodeSubject(header('Subject'))}\n${body}\n${textFromHTML(html)}`,
            full && complete && textSeen,
          ),
        }
      : {}),
  };
}

export class GmailApi implements GmailGateway {
  constructor(
    private credentials: () => Promise<{ account: AccountInfo; bearer: string }>,
    private request: typeof fetch = fetch,
    private apiSendAllowed: () => void = () => {},
  ) {}
  async account() {
    return (await this.credentials()).account;
  }
  sendAs(expected: AccountInfo, signal?: AbortSignal) {
    return readSendAs(this.credentials, expected, this.request, signal);
  }
  private async read(
    path: string,
    query = new URLSearchParams(),
    expected?: AccountInfo,
    maxBytes = 4 * 1024 * 1024,
  ): Promise<any> {
    const { bearer, account } = await this.credentials();
    if (expected && !account.scopes.includes(gmailReadScope))
      throw new DomainError('READ_PERMISSION_REQUIRED', 'Brak uprawnienia do odczytu Gmaila.');
    if (
      expected &&
      (account.subject !== expected.subject ||
        account.email.toLowerCase() !== expected.email.toLowerCase())
    )
      throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto zmieniło się podczas odczytu.');
    const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`);
    url.search = query.toString();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.request(url.href, {
          headers: { Authorization: `Bearer ${bearer}` },
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        });
        if (response.status === 429) {
          await response.body?.cancel();
          throw new DomainError(
            'GMAIL_RATE_LIMIT',
            'Gmail ograniczył odczyt. Sender wstrzymany; wznów po ustąpieniu ograniczenia.',
          );
        }
        if ([500, 502, 503, 504].includes(response.status) && attempt < 2) {
          const delay = Number(response.headers.get('Retry-After') ?? '0');
          if (delay > 1) throw new Error('READ_LIMIT');
          await response.body?.cancel();
          await new Promise((r) => setTimeout(r, Math.max(1000 * 2 ** attempt, delay * 1000)));
          continue;
        }
        if (!response.ok) throw new Error('READ_FAILED');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('EMPTY');
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        try {
          while (true) {
            const p = await reader.read();
            if (p.done) break;
            bytes += p.value.length;
            if (bytes > maxBytes) throw new Error('LIMIT');
            chunks.push(p.value);
          }
        } finally {
          await reader.cancel();
        }
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError(
          'GMAIL_READ',
          'Nie ukończono odczytu Gmaila. Nie uznajemy historii za pustą.',
        );
      }
    }
    throw new DomainError('GMAIL_READ', 'Nie ukończono odczytu Gmaila.');
  }
  async marker(expected?: AccountInfo) {
    const p = z
      .object({ historyId: z.string().regex(/^\d+$/), emailAddress: z.email() })
      .parse(await this.read('profile', new URLSearchParams(), expected));
    if (p.emailAddress.toLowerCase() !== (expected ?? (await this.account())).email.toLowerCase())
      throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto poczty zmieniło się.');
    return p.historyId;
  }
  async scan(
    query: string,
    onPage: (messages: GmailMessage[], next: string | null) => void,
    expected?: AccountInfo,
    limitOrOptions:
      number | { priorApplicationsBefore: string; email: string; domains: string[] } = 1000,
  ) {
    const maxMessages = typeof limitOrOptions === 'number' ? limitOrOptions : 1000;
    const prior = typeof limitOrOptions === 'number' ? null : limitOrOptions;
    let cursor: string | null = null;
    const seen = new Set<string>();
    let total = 0;
    const deadline = Date.now() + 45000;
    do {
      if (Date.now() > deadline)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Nie ukończono odczytu w limicie czasu.');
      const params = new URLSearchParams({ q: query, maxResults: '50', includeSpamTrash: 'true' });
      if (cursor) params.set('pageToken', cursor);
      const page = z
        .object({
          messages: z.array(z.object({ id: providerId, threadId: providerId })).optional(),
          resultSizeEstimate: z.number().int().nonnegative().optional(),
          nextPageToken: z.string().min(1).max(2000).optional(),
        })
        .refine(
          (p) => p.messages !== undefined || p.resultSizeEstimate === 0,
          'Incomplete message list',
        )
        .transform((p) => ({ ...p, messages: p.messages ?? [] }))
        .parse(await this.read('messages', params, expected));
      if (Date.now() > deadline)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Nie ukończono odczytu w limicie czasu.');
      total += page.messages.length;
      if (total > maxMessages)
        throw new DomainError(
          'GMAIL_HISTORY_LIMIT',
          'Historia przekracza limit odczytu; wymaga przeglądu, nie jest pusta.',
        );
      const messages: GmailMessage[] = [];
      for (const { id } of page.messages) {
        if (Date.now() > deadline)
          throw new DomainError(
            'GMAIL_HISTORY_LIMIT',
            'Nie ukończono odczytu w limicie czasu; historia wymaga przeglądu.',
          );
        const params = new URLSearchParams({ format: 'metadata' });
        for (const name of [
          'From',
          'To',
          'Cc',
          'Bcc',
          'Subject',
          'Message-ID',
          'Auto-Submitted',
          'Precedence',
        ])
          params.append('metadataHeaders', name);
        let m = parseGmailMessage(await this.read(`messages/${id}`, params, expected));
        if (m.id !== id)
          throw new DomainError('GMAIL_MESSAGE', 'Niezgodny identyfikator odczytanej wiadomości.');
        const inScope =
          prior &&
          [...m.from, ...m.to].some(
            (email) =>
              email === prior.email ||
              prior.domains.some(
                (domain) =>
                  email.split('@')[1] === domain || email.split('@')[1]?.endsWith('.' + domain),
              ),
          );
        if (
          prior &&
          inScope &&
          !m.labels.includes('SENT') &&
          Date.parse(m.at) < Date.parse(prior.priorApplicationsBefore)
        ) {
          const metadata = m;
          m = parseGmailMessage(
            await this.read(`messages/${id}`, new URLSearchParams({ format: 'full' }), expected),
            true,
            true,
          );
          if (
            m.id !== metadata.id ||
            m.threadId !== metadata.threadId ||
            m.at !== metadata.at ||
            m.labels.includes('SENT') ||
            JSON.stringify(m.from) !== JSON.stringify(metadata.from) ||
            JSON.stringify(m.to) !== JSON.stringify(metadata.to)
          )
            throw new DomainError(
              'GMAIL_MESSAGE',
              'Wiadomość zmieniła zakres podczas kontroli odmowy kontaktu.',
            );
        }
        messages.push(m);
      }
      cursor = page.nextPageToken ?? null;
      if (cursor && seen.has(cursor))
        throw new DomainError('GMAIL_PAGINATION', 'Nie ukończono stronicowania historii.');
      if (cursor) seen.add(cursor);
      // Persist the page and cursor together only after all metadata in the page was read.
      onPage(messages, cursor);
      if (seen.size > 20)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Nie ukończono historii w limicie stron.');
    } while (cursor);
  }
  async thread(id: string) {
    providerId.parse(id);
    const result = z
      .object({ id: providerId, messages: z.array(z.unknown()).max(200) })
      .parse(await this.read(`threads/${id}`, new URLSearchParams({ format: 'full' })));
    if (result.id !== id) throw new DomainError('GMAIL_MESSAGE', 'Niezgodny wątek.');
    const messages = result.messages.map((m) => parseGmailMessage(m, true));
    if (messages.some((m) => m.threadId !== id))
      throw new DomainError('GMAIL_MESSAGE', 'Wiadomość pochodzi z innego wątku.');
    return messages;
  }
  async sent(input: SentQuery) {
    if (!/^<[a-zA-Z0-9-]+@jobhunter\.local>$/.test(input.messageId))
      throw new DomainError('GMAIL_MESSAGE', 'Nieprawidłowy identyfikator próby.');
    const expected = await this.account();
    if (!expected.scopes.includes(gmailReadScope))
      throw new DomainError('READ_PERMISSION_REQUIRED', 'Brak uprawnienia do odczytu Gmaila.');
    const scope = input.scope;
    if (
      scope &&
      (expected.subject !== scope.accountSubject ||
        expected.email.toLowerCase() !== scope.accountEmail.toLowerCase())
    )
      throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto zmieniło się przed odczytem.');
    if (input.providerId) {
      if (input.includeRaw) this.assertSentScope(scope);
      providerId.parse(input.providerId);
      const params = new URLSearchParams({ format: 'metadata' });
      for (const name of ['From', 'To', 'Cc', 'Bcc', 'Subject', 'Message-ID'])
        params.append('metadataHeaders', name);
      // Preserve the direct-ID path, including read errors; an error is not an empty result.
      const known = parseGmailMessage(
        await this.read(`messages/${input.providerId}`, params, expected),
      );
      if (known.id !== input.providerId)
        throw new DomainError('GMAIL_MESSAGE', 'Niezgodna wiadomość.');
      if (!input.includeRaw) return [known];
      if (!this.sentInScope(known, scope!)) return [];
      return [await this.sentRaw(known, expected)];
    }
    const results: GmailMessage[] = [];
    if (!scope) {
      await this.scan(
        `in:sent rfc822msgid:${input.messageId.slice(1, -1)}`,
        (page) => results.push(...page),
        expected,
      );
      return results;
    }
    this.assertSentScope(scope);
    const deadline = Date.now() + 45000;
    await this.scan(
      `in:sent from:${scope.accountEmail} to:${scope.recipient} after:${Math.floor(scope.after / 1000)} before:${Math.ceil(scope.before / 1000)}`,
      (page) => results.push(...page),
      expected,
      50,
    );
    let bytes = 0;
    const complete: GmailMessage[] = [];
    for (const m of results) {
      if (!this.sentInScope(m, scope)) continue;
      if (Date.now() > deadline)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Nie ukończono odczytu kandydatów.');
      const message = await this.sentRaw(m, expected);
      bytes += message.raw!.length;
      if (bytes > 24 * 1024 * 1024)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Kandydaci przekraczają limit odczytu.');
      complete.push(message);
    }
    return complete;
  }
  private assertSentScope(
    scope: SentQuery['scope'],
  ): asserts scope is NonNullable<SentQuery['scope']> {
    if (
      !scope ||
      ![scope.accountEmail, scope.recipient].every(
        (email) =>
          z.email().safeParse(email).success && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/.test(email),
      ) ||
      !Number.isFinite(scope.after) ||
      !Number.isFinite(scope.before) ||
      scope.before <= scope.after ||
      scope.before - scope.after > 720000
    )
      throw new DomainError('GMAIL_MESSAGE', 'Brak bezpiecznego zakresu tej próby.');
  }
  private sentInScope(m: GmailMessage, scope: NonNullable<SentQuery['scope']>) {
    return (
      m.labels.includes('SENT') &&
      m.from.length === 1 &&
      m.from[0] === scope.accountEmail.toLowerCase() &&
      m.to.length === 1 &&
      m.to[0] === scope.recipient.toLowerCase() &&
      Date.parse(m.at) >= scope.after &&
      Date.parse(m.at) <= scope.before
    );
  }
  private async sentRaw(m: GmailMessage, expected: AccountInfo): Promise<GmailMessage> {
    const value = z
      .object({
        id: providerId,
        threadId: providerId,
        labelIds: z.array(z.string()),
        internalDate: z.string().regex(/^\d+$/),
        raw: z
          .string()
          .min(1)
          .max(Math.ceil((maxMimeBytes * 4) / 3))
          .regex(/^[a-zA-Z0-9_-]+={0,2}$/),
      })
      .parse(
        await this.read(
          `messages/${m.id}`,
          new URLSearchParams({ format: 'raw' }),
          expected,
          16 * 1024 * 1024,
        ),
      );
    const raw = Buffer.from(value.raw, 'base64url');
    if (raw.toString('base64url') !== value.raw.replace(/=+$/, ''))
      throw new DomainError('GMAIL_MESSAGE', 'Niekompletne kodowanie RAW.');
    const mime = inspectMime(raw);
    const parsed = parseGmailMessage({
      ...value,
      payload: {
        headers: Object.entries(mime.headers).flatMap(([name, values]) =>
          values.map((value) => ({ name, value })),
        ),
      },
    });
    if (parsed.id !== m.id || parsed.threadId !== m.threadId || parsed.at !== m.at)
      throw new DomainError('GMAIL_MESSAGE', 'Metadane i RAW nie dotyczą tej samej wiadomości.');
    return { ...parsed, raw };
  }
  async send(input: FrozenMessage, expected: AccountInfo, beforeSend: () => void) {
    this.apiSendAllowed(); // Before credentials, reservation callback or HTTP.
    const provider = new GmailMailProvider(
      async () => {
        const { account, bearer } = await this.credentials();
        if (
          account.subject !== expected.subject ||
          account.email.toLowerCase() !== expected.email.toLowerCase()
        )
          throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto zmieniono przed wysyłką.');
        return bearer;
      },
      this.request,
      beforeSend,
    );
    return provider.sendFrozenMessage(input);
  }
}
export function disabledGmail(): GmailGateway {
  const denied = async (): Promise<never> => {
    throw new DomainError('SEND_DISABLED', 'Tryb developerski — bez prawdziwej wysyłki.');
  };
  return {
    account: denied,
    marker: denied,
    scan: denied,
    thread: denied,
    sent: denied,
    send: denied,
  };
}
export function nativeGmail(assertNative: () => void, base: string): GmailGateway {
  // Lazy credential access: constructing the app never opens Keychain or reads the mailbox.
  return new GmailApi(
    async () => {
      assertNative();
      const policy = readAccountPolicy(base);
      const metadata = setupInfo(join(base, 'gmail-preparation'));
      if (!metadata) throw new DomainError('GMAIL_NOT_CONNECTED', 'Podłącz jedyne aktywne konto.');
      assertAccountPolicy(policy, metadata);
      return gmailCredentials(await nativeSecretStore(), fetch, {
        policy: () => readAccountPolicy(base),
        metadata: () => setupInfo(join(base, 'gmail-preparation')),
      });
    },
    fetch,
    () => {
      throw new DomainError(
        'API_SEND_DISABLED',
        'Instalacja robocza nadaje wyłącznie przez Computer Use.',
      );
    },
  );
}
