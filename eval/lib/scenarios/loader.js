'use strict';

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { fromEvalRoot } = require('../core/paths');
const { validateScenario } = require('./schema');

function listYamlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .map((name) => path.join(dir, name));
}

function suitesForSelection(suite) {
  if (suite === 'all') return ['routing', 'business', 'safety'];
  return [suite];
}

function loadScenarioFile(filePath) {
  const scenario = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  const result = validateScenario(scenario);
  if (!result.valid) {
    throw new Error(`Invalid scenario ${filePath}: ${result.errors.join('; ')}`);
  }
  return { ...scenario, sourcePath: filePath };
}

function loadScenarios(options = {}) {
  const suite = options.suite || 'all';
  const selectedIds = new Set(options.scenarios || []);
  const files = suitesForSelection(suite).flatMap((suiteName) => {
    return listYamlFiles(fromEvalRoot('scenarios', suiteName));
  });
  const scenarios = files.map(loadScenarioFile);
  if (selectedIds.size === 0) return scenarios;
  return scenarios.filter((scenario) => selectedIds.has(scenario.id));
}

module.exports = { loadScenarios, loadScenarioFile };
