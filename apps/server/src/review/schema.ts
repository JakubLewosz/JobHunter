import { z } from 'zod';
export const refSchema = z
  .object({
    id: z.string().nullable(),
    state: z.enum(['PRESENT', 'MISSING', 'NOT_RECORDED', 'NOT_APPLICABLE']),
  })
  .strict();
const text = z.string(),
  nullableText = text.nullable();
export const codes = [
  'PUBLIC_HTTP',
  'USER_TEXT',
  'FIXTURE',
  'NULL',
  'EMPTY_STRING',
  'ELIGIBLE',
  'INELIGIBLE',
  'READY_APPLICATION',
  'READY_OPEN_INQUIRY',
  'ARCHIVED',
  'CONFLICTING',
  'UNKNOWN',
  'NEW',
  'CONTACTED',
  'SUGGESTED',
  'BLOCKED',
  'DO_NOT_CONTACT',
  'REJECTED',
  'ON_HOLD',
  'BOUNCE',
  'CLEAR',
  'OPT_OUT',
  'UNCLEAR',
  'INCOMING',
  'OUTGOING',
  'RECRUITMENT',
  'GENERAL',
  'SALES',
  'INVOICE',
  'PRIVACY',
  'SECURITY',
  'OTHER',
  'NAME',
  'DOMAIN',
  'VERIFIED',
  'NEEDS_REVIEW',
  'PASS',
  'FAIL',
  'READ',
  'FAILED',
  'INCOMPLETE',
  'UNREAD',
  'PENDING',
  'QUEUED',
  'RUNNING',
  'PAUSED',
  'STOPPED',
  'WAITING',
  'DONE',
  'COMPLETED',
  'COMPLETED_WITH_SKIPS',
  'PARTIAL',
  'CANCELLED',
  'SENT',
  'SENDING',
  'SENT_PROVIDER',
  'SENT_CONFIRMED',
  'SEND_UNKNOWN',
  'FAILED_NOT_SENT',
  'FIRST_CONTACT',
  'SELF_TEST',
  'ACTIVE',
  'OPEN',
  'PROSPECT',
  'YES',
  'NO',
  'RANGE',
  'APPROX',
  'APPROVED',
  'DRAFT',
  'INVALIDATED',
  'NOT_RUN',
  'RETRY',
  'SKIPPED',
  'READY',
  'NEEDS_PREPARATION',
  'NEEDS_REPREPARATION',
  'NEEDS_RESOLUTION',
  'GMAIL_API',
  'GMAIL_BROWSER',
  'CLAIMED',
  'COMMITTING',
  'ACKNOWLEDGED',
  'LOCAL_ONLY',
  'PRIVATE_GIT',
  'DEMO',
  'RESEARCH_ONLY',
  'APPROVAL_REQUIRED',
  'AUTO_POLICY',
  'user',
  'policy',
  'system',
  'import',
  'PROTECTED_DATA_CHANGED',
  'TIME_BUDGET',
  'CODEX_LIMIT',
  'READER_ENVIRONMENT',
  'DEADLINE',
  'SOURCE_STALE',
  'SOURCE_UNVERIFIED',
  'PROFILE_CHANGED',
  'DRAFT_MATERIAL_STALE',
  'DRAFT_MATERIAL_UNVERIFIED',
  'VALIDATION_FAILED',
  'CONTACT_POLICY',
  'COMPANY_IDENTITY_CONFLICT',
  'STOPPED_BY_USER',
  'LEGACY_UNKNOWN',
  'COMPLETE',
  'TEXT_LIMIT',
  'DEPTH_LIMIT',
  'ADDRESS_LIMIT',
  'CONTEXT_LIMIT',
  'UNAVAILABLE',
  'AVAILABLE',
  'EMPTY',
  'ACCESS_BLOCKED',
  'NOT_FOUND',
  'HTTP_ERROR',
  'HTTP_429',
  'TIMEOUT',
  'FETCH_FAILED',
  'TLS_UNTRUSTED',
  'DNS_FAILED',
  'SSRF_BLOCKED',
  'SIZE_LIMIT',
  'REDIRECT_LIMIT',
  'BAD_REDIRECT',
  'UNSUPPORTED_CONTENT',
  'INTERESTED',
  'INVITATION',
  'QUESTION',
  'TASK',
  'AUTORESPONDER',
  'SEARCH',
  'EXTRACT',
  'QUALIFY',
  'DRAFTING',
  'REVIEW',
  'SEND',
  'REPORT',
  'VERIFIED_PUBLIC',
  'READ_VERIFIED_EXCERPT',
  'MOCK',
  'MOCK_VERIFIED',
  'UNCONFIRMED',
  'DEFERRED',
  'ACCEPTED',
  'RESERVED',
  'NOT_SENT',
  'DISCOVERY',
  'QUALIFICATION',
  'DRAFTS_READY',
  'ITEMS_NEED_REVIEW',
  'RESEARCH',
] as const;
export const codeSchema = z.enum(codes);
export type Field = {
  kind:
    | 'id'
    | 'ref'
    | 'text'
    | 'code'
    | 'number'
    | 'boolean'
    | 'date'
    | 'hash'
    | 'refs'
    | 'texts'
    | 'json'
    | 'private';
  target?: string;
  optional?: boolean;
  sql?: string;
};
const f = (kind: Field['kind'], target?: string, optional = false, sql?: string): Field => ({
  kind,
  target,
  optional,
  sql,
});
export const tables: Record<string, { file: string; fields: Record<string, Field> }> = {
  companies: {
    file: 'companies',
    fields: {
      id: f('id'),
      canonical_name: f('text'),
      primary_domain: f('text'),
      history_status: f('code'),
      version: f('number'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  company_aliases: {
    file: 'aliases',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      kind: f('code'),
      value: f('text'),
      verified_at: f('date'),
      created_at: f('date'),
    },
  },
  contacts: {
    file: 'contacts',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      email: f('text'),
      kind: f('code'),
      evidence_id: f('ref', 'evidence'),
      verification_status: f('code'),
      verified_at: f('date'),
      literal_verified: f('boolean', undefined, true),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  evidence: {
    file: 'evidence',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      canonical_url: f('text'),
      fetched_at: f('date'),
      content_hash: f('hash'),
      fragment: f('text'),
      availability: f('code'),
    },
  },
  research_evidence: {
    file: 'evidence-links',
    fields: { evidence_id: f('ref', 'evidence'), source_id: f('ref', 'research_sources') },
  },
  research_sources: {
    file: 'sources',
    fields: {
      id: f('id'),
      original_url: f('text'),
      final_url: f('text'),
      title: f('text'),
      fetched_at: f('date'),
      method: f('code'),
      status: f('code'),
      http_status: f('number'),
      fragment: f('text'),
      content_hash: f('hash'),
      text: f('text'),
      parser_version: f('number', undefined, true),
      completeness: f('code', undefined, true),
      address_contexts: f('json', undefined, true),
      outbound_links: f('json', undefined, true),
    },
  },
  opportunities: {
    file: 'opportunities',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      evidence_id: f('ref', 'evidence'),
      contact_id: f('ref', 'contacts'),
      title: f('text'),
      type: f('code'),
      status: f('code'),
      remote: f('code'),
      part_time: f('code'),
      paid: f('code'),
      junior: f('code'),
      hours: f('text'),
      decision: f('code'),
      reasons: f('texts'),
      required_conditions: f('texts'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  drafts: {
    file: 'drafts',
    fields: {
      id: f('id'),
      campaign_id: f('ref', 'campaigns'),
      company_id: f('ref', 'companies'),
      opportunity_id: f('ref', 'opportunities'),
      contact_id: f('ref', 'contacts'),
      subject: f('text'),
      body: f('text'),
      fact_ids: f('refs', 'candidate_facts'),
      evidence_ids: f('refs', 'evidence'),
      version: f('number'),
      payload_hash: f('hash'),
      status: f('code'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  draft_versions: {
    file: 'draft-versions',
    fields: {
      id: f('id'),
      draft_id: f('ref', 'drafts'),
      version: f('number'),
      subject: f('text'),
      body: f('text'),
      payload_hash: f('hash'),
      created_at: f('date'),
    },
  },
  candidate_profiles: {
    file: 'candidate-materials',
    fields: {
      id: f('id'),
      name: f('private'),
      goal: f('text'),
      version: f('number'),
      profile_hash: f('hash'),
      approved_at: f('date'),
      hours_min: f('number'),
      hours_max: f('number'),
      availability_mode: f('code', undefined, true),
      hours_approx: f('number', undefined, true),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  candidate_facts: {
    file: 'candidate-materials',
    fields: {
      id: f('id'),
      profile_id: f('ref', 'candidate_profiles'),
      fact_key: f('text'),
      content: f('text'),
      checked_at: f('date'),
      approval_status: f('code'),
      version: f('number'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  portfolio_projects: {
    file: 'candidate-materials',
    fields: {
      id: f('id'),
      profile_id: f('ref', 'candidate_profiles'),
      name: f('text'),
      url: f('text'),
      description: f('text'),
      limitations: f('text'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  cv_assets: {
    file: 'candidate-materials',
    fields: {
      id: f('id'),
      sha256: f('hash'),
      byte_size: f('number'),
      version: f('number'),
      approved_at: f('date'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  research_draft_materials: {
    file: 'material-bindings',
    fields: {
      draft_id: f('ref', 'drafts'),
      version: f('number'),
      payload_hash: f('hash'),
      context_hash: f('hash'),
      code_status: f('code'),
      review_status: f('code'),
      review_result: f('json', undefined, true),
      code_error: f('json'),
      created_at: f('date'),
      updated_at: f('date'),
      context_profile: f(
        'json',
        undefined,
        false,
        `CASE WHEN json_valid(context_json) THEN json_object('name',json_extract(context_json,'$.profile.name'),'hash',json_extract(context_json,'$.profile.hash'),'goal',json_extract(context_json,'$.profile.goal'),'facts',json((SELECT json_group_array(json_object('id',json_extract(j.value,'$.id'),'key',json_extract(j.value,'$.key'),'content',json_extract(j.value,'$.content'))) FROM json_each(context_json,'$.profile.facts') j WHERE j.type='object'))) END`,
      ),
    },
  },
  research_drafts: {
    file: 'material-bindings',
    fields: {
      draft_id: f('ref', 'drafts'),
      profile_hash: f('hash'),
      semantic_review: f('json'),
      reviewed_at: f('date'),
    },
  },
  contact_reviews: {
    file: 'contact-verifications',
    fields: {
      contact_id: f('ref', 'contacts'),
      evidence_id: f('ref', 'evidence'),
      kind: f('code'),
      reviewed_at: f('date'),
    },
  },
  source_verifications: {
    file: 'contact-verifications',
    fields: {
      id: f('id'),
      source_id: f('ref', 'research_sources'),
      checked_at: f('date'),
      status: f('code'),
      final_url: f('text'),
      content_hash: f('hash'),
    },
  },
  campaigns: {
    file: 'policy-records',
    fields: {
      id: f('id'),
      mode: f('code'),
      cv_id: f('ref', 'cv_assets'),
      policy_version: f('number'),
      daily_limit: f('number'),
      cycle_limit: f('number'),
      campaign_limit: f('number'),
      interval_minutes: f('number'),
      duration_minutes: f('number'),
      max_candidates: f('number'),
      window_start: f('text'),
      window_end: f('text'),
      timezone: f('text'),
      schedule_enabled: f('boolean'),
      expires_at: f('date'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  history_records: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      status: f('code'),
      occurred_at: f('date'),
      created_at: f('date'),
    },
  },
  suppressions: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      actor: f('code'),
      permanent: f('boolean'),
      created_at: f('date'),
    },
  },
  outbox: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      draft_id: f('ref', 'drafts'),
      draft_version: f('number'),
      company_id: f('ref', 'companies'),
      run_id: f('ref', 'runs'),
      approval_id: f('ref', 'draft_approvals'),
      status: f('code'),
      kind: f('code', undefined, true),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  send_attempts: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      outbox_id: f('ref', 'outbox'),
      cv_hash: f('hash'),
      state: f('code'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  usage_ledger: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      outbox_id: f('ref', 'outbox'),
      campaign_id: f('ref', 'campaigns'),
      run_id: f('ref', 'runs'),
      day: f('text'),
      state: f('code'),
      created_at: f('date'),
    },
  },
  draft_approvals: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      draft_id: f('ref', 'drafts'),
      draft_version: f('number'),
      payload_hash: f('hash'),
      binding_hash: f('hash'),
      actor: f('code'),
      expires_at: f('date'),
      revoked_at: f('date'),
      created_at: f('date'),
    },
  },
  auto_sessions: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      policy_hash: f('hash'),
      status: f('code'),
      started_at: f('date'),
      stopped_at: f('date'),
    },
  },
  auto_outbox: {
    file: 'history-safety',
    fields: { outbox_id: f('ref', 'outbox'), session_id: f('ref', 'auto_sessions') },
  },
  runs: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      campaign_id: f('ref', 'campaigns'),
      status: f('code'),
      stage: f('code'),
      started_at: f('date'),
      finished_at: f('date'),
      updated_at: f('date'),
    },
  },
  shared_attempts: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      state: f('code'),
      day: f('text'),
      created_at: f('date'),
    },
  },
  shared_usage: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      day: f('text'),
      kind: f('code'),
      state: f('code'),
      created_at: f('date'),
    },
  },
  gmail_messages: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      company_id: f('ref', 'companies'),
      outbox_id: f('ref', 'outbox'),
      direction: f('code'),
      sent_at: f('date'),
      category: f('code'),
      prior_contact_check: f('code', undefined, true),
    },
  },
  gmail_history_checks: {
    file: 'history-safety',
    fields: {
      company_id: f('ref', 'companies'),
      status: f('code'),
      checked_at: f('date'),
      consent_expires_at: f('date'),
    },
  },
  browser_deliveries: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      outbox_id: f('ref', 'outbox'),
      state: f('code'),
      committed_at: f('date'),
      click_granted_at: f('date'),
      created_at: f('date'),
      updated_at: f('date'),
    },
  },
  auto_run_scope: {
    file: 'scope-links',
    fields: { run_id: f('ref', 'runs'), scope_hash: f('private') },
  },
  auto_draft_scope: {
    file: 'scope-links',
    fields: { draft_id: f('ref', 'drafts'), scope_hash: f('private') },
  },
  auto_batches: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      state: f('code'),
      prepared_at: f('date'),
      revision: f('number'),
      policy_hash: f('hash'),
      scope_hash: f('private'),
      approved_at: f('date'),
      updated_at: f('date'),
    },
  },
  auto_batch_items: {
    file: 'history-safety',
    fields: {
      id: f('id'),
      batch_id: f('ref', 'auto_batches'),
      ordinal: f('number'),
      company_id: f('ref', 'companies'),
      contact_id: f('ref', 'contacts'),
      draft_id: f('ref', 'drafts'),
      draft_version: f('number'),
      state: f('code'),
      qualified_at: f('date'),
    },
  },
  auto_batch_sessions: {
    file: 'history-safety',
    fields: { batch_id: f('ref', 'auto_batches'), session_id: f('ref', 'auto_sessions') },
  },
  auto_batch_outbox: {
    file: 'history-safety',
    fields: { item_id: f('ref', 'auto_batch_items'), outbox_id: f('ref', 'outbox') },
  },
  company_domain_enrichments: {
    file: 'identity-events',
    fields: {
      id: f('id'),
      operation_id: f('private'),
      company_id: f('ref', 'companies'),
      previous_kind: f('code'),
      previous_value: f('text'),
      previous_version: f('number'),
      resulting_version: f('number'),
      domain: f('text'),
      alias_id: f('ref', 'company_aliases'),
      source_id: f('ref', 'research_sources'),
      source_hash: f('hash'),
      parser_version: f('number'),
      verification_id: f('ref', 'source_verifications'),
      verified_at: f('date'),
      company_name: f('text'),
      identity_quote: f('text'),
      proof_hash: f('hash'),
      created_at: f('date'),
    },
  },
};
const historicalFact = z
  .object({
    id: text,
    key: text,
    content: text,
    currentFact: refSchema,
    version: z.number().nullable(),
    approvalStatus: z.literal('NOT_RECORDED'),
  })
  .strict();
