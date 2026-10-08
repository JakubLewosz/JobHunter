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

Nazywam się Jakub Lewosz i jestem uczniem ostatniej klasy Technikum Programistycznego INFOTECH w Białymstoku. Szukam regularnej, płatnej współpracy programistycznej.

[Jeden konkretny fakt o firmie lub potwierdzonej ofercie i krótki opis jednego pasującego projektu: projekt, aplikacja lub prototyp, bez domyślnego słowa demo i bez sugerowania produkcji. Bez tłumaczenia oczywistości dopasowania, prezentacji i umniejszania projektu. Przy braku dopasowania opis projektu jest pomijany. Opcjonalna wzmianka o Codexie mieści się w tej części, jeśli jest przydatna i potwierdzona.]

Jestem dostępny w pełni zdalnie, około 20 godzin tygodniowo, głównie po lekcjach.

[Jedno krótkie pytanie o możliwość takiej współpracy albo dopasowanie dostępności do potwierdzonej rekrutacji.]

GitHub: https://github.com/JakubLewosz

Pozdrawiam
Jakub Lewosz`;
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
      (/automatyzac|automation/.test(context) ? 8 : 0) +
      (/integrac|integration|webhook|\bapi\b/.test(context) ? 5 : 0),
    codefabric: /lokaln.*model|local.*model|\bllm\b|językow|language model/.test(context)
      ? 14
      : /\bagent|narzędzi.*\bai\b|\bai\b/.test(context)
        ? 10
        : 0,
    elektroscan:
      (/\bpdf\b|dokument|document/.test(context) ? 7 : 0) +
      (/analiz.*obraz|image|vision|elektrycz/.test(context) ? 8 : 0),
  };
}
export function relevantProjectFacts(facts: Row[], analysis: Row): Row[] {
  const context = [analysis.title, ...(analysis.requirements ?? []).map((r: Row) => r.text)]
    .join(' ')
    .toLowerCase();
  const scores = projectScores(context);
  const projects = facts.filter((f) => projectKeys.includes(f.key as (typeof projectKeys)[number]));
  const ranked = projects
    .map((f) => ({ fact: f, score: scores[f.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  // No demonstrated connection means no project paragraph.
  if (!ranked[0]?.score) return [];
  const selected = [ranked[0].fact];
  // Two projects need separate, verified requirements with distinct strongest matches.
  const requirementMatches = new Set(
    (analysis.requirements ?? []).map(
      (r: Row) =>
        Object.entries(projectScores(r.text))
          .filter(([, score]) => score >= 7)
          .sort((a, b) => b[1] - a[1])[0]?.[0],
    ),
  );
  if (
    ranked[1]?.score >= 7 &&
    requirementMatches.has(ranked[0].fact.key) &&
    requirementMatches.has(ranked[1].fact.key)
  )
    selected.push(ranked[1].fact);
  return selected;
}
