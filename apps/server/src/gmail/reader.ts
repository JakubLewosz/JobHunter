import addressparser from 'nodemailer/lib/addressparser/index.js';
import { z } from 'zod';
import { DomainError } from '../util.js';
import { GmailMailProvider } from './client.js';
import { gmailCredentials, gmailReadScope, nativeSecretStore, type AccountInfo } from './oauth.js';
import type { FrozenMessage } from '../providers.js';
import { textFromHTML } from '../research/fetcher.js';
import { inspectMime, decodeSubject, maxMimeBytes } from './inspection.js';
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
}
export interface SentQuery {
  messageId: string;
  providerId?: string | null;
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
  marker(): Promise<string>;
  scan(query: string, page: (messages: GmailMessage[], next: string | null) => void): Promise<void>;
  thread(id: string): Promise<GmailMessage[]>;
  sent(input: SentQuery): Promise<GmailMessage[]>;
  send(
    input: FrozenMessage,
    account: AccountInfo,
    beforeSend: () => void,
  ): Promise<{ id: string; threadId: string; confirmed: boolean }>;
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
export function parseGmailMessage(raw: unknown, full = false): GmailMessage {
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
  const visit = (part: any, depth = 0) => {
    if (depth > 15) return;
    if (part.mimeType === 'text/plain' && !part.filename && typeof part.body?.data === 'string') {
      if (part.body.data.length <= 48000)
        body += Buffer.from(part.body.data, 'base64url')
          .toString('utf8')
          .slice(0, 16000 - body.length);
    }
    if (
      part.mimeType === 'text/html' &&
      !part.filename &&
      typeof part.body?.data === 'string' &&
      part.body.data.length <= 48000
    )
      html += Buffer.from(part.body.data, 'base64url')
        .toString('utf8')
        .slice(0, 16000 - html.length);
    if (Array.isArray(part.parts))
      for (const child of part.parts.slice(0, 50)) visit(child, depth + 1);
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
  };
}

export class GmailApi implements GmailGateway {
  constructor(
    private credentials: () => Promise<{ account: AccountInfo; bearer: string }>,
    private request: typeof fetch = fetch,
  ) {}
  async account() {
    return (await this.credentials()).account;
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
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 2) {
          const delay = Number(response.headers.get('Retry-After') ?? '0');
          if (delay > 1) throw new Error('READ_LIMIT');
          await response.body?.cancel();
          await new Promise((r) => setTimeout(r, Math.max(100 * (attempt + 1), delay * 1000)));
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
      } catch {
        throw new DomainError(
          'GMAIL_READ',
          'Nie ukończono odczytu Gmaila. Nie uznajemy historii za pustą.',
        );
      }
    }
    throw new DomainError('GMAIL_READ', 'Nie ukończono odczytu Gmaila.');
  }
  async marker() {
    const p = z
      .object({ historyId: z.string().regex(/^\d+$/), emailAddress: z.email() })
      .parse(await this.read('profile'));
    if (p.emailAddress.toLowerCase() !== (await this.account()).email.toLowerCase())
      throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto poczty zmieniło się.');
    return p.historyId;
  }
  async scan(
    query: string,
    onPage: (messages: GmailMessage[], next: string | null) => void,
    expected?: AccountInfo,
    maxMessages = 1000,
  ) {
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
        const m = parseGmailMessage(await this.read(`messages/${id}`, params, expected));
        if (m.id !== id)
          throw new DomainError('GMAIL_MESSAGE', 'Niezgodny identyfikator odczytanej wiadomości.');
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
      return [known];
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
    if (
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
      if (
        !m.labels.includes('SENT') ||
        m.from.length !== 1 ||
        m.from[0] !== scope.accountEmail.toLowerCase() ||
        m.to.length !== 1 ||
        m.to[0] !== scope.recipient.toLowerCase() ||
        Date.parse(m.at) < scope.after ||
        Date.parse(m.at) > scope.before
      )
        continue;
      if (Date.now() > deadline)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Nie ukończono odczytu kandydatów.');
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
      bytes += raw.length;
      if (bytes > 24 * 1024 * 1024)
        throw new DomainError('GMAIL_HISTORY_LIMIT', 'Kandydaci przekraczają limit odczytu.');
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
      complete.push({ ...parsed, raw });
    }
    return complete;
  }
  async send(input: FrozenMessage, expected: AccountInfo, beforeSend: () => void) {
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
export function nativeGmail(): GmailGateway {
  // Lazy credential access: constructing the app never opens Keychain or reads the mailbox.
  return new GmailApi(async () => gmailCredentials(await nativeSecretStore()));
}
