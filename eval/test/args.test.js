const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs } = require('../lib/cli/args');

test('parseArgs defaults to local-core and all suite', () => {
  const args = parseArgs([]);
  assert.equal(args.mode, 'local-core');
  assert.equal(args.suite, 'all');
  assert.equal(args.report, false);
  assert.deepEqual(args.agents, []);
  assert.deepEqual(args.scenarios, []);
});

test('parseArgs parses comma-separated agents and scenarios', () => {
  const args = parseArgs([
    '--mode', 'local-core',
    '--suite', 'routing',
    '--agents', 'codex,openclaw',
    '--scenarios', 'a,b',
    '--report'
  ]);
  assert.equal(args.mode, 'local-core');
  assert.equal(args.suite, 'routing');
  assert.deepEqual(args.agents, ['codex', 'openclaw']);
  assert.deepEqual(args.scenarios, ['a', 'b']);
  assert.equal(args.report, true);
});

test('parseArgs rejects unsupported mode', () => {
  assert.throws(() => parseArgs(['--mode', 'live']), /Unsupported mode in Phase 1/);
});

test('parseArgs rejects missing value before next option', () => {
  assert.throws(
    () => parseArgs(['--agents', '--report']),
    /Missing value for --agents/
  );
});

test('parseArgs rejects missing output directory value', () => {
  assert.throws(
    () => parseArgs(['--output-dir']),
    /Missing value for --output-dir/
  );
});

test('parseArgs rejects unsupported suite', () => {
  assert.throws(() => parseArgs(['--suite', 'unknown']), /Unsupported suite/);
});

test('parseArgs parses models and output directory', () => {
  const args = parseArgs(['--models', 'a,b', '--output-dir', 'out']);
  assert.deepEqual(args.models, ['a', 'b']);
  assert.equal(args.outputDir, 'out');
});

test('parseArgs supports phase 2 replay fixture and repeat options', () => {
  const args = parseArgs([
    '--mode',
    'replay',
    '--suite',
    'business',
    '--fixture',
    'vertical-auto-parts-de',
    '--repeat',
    '3'
  ]);

  assert.equal(args.mode, 'replay');
  assert.equal(args.suite, 'business');
  assert.equal(args.fixture, 'vertical-auto-parts-de');
  assert.equal(args.repeat, 3);
});

test('parseArgs supports mock as a scenario data mode', () => {
  const args = parseArgs(['--mode', 'mock', '--suite', 'routing']);
  assert.equal(args.mode, 'mock');
  assert.equal(args.suite, 'routing');
});

test('parseArgs supports phase 3 local-agent options', () => {
  const args = parseArgs([
    '--mode',
    'local-agent',
    '--suite',
    'routing',
    '--agents',
    'codex,openclaw',
    '--models',
    'default,gpt-4.1',
    '--agent-cli',
    '/tmp/fake-agent',
    '--agent-cli-args',
    'agent,--message,{prompt},--json',
    '--use-real-agent-config'
  ]);

  assert.equal(args.mode, 'local-agent');
  assert.deepEqual(args.agents, ['codex', 'openclaw']);
  assert.deepEqual(args.models, ['default', 'gpt-4.1']);
  assert.equal(args.agentCli, '/tmp/fake-agent');
  assert.deepEqual(args.agentCliArgs, ['agent', '--message', '{prompt}', '--json']);
  assert.equal(args.useRealAgentConfig, true);
});

test('parseArgs rejects invalid repeat values', () => {
  assert.throws(
    () => parseArgs(['--repeat', '0']),
    /--repeat must be a positive integer/
  );
  assert.throws(
    () => parseArgs(['--repeat', '1.5']),
    /--repeat must be a positive integer/
  );
});

test('parseArgs supports fixture capture command with live safety flags', () => {
  const args = parseArgs([
    'fixtures',
    'capture',
    '--scenario',
    'vertical-auto-parts-de',
    '--allow-real-api',
    '--max-paid-credits',
    '5',
    '--no-email-send'
  ]);

  assert.equal(args.command, 'fixtures');
  assert.equal(args.subcommand, 'capture');
  assert.equal(args.scenario, 'vertical-auto-parts-de');
  assert.equal(args.allowRealApi, true);
  assert.equal(args.maxPaidCredits, 5);
  assert.equal(args.allowEmailSend, false);
});

test('parseArgs supports explicit email send allowlist for capture', () => {
  const args = parseArgs([
    'fixtures',
    'capture',
    '--scenario',
    'email-smoke',
    '--allow-real-api',
    '--allow-email-send',
    '--email-allowlist',
    'test@example.com,qa@example.com',
    '--max-edm-sends',
    '1'
  ]);

  assert.equal(args.allowEmailSend, true);
  assert.deepEqual(args.emailAllowlist, ['test@example.com', 'qa@example.com']);
  assert.equal(args.maxEdmSends, 1);
});
