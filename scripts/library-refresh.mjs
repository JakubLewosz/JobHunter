import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { runLibraryRefresh } from '../dist/apps/server/src/research/library-refresh-entry.js';
const args = process.argv.slice(2);
const value = key => args.indexOf(key) < 0 ? undefined : args[args.indexOf(key) + 1];
if (args.includes('--help')) {
  console.log('research:refresh --data-dir EXISTING_PROFILE --ids-file PRIVATE_JSON_ARRAY --minutes 1..60 --workstation; stdin: stop');
} else {
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const input = createInterface({ input: process.stdin });
  input.on('line', line => { if (line.trim() === 'stop') stop(); });
  try {
    if (!args.includes('--workstation') || !value('--data-dir') || !value('--ids-file') || !value('--minutes'))
      throw Error('EXPLICIT_REFRESH_SCOPE_REQUIRED');
    const result = await runLibraryRefresh({
      dir: value('--data-dir'), draftIds: JSON.parse(readFileSync(value('--ids-file'), 'utf8')),
      minutes: Number(value('--minutes')), signal: controller.signal,
    });
    console.log(JSON.stringify({ operationId: result.operationId, reason: result.reason, report: result.report,
      selected: result.selected.length, returned: result.results.length, preserved: result.preserved, sendAuthority: false }));
    if (!['COMPLETED', 'DEADLINE', 'STOPPED'].includes(result.reason)) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ code: error.code ?? 'REFRESH_OPTIONS' }));
    process.exitCode = 1;
  } finally { input.close(); }
}
