import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import {
  readProtectedSnapshot,
  compareProtectedSnapshots,
  fileMaterialProof,
} from '../apps/server/src/research/protection.js';
import { enrichCompanyDomain } from '../apps/server/src/research/domain-enrichment.js';
async function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-protection-')),
    store = new Store(dir);
  const runner = new FixtureRunner(),
    reader = new FixtureReader();
  runner.prospect = reader.prospect = true;
  let time = Date.now();
  const service = new ResearchJobHunter(store, { runner, reader, clock: () => new Date(time) });
  t.after(async () => {
    await service.stopWorker();
    store.close();
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  const c = service.findOrCreateCompany('Fixture Company', null).company;
  const before = readProtectedSnapshot(store.db);
  await service.importURL('https://fixture.example.test/careers');
  await service.tick();
  const after = readProtectedSnapshot(store.db);
  return { dir, store, service, c, before, after, advance: () => (time += 48 * 3600000) };
}
test('qualification atomically binds domain, alias and event; fixed baseline accepts repeated checks and aged proof', async (t) => {
  const f = await fixture(t);
  assert.equal(f.store.one('SELECT count(*) n FROM company_domain_enrichments')!.n, 1);
  assert.equal(
    f.store.one('SELECT primary_domain FROM companies WHERE id=?', f.c.id)!.primary_domain,
    'fixture.example.test',
  );
  for (let n = 0; n < 4; n++)
    assert.equal(compareProtectedSnapshots(f.before, readProtectedSnapshot(f.store.db)).ok, true);
  f.advance();
  assert.equal(compareProtectedSnapshots(f.before, readProtectedSnapshot(f.store.db)).ok, true);
  const draft = f.service.draftRows()[0];
  assert.ok(draft);
  assert.ok(f.service.draftMaterialIssues(draft).length);
});
test('unchanged snapshot and independent synthetic file adapter', async (t) => {
  const f = await fixture(t);
  assert.equal(compareProtectedSnapshots(f.after, f.after).ok, true);
  const asset = f.service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nsynthetic\n%%EOF').toString('base64'),
  );
  f.service.approveCV(asset.id);
  const before = readProtectedSnapshot(f.store.db),
    files = fileMaterialProof(f.store.db, f.dir);
  assert.equal(files.valid, true);
  const cv = f.store.one('SELECT stored_name FROM cv_assets WHERE id=?', asset.id)!;
  writeFileSync(join(f.dir, 'cv', cv.stored_name), 'changed');
  assert.equal(
    compareProtectedSnapshots(before, readProtectedSnapshot(f.store.db), {
      before: files,
      after: fileMaterialProof(f.store.db, f.dir),
    }).ok,
    false,
  );
});
for (const variant of [
  'missing',
  'hash',
  'domain',
  'company',
  'operation',
  'name',
  'oldAlias',
  'oldVersion',
  'block',
  'otherOwner',
]) {
  test('pure guard rejects ' + variant + ' without consuming any evidence', async (t) => {
    const f = await fixture(t),
      after = structuredClone(f.after);
    const event = after.events[0];
    assert.ok(event);
    if (variant === 'missing') after.events = [];
    if (variant === 'hash') event.proof_hash = 'changed';
    if (variant === 'domain') event.domain = 'other.example.test';
    if (variant === 'company') event.company_id = 'other';
    if (variant === 'operation') after.events.push({ ...event, id: 'other-event' });
    if (variant === 'name')
      after.companies.find((c) => c.id === f.c.id)!.canonical_name = 'Changed';
    if (variant === 'oldAlias')
      after.aliases = after.aliases.filter(
        (a) => a.id !== f.before.aliases.find((a) => a.company_id === f.c.id)!.id,
      );
    if (variant === 'oldVersion') {
      f.before.versions['old-version'] = 'original';
      f.after.versions['old-version'] = 'original';
      after.versions['replacement'] = 'original';
    }
    if (variant === 'block') after.tables.suppressions = 'different';
    if (variant === 'otherOwner')
      after.companies.push({ ...f.c, id: 'other', primary_domain: event.domain });
    assert.equal(compareProtectedSnapshots(f.before, after).ok, false);
    assert.equal(compareProtectedSnapshots(f.before, f.after).ok, true);
  });
}
test('a later forbidden mutation cannot reuse the old legal event', async (t) => {
  const f = await fixture(t);
  f.store.exec(
    'UPDATE companies SET primary_domain=?,version=version+1 WHERE id=?',
    'second.example.test',
    f.c.id,
  );
  assert.equal(compareProtectedSnapshots(f.before, readProtectedSnapshot(f.store.db)).ok, false);
});
test('event insertion error rolls back domain and alias; empty string needs explicit separate permission', async (t) => {
  const f = await fixture(t);
  const c = f.service.findOrCreateCompany('Fixture Other', null).company;
  const source = f.service.saveSource({
    ...(await new FixtureReader().read('https://other.example.test/')),
    final_url: 'https://other.example.test/',
    text: 'Fixture Other. Official identity.',
    fragment: 'Fixture Other.',
    content_hash: 'synthetic-other',
  });
  const input = {
    companyId: c.id,
    expectedVersion: c.version,
    domain: 'other.example.test',
    operationId: 'synthetic-operation',
    companyName: c.canonical_name,
    sourceId: source.id,
    quote: 'Fixture Other.',
    now: f.service.now(),
  };
  const exec = f.store.exec.bind(f.store);
  f.store.exec = (sql, ...args) => {
    if (sql.startsWith('INSERT INTO company_domain_enrichments'))
      throw Error('SYNTHETIC_EVENT_FAILURE');
    return exec(sql, ...args);
  };
  try {
    assert.throws(() => enrichCompanyDomain(f.store, input), /SYNTHETIC_EVENT_FAILURE/);
  } finally {
    f.store.exec = exec;
  }
  assert.equal(
    f.store.one('SELECT primary_domain FROM companies WHERE id=?', c.id)!.primary_domain,
    null,
  );
  assert.equal(
    f.store.one(
      "SELECT count(*) n FROM company_aliases WHERE company_id=? AND kind='DOMAIN'",
      c.id,
    )!.n,
    0,
  );
  f.store.exec("UPDATE companies SET primary_domain='' WHERE id=?", c.id);
  assert.throws(
    () => enrichCompanyDomain(f.store, input),
    (e: any) => e.code === 'DOMAIN_NOT_EMPTY',
  );
  enrichCompanyDomain(f.store, { ...input, allowLegacyEmptyString: true });
  assert.equal(
    f.store.one('SELECT previous_kind FROM company_domain_enrichments WHERE company_id=?', c.id)!
      .previous_kind,
    'EMPTY_STRING',
  );
});
test('snapshot uses one WAL read view while a second synthetic connection commits', async (t) => {
  const f = await fixture(t),
    other = new Database(join(f.dir, 'jobhunter.sqlite'));
  const prepare = f.store.db.prepare.bind(f.store.db);
  let interleaved = false;
  (f.store.db as any).prepare = (sql: string) => {
    if (!interleaved && sql.startsWith('SELECT id,canonical_name')) {
      interleaved = true;
      other
        .prepare('UPDATE companies SET canonical_name=? WHERE id=?')
        .run('Changed by second connection', f.c.id);
    }
    return prepare(sql);
  };
  try {
    const during = readProtectedSnapshot(f.store.db);
    assert.equal(during.companies.find((c) => c.id === f.c.id)!.canonical_name, 'Fixture Company');
  } finally {
    (f.store.db as any).prepare = prepare;
    other.close();
  }
  assert.equal(
    readProtectedSnapshot(f.store.db).companies.find((c) => c.id === f.c.id)!.canonical_name,
    'Changed by second connection',
  );
});

