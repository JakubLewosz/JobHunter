// Reproducible public-entry integration. Import in a host that supports Node
// modules and the documented tab; CLI below uses Node/Playwright, a separate level.
import { createServer } from 'node:http';
import { readFileSync, mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir, release } from 'node:os';
import { pathToFileURL } from 'node:url';
import { runNightflowTask } from './browser-executor.mjs';
import { requestNightflow } from '../dist/apps/server/src/nightflow-control.js';
import { runningBuildIdentity } from '../dist/apps/server/src/build-identity.js';

export async function createLocalFixturePage() {
  const html = readFileSync(new URL('../tests/fixtures/gmail-compose.html', import.meta.url));
  const server = createServer((req, res) => {
    if (req.method !== 'GET' || !req.url?.startsWith('/fixture')) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'",
    });
    res.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    url: origin + '/fixture?no-id',
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}

export async function runLocalHostFixture({
  tab,
  taskId,
  wallClock = false,
  scenario = 'complete',
  onProgress,
  researchWaitMs = 100,
}) {
  if (
    !['complete', 'stop', 'executor-loss', 'lost-ack'].includes(scenario) ||
    (wallClock && scenario !== 'complete')
  )
    throw Error('FIXTURE_SCENARIO');
  const root = mkdtempSync(join(tmpdir(), 'jh-public-host-')),
    dir = join(root, 'data');
  const page = await createLocalFixturePage(),
    abort = new AbortController();
  const startedAt = new Date().toISOString(),
    start = performance.now(),
    events = [],
    samples = [];
  let controlWork = Promise.resolve(),
    lastPhase = null;
  let report;
  const sample = async () => {
    try {
      const live = await requestNightflow(dir, 'status');
      samples.push({
        elapsedMs: performance.now() - start,
        source: live.source,
        target: live.target,
        state: live.current.state,
      });
    } catch {
      /* no inference of owner death from control failure */
    }
  };
  const pulse = setInterval(() => {
    void sample();
    onProgress?.({ event: 'PROGRESS', elapsedMs: performance.now() - start, lastPhase });
  }, 15 * 60000);
  const timeout = setTimeout(() => abort.abort(), wallClock ? 8 * 3600000 + 15 * 60000 : 90000);
  try {
    await tab.goto(page.url);
    const result = await runNightflowTask({
      dir,
      taskId,
      tab,
      signal: abort.signal,
      fixture: {
        origin: page.origin,
        wallClock,
        realWaitMs: researchWaitMs,
        onProgress: (event) => {
          if (events.length < 128) events.push({ event, elapsedMs: performance.now() - start });
          if (event.startsWith('PHASE_')) lastPhase = event;
          if (event === 'PHASE_RESEARCHING') {
            controlWork = sample().then(async () => {
              if (scenario === 'stop') {
                const ack = await requestNightflow(dir, 'stop');
                samples.push({
                  source: ack.source,
                  stop: ack.stop,
                  current: ack.current,
                  target: ack.target,
                });
              }
              if (scenario === 'executor-loss') await tab.close();
            });
            controlWork.catch(() => abort.abort());
          }
          onProgress?.({ event, elapsedMs: performance.now() - start });
        },
      },
    });
    await controlWork;
    report = {
      schema: 1,
      level: 'NODE_PUBLIC_ENTRY_LOCAL_PAGE',
      scenario,
      environment: { platform: process.platform, node: process.version, release: release() },
      code: runningBuildIdentity,
      startedAt,
      endedAt: new Date().toISOString(),
      elapsedMs: performance.now() - start,
      wallClock,
      intendedResearchHours: 8,
      result,
      events,
      samples,
      cleanup: {
        profileLockReleased: !existsSync(join(dir, 'profile.lock')),
        controlClosed: !existsSync(join(dir, 'nightflow-control.json')),
        browserClosed: !existsSync(join(dir, 'browser-executor.json')),
      },
    };
    return report;
  } finally {
    clearInterval(pulse);
    clearTimeout(timeout);
    abort.abort();
    await page.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    if (report) {
      report.cleanup.localPageClosed = true;
      report.cleanup.fixtureDirectoryRemoved = !existsSync(root);
      report.endedAt = new Date().toISOString();
      report.elapsedMs = performance.now() - start;
    }
  }
}

// No real research, account or transport can be configured through this runner.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2),
    outputAt = args.indexOf('--output');
  if (outputAt < 0 || !args[outputAt + 1]) throw Error('OUTPUT_REQUIRED');
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ headless: true }),
    context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/*', (route) =>
    new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort(),
  );
  const tab = {
    goto: (url) => page.goto(url),
    close: () => page.close(),
    url: async () => page.url(),
    playwright: {
      evaluate: (fn) => page.evaluate(fn),
      getByRole: (...a) => page.getByRole(...a),
      getByLabel: (...a) => page.getByLabel(...a),
      locator: (selector) => page.locator(selector),
      waitForEvent: async () => {
        const chooser = await page.waitForEvent('filechooser');
        return { setFiles: (files) => chooser.setFiles(files) };
      },
    },
  };
  try {
    const report = await runLocalHostFixture({
      tab,
      taskId: 'node-fixture-owned-task',
      wallClock: args.includes('--wall-clock'),
      researchWaitMs: args.includes('--steady-short') ? 1000 : 100,
      onProgress: (event) => {
        if (event.event === 'PROGRESS') console.error(JSON.stringify(event));
      },
    });
    writeFileSync(resolve(args[outputAt + 1]), JSON.stringify(report, null, 2) + '\n', {
      flag: 'wx',
    });
    console.log(
      JSON.stringify({
        level: report.level,
        state: report.result.state,
        elapsedMs: report.elapsedMs,
        cleanup: report.cleanup,
      }),
    );
    if (report.result.state !== 'COMPLETED') process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}
