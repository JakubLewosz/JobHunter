import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { DomainError } from '../apps/server/src/util.js';

function holdReview(f: Awaited<ReturnType<typeof setup>>, number = 1, ignoreAbort = false) {
  const entered = Promise.withResolvers<void>(),
    answer = Promise.withResolvers<void>();
  let signal: AbortSignal | undefined;
  let calls = 0;
  const run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const held = prompt.includes('Sprawdź KAŻDE') && ++calls === number;
    if (held) signal = options?.signal;
    return run(prompt, schema, held && ignoreAbort ? { ...options, signal: undefined } : options);
  };
  f.runner.beforeCall = async (prompt) => {
    if (prompt.includes('Sprawdź KAŻDE') && calls === number) {
      entered.resolve();
      await answer.promise;
    }
  };
  return { entered: entered.promise, release: () => answer.resolve(), signal: () => signal };
}

test('AUTO LOCAL_ONLY: sender defers RUNNING review without revocation; same verified version sends once', async (t) => {
  const f = await setup(t, true, false, false, true),
    review = holdReview(f);
  await f.service.startAuto();
  const research = f.service.tick();
  try {
    await review.entered;
    const d = f.service.draftRows()[0];
    assert.equal(
      f.store.one('SELECT review_status FROM research_draft_materials')?.review_status,
      'RUNNING',
    );
    assert.ok(f.store.one('SELECT draft_id FROM auto_draft_scope WHERE draft_id=?', d.id));
    f.advance();
    await f.service.dispatchOne();
    assert.deepEqual(
      {
        session: f.service.dashboard().state.auto.session.status,
        paused: f.service.state().paused,
        reviewAborted: review.signal()?.aborted,
        skipped: f.store.all('SELECT * FROM auto_skips').length,
        versionSkipped: f.store.get(`autoSkipped:${d.id}:${d.version}`, false),
        posts: f.gateway.posts.length,
      },
      {
        session: 'RUNNING',
        paused: false,
        reviewAborted: false,
        skipped: 0,
        versionSkipped: false,
        posts: 0,
      },
    );
    assert.equal(
      f.store.one('SELECT review_status FROM research_draft_materials')?.review_status,
      'RUNNING',
    );
    const deadline = f.store.get<string>('autoNextSendAt', '');
    assert.ok(deadline > f.options.clock().toISOString());
    for (let i = 0; i < 20; i++) await f.service.dispatchOne();
    assert.equal(f.store.get('autoNextSendAt', ''), deadline);
    assert.equal(f.gateway.historyQueries.length, 0);
    review.release();
    await research;
    const checked = f.service.draftRows()[0];
    assert.deepEqual(
      [checked.body, checked.version, checked.payload_hash],
      [d.body, d.version, d.payload_hash],
    );
    assert.equal(JSON.parse(checked.semantic_review).supported, true);
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
    f.advance();
    await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(
      f.runner.prompts.filter((p) => p.includes('Przygotuj indywidualny polski szkic')).length,
      1,
    );
    assert.equal(f.store.one('SELECT actor FROM draft_approvals')?.actor, 'policy');
  } finally {
    review.release();
    await research;
  }
});

test('AUTO LOCAL_ONLY: ready B is dispatched while newer A is still under review', async (t) => {
  const f = await setup(t, false, true, false, true),
    review = holdReview(f, 2);
  await f.service.startAuto();
  const research = f.service.tick();
  try {
    await review.entered;
    const a = f.store.one(
        "SELECT draft_id FROM research_draft_materials WHERE review_status='RUNNING'",
      )!,
      b = f.store.one(
        "SELECT draft_id FROM research_draft_materials WHERE review_status='COMPLETED'",
      )!;
    f.store.exec(
      'UPDATE drafts SET created_at=? WHERE id=?',
      new Date(f.options.clock().getTime() + 1).toISOString(),
      a.draft_id,
    );
    assert.equal(f.service.draftRows()[0].id, a.draft_id);
    f.advance();
    await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(f.store.one('SELECT draft_id FROM outbox')?.draft_id, b.draft_id);
    assert.equal(
      f.store.one('SELECT status FROM drafts WHERE id=?', a.draft_id)?.status,
      'NEEDS_REVIEW',
    );
    assert.equal(review.signal()?.aborted, false);
    assert.equal(f.service.state().paused, false);
    assert.equal(f.store.all('SELECT * FROM auto_skips').length, 0);
  } finally {
    review.release();
    await research;
  }
});

test('AUTO LOCAL_ONLY: PENDING review is deferred with a bounded sender deadline', async (t) => {
  const f = await setup(t, true, false, false, true),
    review = holdReview(f);
  await f.service.startAuto();
  const research = f.service.tick();
  try {
    await review.entered;
    f.store.exec(
      "UPDATE research_draft_materials SET code_status='PENDING',review_status='PENDING'",
    );
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.service.state().paused, false);
    assert.equal(review.signal()?.aborted, false);
    assert.equal(f.store.all('SELECT * FROM auto_skips').length, 0);
    assert.equal(f.gateway.posts.length, 0);
    assert.ok(f.store.get<string>('autoNextSendAt', '') > f.options.clock().toISOString());
    assert.equal(f.gateway.historyQueries.length, 0);
    f.store.exec("UPDATE research_draft_materials SET code_status='PASS',review_status='RUNNING'");
  } finally {
    review.release();
    await research;
  }
});

