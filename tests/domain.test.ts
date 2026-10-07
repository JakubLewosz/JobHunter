import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { JobHunter } from '../apps/server/src/service.js';
import { fixtures, qualify } from '../apps/server/src/providers.js';
import { csvCell, day, inWindow } from '../apps/server/src/util.js';

function setup(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'jobhunter-domain-'));
  const store = new Store(dir);
  let clock = new Date('2026-10-07T09:00:00Z');
  const service = new JobHunter(store, { clock: () => clock });
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return {
    dir,
    store,
    service,
    setClock: (v: string) => {
      clock = new Date(v);
    },
  };
}
async function prepared(t: TestContext) {
  const f = setup(t);
  f.service.approveProfile();
  await f.service.start();
  await f.service.tick();
  return f;
}
function approve(service: JobHunter, amount = 1) {
  const drafts = service
    .draftRows()
    .filter((d) => d.status === 'NEEDS_REVIEW')
    .slice(0, amount);
  service.approveBatch(drafts.map((d) => ({ id: d.id, version: d.version })));
  return drafts;
}

test('profil początkowy jest DRAFT; brak zatwierdzenia blokuje start', async (t) => {
  const { service } = setup(t);
  assert.equal(service.profile().approved_at, null);
  await assert.rejects(() => service.start(), /zatwierdź profil/);
  assert.equal(service.draftRows().length, 0);
});
test('pełny proces przez SQLite: firmy, dowody, szkice, wysyłka, odpowiedź, raport', async (t) => {
  const { service, store } = await prepared(t);
  assert.equal(service.companies().filter((c) => c.opportunity_id).length, 11);
  assert.equal(service.draftRows().length, 5);
  const d = service.dashboard();
  assert.equal(d.stats.duplicates, 1);
  assert.equal(d.stats.rejected, 2);
  assert.equal(d.stats.qualified, 5);
  assert.equal(d.stats.sent, 0);
  approve(service);
  await service.tick();
  assert.equal(service.dashboard().stats.sent, 1);
  assert.equal(service.replies().length, 1);
  const reply = service.replies()[0];
  service.reviewReply(reply.id, 'INTERESTED');
  assert.equal(service.dashboard().stats.interested, 1);
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 1);
  assert.match(service.report('md'), /SYMULACJA/);
  assert.match(service.report('md'), /https:\/\/.+example.invalid/);
});
test('ponowne wyszukanie nie tworzy nowych firm ani szkiców', async (t) => {
  const { service } = await prepared(t);
  await service.start();
  await service.tick();
  assert.equal(service.draftRows().length, 5);
  assert.equal(service.dashboard().stats.companies, 11);
  assert.equal(service.dashboard().stats.duplicates, 13);
});
test('unknown, conflicting, archiwum i kontakt ogólny prowadzą do review', () => {
  for (const key of ['pixel', 'north', 'old', 'general'])
    assert.equal(qualify(fixtures.find((r) => r.key === key)!).decision, 'NEEDS_REVIEW');
});
test('senior onsite i bezpłatne praktyki są odrzucone', () => {
  for (const key of ['meridian', 'campus'])
    assert.equal(qualify(fixtures.find((r) => r.key === key)!).decision, 'REJECTED');
});
test('otwarta kandydatura nie udaje aktywnego wakatu', () => {
  assert.equal(qualify(fixtures.find((r) => r.key === 'flowbyte')!).decision, 'READY_OPEN_INQUIRY');
});
test('Fingoweb jest zablokowany; sugestie historii nie udają wysyłek', (t) => {
  const { service, store } = setup(t);
  const f = service.companies().find((c) => c.canonical_name === 'Fingoweb')!;
  assert.equal(f.suppression_reason, 'RECRUITMENT_ON_HOLD');
  assert.ok(store.one('SELECT id FROM suppressions WHERE company_id=?', f.id));
  assert.equal(
    service.companies().find((c) => c.canonical_name === 'Iyuno')!.history_status,
    'HISTORY_TO_VERIFY',
  );
  assert.equal(service.dashboard().stats.sent, 0);
});
test('alias domeny scala firmę; wspólny ATS/Gmail nie scala różnych firm', (t) => {
  const { service } = setup(t);
  const a = service.findOrCreateCompany('A', 'a.example.invalid');
  assert.equal(
    service.findOrCreateCompany('A sp. z o.o.', 'a.example.invalid').company.id,
    a.company.id,
  );
  assert.notEqual(
    service.findOrCreateCompany('B', 'gmail.com').company.id,
    service.findOrCreateCompany('C', 'gmail.com').company.id,
  );
  assert.notEqual(
    service.findOrCreateCompany('D', 'greenhouse.io').company.id,
    service.findOrCreateCompany('E', 'greenhouse.io').company.id,
  );
});
test('nieistniejące fact ID i evidence ID nie przechodzą walidacji', async (t) => {
  const { service } = await prepared(t);
  const d = service.draftRows()[0];
  const base = {
    subject: d.subject,
    body: d.body,
    factIds: JSON.parse(d.fact_ids),
    evidenceIds: JSON.parse(d.evidence_ids),
  };
  assert.throws(() => service.validateDraft({ ...base, factIds: ['fake'] }, d.company_id));
  assert.throws(() => service.validateDraft({ ...base, evidenceIds: ['fake'] }, d.company_id));
  const other = service.draftRows()[1];
  assert.throws(() =>
    service.validateDraft({ ...base, evidenceIds: JSON.parse(other.evidence_ids) }, d.company_id),
  );
});
test('model nie może nadać sobie zgody, zmienić odbiorcy ani przemycić polecenia', async (t) => {
  const { service } = await prepared(t);
  const d = service.draftRows()[0];
  const base = {
    subject: d.subject,
    body: d.body,
    factIds: JSON.parse(d.fact_ids),
    evidenceIds: JSON.parse(d.evidence_ids),
  };
  assert.throws(() => service.validateDraft({ ...base, approved: true }, d.company_id));
  assert.throws(() =>
    service.validateDraft({ ...base, recipient: 'evil@example.com' }, d.company_id),
  );
  assert.throws(() =>
    service.validateDraft({ ...base, shell: 'cat ~/.codex/auth.json' }, d.company_id),
  );
});
test('niepoprawny JSON/za długi tekst/CRLF i zmyślone doświadczenie są odrzucane', async (t) => {
  const { service } = await prepared(t);
  const d = service.draftRows()[0];
  const base = {
    subject: d.subject,
    body: d.body,
    factIds: JSON.parse(d.fact_ids),
    evidenceIds: JSON.parse(d.evidence_ids),
  };
  assert.throws(() => service.validateDraft('{', d.company_id));
  assert.throws(() => service.validateDraft({ ...base, body: 'a'.repeat(5001) }, d.company_id));
  assert.throws(() => service.validateDraft({ ...base, subject: 'x\r\nBcc: evil' }, d.company_id));
  assert.throws(() =>
    service.validateDraft(
      { ...base, body: d.body + ' Mam 5 lat doświadczenia komercyjnego.' },
      d.company_id,
    ),
  );
});
test('zgoda na nieaktualną wersję i duplikat w paczce są odrzucane atomowo', async (t) => {
  const { service, store } = await prepared(t);
  const d = service.draftRows()[0];
  assert.throws(() => service.approveBatch([{ id: d.id, version: 99 }]));
  assert.throws(() =>
    service.approveBatch([
      { id: d.id, version: 1 },
      { id: d.id, version: 1 },
    ]),
  );
  assert.equal(store.one('SELECT count(*) n FROM draft_approvals')!.n, 0);
});
test('bez zgody nie ma wysyłki', async (t) => {
  const { service, store } = await prepared(t);
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});
test('wygasła zgoda blokuje dispatcher', async (t) => {
  const { service, setClock, store } = await prepared(t);
  approve(service);
  setClock('2026-10-07T10:01:00Z');
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.equal(service.outboxRows()[0].status, 'BLOCKED');
});
test('edycja tekstu tworzy wersję i unieważnia oczekującą zgodę', async (t) => {
  const { service, store } = await prepared(t);
  const [d] = approve(service);
  service.editDraft(d.id, {
    version: d.version,
    subject: d.subject,
    body: d.body + ' Dziękuję za poświęcony czas.',
  });
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.equal(store.all('SELECT * FROM draft_versions WHERE draft_id=?', d.id).length, 2);
  assert.equal(service.outboxRows()[0].status, 'CANCELLED');
});
test('zmiana recipienta/profilu/konta/polityki unieważnia binding', async (t) => {
  const { service, store } = await prepared(t);
  const [d] = approve(service);
  const a = store.one('SELECT * FROM draft_approvals WHERE draft_id=?', d.id)!;
  assert.deepEqual(service.policy(d, a, true), []);
  store.exec(
    'UPDATE contacts SET email=? WHERE id=?',
    'other@aurora.example.invalid',
    d.contact_id,
  );
  assert.ok(service.policy(d, a, true).includes('APPROVAL_CHANGED'));
  store.exec("UPDATE candidate_profiles SET profile_hash='changed'");
  assert.ok(service.policy(d, a, true).includes('APPROVAL_CHANGED'));
  store.exec("UPDATE campaigns SET account_email='new@demo.example.invalid',policy_version=2");
  assert.ok(service.policy(d, a, true).includes('APPROVAL_CHANGED'));
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});
test('zmiana profilu nie przenosi starej zgody i nie produkuje fałszywych szkiców', async (t) => {
  const { service } = await prepared(t);
  approve(service);
  const p = service.profile();
  service.updateProfile({
    name: p.name,
    goal: p.goal,
    hours_min: 10,
    hours_max: 12,
    version: p.version,
    facts: p.facts.map((f) => ({ id: f.id, content: f.content })),
  });
  assert.equal(service.profile().approved_at, null);
  assert.equal(service.outboxRows()[0].status, 'CANCELLED');
  service.approveProfile();
  assert.equal(
    service.policy(service.draftRows()[0], undefined, true).includes('INVALID_DRAFT'),
    true,
  );
});
test('CV jest kopią niezmienną i zmiana CV unieważnia zgody', async (t) => {
  const { service, store, dir } = await prepared(t);
  const bytes = Buffer.from('%PDF-1.4\nDemo CV\n%%EOF');
  const cv = service.uploadCV('CV.pdf', bytes.toString('base64'));
  assert.throws(
    () => service.approveBatch([{ id: service.draftRows()[0].id, version: 1 }]),
    /CV_NOT_APPROVED/,
  );
  service.approveCV(cv.id);
  approve(service);
  writeFileSync(join(dir, 'original.pdf'), 'changed original');
  assert.deepEqual(service.cvBytes(cv.id).bytes, bytes);
  writeFileSync(join(dir, 'cv', cv.stored_name), 'replaced');
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  assert.match(service.outboxRows()[0].reason, /CV_CHANGED/);
});
test('podmiana wybranego CV anuluje wcześniejszą zgodę', async (t) => {
  const { service } = await prepared(t);
  const a = service.uploadCV('A.pdf', Buffer.from('%PDF-1.4\na').toString('base64'));
  service.approveCV(a.id);
  approve(service);
  service.uploadCV('B.pdf', Buffer.from('%PDF-1.4\nb').toString('base64'));
  assert.equal(service.outboxRows()[0].status, 'CANCELLED');
});
test('nie-PDF i zbyt duży PDF są odrzucane', (t) => {
  const { service } = setup(t);
  assert.throws(() => service.uploadCV('fake.pdf', Buffer.from('not pdf').toString('base64')));
  assert.throws(() =>
    service.uploadCV(
      'large.pdf',
      Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(5 * 1024 * 1024)]).toString('base64'),
    ),
  );
});
test('pauza, stop i kill switch są sprawdzane przed wysyłką', async (t) => {
  const { service, store } = await prepared(t);
  approve(service);
  service.control('pause');
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  await service.start();
  service.control('emergency-stop');
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
  service.control('stop');
  assert.equal(service.state().stopped, true);
  assert.equal(service.outboxRows()[0].status, 'CANCELLED');
});
test('nowa odmowa przed dispatch blokuje pierwszą wiadomość', async (t) => {
  const { service, store } = await prepared(t);
  const [d] = approve(service);
  service.suppress(d.company_id, 'REJECTED', 'Test odmowy');
  await service.tick();
  assert.equal(service.outboxRows()[0].status, 'BLOCKED');
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 0);
});
test('dwa wywołania workera nie przekraczają kwoty ani nie dublują kontaktu', async (t) => {
  const { service, store } = await prepared(t);
  approve(service, 5);
  await Promise.all([service.tick(), service.tick()]);
  await service.tick();
  await service.tick();
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 3);
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 3);
  assert.equal(service.outboxRows().filter((o) => o.status === 'QUEUED').length, 2);
  assert.equal(service.state().status, 'CYCLE_LIMIT');
});
test('nowy cykl obsługuje oczekującą kolejkę w ramach nowej kwoty cyklu', async (t) => {
  const { service, store } = await prepared(t);
  approve(service, 5);
  await service.tick();
  await service.tick();
  await service.tick();
  await service.tick();
  await service.start();
  await service.tick();
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 5);
  assert.equal(service.outboxRows().filter((o) => o.status === 'QUEUED').length, 0);
});
test('limit dnia liczy rezerwacje i timeout; restart nie resetuje licznika', async (t) => {
  const { service, store } = await prepared(t);
  service.updateCampaign({
    daily_limit: 1,
    cycle_limit: 1,
    campaign_limit: 10,
    interval_minutes: 60,
    duration_minutes: 20,
    max_candidates: 20,
    window_start: '08:00',
    window_end: '16:00',
    schedule_enabled: false,
  });
  approve(service, 2);
  await service.tick();
  await service.start();
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
  new JobHunter(store, { clock: service.clock });
  assert.equal(service.dashboard().stats.reserved, 1);
});
test('timeout po przyjęciu: SEND_UNKNOWN, jedna próba, reconcile bez kolejnego send', async (t) => {
  const { service, store } = await prepared(t);
  store.set('scenario', 'TIMEOUT_AFTER_SEND');
  approve(service);
  await service.tick();
  const o = service.outboxRows()[0];
  assert.equal(o.status, 'SEND_UNKNOWN');
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
  assert.equal(service.state().killSwitch, true);
  assert.throws(() => service.control('resume-sender'));
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
  assert.equal((await service.reconcile(o.id)).confirmed, true);
  assert.equal(service.outboxRows()[0].status, 'SENT_CONFIRMED');
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
  assert.equal(service.dashboard().stats.reserved, 1);
  service.control('resume-sender');
});
test('restart w SENDING zmienia stan na SEND_UNKNOWN bez ponowienia', async (t) => {
  const { service, store } = await prepared(t);
  approve(service);
  await service.tick();
  const o = service.outboxRows()[0];
  store.exec("UPDATE outbox SET status='SENDING' WHERE id=?", o.id);
  const resumed = new JobHunter(store, { clock: service.clock });
  assert.equal(resumed.outboxRows()[0].status, 'SEND_UNKNOWN');
  assert.equal(resumed.state().killSwitch, true);
  await resumed.tick();
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
});
test('brak wyniku reconcile nie uruchamia ślepego retry', async (t) => {
  const { service, store } = await prepared(t);
  approve(service);
  await service.tick();
  const o = service.outboxRows()[0];
  store.exec("UPDATE outbox SET status='SEND_UNKNOWN' WHERE id=?", o.id);
  store.exec('DELETE FROM mock_deliveries');
  assert.equal((await service.reconcile(o.id)).confirmed, false);
  assert.equal(service.outboxRows()[0].status, 'SEND_UNKNOWN');
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 1);
});
test('sukces dostawcy bez Wysłanych nie jest potwierdzeniem ani doręczeniem', async (t) => {
  const { service, store } = await prepared(t);
  store.set('scenario', 'PROVIDER_ONLY');
  approve(service);
  await service.tick();
  assert.equal(service.outboxRows()[0].status, 'SENT_PROVIDER');
  assert.equal(service.replies().length, 0);
  await service.reconcile(service.outboxRows()[0].id);
  assert.equal(service.replies().length, 1);
});
test('pierwszy kontakt z firmą nie może trafić do kolejki drugi raz', async (t) => {
  const { service, store } = await prepared(t);
  const [d] = approve(service);
  assert.throws(() => service.approveBatch([{ id: d.id, version: d.version }]), /już jest/);
  await service.tick();
  assert.throws(() => service.approveBatch([{ id: d.id, version: d.version }]));
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
});
test('frozen MIME zawiera tylko jednego odbiorcę i nie zmienia się po send', async (t) => {
  const { service, store } = await prepared(t);
  const [d] = approve(service);
  await service.tick();
  const a = store.one('SELECT * FROM send_attempts')!;
  const mime = (a.mime as Buffer).toString();
  assert.match(mime, /Message-ID:\s+<.+@jobhunter\.example\.invalid>/);
  assert.equal((mime.match(/^To:/gm) ?? []).length, 1);
  assert.ok(!/^Bcc:|^Cc:/m.test(mime));
  assert.throws(() =>
    service.editDraft(d.id, { version: 1, subject: d.subject, body: d.body + ' zmiana' }),
  );
  assert.deepEqual(store.one('SELECT mime FROM send_attempts')!.mime, a.mime);
});
test('autoresponder nie zwiększa zainteresowania; korekta jest zapisywana', async (t) => {
  const { service } = await prepared(t);
  const d = service.draftRows().find((d) => d.canonical_name === 'Vector Labs')!;
  service.approveBatch([{ id: d.id, version: 1 }]);
  await service.tick();
  const r = service.replies()[0];
  assert.equal(r.category, 'AUTORESPONDER');
  service.reviewReply(r.id, 'AUTORESPONDER');
  assert.equal(service.dashboard().stats.interested, 0);
  service.reviewReply(r.id, 'INTERESTED');
  assert.equal(service.dashboard().stats.interested, 1);
});
test('historia CSV: preview, duplikaty, sugestie i idempotentny import', (t) => {
  const { service } = setup(t);
  const csv =
    'company,status,domain,email\nTest Firma,SUGGESTED,test.example.invalid,hr@test.example.invalid\nTest Firma,SUGGESTED,test.example.invalid,hr@test.example.invalid';
  const preview = service.previewHistory(csv);
  assert.equal(preview.rows[1].duplicate, true);
  assert.equal(service.importHistory(csv, preview.hash).imported, 2);
  assert.equal(service.importHistory(csv, preview.hash).imported, 0);
  assert.equal(
    service.companies().find((c) => c.canonical_name === 'Test Firma')!.history_status,
    'HISTORY_TO_VERIFY',
  );
  assert.throws(() => service.importHistory(csv + '\n', 'x'.repeat(64)));
});
test('historia CSV nie akceptuje danych live w bazie demo', (t) => {
  const { service } = setup(t);
  const csv = 'company,status,email\nTest,CONTACTED,hr@real-company.pl';
  assert.equal(service.previewHistory(csv).rows[0].valid, false);
  assert.throws(() => service.importHistory(csv, service.previewHistory(csv).hash));
});
test('CSV zabezpiecza formuły i cytuje cudzysłowy', () => {
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  for (const value of ['+SUM(A1)', '-1+2', '@test', '  =cmd'])
    assert.ok(csvCell(value).startsWith('"\''));
});
test('Europe/Warsaw: północ i DST liczone według strefy', () => {
  assert.equal(day(new Date('2026-10-06T22:30:00Z')), '2026-10-07');
  assert.equal(day(new Date('2026-10-25T00:30:00Z')), '2026-10-25');
  assert.equal(day(new Date('2026-10-25T01:30:00Z')), '2026-10-25');
  assert.equal(inWindow(new Date('2026-10-07T07:00:00Z'), '08:00', '16:00'), true);
  assert.equal(inWindow(new Date('2026-10-10T07:00:00Z'), '08:00', '16:00'), false);
});
test('po uśpieniu tylko jeden zaległy cykl; po trzech pustych cyklach stop', async (t) => {
  const { service, setClock, store } = await prepared(t);
  const c = service.campaign();
  service.updateCampaign({
    daily_limit: c.daily_limit,
    cycle_limit: c.cycle_limit,
    campaign_limit: c.campaign_limit,
    interval_minutes: 60,
    duration_minutes: 20,
    max_candidates: 20,
    window_start: '08:00',
    window_end: '16:00',
    schedule_enabled: true,
  });
  setClock('2026-10-07T13:00:00Z');
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM runs')!.n, 2);
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM runs')!.n, 2);
  await service.start();
  await service.tick();
  await service.start();
  await service.tick();
  assert.equal(service.state().status, 'NO_NEW_CANDIDATES');
  assert.equal(service.state().nextCycle, null);
});
test('stop i blokady pozostają po ponownym otwarciu SQLite', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'jobhunter-restart-'));
  const first = new Store(dir);
  const a = new JobHunter(first);
  a.approveProfile();
  await a.start();
  a.control('emergency-stop');
  a.control('stop');
  first.close();
  const second = new Store(dir);
  t.after(() => {
    second.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const b = new JobHunter(second);
  assert.equal(b.state().stopped, true);
  assert.equal(b.state().killSwitch, true);
  assert.equal(
    b.companies().find((c) => c.canonical_name === 'Fingoweb')!.suppression_reason,
    'RECRUITMENT_ON_HOLD',
  );
});
test('trzy kolejne trwałe zwroty blokują sender i firmy', async (t) => {
  const { service, store } = await prepared(t);
  store.set('scenario', 'BOUNCE_REPLY');
  approve(service, 3);
  await service.tick();
  await service.tick();
  await service.tick();
  assert.equal(service.replies().length, 3);
  assert.ok(service.replies().every((r) => r.category === 'BOUNCE'));
  assert.equal(service.state().killSwitch, true);
  assert.equal(store.one("SELECT count(*) n FROM suppressions WHERE reason='BOUNCE'")!.n, 3);
});
test('historia zachowuje adres, datę i źródło; dawny kontakt blokuje ten adres', async (t) => {
  const { service, store } = await prepared(t);
  const d = service.draftRows()[0];
  const csv = `company,status,email,date\nInna nazwa historii,CONTACTED,${d.email},2026-10-06`;
  service.importHistory(csv, service.previewHistory(csv).hash);
  const record = store.one('SELECT * FROM history_records')!;
  assert.equal(record.email, d.email);
  assert.equal(record.occurred_at, '2026-10-06T00:00:00.000Z');
  assert.ok(service.policy(d, undefined, true).includes('RECIPIENT_HISTORY'));
});
test('kwota zmienia dzień według Warszawy; stary zapis nie jest zerowany', async (t) => {
  const { service, store, setClock } = setup(t);
  setClock('2026-10-07T21:50:00Z');
  service.approveProfile();
  await service.start();
  await service.tick();
  service.updateCampaign({
    daily_limit: 1,
    cycle_limit: 1,
    campaign_limit: 10,
    interval_minutes: 60,
    duration_minutes: 20,
    max_candidates: 20,
    window_start: '08:00',
    window_end: '16:00',
    schedule_enabled: false,
  });
  approve(service, 2);
  await service.tick();
  assert.equal(service.dashboard().stats.reserved, 1);
  setClock('2026-10-07T22:10:00Z');
  await service.start();
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM usage_ledger')!.n, 2);
  assert.deepEqual(
    store.all('SELECT day FROM usage_ledger ORDER BY created_at').map((r) => r.day),
    ['2026-10-07', '2026-10-08'],
  );
  assert.equal(service.dashboard().stats.reserved, 1);
});
test('baza działa w ścieżce ze spacjami i polskimi znakami na bieżącym OS', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'JobHunter próba z odstępami ąę-'));
  const store = new Store(dir);
  t.after(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const service = new JobHunter(store);
  assert.equal(service.profile().name, 'Jakub Lewosz');
});
test('jednoznaczny błąd przed send wymaga nowej zgody i zachowuje próbę', async (t) => {
  const { service, store } = await prepared(t);
  store.set('scenario', 'FAIL_BEFORE_SEND');
  const [d] = approve(service);
  await service.tick();
  assert.equal(service.outboxRows()[0].status, 'FAILED_NOT_SENT');
  assert.equal(service.draftRows().find((x) => x.id === d.id)!.status, 'NEEDS_REVIEW');
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 0);
  store.set('scenario', 'NORMAL');
  service.approveBatch([{ id: d.id, version: d.version }]);
  await service.tick();
  assert.equal(store.one('SELECT count(*) n FROM mock_deliveries')!.n, 1);
  assert.equal(store.one('SELECT count(*) n FROM send_attempts')!.n, 2);
});
