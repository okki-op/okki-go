const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCommand } = require('../lib/core/process');
const { readJson } = require('../lib/core/fs-utils');
const { runLocalCore } = require('../lib/runners/local-core-runner');

const evalRoot = path.resolve(__dirname, '..');

test('CLI local-core routing suite exits 0 and writes reports to output dir', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-routing-'));

  const result = runCommand(
    process.execPath,
    [
      path.join(evalRoot, 'run.js'),
      '--mode',
      'local-core',
      '--suite',
      'routing',
      '--report',
      '--output-dir',
      outputDir
    ],
    { cwd: evalRoot }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Completed: \d+/);
  assert.match(result.stdout, /Failed: 0/);
  assert.match(result.stdout, new RegExp(`Output: ${escapeRegExp(outputDir)}`));

  const summaryPath = path.join(outputDir, 'summary.json');
  const reportPath = path.join(outputDir, 'report.md');
  assert.ok(fs.existsSync(summaryPath), 'summary.json should exist');
  assert.ok(fs.existsSync(reportPath), 'report.md should exist');

  const summary = readJson(summaryPath);
  assert.equal(summary.mode, 'local-core');
  assert.equal(summary.suite, 'routing');
  assert.equal(summary.summary.failed, 0);
  assert.ok(summary.summary.total > 0);
});

test('runLocalCore applies selected scenario filter across all scenario suites', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-all-filter-'));

  const run = runLocalCore({
    suite: 'all',
    scenarios: [
      'trigger-company-search-industry-country',
      'e2e-find-prospects-no-paid-call',
      'email-send-confirmation'
    ],
    outputDir
  });

  const scenarioResults = run.results.filter((result) => result.caseId);
  assert.deepEqual(scenarioResults.map((result) => result.suite), ['routing', 'business', 'safety']);
  assert.deepEqual(scenarioResults.map((result) => result.caseId), [
    'trigger-company-search-industry-country',
    'e2e-find-prospects-no-paid-call',
    'email-send-confirmation'
  ]);
  assert.equal(run.results.filter((result) => result.caseId === 'e2e-find-prospects-no-paid-call').length, 1);
  assert.equal(fs.existsSync(path.join(outputDir, 'summary.json')), false);
  assert.equal(fs.existsSync(path.join(outputDir, 'report.md')), false);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