test('AUTO LOCAL_ONLY: review ERROR preserves material without durable skip; explicit review-only retry can send', async (t) => {
  const f = await setup(t, true, false, false, true);
  f.runner.beforeCall = async (prompt) => {
    if (prompt.includes('Sprawdź KAŻDE'))
      throw new DomainError('CODEX_FAILED', 'fictional review failure');
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  for (let i = 0; i < 3; i++) {
    f.advance();
    await f.service.dispatchOne();
  }
  assert.equal(
    f.store.one('SELECT review_status FROM research_draft_materials')?.review_status,
    'ERROR',
  );
  assert.equal(JSON.parse(f.service.draftRows()[0].semantic_review).supported, null);
  assert.equal(f.service.state().paused, false);
  assert.equal(f.store.all('SELECT * FROM auto_skips').length, 0);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.gateway.historyQueries.length, 0);
  assert.equal(f.runner.prompts.filter((p) => p.includes('Sprawdź KAŻDE')).length, 1);
  f.runner.beforeCall = undefined;
  await f.service.retryDraftReview(d.id, d.version);
  const checked = f.service.draftRows()[0];
  assert.deepEqual(
    [checked.body, checked.version, checked.payload_hash],
    [d.body, d.version, d.payload_hash],
  );
  f.advance();
  await f.service.dispatchOne();
  assert.equal(f.gateway.posts.length, 1);
  assert.equal(
    f.runner.prompts.filter((p) => p.includes('Przygotuj indywidualny polski szkic')).length,
    1,
  );
});

for (const supported of [false, null])
  test(`AUTO LOCAL_ONLY: completed supported=${supported} stays rejected without automatic review retries`, async (t) => {
    const f = await setup(t, true, false, false, true),
      run = f.runner.run.bind(f.runner);
    f.runner.run = async (prompt, schema, options) => {
      const result = await run(prompt, schema, options);
      if (prompt.includes('Sprawdź KAŻDE'))
        result.value = schema.parse({ supported, issues: ['fictional negative review'] });
      return result;
    };
    await f.service.startAuto();
    await f.service.tick();
    for (let i = 0; i < 3; i++) {
      f.advance();
      await f.service.dispatchOne();
    }
    assert.equal(
      f.store.one('SELECT review_status FROM research_draft_materials')?.review_status,
      'COMPLETED',
    );
    assert.equal(JSON.parse(f.service.draftRows()[0].semantic_review).supported, supported);
    assert.equal(
      f.store.one('SELECT reason_code FROM auto_skips')?.reason_code,
      'SEMANTIC_REVIEW_REQUIRED',
    );
    assert.equal(f.service.state().paused, false);
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.runner.prompts.filter((p) => p.includes('Sprawdź KAŻDE')).length, 1);
  });

test('AUTO LOCAL_ONLY: even a positive provider response after Stop cannot restore send authority', async (t) => {
  const f = await setup(t, true, false, false, true),
    review = holdReview(f, 1, true);
  await f.service.startAuto();
  const research = f.service.tick();
  try {
    await review.entered;
    f.service.control('stop');
    assert.equal(review.signal()?.aborted, true);
    review.release();
    await research;
    const material = f.store.one('SELECT * FROM research_draft_materials')!;
    assert.equal(material.review_status, 'ERROR');
    assert.equal(JSON.parse(material.review_error).code, 'CANCELLED');
    assert.equal(JSON.parse(f.service.draftRows()[0].semantic_review).supported, null);
    assert.equal(f.service.state().stopped, true);
    assert.equal(f.service.dashboard().state.auto.session, null);
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 0);
  } finally {
    review.release();
    await research;
  }
});

for (const change of ['edit', 'source'])
  test(`AUTO LOCAL_ONLY: ${change} during RUNNING review invalidates its positive result`, async (t) => {
    const f = await setup(t, true, false, false, true),
      review = holdReview(f);
    await f.service.startAuto();
    const research = f.service.tick();
    try {
      await review.entered;
      const d = f.service.draftRows()[0];
      if (change === 'edit')
        f.service.editDraft(d.id, {
          version: d.version,
          subject: d.subject,
          body: d.body + ' Dziękuję.',
        });
      else f.store.exec("UPDATE research_sources SET text=text||' Changed.'");
      const materialAtChange = f.store.all('SELECT * FROM research_draft_materials');
      review.release();
      await research;
      const changed = f.service.draftRows()[0];
      assert.equal(
        f.store.one(
          'SELECT review_status FROM research_draft_materials WHERE draft_id=? AND version=?',
          d.id,
          d.version,
        )?.review_status,
        change === 'edit' ? 'INVALIDATED' : 'RUNNING',
      );
      // A direct external source edit has no application invalidation callback. Its stale
      // binding blocks readiness; the late model is forbidden from writing even INVALIDATED.
      assert.deepEqual(f.store.all('SELECT * FROM research_draft_materials'), materialAtChange);
      assert.equal(JSON.parse(changed.semantic_review).supported, null);
      assert.deepEqual(f.service.draftMaterialIssues(changed), ['DRAFT_MATERIAL_STALE']);
      f.advance();
      await f.service.dispatchOne();
      assert.equal(f.gateway.posts.length, 0);
      assert.equal(
        f.store.one('SELECT reason_code FROM auto_skips')?.reason_code,
        'DRAFT_MATERIAL_STALE',
      );
      assert.equal(f.service.state().paused, false);
    } finally {
      review.release();
      await research;
    }
  });

