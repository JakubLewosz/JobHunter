import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
import { RemoteNightflowHost } from '../apps/server/src/browser/nightflow-host.js';

test('host entry has no transitive backend/SQLite/MIME/OAuth/process dependency', () => {
  const seen = new Set<string>();
  function visit(file: string) {
    file = file.replace(/dist[\\/]/, '').replace(/\.js$/, '.ts');
    if (seen.has(file)) return;
    seen.add(file);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        removeComments: true,
      },
    }).outputText;
    assert.doesNotMatch(
      code,
      /\bprocess\b|better-sqlite3|nodemailer|vault|gmail\/service|nightflow-entry|auto-policy/,
    );
    const dependencies: string[] = [];
    const walk = (node: ts.Node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        dependencies.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        ts.isStringLiteral(node.arguments[0])
      )
        dependencies.push(node.arguments[0].text);
      ts.forEachChild(node, walk);
    };
    walk(ts.createSourceFile(file, code, ts.ScriptTarget.ES2022, true));
    for (const dependency of dependencies) {
      if (dependency.startsWith('.')) visit(resolve(dirname(file), dependency));
      else assert.match(dependency, /^(?:node:(?:fs|net|path|os|crypto|timers\/promises)|zod)$/);
    }
  }
  visit(resolve('scripts/browser-executor.mjs'));
  assert.ok(seen.size >= 6);
});

test('remote host attaches stopped, pins owner/job/generation, expires lease and never takes another worker', async () => {
  let handler: any,
    time = 100,
    connected = true,
    authority = false,
    starts = 0;
  let target = {
    instanceId: 'synthetic-owner',
    jobId: null as string | null,
    generation: null as string | null,
  };
  const broker = {
    setNightflowHandler: (h: any) => {
      handler = h;
    },
    hasWorker: (w: string) => connected && w === 'synthetic-worker',
  };
  const coordinator = {
    controlScope: () => target,
    status: () => ({ state: authority ? 'RESEARCHING' : 'NOT_STARTED', authority }),
  };
  const host = new RemoteNightflowHost(
    () => broker as any,
    () => time,
  );
  try {
    host.bind(
      coordinator as any,
      () => {
        starts++;
        authority = true;
        target = { ...target, jobId: 'synthetic-job', generation: 'synthetic-generation' };
      },
      () => {},
    );
    assert.equal(host.ready(), false);
    const initial = handler('synthetic-worker', 'attach');
    assert.equal(authority, false);
    assert.equal(host.ready(), true);
    assert.throws(() => handler('foreign-worker', 'attach'));
    assert.throws(() => handler('synthetic-worker', 'start', { ...target, instanceId: 'foreign' }));
    const active = handler('synthetic-worker', 'start', initial.target);
    assert.equal(starts, 1);
    assert.throws(() => handler('synthetic-worker', 'start', active.target));
    assert.throws(() => handler('synthetic-worker', 'poll', initial.target));
    assert.throws(() =>
      handler('synthetic-worker', 'poll', { ...active.target, generation: 'stale' }),
    );
    time += 45000;
    assert.equal(host.ready(), false);
    assert.throws(() => handler('synthetic-worker', 'poll', active.target));
    assert.throws(() => handler('synthetic-worker', 'attach'));
    connected = false;
    assert.equal(host.ready(), false);
  } finally {
    host.dispose();
  }
});
