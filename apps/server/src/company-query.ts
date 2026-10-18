export type CompanyQuery = {
  limit?: number;
  offset?: number;
  id?: string;
  search?: string;
  status?: string;
  filter?: string;
};
export function companySelection(query: CompanyQuery) {
  const search = `%${query.search ?? ''}%`,
    status = query.status ?? '',
    filter = query.filter ?? '';
  return {
    where: `(? IS NULL OR c.id=?) AND (?='' OR c.canonical_name LIKE ? OR c.primary_domain LIKE ? OR EXISTS(SELECT 1 FROM opportunities p WHERE p.company_id=c.id AND p.title LIKE ?))
    AND (?='' OR c.history_status=? OR (?='SKIPPED' AND EXISTS(SELECT 1 FROM auto_skips k WHERE k.company_id=c.id)) OR (?='SEND_UNKNOWN' AND (EXISTS(SELECT 1 FROM outbox b WHERE b.company_id=c.id AND b.status='SEND_UNKNOWN') OR EXISTS(SELECT 1 FROM shared_attempts s WHERE s.company_id=c.id AND s.state='SEND_UNKNOWN'))))
    AND (?='' OR (?='results' AND EXISTS(SELECT 1 FROM opportunities p WHERE p.company_id=c.id)) OR (?='history' AND NOT EXISTS(SELECT 1 FROM opportunities p WHERE p.company_id=c.id)) OR EXISTS(SELECT 1 FROM opportunities p WHERE p.company_id=c.id AND p.decision=?))`,
    args: [
      query.id ?? null,
      query.id ?? null,
      query.search ?? '',
      search,
      search,
      search,
      status,
      status,
      status,
      status,
      filter,
      filter,
      filter,
      filter,
    ],
  };
}
