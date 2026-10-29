import { z } from 'zod';
import type { Row } from '../../../../packages/shared/types.js';
import type { JobHunter } from '../service.js';
import { DomainError, hash, id } from '../util.js';
import { projectKeys, projectMentions, projectSelection } from './drafting.js';
import { realDraftSchema } from './contracts.js';

export const fixedProjectContractVersion = 1;
export const projectSlot = '[[APPROVED_PROJECT_DESCRIPTION]]';
export const projectProposalSchema = realDraftSchema
  .omit({ projectDescription: true })
  .extend({
    project: z.string().nullable(),
  })
  .strict();
export function descriptions(service: JobHunter) {
  return service.store
    .all(
      `SELECT d.* FROM project_descriptions d WHERE NOT EXISTS
    (SELECT 1 FROM project_descriptions n WHERE n.project_id=d.project_id AND n.version>d.version)
    ORDER BY d.logical_key`,
    )
    .map((d) => ({
      id: d.id,
      projectId: d.project_id,
      key: d.logical_key,
      version: d.version,
      text: d.text,
      textHash: d.text_hash,
      factId: d.fact_id,
      factVersion: d.fact_version,
      factHash: d.fact_hash,
      status: d.status,
      approvalSource: d.approval_source,
      approvedAt: d.approved_at,
    }));
}
export function usableDescription(d: Row, facts: Row[]) {
  const f = facts.find((f) => f.id === d.factId && (f.key ?? f.fact_key) === d.key);
  return (
    d.status === 'APPROVED' &&
    d.textHash === hash(d.text) &&
    !!f &&
    (f.approvalStatus ?? f.approval_status) === 'APPROVED' &&
    f.version === d.factVersion &&
    (f.contentHash ?? hash(f.content)) === d.factHash
  );
}
export function projectProfile<T extends Row>(p: T, analysis: Row, evidence: Row[]) {
  const selection = projectSelection(p.facts, analysis, evidence, p.projectDescriptions ?? []);
  if (selection.reason === 'PROJECT_SPECIFIC_RESPONSE_REQUIRED')
    throw new DomainError(selection.reason, 'Oferta wymaga osobnej szczegółowej odpowiedzi.');
  selection.selected = selection.selected.map((s) => ({
    ...s,
    fact: s.description
      ? {
          ...s.fact,
          content: s.description.text,
          contentHash: s.fact.contentHash ?? hash(s.fact.content),
        }
      : s.fact,
  }));
  return {
    ...p,
    projectSelection: selection,
    facts: p.facts
      .filter(
        (f: Row) =>
          !projectKeys.includes(f.key as any) || selection.selected.some((s) => s.fact.id === f.id),
      )
      .map((f: Row) => {
        const d = selection.selected.find((s) => s.fact.id === f.id)?.description;
        return d ? { ...f, content: d.text, contentHash: f.contentHash ?? hash(f.content) } : f;
      }),
  };
}
export function selectedDescription(p: Row): Row | undefined {
  const selected = p.projectSelection?.selected;
  if (selected?.length > 1)
    throw new DomainError('TOO_MANY_PROJECTS', 'Wybierz zero albo jeden projekt.');
  const d = selected?.[0]?.description;
  if (d && !usableDescription(d, p.facts))
    throw new DomainError('PROJECT_NOT_APPROVED', 'Opis lub fakt nie jest zatwierdzony.');
  return d;
}
export function descriptionBinding(d: Row) {
  return {
    projectId: d.projectId,
    key: d.key,
    version: d.version,
    textHash: d.textHash,
    factId: d.factId,
    factVersion: d.factVersion,
    factHash: d.factHash,
  };
}
// Exact slots are composition, never extraction or paraphrase of generated prose.
export function composeProject(raw: unknown, p: Row) {
  const v = projectProposalSchema.parse(raw);
  const d = selectedDescription(p);
  const slots = v.body.split(projectSlot).length - 1;
  if (v.project !== (d?.projectId ?? null))
    throw new DomainError('PROJECT_SELECTION_CHANGED', 'Model zmienił zweryfikowany wybór.');
  if (slots !== (d ? 1 : 0) || (d && !v.body.split(/\r?\n\s*\r?\n/).includes(projectSlot)))
    throw new DomainError('PROJECT_SLOT_INVALID', 'Opis wymaga jednego osobnego miejsca.');
  if (projectMentions(v.subject + '\n' + v.body.replace(projectSlot, '')).length)
    throw new DomainError(
      'PROJECT_DESCRIPTION_EXTRA',
      'Projekt pojawił się poza zatwierdzonym zdaniem.',
    );
  const projectFactIds = p.facts
    .filter((f: Row) => projectKeys.includes(f.key as any))
    .map((f: Row) => f.id);
  if (v.claims.some((c) => c.factIds.some((fid) => projectFactIds.includes(fid))))
    throw new DomainError('PROJECT_DESCRIPTION_EXTRA', 'Model dopisał deklarację o projekcie.');
  const { project: _project, ...payload } = v;
  return realDraftSchema.parse({
    ...payload,
    body: d ? v.body.replace(projectSlot, d.text) : v.body,
    factIds: [...new Set([...v.factIds, ...(d ? [d.factId] : [])])],
    claims: [
      ...v.claims,
      ...(d ? [{ text: d.text, kind: 'CANDIDATE', factIds: [d.factId], evidenceIds: [] }] : []),
    ],
    projectDescription: d ? descriptionBinding(d) : null,
  });
}
// Manual text is never rewritten: seal only a literal, already matching paragraph.
export function bindExactProject(v: Row, p: Row) {
  const d = selectedDescription(p);
  return { ...v, projectDescription: d ? descriptionBinding(d) : null };
}
export function revisionProposal(v: Row, p: Row) {
  const d = selectedDescription(p);
  const { projectDescription: _binding, ...rest } = v;
  return {
    ...rest,
    project: d?.projectId ?? null,
    body: d ? v.body.replace(d.text, projectSlot) : v.body,
    claims: v.claims.filter((c: Row) => !d || !c.factIds.includes(d.factId)),
  };
}
export const projectContractInstructions = `STAŁY OPIS: wybór projectSelection jest decyzją kodu, nie modelu. Zwróć project=null i zero miejsc, gdy nie ma wyboru. W innym przypadku project to dokładny projectId wybranego description i w body umieść dokładnie jeden osobny akapit ${projectSlot}. Kod wstawi tam całe zatwierdzone zdanie. Nie pisz nazwy, opisu, szczegółów, technologii ani deklaracji projektu poza miejscem. Nie twórz claims/factIds dla tego miejsca: kod doda właściwy fakt. Otoczenie dotyczy firmy, celu i pozostałych zatwierdzonych faktów. Zwróć resztę struktury realDraft. Ocenie podlega cały złożony list. `;

