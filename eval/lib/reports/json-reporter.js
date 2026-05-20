'use strict';

const path = require('node:path');
const { writeJson } = require('../core/fs-utils');

const STATUSES = ['passed', 'failed', 'warned', 'skipped'];

function summarize(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    warned: 0,
    skipped: 0
  };

  for (const result of results) {
    if (STATUSES.includes(result.status)) {
      summary[result.status] += 1;
    }
  }

  return summary;
}

function writeJsonReport(outputDir, run) {
  writeJson(path.join(outputDir, 'summary.json'), {
    ...run,
    summary: summarize(run.results)
  });
  writeJson(path.join(outputDir, 'cases.json'), run.results);
}

module.exports = { writeJsonReport, summarize };
