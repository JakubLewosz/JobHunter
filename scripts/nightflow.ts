import { readFileSync } from 'node:fs';
import {
  requestNightflow,
  readNightflowReport,
  controlCause,
  unknownNightflowOwner,
} from '../apps/server/src/nightflow-control.js';
import { DomainError } from '../apps/server/src/util.js';
const [command, ...args] = process.argv.slice(2);
const value = (key: string) => (args.indexOf(key) < 0 ? undefined : args[args.indexOf(key) + 1]);
const controller = new AbortController();
const progress = (event: string) => {
  if (command === 'fixture' && process.connected)
    process.send?.({ kind: 'NIGHTFLOW_FIXTURE_PROGRESS', event }, () => {});
};
if (command === 'fixture' && process.connected) {
  process.on('message', (message: any) => {
    if (message?.op === 'CANCEL_FIXTURE') {
      controller.abort();
      progress('CANCEL_RECEIVED');
    }
  });
}
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
// ENTRY means the fixture cancellation listener is installed.
progress('ENTRY');
try {
  const dir = value('--data-dir');
  if (
    !dir ||
    ![
      'fixture',
      'plan',
      'preflight',
      'start',
      'browser-owner',
      'status',
      'stop',
      'resume',
      'report',
    ].includes(command)
  )
    throw new DomainError('NIGHTFLOW_OPTIONS', 'Wskaż komendę i --data-dir.');
  if (['status', 'stop', 'report'].includes(command)) {
    let result;
    try {
      result = await requestNightflow(dir, command);
    } catch (error) {
      if (command !== 'report') {
        console.error(
          JSON.stringify({
            source: 'CONTROL_FAILURE',
            code: command === 'stop' ? 'STOP_UNCONFIRMED' : 'STATUS_UNAVAILABLE',
            cause: controlCause(error),
            current: unknownNightflowOwner(),
          }),
        );
        process.exitCode = 1;
      } else result = readNightflowReport(dir);
    }
    if (result) console.log(JSON.stringify(result));
  } else if (command === 'browser-owner') {
    if (!args.includes('--workstation') || !value('--plan'))
      throw new DomainError('WORKSTATION_REQUIRED', 'Wskaż istniejącą instalację i zapisany plan.');
    const { runStoppedNightflowOwner } = await import('./nightflow-node-owner.mjs');
    console.log(
      JSON.stringify(
        await runStoppedNightflowOwner({
          dir,
          planId: value('--plan'),
          resumeJobId: value('--job'),
          signal: controller.signal,
          onReady: (info: unknown) => console.log(JSON.stringify(info)),
        }),
      ),
    );
  } else {
    if (command !== 'fixture' && !args.includes('--workstation'))
      throw new DomainError('WORKSTATION_REQUIRED', 'Wskaż jawnie istniejącą instalację.');
    progress('IMPORT_BEGIN');
    const { withNightflow } = await import('../apps/server/src/nightflow-entry.js');
    progress('IMPORT_END');
    const result = await withNightflow(
      {
        dir,
        fixture: command === 'fixture',
        signal: controller.signal,
        ...(command === 'fixture' ? { onProgress: progress } : {}),
      },
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
    progress('RESULT');
    console.log(JSON.stringify(result));
  }
} catch (e) {
  console.error(JSON.stringify({ code: e instanceof DomainError ? e.code : 'NIGHTFLOW_FAILED' }));
  process.exitCode = 1;
} finally {
  if (process.connected) process.disconnect();
}
