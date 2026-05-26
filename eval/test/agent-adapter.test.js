const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAccioAdapter } = require('../lib/adapters/accio-adapter');
const { createClaudeAdapter } = require('../lib/adapters/claude-adapter');
const { createCodexAdapter } = require('../lib/adapters/codex-adapter');
const { createNoopAdapter } = require('../lib/adapters/noop-adapter');
const { createOpenClawAdapter } = require('../lib/adapters/openclaw-adapter');

test('noop adapter reports skipped when an agent is unavailable', () => {
  const adapter = createNoopAdapter({ agent: 'missing-agent', reason: 'agent_not_installed' });

  assert.equal(adapter.name, 'missing-agent');
  assert.deepEqual(adapter.detect(), {
    installed: false,
    reason: 'agent_not_installed'
  });
});

test('codex adapter detects executable availability through injected command lookup', () => {
  const installed = createCodexAdapter({
    commandExists: (command) => command === 'codex'
  });
  assert.deepEqual(installed.detect(), {
    installed: true,
    executable: 'codex'
  });

  const missing = createCodexAdapter({
    commandExists: () => false
  });
  assert.deepEqual(missing.detect(), {
    installed: false,
    executable: 'codex',
    reason: 'agent_not_installed'
  });
});

test('codex adapter prepares isolated profile and installs OKKI Go skill', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-adapter-'));
  const adapter = createCodexAdapter({
    commandExists: () => true,
    tmpRoot
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });

  assert.equal(profile.agent, 'codex');
  assert.equal(profile.modelProfile, 'default');
  assert.equal(profile.env.CODEX_HOME, path.join(tmpRoot, 'codex', 'default'));
  assert.equal(profile.skillDir, path.join(tmpRoot, 'codex', 'default', 'skills', 'okki-go'));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'skill.md')));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'references', 'api-reference.md')));
});

test('codex adapter can seed isolated profile from real config files', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-real-config-'));
  const realCodexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-real-codex-home-'));
  fs.writeFileSync(path.join(realCodexHome, 'auth.json'), '{"token":"redacted"}\n');
  fs.writeFileSync(path.join(realCodexHome, 'config.toml'), 'model = "gpt-test"\n');
  fs.writeFileSync(path.join(realCodexHome, 'history.jsonl'), '{"sensitive":true}\n');
  fs.mkdirSync(path.join(realCodexHome, 'log'), { recursive: true });
  fs.writeFileSync(path.join(realCodexHome, 'log', 'codex-tui.log'), 'do not copy\n');

  const adapter = createCodexAdapter({
    commandExists: () => true,
    tmpRoot,
    useRealAgentConfig: true,
    realCodexHome
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });

  assert.equal(profile.env.CODEX_HOME, path.join(tmpRoot, 'codex', 'default'));
  assert.equal(
    fs.readFileSync(path.join(profile.env.CODEX_HOME, 'auth.json'), 'utf8'),
    '{"token":"redacted"}\n'
  );
  assert.equal(
    fs.readFileSync(path.join(profile.env.CODEX_HOME, 'config.toml'), 'utf8'),
    'model = "gpt-test"\n'
  );
  assert.equal(fs.existsSync(path.join(profile.env.CODEX_HOME, 'history.jsonl')), false);
  assert.equal(fs.existsSync(path.join(profile.env.CODEX_HOME, 'log')), false);
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'skill.md')));
});

test('codex adapter executes scenario through CLI and judges captured transcript', () => {
  const adapter = createCodexAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-run-')),
    commandArgs: [path.join(__dirname, 'fixtures', 'fake-codex-cli.js')],
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      api: {
        mustCall: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
      }
    }
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'codex');
  assert.equal(result.modelProfile, 'default');
  assert.equal(result.status, 'passed');
  assert.equal(result.run.exitCode, 0);
  assert.match(result.run.transcript, /ROUTING_DECISION: triggered/);
  assert.deepEqual(result.run.apiCalls, [
    { method: 'POST', path: '/api/v1/companies/search-advanced' }
  ]);
  assert.equal(result.routingOutcome, 'triggered');
  assert.ok(result.run.durationMs >= 0);
});

