import { StringDecoder } from 'node:string_decoder';

// Metadata only: never retain item text, reasoning, commands, URLs, arguments or IDs.
export type ProcessTrace = {
  timeoutMs: number;
  inputBytes: number;
  schemaBytes: number;
  sourceCount: number | null;
  search: boolean;
  spawnMs: number | null;
  stdinEndMs: number | null;
  firstStdoutMs: number | null;
  firstStderrMs: number | null;
  turnStartedMs: number | null;
  turnCompletedMs: number | null;
  lastEventMs: number | null;
  exitMs: number | null;
  closeMs: number | null;
  killMs: number | null;
  killReason: string | null;
  timeoutPhase: string | null;
  stdoutBytes: number;
  stderrBytes: number;
  malformedLines: number;
  transportRetries: number;
  eventCounts: Record<string, number>;
  events: { ms: number; type: string; itemType: string | null }[];
  model: string | null;
  effort: string | null;
};
const eventTypes = new Set([
  'thread.started',
  'turn.started',
  'turn.completed',
  'turn.failed',
  'item.started',
  'item.updated',
  'item.completed',
  'error',
]);
const itemTypes = new Set([
  'agent_message',
  'reasoning',
  'command_execution',
  'file_change',
  'mcp_tool_call',
  'web_search',
  'plan_update',
  'error',
]);
export function newProcessTrace(
  input: Pick<ProcessTrace, 'timeoutMs' | 'inputBytes' | 'schemaBytes' | 'sourceCount' | 'search'>,
): ProcessTrace {
  return {
    ...input,
    spawnMs: null,
    stdinEndMs: null,
    firstStdoutMs: null,
    firstStderrMs: null,
    turnStartedMs: null,
    turnCompletedMs: null,
    lastEventMs: null,
    exitMs: null,
    closeMs: null,
    killMs: null,
    killReason: null,
    timeoutPhase: null,
    stdoutBytes: 0,
    stderrBytes: 0,
    malformedLines: 0,
    transportRetries: 0,
    eventCounts: {},
    events: [],
    model: null,
    effort: null,
  };
}
export function traceTimeoutPhase(t: ProcessTrace) {
  if (t.turnCompletedMs !== null) return 'AFTER_TURN_COMPLETED';
  if (t.spawnMs === null) return 'SPAWN';
  if (t.firstStdoutMs === null && t.firstStderrMs === null) return 'NO_OUTPUT';
  if (t.turnStartedMs === null) return 'BEFORE_TURN_STARTED';
  const last = t.events.at(-1);
  if (last?.itemType === 'web_search' && last.type !== 'item.completed') return 'WEB_SEARCH_ACTIVE';
  return 'TURN_ACTIVE'; // No claim that silence means hung or reasoning has finished.
}
export class ProcessEventObserver {
  private decoder = new StringDecoder('utf8');
  private pending = '';
  forbiddenTool = false;
  constructor(
    readonly trace: ProcessTrace,
    private elapsed: () => number,
  ) {}
  stdout(chunk: Buffer) {
    this.pending += this.decoder.write(chunk);
    let end;
    while ((end = this.pending.indexOf('\n')) >= 0) {
      this.line(this.pending.slice(0, end));
      this.pending = this.pending.slice(end + 1);
    }
  }
  finish() {
    this.pending += this.decoder.end();
    if (this.pending.trim()) this.line(this.pending);
    this.pending = '';
  }
  private line(line: string) {
    if (!line.trim()) return;
    let e: any;
    try {
      e = JSON.parse(line);
    } catch {
      this.trace.malformedLines++;
      return;
    }
    if (!e || typeof e !== 'object' || Array.isArray(e)) {
      this.trace.malformedLines++;
      return;
    }
    const type = eventTypes.has(e?.type) ? e.type : 'other',
      itemType = e?.item ? (itemTypes.has(e.item.type) ? e.item.type : 'other') : null,
      ms = this.elapsed(),
      key = itemType ? `${type}:${itemType}` : type;
    this.trace.eventCounts[key] = (this.trace.eventCounts[key] ?? 0) + 1;
    this.trace.lastEventMs = ms;
    this.trace.events.push({ ms, type, itemType });
    if (this.trace.events.length > 64) this.trace.events.shift();
    if (type === 'turn.started') this.trace.turnStartedMs ??= ms;
    if (type === 'turn.completed') this.trace.turnCompletedMs ??= ms;
    if (['command_execution', 'file_change', 'mcp_tool_call'].includes(itemType ?? ''))
      this.forbiddenTool = true;
    if (
      (type === 'error' || type === 'turn.failed') &&
      /retry|reconnect/i.test(e.message ?? e.error?.message ?? '')
    )
      this.trace.transportRetries++;
    const model = e.model ?? e.thread?.model;
    if (typeof model === 'string' && /^[a-z0-9][a-z0-9._-]{0,79}$/i.test(model))
      this.trace.model = model;
    const effort = e.reasoning_effort ?? e.reasoning?.effort;
    if (['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(effort))
      this.trace.effort = effort;
  }
}