test('AUTO LOCAL_ONLY: review starting after selection is blocked by the final gate, not session failure', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0],
    review = holdReview(f),
    refresh = f.service.refreshDraftSources.bind(f.service);
  let checking: Promise<unknown> | undefined;
  f.service.refreshDraftSources = async (...args) => {
    await refresh(...args);
    checking = f.service.retryDraftReview(d.id, d.version);
    await review.entered;
  };
  try {
    f.advance();
    await f.service.dispatchOne();
    assert.equal(review.signal()?.aborted, false);
    assert.equal(f.service.state().paused, false);
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.gateway.historyQueries.length, 0);
    assert.equal(f.store.all('SELECT * FROM auto_skips').length, 0);
    assert.ok(f.store.get<string>('autoNextSendAt', '') > f.options.clock().toISOString());
    review.release();
    await checking;
    f.service.refreshDraftSources = refresh;
    f.advance();
    await f.service.dispatchOne();
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(
      f.runner.prompts.filter((p) => p.includes('Przygotuj indywidualny polski szkic')).length,
      1,
    );
  } finally {
    review.release();
    await checking;
  }
});

test('AUTO LOCAL_ONLY: review starting on a queued packet still blocks before reservation without skipping its draft', async (t) => {
  const f = await setup(t, true, false, false, true);
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0],
    review = holdReview(f),
    account = f.gateway.account.bind(f.gateway);
  let checking: Promise<unknown> | undefined;
  f.gateway.account = async () => {
    if (
      !checking &&
      f.store.one(
        "SELECT o.id FROM outbox o JOIN auto_outbox a ON a.outbox_id=o.id WHERE o.status='QUEUED'",
      )
    ) {
      checking = f.service.retryDraftReview(d.id, d.version);
      await review.entered;
    }
    return account();
  };
  try {
    f.advance();
    await f.service.dispatchOne();
    assert.ok(checking);
    assert.equal(f.service.outboxRows()[0].status, 'BLOCKED');
    assert.equal(f.store.all('SELECT * FROM send_attempts').length, 0);
    assert.equal(f.gateway.posts.length, 0);
    assert.equal(f.store.all('SELECT * FROM auto_skips').length, 0);
    assert.equal(review.signal()?.aborted, false);
    assert.equal(f.service.state().paused, false);
    assert.ok(f.store.get<string>('autoNextSendAt', '') > f.options.clock().toISOString());
    f.gateway.account = account;
    review.release();
    await checking;
    f.advance();
    await Promise.all([f.service.dispatchOne(), f.service.dispatchOne()]);
    assert.equal(f.gateway.posts.length, 1);
    assert.equal(f.store.all('SELECT * FROM send_attempts').length, 1);
    assert.equal(
      f.runner.prompts.filter((p) => p.includes('Przygotuj indywidualny polski szkic')).length,
      1,
    );
    const sent = f.service.draftRows()[0];
    assert.deepEqual(
      [sent.body, sent.version, sent.payload_hash],
      [d.body, d.version, d.payload_hash],
    );
  } finally {
    review.release();
    await checking;
  }
});

test('AUTO LOCAL_ONLY: code-rejected material is a draft rejection, never waiting review or session failure', async (t) => {
  const f = await setup(t, true, false, false, true),
    run = f.runner.run.bind(f.runner);
  f.runner.run = async (prompt, schema, options) => {
    const result = await run(prompt, schema, options);
    if (prompt.includes('Przygotuj indywidualny polski szkic')) {
      const value = result.value as any;
      value.body += ' Używam React.';
      value.claims.push({
        kind: 'CANDIDATE',
        text: 'Używam React.',
        factIds: [value.factIds[0]],
        evidenceIds: [],
      });
    }
    return result;
  };
  await f.service.startAuto();
  await f.service.tick();
  const material = f.store.one('SELECT * FROM research_draft_materials')!;
  assert.equal(material.code_status, 'REJECTED');
  assert.equal(material.review_status, 'NOT_RUN');
  assert.equal(JSON.parse(material.code_error).code, 'UNSUPPORTED_TECHNOLOGY');
  f.advance();
  await f.service.dispatchOne();
  assert.equal(
    f.store.one('SELECT reason_code FROM auto_skips')?.reason_code,
    'DRAFT_MATERIAL_UNVERIFIED',
  );
  assert.equal(f.service.state().paused, false);
  assert.equal(f.gateway.posts.length, 0);
  assert.equal(f.runner.prompts.filter((p) => p.includes('Sprawdź KAŻDE')).length, 0);
});
