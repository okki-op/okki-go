#!/usr/bin/env node
'use strict';

const { parseArgs } = require('./lib/cli/args');
const { summarize } = require('./lib/reports/json-reporter');
const { runLocalCore } = require('./lib/runners/local-core-runner');

function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    console.error('Run with --help for usage.');
    return 1;
  }

  if (options.help) {
    console.log(usage());
    return 0;
  }

  try {
    const run = runLocalCore(options);
    const summary = summarize(run.results);
    console.log(`Completed: ${summary.total}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Output: ${run.outputDir}`);
    return summary.failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(error.stack || error.message);
    return 1;
  }
}

function usage() {
  return [
    'Usage: node run.js [options]',
    '',
    'Options:',
    '  --mode local-core                 Evaluation mode (Phase 1 only)',
    '  --suite <all|install|static|routing|business|safety>',
    '  --scenarios <id,id>               Limit routing/business/safety scenarios',
    '  --report                         Write summary.json, cases.json, and report.md',
    '  --output-dir <dir>                Output directory (default: results/<runId>)',
    '  --help, -h                       Show this help'
  ].join('\n');
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, usage };
