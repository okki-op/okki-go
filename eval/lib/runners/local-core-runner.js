'use strict';

const path = require('node:path');
const { ensureDir } = require('../core/fs-utils');
const { fromEvalRoot, makeRunId } = require('../core/paths');
const { runInstallerMatrix } = require('../installer/install-matrix-runner');
const { judgeScenarioRun } = require('../judge/rule-judge');
const { writeJsonReport } = require('../reports/json-reporter');
const { writeMarkdownReport } = require('../reports/markdown-reporter');
const { loadScenarios } = require('../scenarios/loader');
const { runStaticChecks } = require('../static/static-checker');
const { runReferenceScenario } = require('./reference-agent');

const SCENARIO_SUITES = new Set(['routing', 'business', 'safety']);
const ALL_SUITES = ['install', 'static', 'routing', 'business', 'safety'];

function runScenarioSuite(suite, selectedScenarios) {
  if (!SCENARIO_SUITES.has(suite)) {
    throw new Error(`Unsupported scenario suite: ${suite}`);
  }

  return runScenarios(suite, selectedScenarios);
}

function runLocalCore(options = {}) {
  const suite = options.suite || 'all';
  const runId = options.runId || makeRunId();
  const outputDir = path.resolve(options.outputDir || fromEvalRoot('results', runId));
  ensureDir(outputDir);

  const results = suite === 'all'
    ? runAllSuites(options.scenarios || [])
    : runSuite(suite, options.scenarios || []);
  const run = {
    runId,
    mode: options.mode || 'local-core',
    suite,
    outputDir,
    results
  };

  if (options.report) {
    writeJsonReport(outputDir, run);
    writeMarkdownReport(outputDir, run);
  }

  return run;
}

function runAllSuites(selectedScenarios) {
  const scenariosBySuite = loadScenarioSuitesForAll(selectedScenarios);
  const results = [];

  for (const suite of ALL_SUITES) {
    if (suite === 'install') {
      results.push(...runInstallerMatrix());
    } else if (suite === 'static') {
      results.push(...runStaticChecks());
    } else {
      results.push(...judgeScenarios(scenariosBySuite.get(suite) || []));
    }
  }

  return results;
}

function runSuite(suite, selectedScenarios) {
  if (suite === 'install') return runInstallerMatrix();
  if (suite === 'static') return runStaticChecks();
  return runScenarioSuite(suite, selectedScenarios);
}

function runScenarios(suite, selectedScenarios) {
  return judgeScenarios(loadScenarios({ suite, scenarios: selectedScenarios || [] }));
}

function loadScenarioSuitesForAll(selectedScenarios) {
  const selectedIds = new Set(selectedScenarios || []);
  const selectedFound = new Set();
  const scenariosBySuite = new Map();

  for (const suite of ALL_SUITES.filter((candidate) => SCENARIO_SUITES.has(candidate))) {
    const scenarios = loadScenarios({ suite });
    const filtered = selectedIds.size === 0
      ? scenarios
      : scenarios.filter((scenario) => selectedIds.has(scenario.id));
    for (const scenario of filtered) selectedFound.add(scenario.id);
    scenariosBySuite.set(suite, filtered);
  }

  const unknownIds = [...selectedIds].filter((id) => !selectedFound.has(id));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown scenario id(s): ${unknownIds.join(', ')}`);
  }

  return scenariosBySuite;
}

function judgeScenarios(scenarios) {
  return scenarios.map((scenario) => {
    return judgeScenarioRun(scenario, runReferenceScenario(scenario));
  });
}

module.exports = { runLocalCore, runScenarioSuite };