export function checkProjectContract(v: Row, p: Row) {
  if (p.fixedProjectContractVersion !== fixedProjectContractVersion) return;
  const mentions = projectMentions(v.subject + '\n' + v.body);
  const d =
    selectedDescription(p) ??
    (mentions.length === 1 && !p.projectSelection
      ? p.projectDescriptions?.find(
          (d: Row) => d.key === mentions[0] && usableDescription(d, p.facts),
        )
      : undefined);
  if (!d) {
    if (mentions.length || v.projectDescription)
      throw new DomainError(
        'PROJECT_DESCRIPTION_REQUIRED',
        'Brak zatwierdzonego dosłownego opisu.',
      );
  } else {
    if (!v.body.split(/\r?\n\s*\r?\n/).includes(d.text) || v.body.split(d.text).length !== 2)
      throw new DomainError(
        'PROJECT_DESCRIPTION_REQUIRED',
        'Wymagane dokładne zatwierdzone zdanie w osobnym akapicie.',
      );
    if (JSON.stringify(v.projectDescription) !== JSON.stringify(descriptionBinding(d)))
      throw new DomainError('PROJECT_DESCRIPTION_STALE', 'Nieaktualne powiązanie opisu.');
    if (projectMentions(v.subject + '\n' + v.body.replace(d.text, '')).length)
      throw new DomainError('PROJECT_DESCRIPTION_EXTRA', 'Dodatkowy opis lub projekt.');
    const claims = v.claims.filter((c: Row) => c.factIds.includes(d.factId));
    if (
      claims.length !== 1 ||
      claims[0].text !== d.text ||
      claims[0].kind !== 'CANDIDATE' ||
      JSON.stringify(claims[0].factIds) !== JSON.stringify([d.factId]) ||
      claims[0].evidenceIds.length ||
      !v.factIds.includes(d.factId)
    )
      throw new DomainError(
        'PROJECT_CLAIM_INVALID',
        'Opis musi mieć własny zatwierdzony fakt, bez dowodu firmy.',
      );
  }
  const outside = d ? v.body.replace(d.text, '') : v.body;
  if (
    /\[\[APPROVED_PROJECT_DESCRIPTION\]\]|(?:w tym|w moim|ten|tego|w ramach (?:tego|projektu)|moja|mój)\s+(?:projek|aplikac|prototyp|gra\b|rozwiązani)|(?:wdrożyłem|wdrożyliśmy|dodałem|zaimplementowałem|zaprogramowałem|zbudowałem|stworzyłem|opracowałem|przygotowałem|współtworzyłem)\b/iu.test(
      outside,
    )
  )
    throw new DomainError(
      'PROJECT_DESCRIPTION_EXTRA',
      'Dodatkowa deklaracja wykonanej pracy wymaga osobnej treści.',
    );
  const allProjectIds = p.facts
    .filter((f: Row) => projectKeys.includes(f.key as any))
    .map((f: Row) => f.id);
  if (v.factIds.some((fid: string) => allProjectIds.includes(fid) && fid !== d?.factId))
    throw new DomainError('UNSUPPORTED_PROJECT', 'Odwołanie do innego projektu.');
}

