const args = process.argv.slice(2);
if (args.includes('--version')) console.log('codex-cli 0.fixture');
else if (args[0] === 'login') console.log('Logged in using ChatGPT');
else if (args.includes('--help'))
  console.log(
    '--ignore-user-config --ignore-rules --output-schema --ephemeral --json --strict-config',
  );
else {
  let input = '';
  process.stdin.on('data', (c) => (input += c));
  process.stdin.on('end', () => {
    if (input === 'fixture-invalid-output') {
      console.log(
        JSON.stringify({
          type: 'item.completed',
          item: { type: 'agent_message', text: '{"value":42}' },
        }),
      );
      console.log(JSON.stringify({ type: 'turn.completed' }));
      return;
    }
    console.error(
      'ERROR wire framing broke (EFRAME37); token=fictional-secret-value api_key="fictional-api-secret" Authorization: Bearer fictional-bearer-secret',
    );
    console.error('environment={"PATH":"FICTIONAL_PRIVATE_ENVIRONMENT"}');
    console.log(
      JSON.stringify({
        type: 'item.completed',
        item: { type: 'agent_message', text: 'MODEL_EVENT_MUST_NOT_BE_LOGGED' },
      }),
    );
    process.exitCode = 37;
  });
}
