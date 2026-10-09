import { strict as assert } from 'node:assert';
import type { GmailGateway, GmailMessage, SentQuery } from '../apps/server/src/gmail/reader.js';
import { decodeSubject } from '../apps/server/src/gmail/reader.js';
import {
  gmailReadScope,
  gmailSendScope,
  type AccountInfo,
} from '../apps/server/src/gmail/oauth.js';
import type { FrozenMessage } from '../apps/server/src/providers.js';
import { DomainError } from '../apps/server/src/util.js';

// Memory-only fictional mail. No Keychain or external networking.
export class FixtureGmail implements GmailGateway {
  info: AccountInfo = {
    email: 'owner@example.test',
    subject: 'fictional-account',
    connectedAt: new Date().toISOString(),
    scopes: ['openid', 'email', gmailSendScope, gmailReadScope],
  };
  posts: FrozenMessage[] = [];
  sentMessages: GmailMessage[] = [];
  previous: GmailMessage[] = [];
  incoming: GmailMessage[] = [];
  errorHistory = false;
  changeMarker = false;
  markerCalls = 0;
  timeout = false;
  reject = false;
  beforePost?: () => Promise<void>;
  account = async () => this.info;
  marker = async () => String(this.changeMarker ? ++this.markerCalls : 1);
  async scan(_query: string, onPage: (m: GmailMessage[], next: string | null) => void) {
    onPage(this.previous, this.errorHistory ? 'fictional-next' : null);
    if (this.errorHistory) throw new DomainError('GMAIL_READ', 'Fikcyjny błąd drugiej strony.');
  }
  async thread(id: string) {
    return [...this.sentMessages, ...this.incoming].filter((m) => m.threadId === id);
  }
  async sent(input: SentQuery) {
    return this.sentMessages.filter((m) =>
      input.providerId
        ? m.id === input.providerId
        : input.scope
          ? true
          : m.messageId === input.messageId,
    );
  }
  async send(input: FrozenMessage, account: AccountInfo, beforeSend: () => void) {
    assert.equal(account.subject, this.info.subject);
    await this.beforePost?.();
    try {
      beforeSend();
    } catch {
      throw new DomainError('FAILED_NOT_SENT', 'Fikcyjna blokada przed HTTP.');
    }
    if (this.reject) throw new DomainError('FAILED_NOT_SENT', 'Fikcyjne HTTP 403.');
    this.posts.push(input);
    const mime = input.mime
      .toString('utf8')
      .split('\r\n\r\n')[0]
      .replace(/\r\n[ \t]+/g, ' ');
    const get = (name: string) => mime.match(new RegExp(`^${name}: (.*)$`, 'mi'))![1].trim();
    const m: GmailMessage = {
      id: `fixture-${this.posts.length}`,
      threadId: `thread-${this.posts.length}`,
      labels: ['SENT'],
      from: [account.email],
      to: [input.recipient],
      subject: decodeSubject(get('Subject')),
      messageId: input.messageId,
      at: new Date().toISOString(),
      body: '',
      category: 'UNCLEAR',
      raw: input.mime,
    };
    this.sentMessages.push(m);
    if (this.timeout) throw new DomainError('SEND_UNKNOWN', 'Fikcyjny timeout po przyjęciu.');
    return { id: m.id, threadId: m.threadId, confirmed: false };
  }
}
