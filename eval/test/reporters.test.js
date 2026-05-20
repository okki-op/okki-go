const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readJson, readText } = require('../lib/core/fs-utils');
const { writeJsonReport, summarize } = require('../lib/reports/json-reporter');
const { writeMarkdownReport } = require('../lib/reports/markdown-reporter');

test('writeJsonReport writes summary and cases reports', () => {
  const outputDir = makeOutputDir();
  const run = makeRun();

  writeJsonReport(outputDir, run);

  assert.deepEqual(readJson(path.join(outputDir, 'summary.json')), {
    ...run,
    summary: {
      total: 4,
      passed: 1,
      failed: 1,
      warned: 1,
      skipped: 1
    }
  });
  assert.deepEqual(readJson(path.join(outputDir, 'cases.json')), run.results);
});

test('summarize counts exact result statuses', () => {
  assert.deepEqual(summarize(makeRun().results), {
    total: 4,
    passed: 1,
    failed: 1,
    warned: 1,
    skipped: 1
  });
});

test('writeMarkdownReport writes run metadata, summary, cases, and failure reasons', () => {
  const outputDir = makeOutputDir();
  const run = makeRun();

  writeMarkdownReport(outputDir, run);

  const report = readText(path.join(outputDir, 'report.md'));
  assert.match(report, /# OKKI Go Evaluation Report/);
  assert.match(report, /Run ID: run-123/);
  assert.match(report, /Mode: local-core/);
  assert.match(report, /Suite: smoke/);
  assert.match(report, /\| Status \| Count \|/);
  assert.match(report, /\| failed \| 1 \|/);
  assert.match(report, /\| Case \| Status \| Reason \|/);
  assert.match(report, /\| scenario-fail \| failed \| missing required confirmation; timeout waiting for answer \|/);
  assert.ok(fs.existsSync(path.join(outputDir, 'report.md')));
});

function makeRun() {
  return {
    runId: 'run-123',
    mode: 'local-core',
    suite: 'smoke',
    results: [
      { caseId: 'scenario-pass', status: 'passed' },
      {
        caseId: 'scenario-fail',
        status: 'failed',
        failureReasons: ['missing required confirmation', 'timeout waiting for answer']
      },
      { id: 'static-warning', status: 'warned', reason: 'legacy runtime flag' },
      { id: 'install-skip', status: 'skipped', reason: 'runtime unavailable' }
    ]
  };
}

function makeOutputDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'okki-reporters-'));
}
