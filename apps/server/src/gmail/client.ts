import { DomainError, hash } from '../util.js';
import type { FrozenMessage, MailProvider } from '../providers.js';

// Preparation only: not instantiated by DEMO/RESEARCH_ONLY or exposed through their APIs.
export class GmailMailProvider implements MailProvider {
  constructor(
    private token: () => Promise<string>,
    private request: typeof fetch = fetch,
    private beforeSend: () => void = () => {},
  ) {}
  async sendFrozenMessage(input: FrozenMessage) {
    if (hash(input.mime) !== input.mimeHash)
      throw new DomainError('FAILED_NOT_SENT', 'Bajty wiadomości zmieniły się przed wysyłką.');
    let bearer: string;
    try {
      bearer = await this.token();
      this.beforeSend();
    } catch {
      throw new DomainError('FAILED_NOT_SENT', 'Nie uzyskano zgody konta; nie wywołano wysyłki.');
    }
    try {
      // Exactly one HTTP attempt. No retry middleware, redirects or automatic refresh-and-resend.
      const response = await this.request(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: input.mime.toString('base64url') }),
          signal: AbortSignal.timeout(15000),
          redirect: 'error',
        },
      );
      if ([400, 401, 403, 404, 429].includes(response.status))
        throw new DomainError(
          'FAILED_NOT_SENT',
          `Gmail odrzucił żądanie (HTTP ${response.status}).`,
        );
      if (!response.ok) throw new Error('UNCERTAIN');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('EMPTY');
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 65536) throw new Error('LIMIT');
          chunks.push(part.value);
        }
      } finally {
        await reader.cancel();
      }
      const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (
        typeof value.id !== 'string' ||
        typeof value.threadId !== 'string' ||
        !value.id ||
        !value.threadId
      )
        throw new Error('UNCERTAIN');
      return { id: value.id, threadId: value.threadId, confirmed: false };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError(
        'SEND_UNKNOWN',
        'Wynik wysyłki jest niepewny. Nie ponawiaj automatycznie.',
      );
    }
  }
  async lookupSendResult(_messageId: string): Promise<null> {
    throw new DomainError(
      'READ_PERMISSION_REQUIRED',
      'Odczyt Wysłanych i rozstrzyganie wysyłek wymagają osobnego etapu oraz uprawnienia do odczytu.',
    );
  }
}
