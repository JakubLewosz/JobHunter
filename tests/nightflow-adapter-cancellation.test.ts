import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withNightflow } from '../apps/server/src/nightflow-entry.js';
import { RemoteNightflowHost } from '../apps/server/src/browser/nightflow-host.js';
import { BrowserExecutorClient } from '../apps/server/src/browser/client.js';

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('../dist/') && context.parentURL?.endsWith('/browser-executor.mjs'))
      return nextResolve(
        new URL(specifier.replace('../dist/', '../').replace(/\.js$/, '.ts'), context.parentURL)
          .href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const { CodexNightflowAdapter, runNightflowTask } = await import('../scripts/browser-executor.mjs');
hooks.deregister();

function barrier() {
  const entered = Promise.withResolvers<void>(),
    released = Promise.withResolvers<void>();
  return {
    entered: entered.promise,
    reach: entered.resolve,
    wait: released.promise,
    release: released.resolve,
  };
}

async function fixture(t: TestContext, action: (fixture: any) => Promise<void>, held = false) {
  const dir = mkdtempSync(join(tmpdir(), 'jh-r15-'));
  let service: any,
    work: Promise<any> | undefined,
    starts = 0,
    releases = 0;
  const gate = barrier();
  const host = new RemoteNightflowHost(() => service.browserDelivery);
  try {
    await withNightflow({ dir, fixture: true, host }, async (coordinator, backend, plan) => {
      service = backend;
      coordinator.savePlan(plan, true);
      const boundary = (coordinator as any).options.boundary;
      (coordinator as any).options.boundary = async (phase: string) => {
        await boundary?.(phase);
        if (held && phase === 'VALIDATING') {
          gate.reach();
          await gate.wait;
        }
      };
      const broker = service.browserDelivery;
      const setHandler = broker.setNightflowHandler.bind(broker);
      broker.setNightflowHandler = (handler: any) =>
        setHandler(
          handler &&
            ((...args: any[]) => {
              if (args[1] === 'start') starts++;
              return handler(...args);
            }),
        );
      const release = broker.release.bind(broker);
      broker.release = (worker: string) => {
        releases++;
        return release(worker);
      };
      host.bind(
        coordinator,
        () => {
          work = coordinator.start(plan.id);
        },
        () => {},
      );
      await broker.listen();
      const counters = () => ({
        starts,
        jobs: service.store.one('SELECT count(*) n FROM nightflow_jobs').n,
        reservations: service.store.one('SELECT count(*) n FROM usage_ledger').n,
        attempts: service.store.one('SELECT count(*) n FROM send_attempts').n,
        actions: service.gateway.posts.length,
        authority: coordinator.status().authority,
      });
      const baseline = counters();
      const adapter = new CodexNightflowAdapter(dir, 'synthetic-r15', {
        url: async () => 'http://127.0.0.1/',
      });
      try {
        await action({
          dir,
          adapter,
          host,
          broker,
          coordinator,
          gate,
          counters,
          baseline,
          releases: () => releases,
          work: () => work,
        });
      } finally {
        await adapter.close().catch(() => {});
        coordinator.stop();
        gate.release();
        await work;
        host.dispose();
      }
    });
  } finally {
    host.dispose();
    rmSync(dir, { recursive: true, force: true });
  }
}

function unchanged(fixture: any) {
  assert.deepEqual(fixture.counters(), fixture.baseline);
}

test('R15 IPC: pre-aborted public entry cannot Start or release another executor', async (t) => {
  await fixture(t, async (current) => {
    const foreign = new BrowserExecutorClient(current.dir);
    await foreign.probe();
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      runNightflowTask({
        dir: current.dir,
        taskId: 'synthetic-preabort',
        tab: { url: async () => assert.fail('pre-abort touched tab') },
        signal: controller.signal,
      }),
    );
    unchanged(current);
    assert.equal(current.releases(), 0);
    assert.equal(current.broker.status().connected, true);
    await foreign.release();
  });
});

for (const point of ['tab', 'probe', 'attach'])
  test('R15 IPC: abort while awaiting ' + point + ' sends zero Start', async (t) => {
    await fixture(t, async (current) => {
      const controller = new AbortController(),
        gate = barrier();
      current.adapter.options.signal = controller.signal;
      if (point === 'tab')
        current.adapter.tab.url = async () => {
          gate.reach();
          await gate.wait;
          return 'http://127.0.0.1/';
        };
      else {
        const method = point === 'probe' ? 'probe' : 'nightflow';
        const original = current.adapter.client[method].bind(current.adapter.client);
        current.adapter.client[method] = async (...args: any[]) => {
          const result = await original(...args);
          gate.reach();
          await gate.wait;
          return result;
        };
      }
      const connecting = current.adapter.connect();
      await gate.entered;
      controller.abort();
      gate.release();
      await assert.rejects(connecting);
      await assert.rejects(current.adapter.start());
      await current.adapter.close();
      unchanged(current);
      assert.equal(current.adapter.started, false);
      assert.equal(current.broker.status().connected, false);
      assert.equal(current.releases(), point === 'tab' ? 0 : 1);
    });
  });

