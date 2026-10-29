import type { Row } from '../../../../packages/shared/types.js';
export const legacyMessageTemplate = `Dzień dobry,

{{nawiązanie_do_firmy_lub_oferty}} Chciałbym zapytać o możliwość płatnej, regularnej współpracy przy tworzeniu aplikacji, integracji lub automatyzacji.

Nazywam się {{imię}}. {{edukacja_z_profilu}} Szukam współpracy w pełni zdalnej, około {{godziny_orientacyjnie}} godzin tygodniowo, przede wszystkim po lekcjach.

Podczas programowania korzystam z AI. {{jeden_najbardziej_dopasowany_projekt: krótki_opis_i_związek_z_zadaniami_firmy}}

Czy rozważają Państwo współpracę w takim modelu? Chętnie przedstawię projekt i porozmawiam o zadaniach, przy których mógłbym pomóc.

{{portfolio_z_zatwierdzonego_profilu}}

Pozdrawiam
{{imię}}`;
export const defaultMessageTemplate = `Dzień dobry,

[Napisz naturalną wiadomość do konkretnej firmy. Wybierz otwarcie i kolejność informacji z kontekstu: aktywnej oferty, otwartych kandydatur lub rzeczowej podstawy zapytania bez rekrutacji.]

[Połącz zadanie lub obszar firmy z chęcią pracy przy nim albo pasującym zatwierdzonym przykładem. Projekt jest opcjonalny; objaśnij aplikację lub własną pracę bez kopiowania całej notatki funkcji. Zachowaj edukację, cel płatnej regularnej pracy, zdalność i dostępność z zatwierdzonego profilu; umieść je tam, gdzie pasują do toku listu.]

[Wyraź prośbę o współpracę lub pytanie o nierozstrzygnięty warunek tylko raz, w odpowiednim miejscu. Nie powtarzaj jej na początku i końcu. Powyższe wskazówki nie określają liczby ani kolejności akapitów i nie są treścią do wysłania.]

[GitHub z zatwierdzonego profilu]

Pozdrawiam
[Imię i nazwisko z zatwierdzonego profilu]`;
export const projectKeys = [
  'fixdesk',
  'autorelay',
  'codefabric',
  'elektroscan',
  'sekiforma',
  'samurais-last-stand',
] as const;
export const approximateAvailability = (hours: number, afterSchool = true) =>
  `Płatna praca w pełni zdalna, około ${hours} godzin tygodniowo${afterSchool ? ', przede wszystkim po lekcjach' : ''}.`;
