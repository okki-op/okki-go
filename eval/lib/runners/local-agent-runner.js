'use strict';

const path = require('node:path');
const { ensureDir } = require('../core/fs-utils');
const { fromEvalRoot, makeRunId } = require('../core/paths');
const { createAdapter } = require('../adapters/registry');
const { writeJsonReport } = require('../reports/json-reporter');
const { writeMarkdownReport } = require('../reports/markdown-reporter');
const { loadScenarios } = require('../scenarios/loader');

const DEFAULT_AGENTS = ['codex'];

function runLocalAgent(options = {}) {
  const suite = options.suite || 'routing';
  const agents = options.agents && options.agents.length > 0 ? options.agents : DEFAULT_AGENTS;
  const models = options.models && options.models.length > 0 ? options.models : ['default'];
  const runId = options.runId || makeRunId();
  const outputDir = path.resolve(options.outputDir || fromEvalRoot('results', runId));
  ensureDir(outputDir);

  const scenarios = loadScenarios({ suite, scenarios: options.scenarios || [] });
  const adapterFactory = options.adapterFactory || ((agent) => createAdapter(agent, options));
  const results = [];
  const agentCoverage = [];

  for (const agent of agents) {
    const adapter = adapterFactory(agent);
    const detection = adapter.detect();
    agentCoverage.push({
      agent,
      installed: detection.installed,
      executable: detection.executable,
      reason: detection.reason,
      accountId: detection.accountId,
      accountDir: detection.accountDir,
      accounts: detection.accounts
    });

    if (!detection.installed) {
      results.push(skippedAgentResult(agent, detection.reason || 'agent_not_installed', suite));
      continue;
    }

    for (const modelProfile of models) {
      let profile;
      try {
        profile = adapter.prepareProfile({ modelProfile });
      } catch (error) {
        results.push({
          id: `agent-${agent}-${modelProfile}-profile`,
          suite,
          agent,
          modelProfile,
          status: 'blocked',
          reason: 'agent_profile_prepare_failed',
          error: error.message
        });
        continue;
      }

      for (const scenario of scenarios) {
        results.push(adapter.runScenario(profile, scenario));
      }
    }
  }

  const run = {
    runId,
    mode: 'local-agent',
    suite,
    outputDir,
    agents,
    models,
    agentCoverage: normalizeCoverage(agentCoverage),
    results
  };

  if (options.report) {
    writeJsonReport(outputDir, run);
    writeMarkdownReport(outputDir, run);
  }

  return run;
}

function skippedAgentResult(agent, reason, suite) {
  return {
    id: `agent-${agent}-skipped`,
    suite,
    agent,
    status: 'skipped',
    reason
  };
}

function normalizeCoverage(agentCoverage) {
  return agentCoverage.map((coverage) => {
    const normalized = {
      agent: coverage.agent,
      installed: coverage.installed
    };
    if (coverage.executable) normalized.executable = coverage.executable;
    if (coverage.reason) normalized.reason = coverage.reason;
    if (coverage.accountId) normalized.accountId = coverage.accountId;
    if (coverage.accountDir) normalized.accountDir = coverage.accountDir;
    if (coverage.accounts) normalized.accounts = coverage.accounts;
    return normalized;
  });
}

module.exports = { runLocalAgent };
