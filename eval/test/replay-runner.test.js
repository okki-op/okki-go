const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCommand } = require('../lib/core/process');
const { readJson } = require('../lib/core/fs-utils');
const { runReplay } = require('../lib/runners/replay-runner');

const evalRoot = path.resolve(__dirname, '..');

test('runReplay executes selected scenarios against a replay fixture', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-replay-'));

  const run = runReplay({
    suite: 'business',
    fixture: 'vertical-auto-parts-de',
    scenarios: ['e2e-procurement-outreach'],
    outputDir,
    report: true
  });

  assert.equal(run.mode, 'replay');
  assert.equal(run.fixture.name, 'vertical-auto-parts-de');
  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].caseId, 'e2e-procurement-outreach');
  assert.equal(run.results[0].dataMode, 'replay');
  assert.equal(run.results[0].fixture, 'vertical-auto-parts-de');
  assert.equal(run.results[0].scores.businessQuality, 100);
  assert.equal(run.results[0].manualReview.required, false);
  assert.ok(fs.existsSync(path.join(outputDir, 'summary.json')));
  assert.ok(fs.existsSync(path.join(outputDir, 'cases.json')));
  assert.ok(fs.existsSync(path.join(outputDir, 'manual-review.json')));
});

test('runReplay repeats scenarios with stable iteration metadata', () => {
  const run = runReplay({
    suite: 'routing',
    fixture: 'vertical-auto-parts-de',
    scenarios: ['trigger-company-search-industry-country'],
    repeat: 2
  });

  assert.deepEqual(run.results.map((result) => result.iteration), [1, 2]);
  assert.deepEqual(run.results.map((result) => result.caseId), [
    'trigger-company-search-industry-country',
    'trigger-company-search-industry-country'
  ]);
});

test('CLI replay mode writes report metadata and exits 0 for passing cases', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-cli-replay-'));

  const result = runCommand(
    process.execPath,
    [
      path.join(evalRoot, 'run.js'),
      '--mode',
      'replay',
      '--suite',
      'business',
      '--fixture',
      'vertical-auto-parts-de',
      '--scenarios',
      'e2e-procurement-outreach',
      '--report',
      '--output-dir',
      outputDir
    ],
    { cwd: evalRoot }
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Mode: replay/);
  assert.match(result.stdout, /Fixture: vertical-auto-parts-de/);
  assert.match(result.stdout, /Failed: 0/);

  const summary = readJson(path.join(outputDir, 'summary.json'));
  assert.equal(summary.mode, 'replay');
  assert.equal(summary.fixture.name, 'vertical-auto-parts-de');
  assert.equal(summary.summary.failed, 0);
  assert.equal(summary.summary.business.averageQualityScore, 100);
});

test('runReplay requires an explicit fixture name', () => {
  assert.throws(
    () => runReplay({ suite: 'routing' }),
    /Replay mode requires --fixture/
  );
});
