import { readFileSync } from 'node:fs';
import { withNightflow } from '../apps/server/src/nightflow-entry.js';
import { requestNightflow, readNightflowReport } from '../apps/server/src/nightflow-control.js';
import { DomainError } from '../apps/server/src/util.js';
const [command, ...args] = process.argv.slice(2);
const value = (key: string) => (args.indexOf(key) < 0 ? undefined : args[args.indexOf(key) + 1]);
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
try {
  const dir = value('--data-dir');
  if (
    !dir ||
    !['fixture', 'plan', 'preflight', 'start', 'status', 'stop', 'resume', 'report'].includes(
      command,
    )
  )
    throw new DomainError('NIGHTFLOW_OPTIONS', 'Wskaż komendę i --data-dir.');
  if (['status', 'stop', 'report'].includes(command)) {
    let result;
    try {
      result = await requestNightflow(dir, command);
    } catch {
      result = readNightflowReport(dir);
    }
    console.log(JSON.stringify(result));
  } else {
    if (command !== 'fixture' && !args.includes('--workstation'))
      throw new DomainError('WORKSTATION_REQUIRED', 'Wskaż jawnie istniejącą instalację.');
    const result = await withNightflow(
      { dir, fixture: command === 'fixture', signal: controller.signal },
      async (coordinator, _service, plan) => {
        if (command === 'fixture') {
          coordinator.savePlan(plan, true);
          return { fixture: true, ...(await coordinator.start(plan.id)) };
        }
        if (command === 'plan') {
          if (!value('--file') || !args.includes('--confirm-selection-rules'))
            throw new DomainError(
              'PLAN_APPROVAL_REQUIRED',
              'Wymagany plik i jawne potwierdzenie reguł.',
            );
          return coordinator.savePlan(JSON.parse(readFileSync(value('--file')!, 'utf8')), true);
        }
        if (command === 'preflight') return coordinator.preflight(value('--plan') ?? '');
        if (!value('--plan') || (command === 'resume' && !value('--job')))
          throw new DomainError('PLAN_REQUIRED', 'Wskaż zapisany plan i zadanie do wznowienia.');
        return coordinator.start(
          value('--plan')!,
          command === 'resume' ? value('--job') : undefined,
        );
      },
    );
    console.log(JSON.stringify(result));
  }
} catch (e) {
  console.error(JSON.stringify({ code: e instanceof DomainError ? e.code : 'NIGHTFLOW_FAILED' }));
  process.exitCode = 1;
}
