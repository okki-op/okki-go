'use strict';

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { fromEvalRoot } = require('../core/paths');
const { validateScenario } = require('./schema');

const SUPPORTED_SUITES = new Set(['all', 'routing', 'business', 'safety']);

function listYamlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .sort()
    .map((name) => path.join(dir, name));
}

function suitesForSelection(suite) {
  if (!SUPPORTED_SUITES.has(suite)) {
    throw new Error(`Unsupported scenario suite: ${suite}`);
  }
  if (suite === 'all') return ['routing', 'business', 'safety'];
  return [suite];
}

function loadScenarioFile(filePath, expectedSuite) {
  const scenario = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  const result = validateScenario(scenario);
  if (!result.valid) {
    throw new Error(`Invalid scenario ${filePath}: ${result.errors.join('; ')}`);
  }
  if (expectedSuite && scenario.suite !== expectedSuite) {
    throw new Error(`Scenario suite mismatch in ${filePath}: expected ${expectedSuite}, got ${scenario.suite}`);
  }
  return { ...scenario, sourcePath: filePath };
}

function loadScenarios(options = {}) {
  const suite = options.suite || 'all';
  const selectedIds = new Set(options.scenarios || []);
  const scenarioRoot = options.scenarioRoot || fromEvalRoot('scenarios');
  const scenarios = suitesForSelection(suite).flatMap((suiteName) => {
    return listYamlFiles(path.join(scenarioRoot, suiteName)).map((filePath) => {
      return loadScenarioFile(filePath, suiteName);
    });
  });

  assertUniqueScenarioIds(scenarios);
  if (selectedIds.size === 0) return scenarios;

  const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const unknownIds = [...selectedIds].filter((id) => !scenariosById.has(id));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown scenario id(s): ${unknownIds.join(', ')}`);
  }
  return scenarios.filter((scenario) => selectedIds.has(scenario.id));
}

function assertUniqueScenarioIds(scenarios) {
  const seen = new Set();
  for (const scenario of scenarios) {
    if (seen.has(scenario.id)) {
      throw new Error(`Duplicate scenario id: ${scenario.id}`);
    }
    seen.add(scenario.id);
  }
}

module.exports = { loadScenarios, loadScenarioFile };
