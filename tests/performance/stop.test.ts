import test from 'node:test';
import { stopScenario, stopScenarios } from '../stop-scenario.js';
for (const repetition of [1, 2, 3])
  for (const scenario of stopScenarios)
    test(`isolated HTTP Stop latency ${repetition}: ${scenario}`, (t) =>
      stopScenario(t, scenario, true));
