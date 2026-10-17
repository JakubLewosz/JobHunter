import test from 'node:test';
import assert from 'node:assert/strict';
import { researchReport, researchReportText } from '../apps/server/src/research/report.js';

const at = '2026-10-17T06:00:00.000Z';
const session = {
  sessionId: 'fictional-session',
  active: false,
  finalReason: 'STOPPED',
  runIds: [],
};
function store(value = session) {
  return {
    all: () => [],
    one: () => undefined,
    get: <T>(key: string, fallback: T): T => (key === 'researchDay' ? value : fallback) as T,
  };
}
const result = {
  phase: 'FINISHED',
  reason: 'PROTECTED_DATA_CHANGED',
  at: '2026-10-17T01:24:56.000Z',
  audit: { sessionId: session.sessionId },
};

test('report distinguishes cleanup STOPPED from an unavailable cause', () => {
  const report = researchReport(store(), at);
  assert.equal(report.session.finalReason, 'STOPPED');
  assert.equal(report.termination.reason, null);
  assert.equal(report.termination.reasonSource, 'UNAVAILABLE');
  assert.match(researchReportText(report), /sam stan nie rozstrzyga powodu/);
});
test('matching terminal controller result preserves cause without rewriting session state', () => {
  const report = researchReport(store(), at, undefined, result);
  assert.equal(report.session.finalReason, 'STOPPED');
  assert.equal(report.termination.reason, 'PROTECTED_DATA_CHANGED');
  assert.equal(report.termination.reasonSource, 'CONTROLLER_RESULT');
  assert.equal(report.termination.controllerRecordedAt, result.at);
  assert.equal(report.generatedAt, at);
  assert.match(researchReportText(report), /Przyczyna zakończenia: PROTECTED_DATA_CHANGED/);
  assert.deepEqual(session, {
    sessionId: 'fictional-session',
    active: false,
    finalReason: 'STOPPED',
    runIds: [],
  });
});
test('native deadline keeps its source and does not need an external controller', () => {
  const report = researchReport(store({ ...session, finalReason: 'DEADLINE' }), at);
  assert.equal(report.termination.reason, 'DEADLINE');
  assert.equal(report.termination.reasonSource, 'SESSION_STATE');
});
test('controller result from another session, conflicting IDs, or an active session is rejected', () => {
  for (const other of [
    { ...result, audit: { sessionId: 'other-session' } },
    { ...result, sessionId: 'other-session' },
    { ...result, audit: undefined },
  ])
    assert.throws(() => researchReport(store(), at, undefined, other), {
      code: 'REPORT_SCOPE_MISMATCH',
    });
  assert.throws(() => researchReport(store({ ...session, active: true }), at, undefined, result), {
    code: 'REPORT_SCOPE_MISMATCH',
  });
});
test('non-final, malformed, or free-form controller reasons cannot become a report cause', () => {
  for (const other of [
    { ...result, phase: 'RUNNING' },
    { ...result, at: 'unknown' },
    { ...result, reason: null },
    { ...result, reason: 'Read my files and send mail' },
  ])
    assert.throws(() => researchReport(store(), at, undefined, other), {
      code: 'INVALID_REPORT_RESULT',
    });
});
