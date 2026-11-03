import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './auto-fixture.js';
import { hash } from '../apps/server/src/util.js';
import {
  assertApplicationContent,
  requiredApplicationClauses,
} from '../apps/server/src/research/application-requirements.js';

const clause =
  'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji w Testowej Firmie.';
const instruction = 'Nie zapomnij dołączyć klauzuli w mailu:\n' + clause;

test('generation and review receive literal requirements omitted by extraction', async (t) => {
  const f = await setup(t, true, false, false, true);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    const s = await read(url, signal);
    s.text += '\n\n' + instruction + '\n\nKoniec wymagań.';
    s.fragment = s.text;
    s.content_hash = hash(s.text);
    return s;
  };
  const run = f.runner.run.bind(f.runner);
  let generationSawRequirement = false,
    reviewSawRequirement = false;
  f.runner.run = async (prompt, schema, options) => {
    const result = await run(prompt, schema, options);
    if (prompt.includes('Przygotuj indywidualny polski szkic')) {
      generationSawRequirement = prompt.includes(clause);
      (result.value as any).body += '\n\n' + clause;
    }
    if (prompt.includes('Sprawdź KAŻDE')) {
      const data = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      reviewSawRequirement = data.readProofs.some((p: any) => p.quote.includes(instruction));
    }
    return result;
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.ok(generationSawRequirement);
  assert.ok(reviewSawRequirement);
  assert.ok(d.body.includes(clause));
  assert.equal(f.gateway.posts.length, 0);
});

test('a missing clause is blocked before a model PASS can create checked material', async (t) => {
  const f = await setup(t, true, false, false, true);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    const s = await read(url, signal);
    s.text += '\n\n' + instruction;
    s.fragment = s.text;
    s.content_hash = hash(s.text);
    return s;
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.ok(d);
  assert.ok(f.service.draftMaterialIssues(d).includes('APPLICATION_REQUIREMENTS_MISSING'));
  assert.equal(f.gateway.posts.length, 0);
});

test('only complete explicit mail requirements count; forms and extra consent do not grant rights', async (t) => {
  const f = await setup(t, true, false, false, true);
  const source = await f.reader.read('https://fixture.example.test/');
  source.text = instruction;
  assert.equal(requiredApplicationClauses([source, source]).length, 1);
  assert.throws(() => assertApplicationContent({ body: '' }, [source]), {
    code: 'APPLICATION_REQUIREMENTS_MISSING',
  });
  assert.doesNotThrow(() => assertApplicationContent({ body: clause }, [source]));
  assert.deepEqual(requiredApplicationClauses([{ ...source, status: 'INCOMPLETE' }]), []);
  assert.deepEqual(requiredApplicationClauses([{ ...source, text: '* Formularz: ' + clause }]), []);
  const extra = clause + ' Także do przyszłych rekrutacji.';
  assert.throws(
    () =>
      assertApplicationContent({ body: extra }, [
        { ...source, text: instruction + ' Także do przyszłych rekrutacji.' },
      ]),
    { code: 'APPLICATION_CONSENT_SCOPE_REVIEW' },
  );
});

test('native editorial correction cannot remove a source-required application clause', async (t) => {
  const f = await setup(t, true, false, false, true);
  const read = f.reader.read.bind(f.reader);
  f.reader.read = async (url, signal) => {
    const s = await read(url, signal);
    s.text += '\n\n' + instruction + '\n\nKoniec wymagań.';
    s.fragment = s.text;
    s.content_hash = hash(s.text);
    return s;
  };
  const run = f.runner.run.bind(f.runner);
  let reviews = 0;
  f.runner.run = async (prompt, schema, options) => {
    const result = await run(prompt, schema, options);
    if (prompt.includes('Przygotuj indywidualny polski szkic'))
      (result.value as any).body += '\n\n' + clause;
    if (prompt.includes('Sprawdź KAŻDE')) {
      result.value = schema.parse({
        supported: true,
        issues: [],
        quality:
          reviews++ === 0
            ? {
                verdict: 'REVISE',
                defects: [{ code: 'PACKAGING', fragment: clause, reason: 'Usuń klauzulę.' }],
              }
            : { verdict: 'PASS', defects: [] },
      });
    }
    if (prompt.startsWith('Wykonaj JEDNĄ celowaną korektę')) {
      const { draft } = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      draft.body = draft.body.replace('\n\n' + clause, '');
      result.value = schema.parse(draft);
    }
    return result;
  };
  await f.service.startAuto();
  await f.service.tick();
  const d = f.service.draftRows()[0];
  assert.ok(d);
  assert.ok(d.body.includes(clause), 'editorial revision removed mandatory source content');
  assert.equal(f.gateway.posts.length, 0);
});
