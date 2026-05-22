'use strict';

const path = require('node:path');
const { ensureDir, writeJson } = require('../core/fs-utils');
const { fromEvalRoot, makeRunId } = require('../core/paths');
const { loadReplayFixture } = require('../fixtures/loader');
const { createManualReviewRecord } = require('../judge/manual-review');
const { judgeQuality } = require('../judge/quality-judge');
const { judgeScenarioRun } = require('../judge/rule-judge');
const { writeJsonReport } = require('../reports/json-reporter');
const { writeMarkdownReport } = require('../reports/markdown-reporter');
const { loadScenarios } = require('../scenarios/loader');
const { runReferenceScenario } = require('./reference-agent');

function runReplay(options = {}) {
  if (!options.fixture) throw new Error('Replay mode requires --fixture');

  const suite = options.suite || 'business';
  const repeat = options.repeat || 1;
  const runId = options.runId || makeRunId();
  const outputDir = path.resolve(options.outputDir || fromEvalRoot('results', runId));
  ensureDir(outputDir);

  const fixture = loadReplayFixture(options.fixture);
  const scenarios = loadScenarios({ suite, scenarios: options.scenarios || [] });
  const results = [];

  for (let iteration = 1; iteration <= repeat; iteration += 1) {
    for (const scenario of scenarios) {
      results.push(runReplayScenario(scenario, fixture, iteration));
    }
  }

  const run = {
    runId,
    mode: 'replay',
    suite,
    fixture,
    outputDir,
    repeat,
    results
  };

  if (options.report) {
    writeJsonReport(outputDir, run);
    writeMarkdownReport(outputDir, run);
    writeJson(path.join(outputDir, 'manual-review.json'), results.map((result) => result.manualReview));
  }

  return run;
}

function runReplayScenario(scenario, fixture, iteration) {
  const fixtureEvidence = evidenceFromFixture(fixture);
  const referenceRun = {
    ...runReferenceScenario(scenario),
    dataMode: 'replay',
    fixture: fixture.name,
    fixtureEvidence
  };
  referenceRun.output = replayOutputFor(scenario, fixtureEvidence, referenceRun.output);

  const ruleResult = judgeScenarioRun(scenario, referenceRun);
  const qualityResult = judgeQuality(scenario, referenceRun);
  const failureReasons = [
    ...ruleResult.failureReasons,
    ...qualityResult.failureReasons
  ];

  const result = {
    ...ruleResult,
    status: failureReasons.length === 0 ? 'passed' : 'failed',
    failureReasons,
    dataMode: 'replay',
    fixture: fixture.name,
    iteration,
    scores: {
      ...ruleResult.scores,
      businessQuality: qualityResult.score
    },
    quality: qualityResult,
    run: referenceRun
  };
  result.manualReview = createManualReviewRecord(result, { mode: 'replay', fixture });
  return result;
}

function evidenceFromFixture(fixture) {
  const payloads = fixture.payloads || {};
  return {
    companies: Array.isArray(payloads['companies-search'] && payloads['companies-search'].list)
      ? payloads['companies-search'].list
      : [],
    contacts: Array.isArray(payloads['profile-emails'] && payloads['profile-emails'].emails)
      ? payloads['profile-emails'].emails
      : [],
    balance: payloads['balance-before'] || null,
    emailTasks: payloads['email-tasks'] || null
  };
}

function replayOutputFor(scenario, evidence, fallbackOutput) {
  if (scenario.suite !== 'business') return fallbackOutput;

  const company = evidence.companies[0] || {};
  const contact = evidence.contacts[0] || {};
  const products = Array.isArray(company.main_products) ? company.main_products.join(', ') : 'relevant products';

  return [
    `${company.company_name || 'Target company'} is relevant because it works with ${products}.`,
    `${contact.name || 'Selected contact'} (${contact.title || 'Procurement contact'}) can be prioritized at ${contact.email || 'the verified email address'}.`,
    'Draft CTA: Could we schedule a 15-minute call next week to compare supplier fit?'
  ].join('\n');
}

module.exports = { runReplay, runReplayScenario, evidenceFromFixture };
