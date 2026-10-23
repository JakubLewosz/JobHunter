import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DomainError, normalizeEmail } from '../util.js';

// Private workstation configuration, never a list of historical senders.
export const accountPolicySchema = z
  .object({
    email: z.email(),
    subject: z.string().min(1).nullable(),
    transport: z.literal('GMAIL_BROWSER'),
    revision: z.string().min(1),
  })
  .strict();
export type AccountPolicy = z.infer<typeof accountPolicySchema>;
export type AccountPolicySource = () => AccountPolicy;
export function readAccountPolicy(base: string): AccountPolicy {
  try {
    const marker = JSON.parse(readFileSync(join(base, 'workstation.json'), 'utf8'));
    return accountPolicySchema.parse(marker.mailPolicy);
  } catch {
    throw new DomainError(
      'ACCOUNT_POLICY_REQUIRED',
      'Skonfiguruj jedno aktywne konto i transport przeglądarkowy.',
    );
  }
}
export function assertAccountPolicy(
  policy: AccountPolicy,
  account: { email: string; subject: string },
  allowUnbound = false,
) {
  if (
    normalizeEmail(account.email) !== normalizeEmail(policy.email) ||
    (!policy.subject && !allowUnbound) ||
    (policy.subject && policy.subject !== account.subject) ||
    !account.subject
  )
    throw new DomainError(
      'GMAIL_ACCOUNT_CHANGED',
      'Tożsamość nie odpowiada jedynemu aktywnemu kontu.',
    );
}
export function assertPolicyUnchanged(source: AccountPolicySource, expected: AccountPolicy) {
  if (JSON.stringify(source()) !== JSON.stringify(expected))
    throw new DomainError(
      'GMAIL_ACCOUNT_CHANGED',
      'Konfiguracja konta zmieniła się podczas operacji.',
    );
}
// Call only after maintenance lock, verified backup and authority revocation.
export function saveAccountPolicy(base: string, policy: AccountPolicy) {
  const path = join(base, 'workstation.json');
  const marker = JSON.parse(readFileSync(path, 'utf8'));
  if (marker.kind !== 'WORKSTATION' || marker.base !== base || marker.historyConfirmed !== true)
    throw new DomainError('WORKSTATION_REQUIRED', 'Brak potwierdzonej instalacji roboczej.');
  const mailPolicy = accountPolicySchema.parse(policy);
  const temporary = join(base, `workstation-${randomUUID()}.tmp`);
  writeFileSync(temporary, JSON.stringify({ ...marker, mailPolicy }, null, 2), {
    mode: 0o600,
    flag: 'wx',
  });
  renameSync(temporary, path);
}
