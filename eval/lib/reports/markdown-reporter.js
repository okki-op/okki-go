'use strict';

const path = require('node:path');
const { writeText } = require('../core/fs-utils');
const { summarize } = require('./json-reporter');

const STATUSES = ['passed', 'failed', 'warned', 'skipped'];

function writeMarkdownReport(outputDir, run) {
  const summary = summarize(run.results);
  const lines = [
    '# OKKI Go Evaluation Report',
    '',
    `Run ID: ${formatCell(run.runId)}`,
    `Mode: ${formatCell(run.mode)}`,
    `Suite: ${formatCell(run.suite)}`,
    '',
    '## Summary',
    '',
    '| Status | Count |',
    '| --- | ---: |',
    `| total | ${summary.total} |`
  ];

  for (const status of STATUSES) {
    lines.push(`| ${status} | ${summary[status]} |`);
  }

  lines.push(
    '',
    '## Cases',
    '',
    '| Case | Status | Reason |',
    '| --- | --- | --- |'
  );

  for (const result of run.results) {
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

module.exports = { writeMarkdownReport };
