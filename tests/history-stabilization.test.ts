import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { HistorySync, exportHistory, importHistory } from '../apps/server/src/history-sync.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
function git(dir: string, ...args: string[]) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'jh-handoff-')),
    remote = join(root, 'confirmed.git'),
    repo = join(root, 'a');
  execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore', windowsHide: true });
  execFileSync('git', ['clone', remote, repo], { stdio: 'ignore', windowsHide: true });
  git(repo, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  const store = new Store(join(root, 'data-a')),
    service = new ResearchJobHunter(store, {
      reader: new FixtureReader(),
      runner: new FixtureRunner(),
    }),
    sync = new HistorySync(store);
  const stores = [store];
  t.after(() => {
    for (const s of stores) s.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  sync.configure({
    directory: repo,
    expectedRemote: remote,
    confirmedPrivate: true,
    confirmedInitialHistory: true,
  });
  return { root, remote, repo, store, service, sync, stores };
}
test('history regression: changing origin across fetch never publishes to unapproved repo', async (t) => {
  const f = fixture(t);
  await f.sync.claim();
  const other = join(f.root, 'unconfirmed.git');
  execFileSync('git', ['init', '--bare', other], { stdio: 'ignore', windowsHide: true });
  const internal = f.sync as any,
    network = internal.gitNetwork.bind(f.sync);
  internal.gitNetwork = async (dir: string, args: string[]) => {
    const result = await network(dir, args);
    if (args[0] === 'fetch') git(f.repo, 'remote', 'set-url', 'origin', other);
    return result;
  };
  await assert.rejects(
    () => f.sync.checkpoint(),
    (e: any) => e.code === 'HISTORY_REMOTE_CHANGED',
  );
  assert.equal(git(other, 'for-each-ref', '--format=%(refname)', 'refs/heads/main'), '');
});
test('history regression: changing branch after configuration blocks checkpoint', async (t) => {
  const f = fixture(t);
  await f.sync.claim();
  git(f.repo, 'checkout', '-b', 'unexpected-branch');
  await assert.rejects(
    () => f.sync.checkpoint(),
    (e: any) => e.code === 'HISTORY_BRANCH',
  );
});
test('history: final owner gate revalidates Git and blocks interrupted staging', async (t) => {
  const f = fixture(t);
  await f.sync.claim();
  const inner = f.sync as any,
    gitOriginal = inner.git.bind(f.sync);
  let calls = 0;
  inner.git = (...args: any[]) => {
    calls++;
    return gitOriginal(...args);
  };
  f.sync.assertOwner();
  f.sync.assertOwner();
  assert.ok(calls > 0);
  writeFileSync(join(f.repo, 'history.pending'), 'fictional interrupted');
  assert.throws(
    () => f.sync.assertOwner(),
    (e: any) => e.code === 'HISTORY_DIRTY',
  );
});

test('history: an independently created reverse alias maps to the confirmed local identity', (t) => {
  const f = fixture(t),
    brand = f.service.findOrCreateCompany('Fictional Brand', 'brand.example.test').company;
  f.store.exec(
    "INSERT INTO company_aliases VALUES ('legal',?,'DOMAIN','legal.example.test','2026-10-11T00:00:00.000Z','2026-10-11T00:00:00.000Z')",
    brand.id,
  );
  const other = new Store(join(f.root, 'independent'));
  f.stores.push(other);
  const s = new ResearchJobHunter(other, {
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  s.findOrCreateCompany('Fictional Legal Name', 'legal.example.test');
  importHistory(f.store, exportHistory(other));
  assert.equal(
    f.store.one(
      "SELECT count(*) n FROM companies WHERE primary_domain IN ('brand.example.test','legal.example.test')",
    )!.n,
    1,
  );
});
test('history: effective global origin change is rechecked without changing any real user config', async (t) => {
  const f = fixture(t),
    path = join(f.root, 'synthetic-global.config'),
    old = process.env.GIT_CONFIG_GLOBAL;
  writeFileSync(path, '');
  process.env.GIT_CONFIG_GLOBAL = path;
  try {
    await f.sync.claim();
    writeFileSync(
      path,
      '[remote "origin"]\n url = "' + join(f.root, 'unconfirmed.git').replaceAll('\\', '/') + '"\n',
    );
    assert.throws(
      () => f.sync.assertOwner(),
      (e: any) => e.code === 'HISTORY_REMOTE_CHANGED',
    );
  } finally {
    if (old === undefined) delete process.env.GIT_CONFIG_GLOBAL;
    else process.env.GIT_CONFIG_GLOBAL = old;
  }
});
test('history: changing Git commondir after checkpoint cannot redirect the final owner gate', async (t) => {
  const f = fixture(t);
  await f.sync.claim();
  writeFileSync(join(f.repo, '.git', 'commondir'), join(f.root, 'different.git'));
  assert.throws(
    () => f.sync.assertOwner(),
    (e: any) => e.code === 'HISTORY_PATH_CHANGED',
  );
});
test('history: A→B→A keeps confirmed alias identity, manual blocks and counters without duplicate import', async (t) => {
  const f = fixture(t),
    brand = f.service.findOrCreateCompany('Fictional Brand', 'brand.example.test').company;
  f.store.exec(
    "INSERT INTO company_aliases (id,company_id,kind,value,verified_at,created_at) VALUES ('legal-alias',?,'DOMAIN','legal.example.test','2026-10-11T00:00:00.000Z','2026-10-11T00:00:00.000Z')",
    brand.id,
  );
  const csv =
    'company,status,domain,email,date\nFictional Brand,CONTACTED,brand.example.test,old@brand.example.test,2026-10-01';
  f.service.importHistory(csv, f.service.previewHistory(csv).hash);
  f.store.exec(
    'INSERT INTO shared_attempts VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    'fictional-a-attempt',
    brand.id,
    'hr@brand.example.test',
    'SENT_CONFIRMED',
    '<fictional-a@example.test>',
    'fixture-hash',
    null,
    'Fictional subject',
    'Fictional frozen body',
    '2026-10-11',
    '2026-10-11T10:00:00.000Z',
  );
  f.store.exec(
    'INSERT INTO shared_usage VALUES (?,?,?,?,?)',
    'fictional-a-usage',
    '2026-10-11',
    'FIRST_CONTACT',
    'ACCEPTED',
    '2026-10-11T10:00:00.000Z',
  );
  f.store.exec(
    'INSERT INTO shared_usage VALUES (?,?,?,?,?)',
    'fictional-self-usage',
    '2026-10-11',
    'SELF_TEST',
    'ACCEPTED',
    '2026-10-11T10:01:00.000Z',
  );
  await f.sync.claim();
  await f.sync.checkpoint(true);
  const repoB = join(f.root, 'b');
  execFileSync('git', ['clone', '--branch', 'main', f.remote, repoB], {
    stdio: 'ignore',
    windowsHide: true,
  });
  const storeB = new Store(join(f.root, 'data-b'));
  f.stores.push(storeB);
  const serviceB = new ResearchJobHunter(storeB, {
    reader: new FixtureReader(),
    runner: new FixtureRunner(),
  });
  const legal = serviceB.findOrCreateCompany('Fictional Legal Name', 'legal.example.test').company;
  const syncB = new HistorySync(storeB);
  syncB.configure({ directory: repoB, expectedRemote: f.remote, confirmedPrivate: true });
  await syncB.claim();
  assert.equal(
    storeB.one('SELECT history_status FROM companies WHERE id=?', legal.id)?.history_status,
    'CONTACTED',
  );
  assert.equal(
    storeB.one("SELECT company_id FROM company_aliases WHERE value='brand.example.test'")
      ?.company_id,
    legal.id,
  );
  const csvB =
    'company,status,domain,email,date\nOther Fictional Company,CONTACTED,other.example.test,old@other.example.test,2026-10-02';
  serviceB.importHistory(csvB, serviceB.previewHistory(csvB).hash);
  const otherId = storeB.one(
    "SELECT id FROM companies WHERE primary_domain='other.example.test'",
  )!.id;
  storeB.exec(
    'INSERT INTO shared_attempts VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    'fictional-b-attempt',
    otherId,
    'hr@other.example.test',
    'SENT_PROVIDER',
    '<fictional-b@example.test>',
    'fixture-hash-b',
    null,
    'Fictional B subject',
    'Fictional B frozen body',
    '2026-10-11',
    '2026-10-11T11:00:00.000Z',
  );
  storeB.exec(
    'INSERT INTO shared_usage VALUES (?,?,?,?,?)',
    'fictional-b-usage',
    '2026-10-11',
    'FIRST_CONTACT',
    'ACCEPTED',
    '2026-10-11T11:00:00.000Z',
  );
  await syncB.checkpoint(true);
  await f.sync.claim();
  await f.sync.checkpoint(true);
  assert.equal(
    f.store.one("SELECT count(*) n FROM history_records WHERE status='CONTACTED'")!.n,
    2,
  );
  const once = JSON.stringify(f.store.all('SELECT * FROM history_records ORDER BY id'));
  importHistory(f.store, exportHistory(f.store));
  assert.equal(JSON.stringify(f.store.all('SELECT * FROM history_records ORDER BY id')), once);
  assert.equal(f.store.all('SELECT * FROM shared_attempts').length, 2);
  assert.equal(f.store.one("SELECT count(*) n FROM shared_usage WHERE kind='FIRST_CONTACT'")!.n, 2);
  assert.equal(f.store.one("SELECT count(*) n FROM shared_usage WHERE kind='SELF_TEST'")!.n, 1);
  const exported = readFileSync(join(f.repo, 'history.json'), 'utf8');
  for (const forbidden of ['autoPolicy', 'gmailCredentials', '%PDF', 'candidate_facts', 'mime":'])
    assert.ok(!exported.includes(forbidden));
  assert.equal(
    f.store.one(
      "SELECT count(*) n FROM companies WHERE primary_domain IN ('brand.example.test','legal.example.test')",
    )!.n,
    1,
  );
});