const entrySchema = z
  .object({
    key: z.enum(projectKeys),
    projectId: z.string().min(1),
    name: z.string().min(1),
    url: z.url(),
    text: z.string().min(20).max(1000),
    factId: z.string().min(1),
    expectedFactVersion: z.number().int().positive().nullable(),
    fact: z
      .object({ content: z.string().min(20).max(2000), source: z.string().min(10).max(2000) })
      .strict()
      .optional(),
  })
  .strict();
export const catalogImportSchema = z
  .object({
    expectedProfileVersion: z.number().int().positive(),
    approvalSource: z.string().min(10).max(2000),
    approvalSha256: z.string().regex(/^[a-f0-9]{64}$/),
    entries: z.array(entrySchema).min(1).max(6),
    confirmed: z.literal(true),
  })
  .strict();
export function importProjectDescriptions(service: JobHunter, raw: unknown) {
  const v = catalogImportSchema.parse(raw),
    s = service.store,
    at = service.now();
  s.assertExclusive();
  if (
    !service.state().stopped ||
    s.get<Row>('researchDay', {}).active ||
    s.one("SELECT id FROM runs WHERE status IN ('QUEUED','RUNNING','PAUSED')") ||
    s.one("SELECT id FROM send_attempts WHERE state IN ('SENDING','SEND_UNKNOWN')") ||
    s.one("SELECT id FROM outbox WHERE status IN ('QUEUED','SENDING','SEND_UNKNOWN')")
  )
    throw new DomainError(
      'MUST_STOP',
      'Katalog można zmienić tylko po Stop i zakończeniu operacji.',
    );
  if (
    new Set(v.entries.map((e) => e.key)).size !== v.entries.length ||
    new Set(v.entries.map((e) => e.projectId)).size !== v.entries.length ||
    new Set(v.entries.map((e) => e.factId)).size !== v.entries.length
  )
    throw new DomainError('DUPLICATE_PROJECT', 'Powtórzony projekt lub fakt.');
  const token = `projectCatalogApproval:${v.approvalSha256}`,
    digest = hash(JSON.stringify(v));
  const current = descriptions(service);
  if (s.get<string | null>(token, null) === digest) {
    if (
      v.entries.every((e) =>
        current.some(
          (d) =>
            d.key === e.key &&
            d.projectId === e.projectId &&
            d.text === e.text &&
            usableDescription(d, service.profile().facts),
        ),
      )
    )
      return { changed: false, version: service.profile().version, descriptions: current };
    throw new DomainError(
      'CATALOG_APPROVAL_REPLAY',
      'Dawna zgoda nie przywraca cofniętego lub zmienionego materiału.',
    );
  }
  const p = service.profile();
  if (p.version !== v.expectedProfileVersion || !p.approved_at)
    throw new DomainError('VERSION_CONFLICT', 'Profil wymaga aktualnej, zatwierdzonej wersji.');
  return s.atomic(() => {
    s.assertExclusive();
    const snapshot = (phase: string) =>
      s.exec(
        'INSERT INTO profile_material_snapshots VALUES (?,?,?,?,?,?)',
        id(),
        'candidate',
        service.profile().version,
        phase,
        JSON.stringify({
          profile: service.profile(),
          allFacts: s.all('SELECT * FROM candidate_facts ORDER BY id'),
          projects: s.all('SELECT * FROM portfolio_projects ORDER BY id'),
        }),
        at,
      );
    snapshot('BEFORE_PROJECT_CATALOG');
    for (const e of v.entries) {
      const oldFact = s.one('SELECT * FROM candidate_facts WHERE fact_key=?', e.key);
      if (
        (oldFact?.id ?? e.factId) !== e.factId ||
        (oldFact?.version ?? null) !== e.expectedFactVersion
      )
        throw new DomainError(
          'VERSION_CONFLICT',
          'Zachowaj ID i oczekiwaną wersję istniejącego faktu.',
        );
      const oldProject = s.one('SELECT * FROM portfolio_projects WHERE id=?', e.projectId);
      const linked = current.find((d) => d.key === e.key);
      if (
        (linked && linked.projectId !== e.projectId) ||
        (oldProject && oldProject.profile_id !== 'candidate')
      )
        throw new DomainError('DUPLICATE_PROJECT', 'Projekt ma już inny identyfikator.');
      if (
        s
          .all('SELECT * FROM portfolio_projects')
          .some(
            (p) =>
              p.id !== e.projectId && (p.id === e.key || projectMentions(p.name).includes(e.key)),
          )
      )
        throw new DomainError('DUPLICATE_PROJECT', 'Zachowaj istniejący identyfikator projektu.');
      if (e.fact) {
        if (oldFact)
          s.exec(
            "UPDATE candidate_facts SET content=?,source=?,version=version+1,approval_status='APPROVED',checked_at=?,updated_at=? WHERE id=?",
            e.fact.content,
            e.fact.source,
            at,
            at,
            e.factId,
          );
        else
          s.exec(
            "INSERT INTO candidate_facts VALUES (?, 'candidate',?,?,?,?,'APPROVED',1,?,?)",
            e.factId,
            e.key,
            e.fact.content,
            e.fact.source,
            at,
            at,
            at,
          );
      }
      const f = s.one('SELECT * FROM candidate_facts WHERE id=?', e.factId);
      if (!f || f.approval_status !== 'APPROVED')
        throw new DomainError('PROJECT_NOT_APPROVED', 'Najpierw zatwierdź właściwy fakt.');
      if (
        projectMentions(e.text).length !== 1 ||
        projectMentions(e.text)[0] !== e.key ||
        /[\r\n]/.test(e.text)
      )
        throw new DomainError(
          'INVALID_PROJECT_DESCRIPTION',
          'Jedno dosłowne zdanie właściwego projektu.',
        );
      if (!oldProject)
        s.exec(
          "INSERT INTO portfolio_projects VALUES (?,'candidate',?,?,?,?,?,?)",
          e.projectId,
          e.name,
          e.url,
          f.content,
          'Zakres i ograniczenia: zatwierdzony fakt oraz źródło opisu.',
          at,
          at,
        );
      const version =
        (s.one('SELECT max(version) n FROM project_descriptions WHERE project_id=?', e.projectId)
          ?.n ?? 0) + 1;
      s.exec(
        "INSERT INTO project_descriptions VALUES (?,?,?,?,?,?,?,?,?,'APPROVED',?,?,?)",
        id(),
        e.projectId,
        e.key,
        version,
        e.text,
        hash(e.text),
        e.factId,
        f.version,
        hash(f.content),
        JSON.stringify({ source: v.approvalSource, sha256: v.approvalSha256 }),
        at,
        at,
      );
    }
    const nextHash = hash(
      JSON.stringify({
        previous: p.profile_hash,
        descriptions: descriptions(service),
        facts: service.profile().facts,
      }),
    );
    s.exec(
      "UPDATE candidate_profiles SET version=version+1,profile_hash=?,approved_at=?,updated_at=? WHERE id='candidate'",
      nextHash,
      at,
      at,
    );
    s.set(token, digest);
    snapshot('AFTER_PROJECT_CATALOG');
    service.event(
      'PROJECT_CATALOG_APPROVED',
      'Wersjonowana zmiana wyłącznie katalogu i objętych zgodą faktów; brak prawa wysyłki.',
      'candidate',
      'user',
    );
    s.assertExclusive();
    return {
      changed: true,
      version: service.profile().version,
      descriptions: descriptions(service),
    };
  });
}