test('draft scope pointer may follow a new immutable version only into the already approved policy scope', async (t) => {
  const f = await fixture(t),
    d = f.service.draftRows()[0];
  f.store.set('autoPolicy', { scopeHash: 'approved-new' });
  f.store.exec('INSERT OR REPLACE INTO auto_draft_scope VALUES (?,?)', d.id, 'previous');
  const before = readProtectedSnapshot(f.store.db);
  f.service.editDraft(d.id, {
    version: d.version,
    subject: d.subject,
    body: d.body + '\nSynthetic scope revision.',
  });
  f.store.exec('UPDATE auto_draft_scope SET scope_hash=? WHERE draft_id=?', 'approved-new', d.id);
  const after = readProtectedSnapshot(f.store.db);
  assert.equal(compareProtectedSnapshots(before, after).ok, true);
  for (const variant of [
    'removed',
    'noNewVersion',
    'regressedVersion',
    'wrongScope',
    'noMatchingRecord',
    'policyChanged',
  ]) {
    const invalid = structuredClone(after),
      scope = invalid.draftScopes.find((r) => r.draft_id === d.id)!;
    if (variant === 'removed') invalid.draftScopes = [];
    if (variant === 'noNewVersion') scope.version = d.version;
    if (variant === 'regressedVersion') scope.version = d.version - 1;
    if (variant === 'wrongScope') scope.scope_hash = 'unapproved';
    if (variant === 'noMatchingRecord') scope.has_version_record = 0;
    if (variant === 'policyChanged') invalid.policyScope = 'unapproved';
    assert.ok(
      compareProtectedSnapshots(before, invalid).codes.includes('DRAFT_SCOPE_CHANGED'),
      variant,
    );
  }
  f.store.exec('UPDATE drafts SET body=? WHERE id=?', 'Unversioned mutation', d.id);
  assert.ok(
    compareProtectedSnapshots(before, readProtectedSnapshot(f.store.db)).codes.includes(
      'DRAFT_SCOPE_CHANGED',
    ),
  );
});
