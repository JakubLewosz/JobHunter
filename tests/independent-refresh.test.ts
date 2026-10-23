import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { runLibraryRefresh } from '../apps/server/src/research/library-refresh-entry.js';
import { ManyReader, ManyRunner } from './auto-fixture.js';
import { DomainError } from '../apps/server/src/util.js';
import { createHash } from 'node:crypto';
import { conditionKeys } from '../apps/server/src/research/contracts.js';
import { hash } from '../apps/server/src/util.js';

async function fixture(t: any, auto = true) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-independent-refresh-'));
  t.after(() => rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  const store = new Store(dir),
    reader = new ManyReader(),
    runner = new ManyRunner();
  const service = new ResearchJobHunter(store, { reader, runner });
  service.approveProfile();
  const cv = service.uploadCV(
    'Synthetic.pdf',
    Buffer.from('%PDF-1.4\nSynthetic\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  for (let n = 1; n <= 6; n++) {
    await service.importURL(`https://fixture${n}.example.test/careers`);
    await service.tick();
  }
  service.control('stop');
  const drafts = service.draftRows().sort((a, b) => a.company_id.localeCompare(b.company_id));
  assert.equal(drafts.length, 6);
  const protectedIds = drafts.slice(0, 3).map((d) => d.id),
    selected = drafts.slice(3);
  const profile = service.profile();
  service.updateProfile({
    name: profile.name,
    goal: profile.goal + ' Aktualne materiały.',
    hours_approx: profile.hours_approx,
    version: profile.version,
    message_template: profile.message_template,
    facts: profile.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  service.approveProfile();
  // Persisted synthetic stopped AUTO installation, narrow pre-existing policy/scope.
  if (auto) {
    store.set('mode', 'AUTO_POLICY');
    store.exec("UPDATE campaigns SET mode='AUTO_POLICY',policy_version=17 WHERE id='research'");
    store.set('autoPolicy', { version: 17, scopeHash: 'synthetic-pilot', draftIds: protectedIds });
    for (const id of protectedIds)
      store.exec('INSERT INTO auto_draft_scope VALUES (?,?)', id, 'synthetic-pilot');
  }
  // Require new generation under current approved facts instead of same-text reuse.
  store.exec(
    "UPDATE research_drafts SET profile_hash='previous-approved-profile' WHERE draft_id IN (SELECT value FROM json_each(?))",
    JSON.stringify(selected.map((d) => d.id)),
  );
  await service.stopWorker();
  store.close();
  writeFileSync(join(dir, 'development.json'), '{}');
  const read = (fn: (db: Database.Database) => any) => {
    const db = new Database(join(dir, 'jobhunter.sqlite'), { readonly: true, fileMustExist: true });
    try {
      return fn(db);
    } finally {
      db.close();
    }
  };
  const protectedSnapshot = () =>
    read((db) =>
      Object.fromEntries(
        [
          'campaigns',
          'candidate_profiles',
          'candidate_facts',
          'cv_assets',
          'auto_draft_scope',
          'auto_run_scope',
          'outbox',
          'send_attempts',
          'usage_ledger',
          'gmail_previews',
          'gmail_outbox',
          'auto_batches',
          'draft_approvals',
        ].map((table) => [table, db.prepare('SELECT * FROM ' + table + ' ORDER BY rowid').all()]),
      ),
    );
  const before = protectedSnapshot();
  return {
    dir,
    reader,
    runner,
    drafts,
    selected,
    protectedIds,
    read,
    before,
    protectedSnapshot,
    options: { dir, minutes: 1, draftIds: selected.map((d) => d.id), fixture: { reader, runner } },
  };
}

test('independent refresh preserves persisted AUTO mode, narrow pilot policy/scopes and mail while generating other old drafts', async (t) => {
  const f = await fixture(t);
  const result = await runLibraryRefresh(f.options);
  assert.equal(result.reason, 'COMPLETED');
  assert.equal(result.results.length, 3);
  assert.ok(result.results.every((r: any) => r.code === 'CHECKED'));
  assert.equal(
    f.read((db) =>
      JSON.parse((db.prepare("SELECT value FROM app_state WHERE key='mode'").get() as any).value),
    ),
    'AUTO_POLICY',
  );
  assert.deepEqual(f.protectedSnapshot(), f.before);
  assert.equal(result.preserved, true);
});

test('A then local rejected B then C completes C and keeps B error/checkpoint without granting PASS', async (t) => {
  const f = await fixture(t, false),
    original = f.runner.run.bind(f.runner);
  let generations = 0;
  f.runner.run = async (prompt, schema, options) => {
    if (prompt.includes('POPRAW ISTNIEJĄCY SZKIC') && ++generations === 2)
      throw new DomainError('INVALID_CLAIM', 'Synthetic local rejection');
    return original(prompt, schema, options);
  };
  const result = await runLibraryRefresh(f.options);
  assert.equal(result.reason, 'COMPLETED');
  assert.equal(result.results.length, 3);
  assert.equal(result.results[0].code, 'CHECKED');
  assert.equal(result.results[1].code, 'INVALID_CLAIM');
  assert.equal(result.results[2].code, 'CHECKED');
  assert.equal(generations, 3);
  assert.equal(
    f.read(
      (db) =>
        (
          db
            .prepare("SELECT count(*) n FROM runs WHERE status='PARTIAL' AND error='INVALID_CLAIM'")
            .get() as any
        ).n,
    ),
    1,
  );
  assert.equal(
    f.read(
      (db) =>
        (
          db
            .prepare(
              "SELECT count(*) n FROM research_items WHERE status='ERROR' AND error='INVALID_CLAIM'",
            )
            .get() as any
        ).n,
    ),
    1,
  );
  assert.deepEqual(f.protectedSnapshot(), f.before);
});

for (const change of [
  'profile',
  'policy',
  'version',
  'foreign-pause',
  'protected-source',
  'owner',
  'stop',
  'provider',
  'unknown',
])
  test(`independent refresh fences ${change} during await and never starts the next ID`, async (t) => {
    const f = await fixture(t),
      controller = new AbortController(),
      original = f.reader.read.bind(f.reader);
    let reads = 0;
    f.reader.read = async (url, signal) => {
      reads++;
      const value = await original(url, signal);
      const db = new Database(join(f.dir, 'jobhunter.sqlite'));
      try {
        if (change === 'profile')
          db.prepare('UPDATE candidate_profiles SET version=version+1').run();
        if (change === 'policy')
          db.prepare(
            "UPDATE campaigns SET policy_version=policy_version+1 WHERE id='research'",
          ).run();
        if (change === 'version')
          db.prepare('UPDATE drafts SET version=version+1 WHERE id=?').run(f.selected[0].id);
        if (change === 'foreign-pause')
          db.prepare(
            "UPDATE runs SET status='PAUSED' WHERE id=(SELECT id FROM runs ORDER BY rowid LIMIT 1)",
          ).run();
        if (change === 'owner') {
          const path = join(f.dir, 'profile.lock', 'owner.json'),
            owner = JSON.parse(readFileSync(path, 'utf8'));
          writeFileSync(path, JSON.stringify({ ...owner, instance: 'foreign-synthetic-owner' }));
        }
      } finally {
        db.close();
      }
      if (change === 'stop') controller.abort();
      if (change === 'provider')
        throw new DomainError('READER_ENVIRONMENT', 'Synthetic provider outage');
      if (change === 'unknown') throw Error('Synthetic unknown failure');
      if (change === 'protected-source') {
        const protectedURL = f.read((db) => {
          const d = db
            .prepare('SELECT opportunity_id FROM drafts WHERE id=?')
            .get(f.protectedIds[0]) as any;
          const item = db
            .prepare('SELECT source_ids FROM research_items WHERE opportunity_id=? LIMIT 1')
            .get(d.opportunity_id) as any;
          return (
            db
              .prepare('SELECT original_url FROM research_sources WHERE id=?')
              .get(JSON.parse(item.source_ids)[0]) as any
          ).original_url;
        });
        value.final_url = protectedURL;
      }
      return value;
    };
    const run = runLibraryRefresh({ ...f.options, signal: controller.signal });
    {
      const result = await run;
      assert.notEqual(result.reason, 'COMPLETED');
      assert.equal(result.results.length, 0);
      if (change === 'owner') {
        assert.equal(result.reason, 'PROFILE_LOCK_LOST');
        assert.equal(result.lockReleased, false);
      }
      if (change === 'foreign-pause')
        assert.equal(
          f.read(
            (db) =>
              (db.prepare("SELECT count(*) n FROM runs WHERE status='PAUSED'").get() as any).n,
          ),
          1,
        );
    }
    assert.equal(reads, 1);
    assert.equal(
      f.read(
        (db) =>
          (db.prepare('SELECT version FROM drafts WHERE id=?').get(f.selected[1].id) as any)
            .version,
      ),
      f.selected[1].version,
    );
    assert.equal(
      f.read((db) => (db.prepare('SELECT count(*) n FROM send_attempts').get() as any).n),
      0,
    );
  });

test('absolute outer deadline caps a block and is never extended', async (t) => {
  const f = await fixture(t),
    deadline = new Date(Date.now() + 80).toISOString();
  f.reader.read = async (_url, signal) => {
    await new Promise<void>((resolve) =>
      signal!.addEventListener('abort', () => resolve(), { once: true }),
    );
    signal!.throwIfAborted();
    throw Error('unreachable');
  };
  const result = await runLibraryRefresh({ ...f.options, deadline });
  assert.equal(result.reason, 'DEADLINE');
  assert.equal(result.deadline, deadline);
  assert.equal(result.results.length, 0);
  assert.deepEqual(f.protectedSnapshot(), f.before);
});

test('explicit protected targets are skipped without touching their sources or text', async (t) => {
  const f = await fixture(t),
    calls = f.reader.calls;
  const result = await runLibraryRefresh({
    ...f.options,
    draftIds: f.protectedIds,
    protectedDraftIds: f.protectedIds,
  });
  assert.equal(result.reason, 'COMPLETED');
  assert.ok(result.results.every((r: any) => r.code === 'PROTECTED_DRAFT'));
  assert.equal(f.reader.calls, calls);
  assert.deepEqual(f.protectedSnapshot(), f.before);
});

for (const change of ['profile', 'version', 'provider', 'unknown'])
  test(`independent refresh rejects late model results after ${change}`, async (t) => {
    const f = await fixture(t),
      original = f.runner.run.bind(f.runner);
    let injected = false;
    const before = f.read(
      (db) => (db.prepare('SELECT count(*) n FROM draft_versions').get() as any).n,
    );
    f.runner.run = async (prompt, schema, options) => {
      const result = await original(prompt, schema, options);
      if (!injected && prompt.includes('Wydobądź firmę')) {
        injected = true;
        const db = new Database(join(f.dir, 'jobhunter.sqlite'));
        try {
          if (change === 'profile')
            db.prepare('UPDATE candidate_profiles SET version=version+1').run();
          if (change === 'version')
            db.prepare('UPDATE drafts SET version=version+1 WHERE id=?').run(f.selected[0].id);
        } finally {
          db.close();
        }
        if (change === 'provider') throw new DomainError('CODEX_LIMIT', 'Synthetic limit');
        if (change === 'unknown') throw Error('Synthetic system error');
      }
      return result;
    };
    const result = await runLibraryRefresh(f.options);
    assert.equal(injected, true);
    assert.notEqual(result.reason, 'COMPLETED');
    assert.equal(result.results.length, 0);
    assert.equal(
      f.read((db) => (db.prepare('SELECT count(*) n FROM draft_versions').get() as any).n),
      before,
    );
    assert.equal(
      f.read(
        (db) =>
          (db.prepare('SELECT version FROM drafts WHERE id=?').get(f.selected[1].id) as any)
            .version,
      ),
      f.selected[1].version,
    );
  });

test('owner lost during semantic review cannot write even error/cleanup rows under the foreign owner', async (t) => {
  const f = await fixture(t),
    original = f.runner.run.bind(f.runner);
  const digest = () =>
    f.read((db) =>
      createHash('sha256')
        .update(
          JSON.stringify(
            (
              db
                .prepare(
                  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
                )
                .all() as any[]
            ).map(({ name }) => [
              name,
              db.prepare('SELECT * FROM "' + name + '" ORDER BY rowid').all(),
            ]),
          ),
        )
        .digest('hex'),
    );
  let atLoss: string | undefined;
  f.runner.run = async (prompt, schema, options) => {
    const result = await original(prompt, schema, options);
    if (prompt.includes('Sprawdź KAŻDE')) {
      const path = join(f.dir, 'profile.lock', 'owner.json'),
        owner = JSON.parse(readFileSync(path, 'utf8'));
      writeFileSync(path, JSON.stringify({ ...owner, instance: 'foreign-synthetic-owner' }));
      atLoss = digest();
    }
    return result;
  };
  const result = await runLibraryRefresh(f.options);
  assert.equal(result.reason, 'PROFILE_LOCK_LOST');
  assert.ok(atLoss);
  assert.equal(digest(), atLoss);
  assert.equal(result.lockReleased, false);
});

test('independent AUTO-library renewal preserves a rejected role and can prepare a separate proved GENERAL company inquiry', async (t) => {
  const f = await fixture(t),
    selected = f.selected[0],
    original = f.runner.run.bind(f.runner);
  f.reader.read = async (url, signal) => {
    signal?.throwIfAborted();
    const n = new URL(url).hostname.match(/fixture(\d+)/)![1];
    const text = `Fixture Company ${n}. Tworzymy aplikacje webowe, automatyzacje i integracje API. Aktualnie poszukujemy Mid PHP. Praca wyłącznie stacjonarna. Pełen etat. Wymagane trzy lata doświadczenia. Kontakt ogólny: biuro@fixture${n}.example.test.`;
    return {
      id: 'new-source-' + n,
      original_url: url,
      final_url: url,
      title: 'Fixture Company ' + n,
      fetched_at: new Date().toISOString(),
      method: 'TEST_FIXTURE',
      status: 'READ',
      http_status: 200,
      text,
      fragment: text,
      content_hash: hash(text + url),
      error: null,
    };
  };
  f.runner.run = async (prompt, schema, options) => {
    const result = await original(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6)),
        sid = sources[0].id;
      const n = new URL(sources[0].url).hostname.match(/fixture(\d+)/)![1];
      const proof = (quote: string) => ({
        sourceId: sid,
        quote,
        explanation: 'Literal synthetic proof.',
      });
      const value: any = result.value;
      value.title = 'Mid PHP';
      value.titleProof = proof('Mid PHP');
      value.type = 'ACTIVE';
      value.typeProof = proof('Aktualnie poszukujemy Mid PHP.');
      value.companyActivities = [
        proof('Tworzymy aplikacje webowe, automatyzacje i integracje API.'),
      ];
      value.inquiryBasis = value.companyActivities[0];
      value.requirements = [
        {
          text: 'Trzy lata doświadczenia',
          sourceId: sid,
          quote: 'Wymagane trzy lata doświadczenia.',
        },
      ];
      value.conditions = Object.fromEntries(
        conditionKeys.map((k) => [
          k,
          { value: 'unknown', sourceId: null, quote: null, explanation: 'Nieustalone.' },
        ]),
      );
      value.conditions.active = {
        value: 'yes',
        scope: 'OFFER',
        ...proof('Aktualnie poszukujemy Mid PHP.'),
      };
      value.conditions.remote = {
        value: 'no',
        scope: 'OFFER',
        ...proof('Praca wyłącznie stacjonarna.'),
      };
      value.conditions.partTime = { value: 'no', scope: 'OFFER', ...proof('Pełen etat.') };
      value.conditions.junior = {
        value: 'no',
        scope: 'OFFER',
        ...proof('Wymagane trzy lata doświadczenia.'),
      };
      value.contact = {
        email: `biuro@fixture${n}.example.test`,
        kind: 'GENERAL',
        proof: proof(`Kontakt ogólny: biuro@fixture${n}.example.test.`),
      };
      result.value = schema.parse(value);
    }
    return result;
  };
  const result = await runLibraryRefresh({ ...f.options, draftIds: [selected.id] });
  assert.equal(result.reason, 'COMPLETED');
  const details = f.read((db) => {
    const item = db
      .prepare('SELECT * FROM research_items WHERE run_id=?')
      .get(result.results[0].runId) as any;
    return {
      stage: item?.stage,
      error: item?.error,
      analysis: item?.analysis,
      state: db
        .prepare('SELECT key,value FROM app_state WHERE key IN (?,?)')
        .all('researchContactIntent:' + item?.id, 'draftDisposition:' + item?.id),
    };
  });
  assert.equal(result.results[0].code, 'CHECKED', JSON.stringify(details));
  const current = f.read((db) =>
    db
      .prepare('SELECT d.*,t.kind FROM drafts d JOIN contacts t ON t.id=d.contact_id WHERE d.id=?')
      .get(selected.id),
  ) as any;
  assert.ok(current.version > selected.version);
  assert.equal(current.kind, 'GENERAL');
  assert.ok(current.body.includes('automatyzacje i integracje API'));
  assert.ok(!current.body.includes('ofertę Junior'));
  assert.equal(
    f.read(
      (db) =>
        (db.prepare("SELECT count(*) n FROM opportunities WHERE decision='REJECTED'").get() as any)
          .n,
    ),
    1,
  );
  assert.deepEqual(f.protectedSnapshot(), f.before);
  assert.equal(result.preserved, true);
});
