import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../apps/server/src/db.js';
import { AutoPolicyJobHunter } from '../apps/server/src/auto-policy.js';
import { exportHistory, importHistory, HistorySync } from '../apps/server/src/history-sync.js';
import { FixtureGmail } from './gmail-fixture.js';
import { FixtureRunner, FixtureReader } from './research-fixture.js';
import { z } from 'zod';
import { hash, DomainError } from '../apps/server/src/util.js';
class ManyReader extends FixtureReader {
  override async read(url: string, signal?: AbortSignal) {
    const source = await super.read(url, signal),
      n = new URL(url).hostname.match(/fixture(\d+)/)?.[1];
    source.text = source.text
      .replaceAll('Fixture Company', `Fixture Company ${n}`)
      .replaceAll('fixture.example.test', `fixture${n}.example.test`);
    source.fragment = source.text;
    source.content_hash = hash(source.text + url);
    return source;
  }
}
class ManyRunner extends FixtureRunner {
  override async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ) {
    const result = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6)),
        n = new URL(sources[0].url).hostname.match(/fixture(\d+)/)[1];
      const v = result.value as any;
      v.company = `Fixture Company ${n}`;
      v.companyURL = `https://fixture${n}.example.test`;
      v.companyProof.quote = v.company;
      v.contact.email = `hr@fixture${n}.example.test`;
      v.contact.proof.quote = `Rekrutacja: hr@fixture${n}.example.test.`;
      result.value = schema.parse(v);
    }
    return result;
  }
}
class SplitContactRunner extends FixtureRunner {
  override async run<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: { signal?: AbortSignal; search?: boolean },
  ) {
    const result = await super.run(prompt, schema, options);
    if (prompt.includes('Wydobądź firmę')) {
      const sources = JSON.parse(prompt.slice(prompt.lastIndexOf('Dane: ') + 6));
      (result.value as any).contact.proof.sourceId = sources[1].id;
    }
    return result;
  }
}

export function git(dir: string, ...args: string[]) {
  return execFileSync('git', ['-C', dir, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
export async function setup(
  t: TestContext,
  prospect = false,
  many = false,
  split = false,
  local = false,
) {
  const root = mkdtempSync(join(tmpdir(), 'jh-auto-')),
    dir = join(root, 'data'),
    repo = join(root, 'history'),
    remote = join(root, 'remote.git');
  if (!local) {
    execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore', windowsHide: true });
    execFileSync('git', ['clone', remote, repo], { stdio: 'ignore', windowsHide: true });
    git(repo, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  }
  const store = new Store(dir),
    gateway = new FixtureGmail(),
    runner = many ? new ManyRunner() : split ? new SplitContactRunner() : new FixtureRunner(),
    reader = many ? new ManyReader() : new FixtureReader();
  let time = Date.now();
  runner.prospect = reader.prospect = prospect;
  const search = many
    ? {
        search: async () => ({
          urls: Array.from({ length: 5 }, (_, i) => ({
            url: `https://fixture${i + 1}.example.test/careers`,
            contactUrl: null,
          })),
          queries: ['fictional companies'],
        }),
      }
    : split
      ? {
          search: async () => ({
            urls: [
              {
                url: 'https://fixture.example.test/careers',
                contactUrl: 'https://fixture.example.test/contact',
              },
            ],
            queries: ['fictional split contact'],
          }),
        }
      : undefined;
  const options = {
    gateway,
    accountInfo: () => gateway.info,
    runner,
    reader,
    search,
    clock: () => new Date(time),
  };
  const service = new AutoPolicyJobHunter(store, options);
  const extraStores: Store[] = [];
  t.after(async () => {
    await service.stopWorker();
    for (const s of extraStores) s.close();
    store.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  });
  service.approveProfile();
  const cv = service.uploadCV(
    'Fixture.pdf',
    Buffer.from('%PDF-1.4\nfictional\n%%EOF').toString('base64'),
  );
  service.approveCV(cv.id);
  const policy = {
    senderEmail: gateway.info.email,
    cvId: cv.id,
    contactKinds: ['RECRUITMENT', 'GENERAL'],
    contactTypes: ['ACTIVE', 'OPEN', 'PROSPECT'],
    searchScope: 'Firmy działające w Polsce, web, SaaS, integracje i automatyzacje',
    sessionLimit: null,
    dailyLimit: null,
    sendIntervalSeconds: 60,
    researchIntervalSeconds: 60,
    confirmed: true,
    targetedHistoryConsent: true,
  };
  service.configurePolicy(policy);
  if (local)
    await service.configureLocalHistory({
      confirmedHistory: true,
      confirmedSingleWorkstation: true,
    });
  else
    service.historySync.configure({
      directory: repo,
      expectedRemote: remote,
      confirmedPrivate: true,
      confirmedInitialHistory: true,
    });
  await service.probe('codex');
  await service.probe('search');
  return {
    root,
    dir,
    repo,
    remote,
    store,
    service,
    gateway,
    runner,
    reader,
    cv,
    policy,
    options,
    extraStores,
    advance: (n = 61000) => {
      time += n;
    },
  };
}
