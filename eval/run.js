#!/usr/bin/env node
'use strict';

const { parseArgs } = require('./lib/cli/args');
const { createCapturePlan } = require('./lib/fixtures/capture');
const { summarize } = require('./lib/reports/json-reporter');
const { runLocalAgent } = require('./lib/runners/local-agent-runner');
const { runLocalCore } = require('./lib/runners/local-core-runner');
const { runReplay } = require('./lib/runners/replay-runner');

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
    if (options.command === 'fixtures' && options.subcommand === 'capture') {
      const plan = createCapturePlan(options);
      console.log(`Fixture capture plan: ${plan.scenario}`);
      console.log(`Real API: ${plan.allowRealApi ? 'enabled' : 'disabled'}`);
      console.log(`Email send: ${plan.allowEmailSend ? 'enabled' : 'disabled'}`);
      return 0;
    }

    const run = runSelectedMode(options);
    const summary = summarize(run.results);
    console.log(`Mode: ${run.mode}`);
    if (run.fixture && run.fixture.name) console.log(`Fixture: ${run.fixture.name}`);
    console.log(`Completed: ${summary.total}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Output: ${run.outputDir}`);
    return summary.failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(error.stack || error.message);
    return 1;
  }
}

function runSelectedMode(options) {
  if (options.mode === 'replay') return runReplay(options);
  if (options.mode === 'local-agent') return runLocalAgent(options);
  return runLocalCore(options);
}

function usage() {
  return [
    'Usage: node run.js [options]',
    '       node run.js fixtures capture --scenario <id> --allow-real-api [safety options]',
    '',
    'Options:',
    '  --mode <local-core|mock|replay|local-agent>',
    '  --suite <all|install|static|routing|business|safety>',
    '  --agents <id,id>                  Agent list for local-agent',
    '  --models <id,id>                  Model profile list for local-agent',
    '  --agent-cli <path>                Override selected local-agent CLI executable',
    '  --agent-cli-args <arg,arg>        Override selected local-agent CLI args; use {prompt}',
    '  --use-real-agent-config           Allow adapters to use real agent config',
    '  --fixture <name>                  Replay fixture name',
    '  --repeat <n>                      Repeat each selected scenario (default: 1)',
    '  --allow-real-api                  Enable live API fixture capture',
    '  --max-paid-credits <n>            Capture paid credit budget',
    '  --no-email-send                   Disable live email sends for capture',
    '  --allow-email-send                Enable live email sends for capture',
    '  --email-allowlist <email,email>   Allowed recipients for live email sends',
    '  --max-edm-sends <n>               Live email send budget',
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
