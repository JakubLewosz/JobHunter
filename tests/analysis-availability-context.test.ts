import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../apps/server/src/db.js';
import { ResearchJobHunter } from '../apps/server/src/research/service.js';
import { FixtureReader, FixtureRunner } from './research-fixture.js';
import { hash } from '../apps/server/src/util.js';

for (const scenario of ['no-dayparts', 'approved-dayparts', 'source-hours'] as const)
  test(`extraction availability context: ${scenario}`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'jh-analysis-availability-'));
    const store = new Store(dir),
      reader = new FixtureReader(),
      runner = new FixtureRunner();
    reader.prospect = runner.prospect = true;
    const service = new ResearchJobHunter(store, { reader, runner });
    t.after(async () => {
      service.control('stop');
      await service.stopWorker();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    });
    const p = service.profile();
    const availability = `Płatna praca w pełni zdalna, około 20 godzin tygodniowo${scenario === 'approved-dayparts' ? ', przede wszystkim po lekcjach' : ''}.`;
    service.updateProfile({
      name: p.name,
      goal: 'Płatna regularna współpraca programistyczna w pełni zdalnie.',
      hours_approx: 20,
      version: p.version,
      message_template: p.message_template,
      facts: p.facts.map((f) => ({
        id: f.id,
        content: f.fact_key === 'availability' ? availability : f.content,
      })),
    });
    service.approveProfile();
    if (scenario === 'source-hours') {
      const original = reader.read.bind(reader);
      reader.read = async (url, signal) => {
        const s = await original(url, signal);
        s.text += '\nWymagana obecność zespołu od 9:00 do 17:00.';
        s.fragment = s.text;
        s.content_hash = hash(s.text + url);
        return s;
      };
    }
    await service.importURL('https://fixture.example.test/careers');
    await service.tick();
    const prompt = runner.prompts.find((p) => p.includes('Wydobądź firmę'))!;
    assert.ok(prompt);
    assert.ok(!prompt.includes('godziny po lekcjach i ewentualne'));
    assert.ok(prompt.includes('Pory dnia kandydata'));
    assert.equal(prompt.includes('po lekcjach'), scenario === 'approved-dayparts');
    assert.ok(prompt.includes(availability));
    if (scenario === 'source-hours')
      assert.ok(prompt.includes('Wymagana obecność zespołu od 9:00 do 17:00.'));
    assert.equal(store.one('SELECT count(*) n FROM outbox')!.n, 0);
    assert.equal(store.one('SELECT count(*) n FROM auto_sessions')!.n, 0);
  });