export function projectMentions(text: string) {
  const normalized = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return projectKeys.filter((key) =>
    key === 'sekiforma'
      ? /sek\s*i\s*forma/.test(normalized)
      : key === 'samurais-last-stand'
        ? /samurai(?:['’ʼ]?s)?[\s-]*last[\s-]*stand/.test(normalized)
        : normalized.includes(key),
  );
}
function projectScores(context: string): Record<string, number> {
  context = context.toLowerCase();
  return {
    sekiforma:
      /(?:tworz|bud|projekt|develop|implement|responsyw|walidac|katalog|galeri).{0,70}(?:stron|website|frontend|interfejs|user interface)|(?:stron|website|frontend|interfejs|user interface).{0,70}(?:tworz|bud|projekt|develop|implement|responsyw|walidac|katalog|galeri)/.test(
        context,
      )
        ? 9
        : 0,
    fixdesk:
      (/laravel/.test(context) ? 10 : 0) +
      (/\bphp\b/.test(context) ? 6 : 0) +
      (/usterk|ticket|helpdesk/.test(context) ? 8 : 0) +
      (/(?:tworz|bud|rozwij|develop|build).{0,70}(?:aplikacj.{0,25}(?:biznes|wewnętrzn)|internal (?:app|tool)|business app)/.test(
        context,
      )
        ? 7
        : 0),
    'samurais-last-stand':
      /(?:tworz|bud|rozwij|develop|build|projekt).{0,70}(?:\bgry\b|\bgier\b|\bgrę\b|\bgames?\b)|(?:\bgry\b|\bgier\b|\bgames?\b).{0,70}(?:2d|godot|develop)|godot/.test(
        context,
      )
        ? 12
        : 0,
    autorelay:
      (/automatyzac|automation|(?:łącz|connect|exchange|wymian).{0,65}(?:system|dane|data)|(?:dane|data).{0,65}(?:przepływ|flows|automatycz)/.test(
        context,
      )
        ? 8
        : 0) + (/integrac|integration|webhook|\bapi\b/.test(context) ? 5 : 0),
    codefabric:
      /(?:korzyst|używa|uses?|using).{0,50}(?:codex|narzędzi.{0,15}ai)/.test(context) &&
      !/(?:buduj|tworz|rozwij|develop|build).{0,65}(?:agent|model|narzędzi)/.test(context)
        ? 0
        : /lokaln.*model|local.*model|\bllm\b|model.{0,40}język|language model/.test(context)
          ? 14
          : /agent.{0,40}(?:ai|llm)|narzędzi.{0,60}\bai\b|\bai\b.{0,60}(?:tool|narzędzi|model|agent)|private\s+ai\s+environment/.test(
                context,
              )
            ? 10
            : 0,
    elektroscan:
      (/(?:analiz|przetwarz|extract|process|recogn|ocr).{0,70}(?:\bpdf\b|dokument|document)|(?:dokument|document|\bpdf\b).{0,70}(?:analiz|process|extract|recogn)/.test(
        context,
      )
        ? 7
        : 0) +
      (/analiz.{0,50}obraz|(?:image|obraz).{0,50}(?:analys|process|recogn|analiz)|computer vision|(?:plan|schemat).{0,30}elektrycz/.test(
        context,
      )
        ? 8
        : 0),
  };
}
export function projectSelection(
  facts: Row[],
  analysis: Row,
  evidence: Row[] = [],
  descriptions?: Row[],
) {
  const proofs = [
    analysis.inquiryBasis,
    ...(analysis.type === 'PROSPECT' ? [analysis.typeProof] : []),
    ...(analysis.companyActivities ?? []),
    ...(analysis.requirements ?? []),
    analysis.titleProof,
  ].filter(Boolean);
  // Callers validate these proof objects against saved READ sources first. Match the quote, not a hypothesis.
  const meaningful = proofs.filter(
    (p) =>
      p.sourceId &&
      p.quote &&
      !/privacy|regulamin|polityk.{0,20}prywat|cookie|download.{0,15}terms|ignore.{0,20}instructions|ignoruj.{0,20}instrukcj/iu.test(
        p.quote,
      ),
  );
  const contexts = meaningful.map((p) => ({
    sourceId: p.sourceId,
    quote: p.quote,
    scores: projectScores(p.quote),
    evidenceIds: evidence
      .filter(
        (e) =>
          e.sourceId === p.sourceId &&
          e.fragment
            ?.normalize('NFKC')
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .includes(p.quote.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase()),
      )
      .map((e) => e.id),
  }));
  const projects = facts.filter(
    (f) =>
      projectKeys.includes(f.key) &&
      (!descriptions ||
        descriptions.some(
          (d) =>
            d.key === f.key &&
            d.factId === f.id &&
            d.status === 'APPROVED' &&
            d.factVersion === f.version &&
            d.factHash === f.contentHash &&
            f.approvalStatus === 'APPROVED',
        )),
  );
  const ranked = projects
    .map((f) => ({
      fact: f,
      description: descriptions?.find((d) => d.key === f.key),
      score: Math.max(0, ...contexts.map((c) => c.scores[f.key] ?? 0)),
      proofs: contexts.filter((c) => (c.scores[f.key] ?? 0) > 0).map(({ scores, ...p }) => p),
    }))
    .sort((a, b) => b.score - a.score || a.fact.key.localeCompare(b.fact.key, 'en'));
  const selected = ranked[0]?.score ? [ranked[0]] : [];
  const specific = meaningful.some((p) =>
    /(?:opisz|describe|wyjaśnij|explain|przedstaw).{0,90}(?:szczegół|doświadczen|experience|wkład|contribution)|(?:szczegół|detailed).{0,70}(?:opis|description).{0,50}(?:projekt|project|experience)/iu.test(
      p.quote,
    ),
  );
  return {
    considered: projects.map((f) => ({ factId: f.id, project: f.key })),
    selected: specific ? [] : selected,
    tieBreak:
      selected.length && ranked[1]?.score === ranked[0].score
        ? 'SCORE_DESC_THEN_LOGICAL_KEY_ASC'
        : null,
    reason: specific
      ? 'PROJECT_SPECIFIC_RESPONSE_REQUIRED'
      : !projects.length
        ? 'NO_APPROVED_PROJECTS'
        : !contexts.length
          ? 'NO_COMPANY_EVIDENCE'
          : !selected.length
            ? 'NO_PROJECT_MATCH'
            : 'VERIFIED_TASK_MATCH',
  };
}
export function relevantProjectFacts(facts: Row[], analysis: Row): Row[] {
  return projectSelection(facts, analysis).selected.map((p) => p.fact);
}