test('codex adapter preserves unparseable CLI output as failed transcript evidence', () => {
  const adapter = createCodexAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-unparseable-')),
    commandArgs: [path.join(__dirname, 'fixtures', 'fake-codex-cli.js')],
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  profile.env.OKKI_FAKE_CODEX_MODE = 'NO_MARKERS';

  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' }
    }
  });

  assert.equal(result.status, 'failed');
  assert.deepEqual(result.failureReasons, ['missed_trigger']);
  assert.equal(result.run.exitCode, 0);
  assert.equal(result.run.routingDecision, null);
  assert.match(result.run.transcript, /没有结构化 marker/);
});

test('codex adapter default exec args avoid unsupported approval flag', () => {
  const fakeExecutable = makeFakeCodexExecutable();
  const adapter = createCodexAdapter({
    commandExists: () => true,
    executable: fakeExecutable,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-default-args-')),
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' }
    }
  });

  assert.equal(result.run.exitCode, 0);
  assert.ok(!result.run.args.includes('--ask-for-approval'));
});

test('codex adapter blocks failed CLI runs even when stderr echoes prompt marker examples', () => {
  const adapter = createCodexAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-failed-cli-')),
    commandArgs: [path.join(__dirname, 'fixtures', 'fake-codex-cli.js')],
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  profile.env.OKKI_FAKE_CODEX_MODE = 'ECHO_PROMPT_AND_FAIL';

  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' }
    }
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'agent_cli_execution_failed');
  assert.equal(result.run.exitCode, 1);
  assert.equal(result.run.routingDecision, null);
  assert.deepEqual(result.run.apiCalls, []);
  assert.match(result.run.transcript, /ERROR: stream disconnected/);
});

test('codex adapter parses machine-readable markers from final stdout only', () => {
  const adapter = createCodexAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-codex-stdout-only-')),
    commandArgs: [path.join(__dirname, 'fixtures', 'fake-codex-cli.js')],
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  profile.env.OKKI_FAKE_CODEX_MODE = 'STDOUT_AND_STDERR_ECHO';

  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' }
    }
  });

  assert.equal(result.status, 'passed');
  assert.deepEqual(result.run.apiCalls, [
    { method: 'POST', path: '/api/v1/companies/search-advanced' }
  ]);
  assert.match(result.run.stderr, /codex\nROUTING_DECISION/);
});

test('accio adapter detects configured account directories', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-detect-'));
  fs.mkdirSync(path.join(tmpRoot, 'accounts', 'account-1'), { recursive: true });

  const adapter = createAccioAdapter({ configRoot: tmpRoot });

  assert.deepEqual(adapter.detect(), {
    installed: true,
    executable: 'accio',
    accountId: 'account-1',
    accountDir: path.join(tmpRoot, 'accounts', 'account-1')
  });
});

test('accio adapter reports skipped when no account directory is available', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-missing-'));
  const adapter = createAccioAdapter({ configRoot: tmpRoot });

  assert.deepEqual(adapter.detect(), {
    installed: false,
    executable: 'accio',
    reason: 'accio_account_not_found'
  });
});

test('accio adapter requires explicit account id when multiple accounts exist', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-multiple-'));
  fs.mkdirSync(path.join(tmpRoot, 'accounts', 'account-1'), { recursive: true });
  fs.mkdirSync(path.join(tmpRoot, 'accounts', 'account-2'), { recursive: true });

  const adapter = createAccioAdapter({ configRoot: tmpRoot });

  assert.deepEqual(adapter.detect(), {
    installed: false,
    executable: 'accio',
    reason: 'accio_multiple_accounts',
    accounts: ['account-1', 'account-2']
  });
});

