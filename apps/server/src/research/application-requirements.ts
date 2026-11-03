import { DomainError } from '../util.js';
import type { Analysis } from './contracts.js';
import type { Source } from './fetcher.js';
import { sourceComplete } from './source-policy.js';

// A visible mail requirement is data, never permission or a form-checkbox consent.
export function requiredApplicationClauses(sources: Source[]) {
  const found = new Map<string, { sourceId: string; quote: string; clause: string }>();
  for (const source of sources) {
    if (!sourceComplete(source)) continue;
    const marker = /(?:^|\n)[ \t]*Nie zapomnij dołączyć klauzuli w mailu:[ \t]*\n/giu;
    for (const match of source.text.matchAll(marker)) {
      const clause = source.text
        .slice(match.index! + match[0].length)
        .split(/\n\s*\n/)[0]
        .trim();
      if (!/^Wyrażam zgodę na przetwarzanie moich danych osobowych/iu.test(clause)) continue;
      if (clause.length > 2500)
        throw new DomainError(
          'APPLICATION_REQUIREMENT_REVIEW',
          'Wymagana klauzula wymaga przeglądu.',
        );
      found.set(clause, {
        sourceId: source.id,
        quote: match[0].trimStart() + clause,
        clause,
      });
    }
  }
  return [...found.values()];
}

export function assertApplicationContent(payload: { body: string }, sources: Source[]) {
  for (const required of requiredApplicationClauses(sources)) {
    if (
      !/procesu rekrutacji/iu.test(required.clause) ||
      /przyszł|marketing|newsletter/iu.test(required.clause)
    )
      throw new DomainError(
        'APPLICATION_CONSENT_SCOPE_REVIEW',
        'Dodatkowy zakres zgody wymaga decyzji.',
      );
    if (!payload.body.includes(required.clause))
      throw new DomainError(
        'APPLICATION_REQUIREMENTS_MISSING',
        'W finalnej wiadomości brakuje wymaganej klauzuli ze źródła.',
      );
  }
}

export function applicationRequirementData(analysis: Analysis, sources: Source[]): Analysis {
  const requirements = requiredApplicationClauses(sources).map(({ sourceId, quote }) => ({
    text: 'W mailu wymagane jest zamieszczenie podanej klauzuli zgody do procesu rekrutacji.',
    sourceId,
    quote,
  }));
  return requirements.length
    ? { ...analysis, requirements: [...analysis.requirements, ...requirements] }
    : analysis;
}
