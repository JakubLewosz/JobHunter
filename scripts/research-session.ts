import { runResearchSession } from '../apps/server/src/research/session-entry.js';
import { DomainError } from '../apps/server/src/util.js';
const args = process.argv.slice(2),
  value = (name: string) => (args.indexOf(name) < 0 ? undefined : args[args.indexOf(name) + 1]);
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  if (!args.includes('--data-dir') || args.includes('--start') === args.includes('--resume'))
    throw new DomainError(
      'EXPLICIT_START_REQUIRED',
      'Wskaż --data-dir oraz --start albo --resume.',
    );
  const result = await runResearchSession({
    dir: value('--data-dir')!,
    hours: Number(value('--hours') ?? 8),
    query: args.includes('--query') ? value('--query') : undefined,
    resume: args.includes('--resume'),
    fixture: args.includes('--fixture'),
    steps: args.includes('--steps') ? Number(value('--steps')) : undefined,
    advanceMs: args.includes('--advance-ms') ? Number(value('--advance-ms')) : undefined,
    signal: controller.signal,
  });
  // Runtime identities and controller event IDs are local technical data; no messages/profile.
  console.log(JSON.stringify(result));
} catch (e) {
  console.error(JSON.stringify({ code: e instanceof DomainError ? e.code : 'SESSION_FAILED' }));
  process.exitCode = 1;
}