test('accio adapter prepares isolated account profile and installs OKKI Go skill', () => {
  const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-config-'));
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-adapter-'));
  fs.mkdirSync(path.join(configRoot, 'accounts', 'account-1'), { recursive: true });

  const adapter = createAccioAdapter({
    configRoot,
    tmpRoot,
    accountId: 'account-1'
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });

  assert.equal(profile.agent, 'accio');
  assert.equal(profile.modelProfile, 'default');
  assert.equal(profile.env.ACCIO_CONFIG_DIR, path.join(tmpRoot, 'accio', 'default'));
  assert.equal(profile.env.ACCIO_ACCOUNT_ID, 'account-1');
  assert.equal(
    profile.skillDir,
    path.join(tmpRoot, 'accio', 'default', 'accounts', 'account-1', 'skills', 'okki-go')
  );
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'references', 'api-reference.md')));

  const skillsConfig = JSON.parse(
    fs.readFileSync(path.join(tmpRoot, 'accio', 'default', 'accounts', 'account-1', 'skills', 'skills_config.json'), 'utf8')
  );
  assert.equal(skillsConfig['OKKI Go'].enabled, true);
});

test('accio adapter returns blocked run result until real CLI execution is enabled', () => {
  const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-run-config-'));
  fs.mkdirSync(path.join(configRoot, 'accounts', 'account-1'), { recursive: true });
  const adapter = createAccioAdapter({
    configRoot,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-run-')),
    accountId: 'account-1'
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing'
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'accio');
  assert.equal(result.modelProfile, 'default');
  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'agent_cli_execution_not_implemented');
});

test('accio adapter executes scenario through configured CLI and judges captured JSON transcript', () => {
  const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-cli-config-'));
  fs.mkdirSync(path.join(configRoot, 'accounts', 'account-1'), { recursive: true });
  const adapter = createAccioAdapter({
    configRoot,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-accio-cli-run-')),
    accountId: 'account-1',
    executable: process.execPath,
    commandArgs: [
      path.join(__dirname, 'fixtures', 'fake-agent-cli.js'),
      'agent',
      '--message',
      '{prompt}',
      '--json'
    ],
    timeoutMs: 5000
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      api: {
        mustCall: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
      }
    }
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'accio');
  assert.equal(result.modelProfile, 'default');
  assert.equal(result.status, 'passed');
  assert.equal(result.run.exitCode, 0);
  assert.deepEqual(result.run.apiCalls, [
    { method: 'POST', path: '/api/v1/companies/search-advanced' }
  ]);
  assert.equal(result.routingOutcome, 'triggered');
  assert.ok(result.run.args.includes('--message'));
});

test('openclaw adapter detects executable availability through injected command lookup', () => {
  const installed = createOpenClawAdapter({
    commandExists: (command) => command === 'openclaw'
  });
  assert.deepEqual(installed.detect(), {
    installed: true,
    executable: 'openclaw'
  });

  const missing = createOpenClawAdapter({
    commandExists: () => false
  });
  assert.deepEqual(missing.detect(), {
    installed: false,
    executable: 'openclaw',
    reason: 'agent_not_installed'
  });
});

test('openclaw adapter prepares isolated profile and installs OKKI Go skill', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-openclaw-adapter-'));
  const adapter = createOpenClawAdapter({
    commandExists: () => true,
    tmpRoot
  });

  const profile = adapter.prepareProfile({ modelProfile: 'gpt-4.1' });

  assert.equal(profile.agent, 'openclaw');
  assert.equal(profile.modelProfile, 'gpt-4.1');
  assert.equal(profile.env.OPENCLAW_CONFIG_DIR, path.join(tmpRoot, 'openclaw', 'gpt-4.1'));
  assert.equal(profile.skillDir, path.join(tmpRoot, 'openclaw', 'gpt-4.1', 'skills', 'okki-go'));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'references', 'api-reference.md')));
  assert.equal(profile.env.OPENCLAW_STATE_DIR, path.join(tmpRoot, 'openclaw', 'gpt-4.1'));
  assert.equal(profile.env.OPENCLAW_CONFIG_PATH, path.join(tmpRoot, 'openclaw', 'gpt-4.1', 'openclaw.json'));
  assert.ok(fs.existsSync(profile.env.OPENCLAW_CONFIG_PATH));
});