export function revokeProjectDescription(service: JobHunter, raw: unknown) {
  const v = z
    .object({
      projectId: z.string(),
      version: z.number().int().positive(),
      reason: z.string().min(10),
      confirmed: z.literal(true),
    })
    .strict()
    .parse(raw);
  const s = service.store;
  s.assertExclusive();
  if (
    !service.state().stopped ||
    s.get<Row>('researchDay', {}).active ||
    s.one("SELECT id FROM runs WHERE status IN ('QUEUED','RUNNING','PAUSED')") ||
    s.one("SELECT id FROM send_attempts WHERE state IN ('SENDING','SEND_UNKNOWN')") ||
    s.one("SELECT id FROM outbox WHERE status IN ('QUEUED','SENDING','SEND_UNKNOWN')")
  )
    throw new DomainError('MUST_STOP', 'Zatrzymaj operacje przed cofnięciem opisu.');
  const d = descriptions(service).find((d) => d.projectId === v.projectId);
  if (!d || d.version !== v.version || d.status !== 'APPROVED')
    throw new DomainError('VERSION_CONFLICT', 'Opis nie jest bieżącą zatwierdzoną wersją.');
  return s.atomic(() => {
    const p = service.profile(),
      at = service.now();
    s.exec(
      'INSERT INTO profile_material_snapshots VALUES (?,?,?,?,?,?)',
      id(),
      'candidate',
      p.version,
      'BEFORE_PROJECT_REVOCATION',
      JSON.stringify(p),
      at,
    );
    s.exec(
      "INSERT INTO project_descriptions VALUES (?,?,?,?,?,?,?,?,?,'REVOKED',?,?,?)",
      id(),
      d.projectId,
      d.key,
      d.version + 1,
      d.text,
      d.textHash,
      d.factId,
      d.factVersion,
      d.factHash,
      JSON.stringify({ revokedApproval: d.approvalSource, reason: v.reason }),
      at,
      at,
    );
    s.exec(
      "UPDATE candidate_profiles SET version=version+1,profile_hash=?,approved_at=?,updated_at=? WHERE id='candidate'",
      hash(JSON.stringify({ previous: p.profile_hash, descriptions: descriptions(service) })),
      at,
      at,
    );
    s.exec(
      'INSERT INTO profile_material_snapshots VALUES (?,?,?,?,?,?)',
      id(),
      'candidate',
      p.version + 1,
      'AFTER_PROJECT_REVOCATION',
      JSON.stringify(service.profile()),
      at,
    );
    service.event(
      'PROJECT_DESCRIPTION_REVOKED',
      'Cofnięto opis bez zmiany zapisanych wiadomości lub prób.',
      d.projectId,
      'user',
    );
    s.assertExclusive();
    return { changed: true, version: p.version + 1 };
  });
}
