import { companyDomain } from '../util.js';
import { parserVersion } from './html.js';
import type { Source } from './fetcher.js';
import type { Analysis } from './contracts.js';

export function sourceHasCompleteText(s: Source): boolean {
  return (
    s.status === 'READ' &&
    (s.completeness === 'COMPLETE' || (s.completeness == null && s.method !== 'PUBLIC_HTTP'))
  );
}
export function sourceComplete(s: Source): boolean {
  return (
    sourceHasCompleteText(s) && (s.method !== 'PUBLIC_HTTP' || s.parser_version === parserVersion)
  );
}

// Publication authority is independent from the recipient's mailbox domain.
// A directory naming a company is never an official referral by that company.
export function contactSourceAuthority(a: Analysis, sources: Source[], domains: string[]): boolean {
  const source = sources.find((s) => s.id === a.contact.proof.sourceId);
  if (!source || !sourceComplete(source)) return false;
  const allowed = new Set(domains.map(companyDomain).filter(Boolean));
  const host = (s: Source) => {
    try {
      return companyDomain(new URL(s.final_url ?? s.original_url).hostname);
    } catch {
      return null;
    }
  };
  if (allowed.has(host(source))) return true;
  return sources.some((official) => {
    if (!sourceComplete(official) || !allowed.has(host(official))) return false;
    try {
      const links = JSON.parse(official.outbound_links ?? '[]');
      return (
        Array.isArray(links) &&
        links.some((link) => {
          if (
            typeof link.url !== 'string' ||
            typeof link.context !== 'string' ||
            !/rekrut|career|aplik|recruit|kandyd|praca|oferty pracy|join.{0,20}team/iu.test(
              link.context,
            )
          )
            return false;
          const url = new URL(link.url, official.final_url ?? official.original_url);
          url.hash = '';
          return [source.original_url, source.final_url].filter(Boolean).some((value) => {
            const target = new URL(value!);
            target.hash = '';
            return target.href === url.href;
          });
        })
      );
    } catch {
      return false;
    }
  });
}
