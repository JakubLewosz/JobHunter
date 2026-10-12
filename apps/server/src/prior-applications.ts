import { z } from 'zod';
import type { Row } from '../../../packages/shared/types.js';
import type { Store } from './db.js';
import { DomainError, id, normalizeName } from './util.js';

const exceptionSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1).max(200),
    cutoffAt: z.iso.datetime(),
    confirmed: z.literal(true),
  })
  .strict();

export function priorApplicationException(store: Store) {
  const value = store.get<unknown>('priorApplicationException', null);
  if (value === null) return null;
  const parsed = exceptionSchema.safeParse(value);
  if (!parsed.success)
    throw new DomainError(
      'PRIOR_APPLICATION_POLICY_INVALID',
      'Nieprawidłowa granica wcześniejszych zgłoszeń.',
    );
  return parsed.data;
}

// This boundary belongs to the installation's new campaign, never a daily quota or a Start.
export function confirmPriorApplications(store: Store, confirmed: boolean, at: Date) {
  if (!confirmed)
    throw new DomainError(
      'PRIOR_APPLICATION_CONFIRMATION',
      'Wymagana jawna decyzja o jednym kolejnym kontakcie po wcześniejszych zgłoszeniach.',
    );
  if (store.one("SELECT key FROM app_state WHERE key='priorApplicationException'"))
    throw new DomainError(
      'PRIOR_APPLICATION_ALREADY_SET',
      'Granica tej kampanii jest już zapisana; restart ani aktualizacja jej nie odnawiają.',
    );
  const policy = exceptionSchema.parse({
    version: 1,
    id: id(),
    cutoffAt: at.toISOString(),
    confirmed: true,
  });
  store.set('priorApplicationException', policy);
  return policy;
}

function beforeBoundary(store: Store, timestamp: unknown) {
  const policy = priorApplicationException(store);
  if (!policy || typeof timestamp !== 'string') return false;
  const time = Date.parse(timestamp);
  return Number.isFinite(time) && time < Date.parse(policy.cutoffAt);
}

export function isFingoweb(name: unknown) {
  return typeof name === 'string' && normalizeName(name).startsWith('fingoweb');
}

export function manualHistoryBlocks(store: Store, record: Row) {
  if (record.status === 'SUGGESTED') return false;
  if (isFingoweb(record.original_name) || record.status !== 'CONTACTED') return true;
  // Unknown dates imported after the boundary never become invented earlier applications.
  return !beforeBoundary(store, record.occurred_at ?? record.created_at);
}

export function gmailHistoryBlocks(store: Store, message: Row) {
  // Only a complete local check can exempt an earlier incoming reply. No mailbox
  // text goes to a model; unknown checks, refusals and our registered sends block.
  if (
    message.prior_contact_check === 'OPT_OUT' ||
    message.outbox_id !== null ||
    ['REJECTED', 'ON_HOLD', 'BOUNCE', 'DO_NOT_CONTACT'].includes(message.category)
  )
    return true;
  if (
    message.direction !== 'OUTGOING' &&
    !(message.direction === 'INCOMING' && message.prior_contact_check === 'CLEAR')
  )
    return true;
  return !beforeBoundary(store, message.sent_at);
}

export function priorResponseCheck(
  text: string,
  complete: boolean,
): 'CLEAR' | 'OPT_OUT' | 'UNKNOWN' {
  const normalized = text
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const optOut =
    /\b(?:nie (?:kontakt(?:uj\w*|owac)|pis(?:z\w*|ac)|wysyl(?:aj\w*|ac)|przesyl(?:aj\w*|ac))|(?:prosze|prosimy) (?:o )?(?:zaprzestanie|zaprzestac|zaniechanie|wstrzymanie) (?:dalszego )?(?:kontaktu|wysylania|przesylania|pisania)|zaprzestan (?:dalszego )?(?:kontaktu|kontaktowania|wysylania)|nie zycz(?:e|ymy) (?:sobie )?(?:dalszego )?(?:kontaktu|wiadomosci)|do not (?:contact|email|e-mail|write)|don't (?:contact|email|write)|stop (?:contacting|emailing|sending)|(?:refrain from|cease) (?:contacting|emailing|sending)|remove (?:me|us) from)/u.test(
      normalized,
    );
  return optOut ? 'OPT_OUT' : complete ? 'CLEAR' : 'UNKNOWN';
}

export function companyHistoryBlocks(store: Store, company: Row, ownOutbox: string | null = null) {
  if (
    isFingoweb(company.canonical_name) ||
    company.suppression_reason ||
    store.one('SELECT id FROM suppressions WHERE company_id=?', company.id)
  )
    return true;
  if (company.history_status === 'NEW') return false;
  if (company.history_status !== 'CONTACTED' || !priorApplicationException(store)) return true;
  // Registered attempts are never covered by the legacy application exception, even if
  // their timestamps predate the boundary. SEND_UNKNOWN and provider acceptance stay durable.
  if (
    store.one(
      "SELECT a.id FROM send_attempts a JOIN outbox o ON o.id=a.outbox_id WHERE o.company_id=? AND o.kind='FIRST_CONTACT' AND a.state<>'FAILED_NOT_SENT' AND NOT (o.id=? AND o.status IN ('QUEUED','SENDING'))",
      company.id,
      ownOutbox ?? '',
    ) ||
    store.one(
      "SELECT id FROM shared_attempts WHERE company_id=? AND state<>'FAILED_NOT_SENT'",
      company.id,
    ) ||
    store.one(
      "SELECT id FROM outbox WHERE company_id=? AND kind='FIRST_CONTACT' AND status IN ('QUEUED','SENDING','SEND_UNKNOWN','SENT_PROVIDER','SENT_CONFIRMED') AND NOT (id=? AND status IN ('QUEUED','SENDING'))",
      company.id,
      ownOutbox ?? '',
    )
  )
    return true;
  const records = store.all(
    "SELECT * FROM history_records WHERE company_id=? AND status<>'SUGGESTED'",
    company.id,
  );
  const messages = store.all(
    "SELECT m.* FROM gmail_messages m LEFT JOIN outbox o ON o.id=m.outbox_id WHERE m.company_id=? AND (m.outbox_id IS NULL OR o.kind='FIRST_CONTACT')",
    company.id,
  );
  if (!records.length && !messages.length) return true; // Unknown origin is not permission.
  return (
    records.some((record) => manualHistoryBlocks(store, record)) ||
    messages.some((message) => gmailHistoryBlocks(store, message))
  );
}
