import { z } from 'zod';
import { DomainError, hash, normalizeEmail } from '../util.js';
import { gmailReadScope, googleJSON, type AccountInfo } from './oauth.js';
import { assertAccountPolicy, type AccountPolicy } from './account-policy.js';
import type { ComposeObservation } from '../browser/contracts.js';

export const sendAsFields = 'sendAsEmail,replyToAddress,isPrimary,isDefault,verificationStatus';
export type SendAsRead = { account: AccountInfo; resource: unknown; checkedAt: number };
export type ReplyToEvidence = {
  operation: string;
  accountEmail: string;
  accountSubject: string;
  policyRevision: string;
  settingsHash: string;
  replyTo: { kind: 'NONE' } | { kind: 'ADDRESS'; address: string };
  checkedAt: number;
  validUntil: number;
};
const resourceSchema = z.object({
  sendAsEmail: z.email(),
  isPrimary: z.literal(true),
  isDefault: z.literal(true),
  replyToAddress: z.union([z.literal(''), z.email()]).optional(),
  // Google documents this field for custom aliases. Primary identity is verified separately.
  verificationStatus: z.literal('accepted').optional(),
});

export async function readSendAs(
  credentials: () => Promise<{ account: AccountInfo; bearer: string }>,
  expected: AccountInfo,
  request: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<SendAsRead> {
  signal?.throwIfAborted();
  const { account, bearer } = await credentials();
  signal?.throwIfAborted();
  if (
    account.subject !== expected.subject ||
    normalizeEmail(account.email) !== normalizeEmail(expected.email)
  )
    throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto ustawień Gmaila zmieniło się.');
  if (!account.scopes.includes(gmailReadScope))
    throw new DomainError('READ_PERMISSION_REQUIRED', 'Ustawienia wymagają gmail.readonly.');
  const url = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/${encodeURIComponent(expected.email)}`,
  );
  url.searchParams.set('fields', sendAsFields);
  try {
    const resource = await googleJSON(url.href, {}, (input, init) =>
      request(input, {
        ...init,
        headers: { Authorization: `Bearer ${bearer}` },
        signal: signal ? AbortSignal.any([signal, init!.signal!]) : init?.signal,
      }),
    );
    signal?.throwIfAborted();
    return { account, resource, checkedAt: Date.now() };
  } catch {
    signal?.throwIfAborted();
    throw new DomainError('GMAIL_SETTINGS_UNVERIFIED', 'Nie potwierdzono ustawień Send-As.');
  }
}

export function replyToEvidence(
  read: SendAsRead,
  policy: AccountPolicy,
  observation: Pick<ComposeObservation, 'account' | 'sender' | 'replyTo'>,
  operation: string,
  previous?: ReplyToEvidence,
  now = Date.now(),
): ReplyToEvidence {
  assertAccountPolicy(policy, read.account);
  if (!read.account.scopes.includes(gmailReadScope))
    throw new DomainError('READ_PERMISSION_REQUIRED', 'Brak potwierdzonego odczytu ustawień.');
  const parsed = resourceSchema.safeParse(read.resource);
  if (!parsed.success)
    throw new DomainError(
      'GMAIL_SETTINGS_UNVERIFIED',
      'Odpowiedź Send-As jest niepełna lub niezweryfikowana.',
    );
  const setting = parsed.data;
  if (
    normalizeEmail(setting.sendAsEmail) !== normalizeEmail(policy.email) ||
    normalizeEmail(observation.account ?? '') !== normalizeEmail(policy.email) ||
    normalizeEmail(observation.sender) !== normalizeEmail(policy.email)
  )
    throw new DomainError('GMAIL_ACCOUNT_CHANGED', 'Konto, From i Send-As nie są zgodne.');
  // An omitted optional string in a successful, identified SendAs resource means no header.
  // It is not inferred from a missing UI field or from an unsuccessful/partial response.
  const replyTo: ReplyToEvidence['replyTo'] = setting.replyToAddress
    ? { kind: 'ADDRESS', address: normalizeEmail(setting.replyToAddress) }
    : { kind: 'NONE' };
  if (replyTo.kind === 'ADDRESS' && replyTo.address !== normalizeEmail(policy.email))
    throw new DomainError('GMAIL_REPLY_TO_MISMATCH', 'Ustawiony Reply-To jest obcy.');
  if (
    observation.replyTo !== null &&
    observation.replyTo !== undefined &&
    (replyTo.kind === 'NONE'
      ? observation.replyTo !== ''
      : normalizeEmail(observation.replyTo) !== replyTo.address)
  )
    throw new DomainError(
      'GMAIL_REPLY_TO_MISMATCH',
      'Obserwacja Reply-To przeczy ustawieniom API.',
    );
  const evidence: ReplyToEvidence = {
    operation,
    accountEmail: normalizeEmail(read.account.email),
    accountSubject: read.account.subject,
    policyRevision: policy.revision,
    settingsHash: hash(JSON.stringify({ email: normalizeEmail(setting.sendAsEmail), replyTo })),
    replyTo,
    checkedAt: read.checkedAt,
    validUntil: read.checkedAt + 5000,
  };
  if (
    !operation ||
    !Number.isFinite(read.checkedAt) ||
    read.checkedAt > now ||
    now >= evidence.validUntil
  )
    throw new DomainError('GMAIL_SETTINGS_STALE', 'Dowód ustawień wygasł.');
  if (
    previous &&
    ['operation', 'accountEmail', 'accountSubject', 'policyRevision', 'settingsHash'].some(
      (key) => evidence[key as keyof ReplyToEvidence] !== previous[key as keyof ReplyToEvidence],
    )
  )
    throw new DomainError(
      'GMAIL_SETTINGS_CHANGED',
      'Ustawienia lub tożsamość zmieniły się podczas operacji.',
    );
  return evidence;
}
