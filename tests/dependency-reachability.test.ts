import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGmailMessage } from '../apps/server/src/gmail/reader.js';
import { reviewSchema } from '../apps/server/src/research/contracts.js';
test('native history parser preserves the mailbox outside nested address comments', () => {
  const m = parseGmailMessage({
    id: 'synthetic',
    threadId: 'synthetic',
    labelIds: ['INBOX'],
    internalDate: '1700000000000',
    payload: {
      headers: [
        { name: 'From', value: 'Victim (x(y) <evil@evil.test>) <v@victim.test>' },
        { name: 'To', value: 'Candidate <candidate@example.test>' },
        { name: 'Subject', value: 'Synthetic test only' },
      ],
    },
  });
  assert.deepEqual(m.from, ['v@victim.test']);
});
test('oversized native review collection is rejected before creating per-element issue records', () => {
  const r = reviewSchema.safeParse({
    supported: true,
    issues: Array.from({ length: 20000 }, () => ({})),
    quality: { verdict: 'PASS', defects: [] },
  });
  assert.equal(r.success, false);
  if (!r.success) {
    assert.equal(r.error.issues.length, 1);
    assert.equal(r.error.issues[0].code, 'too_big');
  }
});
