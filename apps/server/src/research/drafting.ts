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

[Połącz zadanie lub obszar firmy z jednym pasującym zatwierdzonym projektem. Opisz istotny związek, bez katalogu funkcji i technologii. Zachowaj edukację, cel płatnej regularnej pracy, zdalność i dostępność z zatwierdzonego profilu; umieść je tam, gdzie pasują do toku listu.]

[Wyraź prośbę o współpracę lub pytanie o nierozstrzygnięty warunek tylko raz, w odpowiednim miejscu. Nie powtarzaj jej na początku i końcu. Powyższe wskazówki nie określają liczby ani kolejności akapitów i nie są treścią do wysłania.]

[GitHub z zatwierdzonego profilu]

Pozdrawiam
[Imię i nazwisko z zatwierdzonego profilu]`;
export const projectKeys = ['fixdesk', 'autorelay', 'codefabric', 'elektroscan'] as const;
export const approximateAvailability = (hours: number) =>
  `Płatna praca w pełni zdalna, około ${hours} godzin tygodniowo, przede wszystkim po lekcjach.`;
function projectScores(context: string): Record<string, number> {
  context = context.toLowerCase();
  return {
    fixdesk:
      (/laravel/.test(context) ? 10 : 0) +
      (/\bphp\b/.test(context) ? 6 : 0) +
      (/usterk|ticket|helpdesk/.test(context) ? 8 : 0),
    autorelay:
      (/automatyzac|automation|(?:łącz|connect|exchange|wymian).{0,65}(?:system|dane|data)|(?:dane|data).{0,65}(?:przepływ|flows|automatycz)/.test(
        context,
      )
        ? 8
        : 0) + (/integrac|integration|webhook|\bapi\b/.test(context) ? 5 : 0),
    codefabric: /lokaln.*model|local.*model|\bllm\b|model.{0,40}język|language model/.test(context)
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
export function projectSelection(facts: Row[], analysis: Row, evidence: Row[] = []) {
  const proofs = [
    analysis.inquiryBasis,
    ...(analysis.type === 'PROSPECT' ? [analysis.typeProof] : []),
    ...(analysis.companyActivities ?? []),
    ...(analysis.requirements ?? []),
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
  // A vacancy title is useful only with its own verified literal proof.
  if (analysis.titleProof?.sourceId && analysis.titleProof?.quote)
    contexts.push({
      sourceId: analysis.titleProof.sourceId,
      quote: analysis.titleProof.quote,
      scores: projectScores(analysis.titleProof.quote),
      evidenceIds: evidence
        .filter((e) => e.sourceId === analysis.titleProof.sourceId)
        .map((e) => e.id),
    });
  const projects = facts.filter((f) => projectKeys.includes(f.key));
  const ranked = projects
    .map((f) => ({
      fact: f,
      score: Math.max(0, ...contexts.map((c) => c.scores[f.key] ?? 0)),
      proofs: contexts.filter((c) => (c.scores[f.key] ?? 0) > 0).map(({ scores, ...p }) => p),
    }))
    .sort((a, b) => b.score - a.score);
  const selected = ranked[0]?.score ? [ranked[0]] : [];
  if (
    ranked[1]?.score >= 7 &&
    contexts.some(
      (c) =>
        c.scores[ranked[1].fact.key] >= 7 &&
        c.scores[ranked[1].fact.key] > (c.scores[ranked[0].fact.key] ?? 0),
    ) &&
    contexts.some(
      (c) =>
        c.scores[ranked[0].fact.key] >= 7 &&
        c.scores[ranked[0].fact.key] > (c.scores[ranked[1].fact.key] ?? 0),
    )
  )
    selected.push(ranked[1]);
  return {
    considered: projects.map((f) => ({ factId: f.id, project: f.key })),
    selected,
    reason: !projects.length
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
