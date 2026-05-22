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
      skipped: 1,
      blocked: 0,
      routing: emptyRoutingSummary(),
      business: emptyBusinessSummary(),
      manualReview: emptyManualReviewSummary()
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
    skipped: 1,
    blocked: 0,
    routing: emptyRoutingSummary(),
    business: emptyBusinessSummary(),
    manualReview: emptyManualReviewSummary()
  });
});

test('reporters treat missing and non-array results as empty lists', () => {
  for (const results of [undefined, null, 'not-an-array']) {
    const outputDir = makeOutputDir();
    const run = { runId: 'empty-run', mode: 'local-core', suite: 'routing' };
    if (results !== undefined) run.results = results;

    writeJsonReport(outputDir, run);
    writeMarkdownReport(outputDir, run);

    assert.deepEqual(readJson(path.join(outputDir, 'summary.json')).summary, {
      total: 0,
      passed: 0,
      failed: 0,
      warned: 0,
      skipped: 0,
      blocked: 0,
      routing: emptyRoutingSummary(),
      business: emptyBusinessSummary(),
      manualReview: emptyManualReviewSummary()
    });
    assert.deepEqual(readJson(path.join(outputDir, 'cases.json')), []);
    assert.match(readText(path.join(outputDir, 'report.md')), /\| total \| 0 \|/);
  }
});

test('summarize includes unknown statuses in total but not known buckets', () => {
  assert.deepEqual(summarize([{ status: 'passed' }, { status: 'unknown' }]), {
    total: 2,
    passed: 1,
    failed: 0,
    warned: 0,
    skipped: 0,
    blocked: 0,
    routing: emptyRoutingSummary(),
    business: emptyBusinessSummary(),
    manualReview: emptyManualReviewSummary()
  });
});

test('summarize includes routing, business, and manual review phase 2 aggregates', () => {
  const summary = summarize([
    {
      caseId: 'positive-pass',
      suite: 'routing',
      status: 'passed',
      routingExpectedDecision: 'should_trigger',
      routingOutcome: 'triggered'
    },
    {
      caseId: 'positive-miss',
      suite: 'routing',
      status: 'failed',
      routingExpectedDecision: 'should_trigger',
      routingOutcome: 'not_triggered',
      failureReasons: ['missed_trigger']
    },
    {
      caseId: 'negative-pass',
      suite: 'routing',
      status: 'passed',
      routingExpectedDecision: 'should_not_trigger',
      routingOutcome: 'not_triggered'
    },
    {
      caseId: 'boundary-pass',
      suite: 'routing',
      status: 'passed',
      routingExpectedDecision: 'boundary',
      routingOutcome: 'triggered'
    },
    {
      caseId: 'business-pass',
      suite: 'business',
      status: 'passed',
      scores: { businessQuality: 80 },
      quality: { dimensions: { contactSelection: 100, factuality: 50 } }
    },
    {
      caseId: 'business-review',
      suite: 'business',
      status: 'failed',
      scores: { businessQuality: 40 },
      manualReview: { required: true, status: 'pending' },
      quality: { dimensions: { contactSelection: 0, factuality: 100 } }
    }
  ]);

  assert.equal(summary.routing.positiveRecall, 50);
  assert.equal(summary.routing.negativePrecision, 100);
  assert.equal(summary.routing.boundaryAccuracy, 100);
  assert.deepEqual(summary.routing.missedTriggers, ['positive-miss']);
  assert.equal(summary.business.averageQualityScore, 60);
  assert.deepEqual(summary.business.dimensionAverages, {
    contactSelection: 50,
    factuality: 75
  });
  assert.equal(summary.manualReview.required, 1);
  assert.equal(summary.manualReview.pending, 1);
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
  assert.match(report, /\| blocked \| 0 \|/);
  assert.match(report, /\| Case \| Status \| Reason \|/);
  assert.match(report, /\| scenario-fail \| failed \| missing required confirmation; timeout waiting for answer \|/);
  assert.ok(fs.existsSync(path.join(outputDir, 'report.md')));
});

test('writeMarkdownReport escapes markdown table cells', () => {
  const outputDir = makeOutputDir();
  writeMarkdownReport(outputDir, {
    runId: 'run|pipe',
    mode: 'local-core',
    suite: 'routing',
    results: [
      { caseId: 'case|id', status: 'failed', failureReasons: ['line one\nline two', 'bad | pipe'] }
    ]
  });

  const report = readText(path.join(outputDir, 'report.md'));
  assert.match(report, /Run ID: run\\\|pipe/);
  assert.match(report, /\| case\\\|id \| failed \| line one line two; bad \\\| pipe \|/);
});

test('writeMarkdownReport includes phase 2 routing, business, and manual review sections', () => {
  const outputDir = makeOutputDir();
  writeMarkdownReport(outputDir, {
    runId: 'phase2',
    mode: 'replay',
    suite: 'business',
    fixture: { name: 'vertical-auto-parts-de' },
    results: [
      {
        caseId: 'e2e-procurement-outreach',
        suite: 'business',
        status: 'passed',
        scores: { businessQuality: 100 },
        manualReview: { required: false, status: 'not_required' }
      },
      {
        caseId: 'trigger-company-search-industry-country',
        suite: 'routing',
        status: 'passed',
        routingExpectedDecision: 'should_trigger',
        routingOutcome: 'triggered'
      }
    ]
  });

  const report = readText(path.join(outputDir, 'report.md'));
  assert.match(report, /Fixture: vertical-auto-parts-de/);
  assert.match(report, /## Routing Evaluation/);
  assert.match(report, /positive recall/);
  assert.match(report, /## Business Evaluation/);
  assert.match(report, /average quality score/);
  assert.match(report, /## Manual Review/);
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

function emptyRoutingSummary() {
  return {
    positives: 0,
    positiveRecall: null,
    negatives: 0,
    negativePrecision: null,
    boundaries: 0,
    boundaryAccuracy: null,
    missedTriggers: [],
    wrongTriggers: []
  };
}

function emptyBusinessSummary() {
  return {
    scored: 0,
    averageQualityScore: null,
    dimensionAverages: {}
  };
}

function emptyManualReviewSummary() {
  return {
    required: 0,
    pending: 0
  };
}