export const profileSnapshot = z
  .object({
    id: text,
    profileHash: nullableText,
    goal: nullableText,
    facts: z.array(historicalFact),
    versionKnowledge: z.literal('NOT_RECORDED'),
    approvalKnowledge: z.literal('NOT_RECORDED'),
  })
  .strict();
const review = z
  .object({
    supported: z.boolean().nullable(),
    issueCount: z.number().int().nonnegative(),
    code: codeSchema,
  })
  .strict();
const contexts = z
  .array(
    z.object({ address: text, contexts: z.array(text), complete: z.boolean().nullable() }).strict(),
  )
  .nullable();
const outboundLinks = z.array(z.object({ url: text, context: text }).strict()).nullable();
const fieldSchema = (name: string, field: Field): z.ZodType => {
  if (field.kind === 'id') return text;
  if (field.kind === 'ref') return refSchema;
  if (field.kind === 'refs') return z.array(refSchema).nullable();
  if (field.kind === 'texts') return z.array(text).nullable();
  if (field.kind === 'code') return codeSchema.nullable();
  if (field.kind === 'number') return z.number().finite().nullable();
  if (field.kind === 'boolean') return z.boolean().nullable();
  if (field.kind === 'private')
    return name === 'name' ? z.literal('[CANDIDATE]').nullable() : nullableText;
  if (field.kind === 'json')
    return name === 'address_contexts'
      ? contexts
      : name === 'outbound_links'
        ? outboundLinks
        : name === 'context_profile'
          ? profileSnapshot.nullable()
          : review.nullable();
  return nullableText;
};
export const schemas = Object.fromEntries(
  Object.entries(tables).map(([table, { fields }]) => [
    table,
    z
      .object({
        table: z.literal(table),
        recordId: text,
        ...Object.fromEntries(
          Object.entries(fields).map(([name, field]) => [name, fieldSchema(name, field)]),
        ),
        reviewMetadata: z
          .object({
            missingColumns: z.array(text),
            originalSubjectSha256: nullableText,
            originalBodySha256: nullableText,
            redactedSubjectSha256: nullableText,
            redactedBodySha256: nullableText,
            currentVersion: z.boolean().nullable(),
            savedCheck: refSchema,
            attemptVersions: z.array(z.number()),
            historicalCvBinding: z.literal('NOT_RECORDED'),
          })
          .strict(),
      })
      .strict(),
  ]),
);
export const policyInput = z
  .object({
    senderEmail: z.string().optional(),
    cvId: z.string().optional(),
    contactKinds: z.array(z.enum(['GENERAL', 'RECRUITMENT'])).optional(),
    contactTypes: z.array(z.enum(['ACTIVE', 'OPEN', 'PROSPECT'])).optional(),
    searchScope: z.string().optional(),
    sessionLimit: z.number().nullable().optional(),
    dailyLimit: z.number().nullable().optional(),
    sendIntervalSeconds: z.number().optional(),
    researchIntervalSeconds: z.number().optional(),
    confirmed: z.boolean().optional(),
    targetedHistoryConsent: z.boolean().optional(),
    approvedAt: z.string().optional(),
    createdAt: z.string().optional(),
    profileHash: z.string().optional(),
    hash: z.string().optional(),
    scopeHash: z.string().optional(),
  })
  .strict();
