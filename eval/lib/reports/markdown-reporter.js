'use strict';

const path = require('node:path');
const { writeText } = require('../core/fs-utils');
const { summarize } = require('./json-reporter');

const STATUSES = ['passed', 'failed', 'warned', 'skipped', 'blocked'];

function writeMarkdownReport(outputDir, run) {
  const results = Array.isArray(run.results) ? run.results : [];
  const summary = summarize(results);
  const lines = [
    '# OKKI Go Evaluation Report',
    '',
    `Run ID: ${formatCell(run.runId)}`,
    `Mode: ${formatCell(run.mode)}`,
    `Suite: ${formatCell(run.suite)}`
  ];

  if (run.fixture) {
    lines.push(`Fixture: ${formatCell(fixtureName(run.fixture))}`);
  }

  lines.push(
    '',
    '## Summary',
    '',
    '| Status | Count |',
    '| --- | ---: |',
    `| total | ${summary.total} |`
  );

  for (const status of STATUSES) {
    lines.push(`| ${status} | ${summary[status]} |`);
  }

  appendRoutingSection(lines, summary.routing);
  appendBusinessSection(lines, summary.business);
  appendManualReviewSection(lines, summary.manualReview);

  lines.push(
    '',
    '## Cases',
    '',
    '| Case | Status | Reason |',
    '| --- | --- | --- |'
  );

  for (const result of results) {
    lines.push(`| ${formatCell(result.caseId || result.id)} | ${formatCell(result.status)} | ${formatCell(reasonFor(result))} |`);
  }

  writeText(path.join(outputDir, 'report.md'), `${lines.join('\n')}\n`);
}

function reasonFor(result) {
  if (Array.isArray(result.failureReasons)) {
    return result.failureReasons.join('; ');
  }
  return result.reason || '';
}

function formatCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function appendRoutingSection(lines, routing) {
  lines.push(
    '',
    '## Routing Evaluation',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| positive recall | ${formatMetric(routing.positiveRecall)} |`,
    `| negative precision | ${formatMetric(routing.negativePrecision)} |`,
    `| boundary accuracy | ${formatMetric(routing.boundaryAccuracy)} |`,
    `| missed triggers | ${routing.missedTriggers.length} |`,
    `| wrong triggers | ${routing.wrongTriggers.length} |`
  );
}

function appendBusinessSection(lines, business) {
  lines.push(
    '',
    '## Business Evaluation',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| scored cases | ${business.scored} |`,
    `| average quality score | ${formatMetric(business.averageQualityScore)} |`
  );
}

function appendManualReviewSection(lines, manualReview) {
  lines.push(
    '',
    '## Manual Review',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| required | ${manualReview.required} |`,
    `| pending | ${manualReview.pending} |`
  );
}

function formatMetric(value) {
  return value === null || value === undefined ? '-' : String(value);
}

function fixtureName(fixture) {
  if (typeof fixture === 'string') return fixture;
  return fixture.name || '';
}

module.exports = { writeMarkdownReport };
