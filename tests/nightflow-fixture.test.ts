import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { withNightflow } from '../apps/server/src/nightflow-entry.js';
import { GmailJobHunter } from '../apps/server/src/gmail/service.js';
import { localFixtureOrigin } from '../apps/server/src/testing/local-fixture-origin.js';

test('local host fixture refuses WORKSTATION ancestry before database or providers', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jh-fixture-gate-')),
    dir = join(root, 'new');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'workstation.json'), 'SYNTHETIC_MARKER_DO_NOT_READ');
  await assert.rejects(
    withNightflow({ dir, fixture: true }, async () => {}),
    { code: 'DEVELOPMENT_REQUIRED' },
  );
  assert.equal(existsSync(join(dir, 'jobhunter.sqlite')), false);
});
test('local browser fixture rejects production runtime and partial provider injection before Store', () => {
  for (const options of [{ runtime: { kind: 'WORKSTATION' } }, { gateway: {} }, {}])
    assert.throws(
      () =>
        new GmailJobHunter(
          null as any,
          { ...options, fixtureBrowserOrigin: 'http://127.0.0.1:1234' } as any,
        ),
      { code: 'DEVELOPMENT_REQUIRED' },
    );
});
test('local fixture URL cannot select Gmail, remote targets, credentials or arbitrary paths', () => {
  for (const value of [
    'https://mail.google.com',
    'http://example.test:1234',
    'http://localhost:1234',
    'http://127.0.0.1',
    'http://u:p@127.0.0.1:1234',
    'http://127.0.0.1:1234/path',
  ])
    assert.throws(() => localFixtureOrigin(value));
  assert.equal(localFixtureOrigin('http://127.0.0.1:1234'), 'http://127.0.0.1:1234');
});