test('openclaw adapter executes scenario through CLI and judges captured JSON transcript', () => {
  const adapter = createOpenClawAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-openclaw-cli-run-')),
    commandArgs: [
      path.join(__dirname, 'fixtures', 'fake-agent-cli.js'),
      'agent',
      '--agent',
      'main',
      '--message',
      '{prompt}',
      '--local',
      '--json'
    ],
    timeoutMs: 5000
  });
  const profile = adapter.prepareProfile({ modelProfile: 'default' });
  const result = adapter.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ],
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      api: {
        mustCall: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
      }
    }
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'openclaw');
  assert.equal(result.modelProfile, 'default');
  assert.equal(result.status, 'passed');
  assert.equal(result.run.exitCode, 0);
  assert.match(result.run.transcript, /payloads/);
  assert.deepEqual(result.run.apiCalls, [
    { method: 'POST', path: '/api/v1/companies/search-advanced' }
  ]);
  assert.equal(result.routingOutcome, 'triggered');
});

test('claude adapter detects executable availability through injected command lookup', () => {
  const installed = createClaudeAdapter({
    commandExists: (command) => command === 'claude'
  });
  assert.deepEqual(installed.detect(), {
    installed: true,
    executable: 'claude'
  });

  const missing = createClaudeAdapter({
    commandExists: () => false
  });
  assert.deepEqual(missing.detect(), {
    installed: false,
    executable: 'claude',
    reason: 'agent_not_installed'
  });
});

test('claude adapter prepares isolated profile and installs OKKI Go skill', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-claude-adapter-'));
  const adapter = createClaudeAdapter({
    commandExists: () => true,
    tmpRoot
  });

  const profile = adapter.prepareProfile({ modelProfile: 'default' });

  assert.equal(profile.agent, 'claude');
  assert.equal(profile.modelProfile, 'default');
  assert.equal(profile.env.CLAUDE_CONFIG_DIR, path.join(tmpRoot, 'claude', 'default'));
  assert.equal(profile.skillDir, path.join(tmpRoot, 'claude', 'default', 'skills', 'okki-go'));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'skill.md')));
  assert.ok(fs.existsSync(path.join(profile.skillDir, 'references', 'api-reference.md')));
});

test('openclaw adapter blocks failed CLI execution with transcript evidence', () => {
  const openclaw = createOpenClawAdapter({
    commandExists: () => true,
    executable: process.execPath,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-openclaw-failed-run-')),
    commandArgs: [path.join(__dirname, 'fixtures', 'fake-agent-cli.js'), '--message', '{prompt}'],
    timeoutMs: 5000
  });
  const profile = openclaw.prepareProfile({ modelProfile: 'default' });
  profile.env.OKKI_FAKE_AGENT_MODE = 'FAIL';
  const result = openclaw.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    userTurns: [
      { role: 'user', content: '帮我找德国汽车零部件进口商，最好有联系人邮箱' }
    ]
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'openclaw');
  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'agent_cli_execution_failed');
  assert.equal(result.run.exitCode, 1);
  assert.match(result.run.stderr, /fake Agent CLI failed/);
});

test('claude adapter returns blocked run result until CLI execution is enabled', () => {
  const claude = createClaudeAdapter({
    commandExists: () => true,
    tmpRoot: fs.mkdtempSync(path.join(os.tmpdir(), 'okki-claude-run-'))
  });

  const profile = claude.prepareProfile({ modelProfile: 'default' });
  const result = claude.runScenario(profile, {
    id: 'trigger-company-search-industry-country',
    suite: 'routing'
  });

  assert.equal(result.caseId, 'trigger-company-search-industry-country');
  assert.equal(result.agent, 'claude');
  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'agent_cli_execution_not_implemented');
});

function makeFakeCodexExecutable() {
  const scriptPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'okki-fake-codex-command-')), 'codex');
  const fixturePath = path.join(__dirname, 'fixtures', 'fake-codex-cli.js');
  fs.writeFileSync(
    scriptPath,
    ['#!/bin/sh', `exec "${process.execPath}" "${fixturePath}" "$@"`, ''].join('\n')
  );
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}
