import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args.includes('--version')) console.log('codex-cli trace.fixture');
else if (args.includes('--help'))
  console.log(
    '--ignore-user-config --ignore-rules --output-schema --ephemeral --json --strict-config',
  );
else if (args[0] === 'login') console.log('Logged in using ChatGPT');
else {
  let input = '';
  process.stdin.on('data', (b) => (input += b));
  process.stdin.on('end', () => {
    const [mode, file] = input.split('|'),
      emit = (e) => console.log(JSON.stringify(e));
    const started = () => {
      emit({ type: 'thread.started' });
      emit({ type: 'turn.started' });
    };
    const completed = () => {
      emit({ type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } });
      emit({ type: 'turn.completed' });
    };
    if (mode === 'silent') setInterval(() => {}, 10000);
    else if (mode === 'progress') {
      started();
      setInterval(
        () =>
          emit({
            type: 'item.updated',
            item: { type: 'reasoning', text: 'NEVER_SAVE_PRIVATE_REASONING' },
          }),
        20,
      );
    } else if (mode === 'completed-hang') {
      started();
      completed();
      if (file) writeFileSync(file, 'completed');
      setInterval(() => {}, 10000);
    } else if (mode === 'pre-turn') {
      emit({ type: 'thread.started' });
      setInterval(() => {}, 10000);
    } else if (mode === 'web-search') {
      started();
      emit({ type: 'item.started', item: { type: 'web_search' } });
      setInterval(() => {}, 10000);
    } else if (mode === 'partial') {
      started();
      process.stdout.write('{"type":');
    } else if (mode === 'malformed') {
      console.log('not json');
      completed();
    } else if (mode === 'provider') {
      started();
      emit({ type: 'error', message: 'Transport reconnecting 1/5; token=fictional-secret' });
      process.exitCode = 43;
    } else if (mode === 'overflow') process.stdout.write('x'.repeat(20000));
    else if (mode === 'tool' || mode === 'tool-delay') {
      const tool = () => {
        started();
        emit({
          type: 'item.started',
          item: { type: 'command_execution', command: 'NEVER_SAVE_COMMAND' },
        });
      };
      if (mode === 'tool-delay') setTimeout(tool, 600);
      else tool();
      setInterval(() => {}, 10000);
    } else if (mode === 'tree') {
      const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},10000)'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      writeFileSync(file, String(child.pid));
      started();
      setInterval(() => {}, 10000);
    } else {
      started();
      completed();
    }
    if (file && mode !== 'tree') writeFileSync(file, 'ready');
  });
}
