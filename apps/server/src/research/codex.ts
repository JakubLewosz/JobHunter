import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, delimiter, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { DomainError, hash } from '../util.js';

export type CallMeta = {
  elapsedMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  model: string | null;
  webSearches: number;
  searchQueries?: string[];
};
export interface StructuredRunner {
  inspect(signal?: AbortSignal): Promise<Record<string, unknown>>;
  run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ): Promise<{ value: T; meta: CallMeta }>;
}
export function cliPath(): string {
  if (process.env.JOBHUNTER_CODEX_PATH) {
    if (!isAbsolute(process.env.JOBHUNTER_CODEX_PATH))
      throw new DomainError('CLI_PATH', 'Ścieżka CLI musi być absolutna.');
    return process.env.JOBHUNTER_CODEX_PATH;
  }
  const candidates = (process.env.PATH ?? '')
    .split(delimiter)
    .map((p) => join(p, process.platform === 'win32' ? 'codex.exe' : 'codex'));
  if (process.platform === 'darwin')
    candidates.push(
      '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex',
    );
  return candidates.find((p) => existsSync(p)) ?? 'codex';
}
export function childEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  // Auth belongs to the CLI. Never read/copy auth files and never inherit API keys, app tokens or proxies.
  for (const key of [
    'PATH',
    'HOME',
    'USERPROFILE',
    'LOCALAPPDATA',
    'APPDATA',
    'SYSTEMROOT',
    'WINDIR',
    'TEMP',
    'TMP',
    'TMPDIR',
    'CODEX_HOME',
  ])
    if (process.env[key]) env[key] = process.env[key];
  return env;
}
export const disabledFeatures = [
  'shell_tool',
  'unified_exec',
  'apps',
  'plugins',
  'hooks',
  'multi_agent',
  'multi_agent_v2',
  'browser_use',
  'browser_use_external',
  'computer_use',
  'in_app_browser',
  'image_generation',
  'view_image',
  'artifact',
  'code_mode',
  'memories',
  'skill_search',
  'skill_mcp_dependency_install',
  'tool_suggest',
  'daemon_auto_start',
  'unbounded_connection_retries',
  'worktrees',
  'workspace_dependencies',
  'goals',
  'sleep_tool',
  'auth_elicitation',
  'in_app_chat',
  'in_app_local_automation',
  'in_app_updates',
  'plugin_sharing',
  'remote_plugin',
  'tool_call_mcp_elicitation',
];
export function execArguments(schemaPath: string, search: boolean) {
  return [
    '--no-daemon',
    '-a',
    'never',
    'exec',
    '--ignore-user-config',
    '--ignore-rules',
    '--strict-config',
    '--ephemeral',
    '--skip-git-repo-check',
    '--sandbox',
    'read-only',
    '--color',
    'never',
    '--json',
    '--output-schema',
    schemaPath,
    ...disabledFeatures.flatMap((f) => ['--disable', f]),
    '--enable',
    'skip_host_skill_discovery',
    '-c',
    'project_doc_max_bytes=0',
    '-c',
    'shell_environment_policy.inherit="none"',
    '-c',
    `web_search="${search ? 'live' : 'disabled'}"`,
    '-c',
    'suppress_unstable_features_warning=true',
    '-',
  ];
}
function cliError(text: string): DomainError {
  if (/usage limit|rate.?limit|quota|429|usage_limit/i.test(text))
    return new DomainError(
      'CODEX_LIMIT',
      'Limit Codexa. Zapisano etap; wznów po odnowieniu limitu.',
    );
  if (/not logged|login|unauthoriz|401|authentication|auth_required/i.test(text))
    return new DomainError('CODEX_LOGIN', 'Zaloguj się oficjalnym poleceniem codex login.');
  if (
    /unknown variant|unexpected argument|unknown feature|unknown configuration|unrecognized|invalid config/i.test(
      text,
    )
  )
    return new DomainError(
      'CODEX_CONFIGURATION',
      'CLI nie obsługuje wymaganej konfiguracji izolacji. Sprawdź wersję i dokumentację.',
    );
  return new DomainError(
    'CODEX_FAILED',
    'Wywołanie Codexa nie zakończyło się poprawnie. Bez zastępowania wyniku mockiem.',
  );
}
export function parseJSONL(output: string) {
  let final: string | undefined;
  let completed = false;
  let webSearches = 0;
  const meta: CallMeta = {
    elapsedMs: 0,
    inputTokens: null,
    outputTokens: null,
    cachedInputTokens: null,
    model: null,
    webSearches: 0,
  };
  for (const line of output.split(/\r?\n/).filter((x) => x.trim())) {
    let event: any;
    try {
      event = JSON.parse(line);
    } catch {
      throw new DomainError('CODEX_JSONL', 'Uszkodzony strumień JSONL.');
    }
    if (event.type === 'error' || event.type === 'turn.failed')
      throw cliError(JSON.stringify(event));
    if (event.type === 'item.completed') {
      if (event.item?.type === 'error')
        throw new DomainError(
          'CODEX_TOOLS',
          'Narzędzia wymagane przez CLI są niedostępne. Sprawdź konfigurację; bez fallbacku.',
        );
      if (event.item?.type === 'agent_message') final = event.item.text;
      if (event.item?.type === 'web_search') {
        webSearches++;
        const query = event.item.query ?? event.item.action?.query;
        if (typeof query === 'string') (meta.searchQueries ??= []).push(query.slice(0, 300));
      }
      if (['command_execution', 'mcp_tool_call', 'file_change'].includes(event.item?.type))
        throw new DomainError(
          'ISOLATION_FAILED',
          'CLI udostępniło niedozwolone narzędzie; integracja zatrzymana.',
        );
    }
    if (event.type === 'turn.completed') {
      completed = true;
      const u = event.usage;
      for (const [key, eventKey] of [
        ['inputTokens', 'input_tokens'],
        ['outputTokens', 'output_tokens'],
        ['cachedInputTokens', 'cached_input_tokens'],
      ] as const)
        meta[key] = typeof u?.[eventKey] === 'number' && u[eventKey] >= 0 ? u[eventKey] : null;
    }
  }
  if (!completed || !final)
    throw new DomainError('CODEX_INCOMPLETE', 'Brak końcowego wyniku Codexa.');
  meta.webSearches = webSearches;
  let value: unknown;
  try {
    value = JSON.parse(final);
  } catch {
    throw new DomainError('CODEX_JSON', 'Nieprawidłowy końcowy JSON.');
  }
  return { value, meta };
}
export class ExecCodexRunner implements StructuredRunner {
  constructor(
    private options: {
      binary?: string;
      prefix?: string[];
      timeoutMs?: number;
      maxOutputBytes?: number;
    } = {},
  ) {}
  async inspect(signal?: AbortSignal) {
    const binary = this.options.binary ?? cliPath();
    const version = await this.process(binary, ['--version'], '', 10000, signal);
    const help = await this.process(binary, ['exec', '--help'], '', 10000, signal);
    const required = [
      '--ignore-user-config',
      '--ignore-rules',
      '--output-schema',
      '--ephemeral',
      '--json',
      '--strict-config',
    ];
    if (required.some((x) => !help.includes(x)))
      throw new DomainError('CODEX_CONFIGURATION', 'CLI nie obsługuje wymaganych argumentów.');
    const status = await this.process(binary, ['login', 'status'], '', 10000, signal);
    if (!/Logged in using ChatGPT/i.test(status))
      throw new DomainError(
        'CODEX_LOGIN',
        'Wymagane istniejące logowanie ChatGPT przez codex login; nie używamy klucza API.',
      );
    return {
      available: true,
      configured: true,
      tested: false,
      version: version.trim(),
      binary,
      auth: 'ChatGPT',
    };
  }
  async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: { signal?: AbortSignal; search?: boolean } = {},
  ) {
    if (Buffer.byteLength(prompt) > 160000)
      throw new DomainError('PROMPT_SIZE', 'Pakiet danych jest zbyt duży.');
    await this.inspect(options.signal);
    const task = await mkdtemp(join(tmpdir(), 'jobhunter-agent-'));
    const schemaPath = join(task, 'schema.json');
    try {
      await writeFile(schemaPath, JSON.stringify(z.toJSONSchema(schema)), { mode: 0o600 });
      const started = Date.now();
      const output = await this.process(
        this.options.binary ?? cliPath(),
        execArguments(schemaPath, !!options.search),
        prompt,
        this.options.timeoutMs ?? 120000,
        options.signal,
        task,
      );
      const parsed = parseJSONL(output);
      const validated = schema.safeParse(parsed.value);
      if (!validated.success)
        throw new DomainError('CODEX_SCHEMA', 'Wynik Codexa nie jest zgodny ze schematem.');
      return { value: validated.data, meta: { ...parsed.meta, elapsedMs: Date.now() - started } };
    } finally {
      await rm(task, { recursive: true, force: true });
    }
  }
  private process(
    binary: string,
    args: string[],
    input: string,
    timeoutMs: number,
    signal?: AbortSignal,
    cwd?: string,
  ): Promise<string> {
    if (/\.(cmd|bat)$/i.test(binary))
      throw new DomainError('CLI_PATH', 'Wskaż natywny codex.exe, nie skrypt shellowy.');
    return new Promise((resolve, reject) => {
      signal?.throwIfAborted();
      const child = spawn(binary, [...(this.options.prefix ?? []), ...args], {
        cwd: cwd ?? tmpdir(),
        env: childEnvironment(),
        shell: false,
        windowsHide: true,
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const stdoutChunks: Buffer[] = [],
        stderrChunks: Buffer[] = [];
      let bytes = 0,
        failure: DomainError | undefined;
      const kill = () => {
        if (!child.pid) return;
        if (process.platform === 'win32') {
          // taskkill is called only for the PID owned by this adapter; no image-name/global killing.
          spawn(
            join(process.env.SYSTEMROOT ?? 'C:\\Windows', 'System32', 'taskkill.exe'),
            ['/PID', String(child.pid), '/T', '/F'],
            { windowsHide: true, stdio: 'ignore', shell: false },
          );
        } else {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {}
        }
      };
      const abort = () => {
        failure = new DomainError('CANCELLED', 'Przerwano własne zadanie Codexa.');
        kill();
      };
      const timer = setTimeout(() => {
        failure = new DomainError(
          'CODEX_TIMEOUT',
          'Codex przekroczył limit czasu. Etap można wznowić.',
        );
        kill();
      }, timeoutMs);
      signal?.addEventListener('abort', abort, { once: true });
      const collect = (chunk: Buffer, err: boolean) => {
        bytes += chunk.length;
        if (bytes > (this.options.maxOutputBytes ?? 2 * 1024 * 1024)) {
          failure = new DomainError('CODEX_OUTPUT_LIMIT', 'Przekroczony limit wyjścia Codexa.');
          kill();
          return;
        }
        if (err) stderrChunks.push(chunk);
        else stdoutChunks.push(chunk);
      };
      child.stdout.on('data', (x: Buffer) => collect(x, false));
      child.stderr.on('data', (x: Buffer) => collect(x, true));
      child.stdin.on('error', () => {});
      child.stdin.end(input);
      child.once('error', (e: NodeJS.ErrnoException) => {
        failure = new DomainError(
          e.code === 'ENOENT' ? 'CLI_MISSING' : 'CLI_START',
          'Nie można uruchomić Codex CLI. Ustaw JOBHUNTER_CODEX_PATH.',
        );
      });
      child.once('close', (code) => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        const stdout = Buffer.concat(stdoutChunks).toString('utf8'),
          stderr = Buffer.concat(stderrChunks).toString('utf8');
        if (failure) reject(failure);
        else if (code !== 0) reject(cliError(stderr + '\n' + stdout));
        else
          resolve(
            args[0] === 'login' || args[0] === '--version' || args[0] === 'exec'
              ? stdout + stderr
              : stdout,
          );
      });
    });
  }
}

export function configurationFingerprint() {
  const binary = cliPath();
  let stamp: number | null = null;
  try {
    stamp = statSync(binary).mtimeMs;
  } catch {}
  return hash(
    JSON.stringify({
      binary,
      stamp,
      platform: process.platform,
      args: execArguments('SCHEMA', false),
    }),
  );
}