test('R15 IPC: direct start inherits connect cancellation, no wrapper bypass', async (t) => {
  await fixture(t, async (current) => {
    const controller = new AbortController();
    await current.adapter.connect(controller.signal);
    controller.abort();
    await assert.rejects(current.adapter.start());
    await current.adapter.close();
    await current.adapter.close();
    unchanged(current);
    assert.equal(current.adapter.started, false);
    assert.equal(current.releases(), 1);
  });
});

test('R15 IPC: public wrapper abort during tab await never probes or Starts', async (t) => {
  await fixture(t, async (current) => {
    const controller = new AbortController(),
      gate = barrier();
    const running = runNightflowTask({
      dir: current.dir,
      taskId: 'synthetic-wrapper-abort',
      signal: controller.signal,
      tab: {
        url: async () => {
          gate.reach();
          await gate.wait;
          return 'http://127.0.0.1/';
        },
      },
    });
    await gate.entered;
    controller.abort();
    gate.release();
    await assert.rejects(running);
    unchanged(current);
    assert.equal(current.releases(), 0);
  });
});

test('R15 IPC: close during attach await releases once and rejects late continuation', async (t) => {
  await fixture(t, async (current) => {
    const gate = barrier(),
      request = current.adapter.client.nightflow.bind(current.adapter.client);
    current.adapter.client.nightflow = async (...args: any[]) => {
      const result = await request(...args);
      gate.reach();
      await gate.wait;
      return result;
    };
    const connecting = current.adapter.connect();
    await gate.entered;
    const closing = current.adapter.close();
    gate.release();
    await assert.rejects(connecting);
    await closing;
    await assert.rejects(current.adapter.start());
    unchanged(current);
    assert.equal(current.releases(), 1);
    assert.equal(current.host.ready(), false);
  });
});

test('R15 IPC: abort before socket dispatch does not mark Start as sent', async (t) => {
  await fixture(t, async (current) => {
    const controller = new AbortController();
    await current.adapter.connect(controller.signal);
    const starting = current.adapter.start();
    controller.abort();
    await assert.rejects(starting);
    unchanged(current);
    assert.equal(current.adapter.started, false);
    assert.equal(current.releases(), 1);
  });
});

test('R15 IPC: normal public entry starts exactly once, completes one fake action and releases', async (t) => {
  await fixture(t, async (current) => {
    const result = await runNightflowTask({
      dir: current.dir,
      taskId: 'synthetic-normal',
      tab: { url: async () => 'http://127.0.0.1/' },
    });
    assert.equal(result.status, 'COMPLETED');
    assert.deepEqual(current.counters(), {
      starts: 1,
      jobs: 1,
      reservations: 1,
      attempts: 1,
      actions: 1,
      authority: false,
    });
    assert.equal(current.releases(), 1);
    assert.equal(current.broker.status().connected, false);
  });
});

for (const response of ['delayed', 'lost'])
  test(
    'R15 IPC: accepted Start response ' + response + ', no retry and owned release',
    async (t) => {
      await fixture(
        t,
        async (current) => {
          const gate = barrier(),
            controller = new AbortController();
          current.adapter.options.signal = controller.signal;
          await current.adapter.connect();
          const sockets = new Set<any>();
          current.broker.server.on('connection', (socket: any) => {
            sockets.add(socket);
            socket.once('close', () => sockets.delete(socket));
            let startRequest = false;
            socket.prependListener('data', (data: Buffer) => {
              if (data.toString().includes('"command":"start"')) startRequest = true;
            });
            const end = socket.end.bind(socket);
            socket.end = (data: any) => {
              if (!startRequest) return end(data);
              gate.reach();
              void gate.wait.then(() => (response === 'lost' ? socket.destroy() : end(data)));
              return socket;
            };
          });
          const starting = current.adapter.start();
          const rejected = assert.rejects(starting);
          await gate.entered;
          await current.gate.entered;
          assert.equal(current.adapter.started, true);
          assert.equal(current.counters().authority, true);
          if (response === 'delayed') controller.abort();
          gate.release();
          await rejected;
          await assert.rejects(current.adapter.start());
          assert.equal(current.releases(), 1);
          assert.equal(current.counters().starts, 1);
          assert.equal(current.counters().jobs, 1);
          assert.equal(current.counters().reservations, 0);
          assert.equal(current.counters().actions, 0);
          current.gate.release();
          await current.work();
          assert.equal(current.counters().authority, false);
          assert.equal(current.host.ready(), false);
          for (const socket of sockets) socket.destroy();
        },
        true,
      );
    },
  );

test('R15 IPC: changed owner during cancellation cannot receive Start or release', async (t) => {
  await fixture(t, async (current) => {
    const controller = new AbortController();
    await current.adapter.connect(controller.signal);
    const { readFileSync, writeFileSync } = await import('node:fs');
    const descriptor = join(current.dir, 'browser-executor.json');
    const original = readFileSync(descriptor);
    const replacement = JSON.parse(original.toString());
    replacement.secret = 'a'.repeat(64);
    writeFileSync(descriptor, JSON.stringify(replacement));
    try {
      controller.abort();
      await assert.rejects(current.adapter.start());
      await assert.rejects(current.adapter.close(), /BROWSER_RELEASE_UNCONFIRMED/);
      unchanged(current);
      assert.equal(current.releases(), 0);
    } finally {
      writeFileSync(descriptor, original);
    }
  });
});
