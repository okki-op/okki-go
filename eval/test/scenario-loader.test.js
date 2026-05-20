const test = require('node:test');
const assert = require('node:assert/strict');
const { loadScenarios } = require('../lib/scenarios/loader');
const { validateScenario } = require('../lib/scenarios/schema');

test('loadScenarios loads routing scenarios', () => {
  const scenarios = loadScenarios({ suite: 'routing' });
  assert.ok(scenarios.length >= 6);
  assert.ok(scenarios.some((scenario) => scenario.id === 'trigger-company-search-industry-country'));
});

test('validateScenario accepts a valid routing scenario', () => {
  const scenarios = loadScenarios({ suite: 'routing' });
  const result = validateScenario(scenarios[0]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateScenario rejects missing expected block', () => {
  const result = validateScenario({
    id: 'broken',
    suite: 'routing',
    name: 'Broken',
    userTurns: [{ role: 'user', content: 'Find companies' }]
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('expected is required'));
});
