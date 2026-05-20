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
