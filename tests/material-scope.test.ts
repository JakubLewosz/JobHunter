import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { approvedDiagnosticMaterials } from '../apps/server/src/research/diagnostic.js';

function fixture(t: any) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'jh-material-scope-')));
  const store = new Store(join(base, 'research-only'));
  store.set('skipLegacyHistorySeed', true);
  const service = new ResearchJobHunter(store);
  t.after(() => {
    store.close();
    rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  const edit = (facts: any[]) => {
    const p = service.profile();
    return {
      name: 'Alex Fixture',
      goal: 'Fikcyjna płatna współpraca do sprawdzenia zakresu materiałów.',
      hours_approx: 20,
      version: p.version,
      message_template: p.message_template,
      facts: facts.map((f) => ({ id: f.id, content: f.content })),
    };
  };
  return { base, store, service, edit };
}

test('a current three-project profile preserves the deferred fourth description without approving or exposing it', (t) => {
  const f = fixture(t);
  const old = f.service.profile();
  const deferred = old.facts.find((x) => x.fact_key === 'fixdesk')!;
  f.service.updateProfile(f.edit(old.facts.filter((x) => x.id !== deferred.id)));
  assert.equal(f.store.one('SELECT count(*) n FROM candidate_facts')!.n, old.facts.length);
  assert.equal(
    f.store.one('SELECT content FROM candidate_facts WHERE id=?', deferred.id)!.content,
    deferred.content,
  );
  assert.equal(
    f.service.profile().facts.some((x) => x.id === deferred.id),
    false,
  );
  assert.equal(f.service.profile().approved_at, null);
  f.service.approveProfile(); // Fictional fixture only, never the personal installation.
  const retained = f.store.one('SELECT * FROM candidate_facts WHERE id=?', deferred.id)!;
  assert.equal(retained.approval_status, 'DEFERRED');
  assert.equal(retained.checked_at, null);
  assert.equal(
    f.service.minimalProfile().facts.some((x) => x.id === deferred.id),
    false,
  );
  const restarted = new ResearchJobHunter(f.store);
  assert.equal(
    restarted.profile().facts.some((x) => x.id === deferred.id),
    false,
  );
  assert.equal(restarted.profile().deferred_facts[0].id, deferred.id);
  assert.equal(restarted.state().stopped, true);
  assert.equal(f.store.one('SELECT count(*) n FROM outbox')!.n, 0);
  assert.equal(f.store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});

test('an explicitly supplied deferred project returns as DRAFT and invalidates the previous profile approval', (t) => {
  const f = fixture(t);
  const old = f.service.profile();
  const deferred = old.facts.find((x) => x.fact_key === 'fixdesk')!;
  f.service.updateProfile(f.edit(old.facts.filter((x) => x.id !== deferred.id)));
  f.service.approveProfile();
  const current = f.service.profile();
  f.service.updateProfile(
    f.edit([
      ...current.facts,
      {
        ...deferred,
        content: 'FixtureDesk: nowy opis fikcyjnego projektu do osobnego zatwierdzenia.',
      },
    ]),
  );
  assert.equal(f.service.profile().approved_at, null);
  assert.equal(f.service.profile().deferred_facts.length, 0);
  assert.equal(
    f.service.profile().facts.find((x) => x.id === deferred.id)!.approval_status,
    'DRAFT',
  );
  assert.equal(f.store.one('SELECT count(*) n FROM candidate_facts')!.n, old.facts.length);
});

test('material scope cannot omit core identity/availability facts or invent/duplicate IDs, and errors preserve the profile', (t) => {
  const f = fixture(t);
  const old = f.service.profile();
  const snapshot = JSON.stringify(f.store.all('SELECT * FROM candidate_facts ORDER BY id'));
  for (const facts of [
    old.facts.filter((x) => x.fact_key !== 'availability'),
    [...old.facts, { id: 'invented-fixture-id', content: 'Fixture' }],
    [...old.facts.slice(1), old.facts[1]],
  ])
    assert.throws(
      () => f.service.updateProfile(f.edit(facts)),
      (e: any) => e.code === 'INVALID_FACT',
    );
  assert.equal(f.service.profile().version, old.version);
  assert.equal(JSON.stringify(f.store.all('SELECT * FROM candidate_facts ORDER BY id')), snapshot);
});

test(
  'Windows approved-profile smoke copies only the selected approved facts and rejects any selected DRAFT',
  { skip: process.platform !== 'win32' },
  (t) => {
    const f = fixture(t);
    writeFileSync(
      join(f.base, 'workstation.json'),
      JSON.stringify({ kind: 'WORKSTATION', base: f.base, historyConfirmed: true }),
    );
    const old = f.service.profile();
    f.service.updateProfile(f.edit(old.facts.filter((x) => x.fact_key !== 'fixdesk')));
    assert.throws(() => approvedDiagnosticMaterials(f.base), /APPROVED_MATERIALS_REQUIRED/);
    f.service.approveProfile();
    const materials = approvedDiagnosticMaterials(f.base);
    assert.equal(Object.keys(materials.facts).length, 9);
    assert.equal('fixdesk' in materials.facts, false);
    f.store.exec("UPDATE candidate_facts SET approval_status='DRAFT' WHERE fact_key='autorelay'");
    assert.throws(() => approvedDiagnosticMaterials(f.base), /APPROVED_MATERIALS_REQUIRED/);
  },
);

test('an invalid deferred core fact blocks approval and the Windows diagnostic snapshot', (t) => {
  const f = fixture(t);
  f.service.approveProfile();
  f.store.exec(
    "UPDATE candidate_facts SET approval_status='DEFERRED' WHERE fact_key='availability'",
  );
  assert.throws(
    () => f.service.approveProfile(),
    (e: any) => e.code === 'INVALID_FACT',
  );
  if (process.platform === 'win32') {
    writeFileSync(
      join(f.base, 'workstation.json'),
      JSON.stringify({ kind: 'WORKSTATION', base: f.base, historyConfirmed: true }),
    );
    assert.throws(() => approvedDiagnosticMaterials(f.base), /APPROVED_MATERIALS_REQUIRED/);
  }
});
