'use strict';

const path = require('node:path');
const { writeJson } = require('../core/fs-utils');

const STATUSES = ['passed', 'failed', 'warned', 'skipped'];

function summarize(results) {
  const normalizedResults = normalizeResults(results);
  const summary = {
    total: normalizedResults.length,
    passed: 0,
    failed: 0,
    warned: 0,
    skipped: 0
  };

  for (const result of normalizedResults) {
    if (STATUSES.includes(result.status)) {
      summary[result.status] += 1;
    }
  }

  return summary;
}

function writeJsonReport(outputDir, run) {
  const results = normalizeResults(run.results);
  writeJson(path.join(outputDir, 'summary.json'), {
    ...run,
    results,
    summary: summarize(results)
  });
  writeJson(path.join(outputDir, 'cases.json'), results);
}

function normalizeResults(results) {
  return Array.isArray(results) ? results : [];
}

module.exports = { writeJsonReport, summarize };
