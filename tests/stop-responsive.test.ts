import test from 'node:test';
import { stopScenario, stopScenarios } from './stop-scenario.js';
for (const scenario of stopScenarios)
  test('real HTTP Stop functional invariant under suite load: ' + scenario, (t) =>
    stopScenario(t, scenario, false),
  );
