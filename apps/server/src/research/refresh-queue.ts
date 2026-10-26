import type { Row } from '../../../../packages/shared/types.js';

// Shared selection for the existing operator lifecycle and Nightflow coordinator.
// Queue size is a work budget, never a send/campaign limit or a send permission.
export function selectLibraryRefreshQueue(
  candidates: { d: Row; channelRank: number; issues: string[] }[],
  hours: number,
  lastAttempt: (draftId: string) => string,
) {
  const seen = new Set<string>();
  return candidates
    .filter(({ d, issues }) => d.status !== 'SENT' && !issues.includes('CONTACT_HISTORY'))
    .sort(
      (a, b) =>
        Number(!b.issues.length) - Number(!a.issues.length) ||
        (b.d.decision === 'READY_APPLICATION' ? 1 : 0) -
          (a.d.decision === 'READY_APPLICATION' ? 1 : 0) ||
        b.channelRank - a.channelRank ||
        lastAttempt(a.d.id).localeCompare(lastAttempt(b.d.id)) ||
        a.d.created_at.localeCompare(b.d.created_at) ||
        a.d.id.localeCompare(b.d.id),
    )
    .filter(({ d }) => {
      if (seen.has(d.company_id) || seen.has(d.email.toLowerCase())) return false;
      seen.add(d.company_id);
      seen.add(d.email.toLowerCase());
      return true;
    })
    .slice(0, Math.min(15, hours * 12))
    .map(({ d }) => d.id);
}
