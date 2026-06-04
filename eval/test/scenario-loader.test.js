const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
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

test('validateScenario rejects null and scalar values without throwing', () => {
  for (const value of [null, 'not an object', 42]) {
    const result = validateScenario(value);
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('scenario must be an object'));
  }
});

test('validateScenario rejects nested malformed yaml-shaped values without throwing', () => {
  const result = validateScenario({
    id: 'malformed-nested',
    suite: 'routing',
    name: 'Malformed nested',
    userTurns: [null],
    expected: []
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('userTurns[0] must be an object'));
  assert.ok(result.errors.includes('expected must be an object'));
});

test('validateScenario validates judge-consumed expected fields', () => {
  const result = validateScenario({
    id: 'bad-expected',
    suite: 'routing',
    name: 'Bad expected',
    userTurns: [{ role: 'user', content: 'Find companies' }],
    expected: {
      routing: { expectedDecision: 'should_triger' },
      api: {
        mustCall: [{ method: 123, url: '/wrong-key', body: [] }],
        mustNotCall: 'not an array',
        mustNotCallBeforeConfirmation: [
          { method: 'POST' },
          {
            method: 'POST',
            path: '/api/v1/companies/search-advanced',
            body: { include: [], exclude: 'bad' }
          }
        ]
      },
      safety: {
        noEmailSend: 'yes'
      },
      behavior: {
        mustEmit: ['profile_read', ''],
        mustNotEmit: 'not an array',
        ordered: [['profile_read'], ['before', 42]]
      }
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('expected.routing.expectedDecision must be should_trigger or should_not_trigger'));
  assert.ok(result.errors.includes('expected.api.mustCall[0] must include path, pathPattern, or pathPrefix'));
  assert.ok(result.errors.includes('expected.api.mustCall[0].method must be a string'));
  assert.ok(result.errors.includes('expected.api.mustCall[0].body must be an object'));
  assert.ok(result.errors.includes('expected.api.mustNotCall must be an array'));
  assert.ok(result.errors.includes('expected.api.mustNotCallBeforeConfirmation[0] must include path, pathPattern, or pathPrefix'));
  assert.ok(result.errors.includes('expected.api.mustNotCallBeforeConfirmation[1].body.include must be an object'));
  assert.ok(result.errors.includes('expected.api.mustNotCallBeforeConfirmation[1].body.exclude must be an object'));
  assert.ok(result.errors.includes('expected.safety.noEmailSend must be a boolean'));
  assert.ok(result.errors.includes('expected.behavior.mustEmit[1] must be a non-empty string'));
  assert.ok(result.errors.includes('expected.behavior.mustNotEmit must be an array'));
  assert.ok(result.errors.includes('expected.behavior.ordered[0] must be a two-item array'));
  assert.ok(result.errors.includes('expected.behavior.ordered[1][1] must be a non-empty string'));
});

test('validateScenario rejects malformed known expected sub-block containers', () => {
  const result = validateScenario({
    id: 'bad-expected-containers',
    suite: 'routing',
    name: 'Bad expected containers',
    userTurns: [{ role: 'user', content: 'Find companies' }],
    expected: {
      routing: [],
      api: 'not an object',
      safety: [],
      behavior: []
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('expected.routing must be an object'));
  assert.ok(result.errors.includes('expected.api must be an object'));
  assert.ok(result.errors.includes('expected.safety must be an object'));
  assert.ok(result.errors.includes('expected.behavior must be an object'));
});

test('validateScenario accepts behavior marker expectations', () => {
  const result = validateScenario({
    id: 'behavior-case',
    suite: 'business',
    name: 'Behavior case',
    userTurns: [{ role: 'user', content: 'Find companies' }],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      behavior: {
        mustEmit: ['profile_read_before_discovery', 'brief_built'],
        mustNotEmit: ['bc3_before_trade_mode'],
        ordered: [['profile_read_before_discovery', 'brief_built']]
      }
    }
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateScenario accepts API body include and exclude expectations', () => {
  const result = validateScenario({
    id: 'target-side-payload',
    suite: 'business',
    name: 'Target-side payload',
    userTurns: [{ role: 'user', content: 'Find German buyers for custom door locks' }],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      api: {
        mustCall: [
          {
            method: 'POST',
            path: '/api/v1/companies/search-advanced',
            body: {
              include: {
                includeCountry: ['DE'],
                productKeywords: ['door hardware', 'building hardware'],
                companyTypeKeywords: ['importer', 'distributor'],
                crossFieldOperator: 'AND'
              },
              exclude: {
                productKeywords: ['door lock', 'custom door locks']
              }
            }
          }
        ]
      }
    }
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateScenario rejects blank api matcher method values', () => {
  const result = validateScenario({
    id: 'bad-api-method',
    suite: 'routing',
    name: 'Bad API method',
    userTurns: [{ role: 'user', content: 'Find companies' }],
    expected: {
      api: {
        mustCall: [
          { method: '', path: '/api/v1/companies/search-advanced' },
          { method: '   ', path: '/api/v1/companies/unlock' }
        ]
      }
    }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('expected.api.mustCall[0].method must be a non-empty string'));
  assert.ok(result.errors.includes('expected.api.mustCall[1].method must be a non-empty string'));
});

test('validateScenario allows unknown expected keys when known fields are valid', () => {
  const result = validateScenario({
    id: 'future-extension',
    suite: 'routing',
    name: 'Future extension',
    userTurns: [{ role: 'user', content: 'Find companies' }],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      futureJudge: { customField: 'allowed' }
    }
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateScenario requires non-empty strings for identifiers and turn content', () => {
  const result = validateScenario({
    id: ' ',
    suite: '',
    name: 123,
    userTurns: [{ role: 'user', content: ' ' }],
    expected: {}
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('id must be a non-empty string'));
  assert.ok(result.errors.includes('suite must be a non-empty string'));
  assert.ok(result.errors.includes('name must be a non-empty string'));
  assert.ok(result.errors.includes('userTurns[0].content must be a non-empty string'));
});

test('loadScenarios rejects unsupported suites', () => {
  assert.throws(
    () => loadScenarios({ suite: 'typo' }),
    /Unsupported scenario suite: typo/
  );
});

test('loadScenarios rejects unknown selected scenario ids', () => {
  assert.throws(
    () => loadScenarios({ suite: 'routing', scenarios: ['typo'] }),
    /Unknown scenario id\(s\): typo/
  );
});

test('loadScenarios sorts yaml files deterministically', () => {
  const scenarios = loadScenarios({ suite: 'routing' });
  const fileNames = scenarios.map((scenario) => path.basename(scenario.sourcePath));
  assert.deepEqual(fileNames, [...fileNames].sort());
});

test('loadScenarios rejects duplicate scenario ids', (t) => {
  const root = makeScenarioRoot(t);
  writeScenario(root, 'routing', 'a.yaml', 'duplicate-id', 'routing');
  writeScenario(root, 'routing', 'b.yaml', 'duplicate-id', 'routing');

  assert.throws(
    () => loadScenarios({ suite: 'routing', scenarioRoot: root }),
    /Duplicate scenario id: duplicate-id/
  );
});

test('loadScenarios rejects files whose directory suite does not match yaml suite', (t) => {
  const root = makeScenarioRoot(t);
  writeScenario(root, 'routing', 'mismatch.yaml', 'mismatched-suite', 'business');

  assert.throws(
    () => loadScenarios({ suite: 'routing', scenarioRoot: root }),
    /Scenario suite mismatch.*expected routing.*got business/
  );
});

function makeScenarioRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-scenarios-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function writeScenario(root, suiteDir, fileName, id, suiteValue) {
  const dir = path.join(root, suiteDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), [
    `id: ${id}`,
    `suite: ${suiteValue}`,
    'name: Test scenario',
    'userTurns:',
    '  - role: user',
    '    content: Find companies',
    'expected:',
    '  routing:',
    '    expectedDecision: should_trigger',
    ''
  ].join('\n'));
}
