const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCommand } = require('../lib/core/process');
const { readJson } = require('../lib/core/fs-utils');
const { runLocalAgent } = require('../lib/runners/local-agent-runner');

const evalRoot = path.resolve(__dirname, '..');

test('runLocalAgent marks missing agents as skipped', () => {
  const run = runLocalAgent({
    suite: 'routing',
    agents: ['codex'],
    scenarios: ['trigger-company-search-industry-country'],
    adapterFactory: () => ({
      name: 'codex',
      detect: () => ({ installed: false, reason: 'agent_not_installed' })
    })
  });

  assert.equal(run.mode, 'local-agent');
  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].status, 'skipped');
  assert.equal(run.results[0].agent, 'codex');
  assert.equal(run.results[0].reason, 'agent_not_installed');
});

test('runLocalAgent prepares installed agent profiles and records blocked scenario execution', () => {
  const run = runLocalAgent({
    suite: 'routing',
    agents: ['codex'],
    models: ['default'],
    scenarios: ['trigger-company-search-industry-country'],
    adapterFactory: () => makeInstalledAdapter('codex')
  });

  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].status, 'blocked');
  assert.equal(run.results[0].agent, 'codex');
  assert.equal(run.results[0].modelProfile, 'default');
  assert.equal(run.results[0].caseId, 'trigger-company-search-industry-country');
  assert.equal(run.results[0].reason, 'agent_cli_execution_not_implemented');
});

test('runLocalAgent records judged results from an executing adapter', () => {
  const run = runLocalAgent({
    suite: 'routing',
    agents: ['codex'],
    models: ['default'],
    scenarios: ['trigger-company-search-industry-country'],
    adapterFactory: () => ({
      name: 'codex',
      detect: () => ({ installed: true, executable: 'codex' }),
      prepareProfile: ({ modelProfile }) => ({ agent: 'codex', modelProfile, env: {}, skillDir: '/tmp/skill' }),
      runScenario: (profile, scenario) => ({
        caseId: scenario.id,
        suite: scenario.suite,
        agent: profile.agent,
        modelProfile: profile.modelProfile,
        status: 'passed',
        routingExpectedDecision: 'should_trigger',
        routingOutcome: 'triggered',
        run: {
          exitCode: 0,
          transcript: 'ROUTING_DECISION: triggered\nAPI_CALL: POST /api/v1/companies/search-advanced',
          apiCalls: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
        }
      })
    })
  });

  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].status, 'passed');
  assert.equal(run.results[0].routingOutcome, 'triggered');
  assert.match(run.results[0].run.transcript, /API_CALL: POST/);
});

test('runLocalAgent writes reports with agent coverage metadata', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-local-agent-'));
  const run = runLocalAgent({
    suite: 'routing',
    agents: ['codex'],
    scenarios: ['trigger-company-search-industry-country'],
    outputDir,
    report: true,
    adapterFactory: () => ({
      name: 'codex',
      detect: () => ({ installed: false, reason: 'agent_not_installed' })
    })
  });

  assert.equal(run.outputDir, outputDir);
  const summary = readJson(path.join(outputDir, 'summary.json'));
  assert.equal(summary.mode, 'local-agent');
  assert.equal(summary.summary.skipped, 1);
  assert.deepEqual(summary.agentCoverage, [
    { agent: 'codex', installed: false, reason: 'agent_not_installed' }
  ]);
});

test('CLI local-agent exits 0 when selected agent is skipped', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-local-agent-'));
  const result = runCommand(
    process.execPath,
    [
      path.join(evalRoot, 'run.js'),
      '--mode',
      'local-agent',
      '--suite',
      'routing',
      '--agents',
      'definitely-not-installed-okki-agent',
      '--scenarios',
      'trigger-company-search-industry-country',
      '--report',
      '--output-dir',
      outputDir
    ],
    { cwd: evalRoot }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Mode: local-agent/);
  const summary = readJson(path.join(outputDir, 'summary.json'));
  assert.equal(summary.summary.skipped, 1);
});

test('CLI local-agent can prepare Accio profile when account id is configured', () => {
  const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-accio-config-'));
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-accio-out-'));
  fs.mkdirSync(path.join(configRoot, 'accounts', 'account-1'), { recursive: true });

  const result = runCommand(
    process.execPath,
    [
      path.join(evalRoot, 'run.js'),
      '--mode',
      'local-agent',
      '--suite',
      'routing',
      '--agents',
      'accio',
      '--scenarios',
      'trigger-company-search-industry-country',
      '--report',
      '--output-dir',
      outputDir
    ],
    {
      cwd: evalRoot,
      env: {
        ACCIO_CONFIG_DIR: configRoot,
        ACCIO_ACCOUNT_ID: 'account-1'
      }
    }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = readJson(path.join(outputDir, 'summary.json'));
  assert.equal(summary.agentCoverage[0].agent, 'accio');
  assert.equal(summary.agentCoverage[0].installed, true);
  assert.equal(summary.agentCoverage[0].accountId, 'account-1');
  assert.equal(summary.summary.blocked, 1);
});

test('runLocalAgent can use OpenClaw and Claude adapters from the registry', () => {
  const run = runLocalAgent({
    suite: 'routing',
    agents: ['openclaw', 'claudecode'],
    models: ['default'],
    scenarios: ['trigger-company-search-industry-country'],
    commandExists: () => true
  });

  assert.deepEqual(run.agentCoverage.map((coverage) => coverage.agent), ['openclaw', 'claudecode']);
  assert.deepEqual(run.agentCoverage.map((coverage) => coverage.installed), [true, true]);
  assert.deepEqual(run.results.map((result) => result.status), ['blocked', 'blocked']);
  assert.deepEqual(run.results.map((result) => result.agent), ['openclaw', 'claude']);
});

function makeInstalledAdapter(name) {
  return {
    name,
    detect: () => ({ installed: true, executable: name }),
    prepareProfile: ({ modelProfile }) => ({ agent: name, modelProfile, env: {}, skillDir: '/tmp/skill' }),
    runScenario: (profile, scenario) => ({
      caseId: scenario.id,
      suite: scenario.suite,
      agent: profile.agent,
      modelProfile: profile.modelProfile,
      status: 'blocked',
      reason: 'agent_cli_execution_not_implemented'
    })
  };
}
