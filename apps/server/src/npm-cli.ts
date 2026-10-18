import { existsSync, realpathSync } from 'node:fs';
import { delimiter, join } from 'node:path';

export function resolveNpmCli(env: NodeJS.ProcessEnv = process.env) {
  if (env.npm_execpath && existsSync(env.npm_execpath)) return realpathSync(env.npm_execpath);
  for (const directory of (env.PATH ?? env.Path ?? '').split(delimiter)) {
    for (const candidate of [
      join(directory, 'npm'),
      join(directory, 'node_modules/npm/bin/npm-cli.js'),
    ]) {
      if (!existsSync(candidate)) continue;
      const path = realpathSync(candidate);
      if (/npm-cli\.js$/i.test(path)) return path;
    }
  }
  throw Error('NPM_CLI_UNAVAILABLE');
}
