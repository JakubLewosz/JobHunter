import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { DomainError } from '../apps/server/src/util.js';
import { exportHistory, importHistory } from '../apps/server/src/history-sync.js';
import { Store } from '../apps/server/src/db.js';
import { join } from 'node:path';

for (const local of [false, true])
  for (const seed of [17, 41, 93])
    test(`AUTO ${local ? 'LOCAL_ONLY' : 'PRIVATE_GIT'} logical 24h soak, seed ${seed}`, async (t) => {
      const f = await setup(t, false, true, false, local);
      // Model/HTTP/ownership are controlled adapters. Separate tests exercise real local Git handoff.
      let random = seed;
      const next = () => {
        random = (random * 1664525 + 1013904223) >>> 0;
        return random;
      };
      let service = f.service,
        searchCalls = 0,
        owned = true;
      const fixtureOwner = (s: AutoPolicyJobHunter) => {
        if (local) {
          for (const key of ['assertOwner', 'claim', 'checkpoint', 'status'] as const)
            (s.historySync as any)[key] = () => {
              throw new Error('UNEXPECTED_HISTORY_GIT');
            };
          return;
        }
        s.historySync.assertOwner = () => {
          if (!owned) throw new DomainError('HISTORY_OWNED', 'Fixture owner revoked');
        };
        s.historySync.claim = async () => {
          owned = true;
        };
        s.historySync.checkpoint = async (release = false) => {
          if (release) owned = false;
        };
      };
      fixtureOwner(service);
      const read = f.reader.read.bind(f.reader);
      f.reader.read = async (url, signal) => {
        const source = await read(url, signal);
        source.fetched_at = f.options.clock().toISOString();
        if (Number(new URL(url).hostname.match(/fixture(\d+)/)?.[1]) % 7 === 0) {
          source.status = 'FETCH_FAILED';
          source.error = 'Fixture unavailable';
        }
        return source;
      };
      f.options.search!.search = async () => {
        searchCalls++;
        const n = searchCalls * 3;
        return {
          urls: [1, n, n + 1, n + 2].map((i) => ({
            url: `https://fixture${i}.example.test/careers?utm_source=${next()}`,
            contactUrl: null,
          })),
          queries: ['fictional direction'],
        };
      };
      const scan = f.gateway.scan.bind(f.gateway);
      let transient = false;
      f.gateway.scan = async (q, page) => {
        if (transient) {
          transient = false;
          throw new DomainError('GMAIL_READ', 'Fixture transient read');
        }
        await scan(q, page);
      };
      await service.startAuto();
      const start = f.options.clock().getTime();
      let revoked = false,
        pauses = 0,
        restarts = 0;
      for (let step = 0; step < 96; step++) {
        f.advance(15 * 60000);
        if (step === 8) {
          service.control('pause');
          revoked = true;
          pauses++;
        }
        if (step === 10) {
          await service.startAuto();
          revoked = false;
        }
        if (step === 16) {
          service.control('stop');
          revoked = true;
        }
        if (step === 18) {
          service = new AutoPolicyJobHunter(f.store, f.options);
          fixtureOwner(service);
          restarts++;
          assert.equal(service.state().stopped, true);
          await service.startAuto();
          revoked = false;
        }
        if (step === 24 || step === 44) transient = true;
        if (step === 35) {
          const d = service.draftRows().find((d) => d.status !== 'SENT');
          if (d)
            f.store.exec(
              'UPDATE research_drafts SET semantic_review=? WHERE draft_id=?',
              JSON.stringify({ supported: null, issues: ['Fixture uncertainty'] }),
              d.id,
            );
        }
        if (step === 48) {
          f.advance(6 * 3600000);
        } // wake-up never catches up in a burst
        const before = f.gateway.posts.length;
        await service.tick();
        await Promise.all([service.dispatchOne(), service.dispatchOne()]);
        assert.ok(f.gateway.posts.length - before <= 1, 'at most one operation per wake/tick');
        if (revoked) assert.equal(f.gateway.posts.length, before, 'zero POST after revocation');
        assert.ok(service.dashboard().state.auto.queueSize <= 3, 'bounded queue');
        const recipients = f.gateway.posts.map((p) => p.recipient);
        assert.equal(new Set(recipients).size, recipients.length, 'one first contact per company');
        const reservations = f.store.all(
          'SELECT outbox_id,count(*) n FROM send_attempts GROUP BY outbox_id',
        );
        assert.ok(reservations.every((r) => r.n === 1));
      }
      assert.ok(searchCalls > 8, 'continues past initial directions');
      assert.ok(f.options.clock().getTime() - start >= 24 * 3600000);
      assert.equal(pauses, 1);
      assert.equal(restarts, 1);
      assert.ok(
        f.store.all('SELECT DISTINCT day FROM usage_ledger').length >= 2,
        'Warsaw day rollover',
      );
      assert.ok(f.gateway.posts.length > 5, 'no hidden mail/session limit');
      service.control('stop');
      const snapshot = exportHistory(f.store);
      const other = new Store(join(f.root, 'soak-b'));
      f.extraStores.push(other);
      importHistory(other, snapshot);
      importHistory(other, snapshot);
      assert.equal(other.all('SELECT * FROM shared_attempts').length, snapshot.attempts.length);
      assert.equal(other.all('SELECT * FROM shared_usage').length, snapshot.usage.length);
      await service.startAuto();
      f.advance(3600000);
      await service.tick();
      f.gateway.timeout = true;
      f.advance();
      await service.dispatchOne();
      const uncertain = f.store.one("SELECT id FROM outbox WHERE status='SEND_UNKNOWN'");
      assert.ok(uncertain);
      const posts = f.gateway.posts.length;
      f.advance(86400000);
      await service.dispatchOne();
      assert.equal(f.gateway.posts.length, posts);
      assert.equal(
        f.store.one('SELECT status FROM outbox WHERE id=?', uncertain.id)?.status,
        'SEND_UNKNOWN',
      );
      service.control('stop');
      await service.stopWorker();
    });
