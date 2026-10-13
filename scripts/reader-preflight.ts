import { PublicSourceReader } from '../apps/server/src/research/fetcher.js';
// Diagnostic only: no database, credentials, Gmail or system changes. Each attempt is counted.
let requests = 0;
const reader = new PublicSourceReader({
  beforeRequest: () => {
    if (requests >= 12) throw new Error('PREFLIGHT_LIMIT');
    requests++;
  },
});
const result = await reader.preflight();
console.log(
  JSON.stringify(
    {
      ...result,
      sources: result.sources.map(({ text, fragment, address_contexts, ...s }) => s),
      requests,
    },
    null,
    2,
  ),
);
process.exitCode = result.ok ? 0 : 2;
