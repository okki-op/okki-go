'use strict';

const SUPPORTED_MODES = new Set(['local-core']);
const SUPPORTED_SUITES = new Set(['all', 'install', 'static', 'routing', 'business', 'safety']);

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || String(value).startsWith('--')) {
    throw new Error(`Missing value for ${optionName}`);
  }
  return value;
}

function parseArgs(argv) {
  const parsed = {
    mode: 'local-core',
    suite: 'all',
    report: false,
    agents: [],
    models: [],
    scenarios: [],
    outputDir: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') {
      parsed.report = true;
    } else if (token === '--mode') {
      parsed.mode = readOptionValue(argv, i, token);
      i += 1;
    } else if (token === '--suite') {
      parsed.suite = readOptionValue(argv, i, token);
      i += 1;
    } else if (token === '--agents') {
      parsed.agents = splitCsv(readOptionValue(argv, i, token));
      i += 1;
    } else if (token === '--models') {
      parsed.models = splitCsv(readOptionValue(argv, i, token));
      i += 1;
    } else if (token === '--scenarios') {
      parsed.scenarios = splitCsv(readOptionValue(argv, i, token));
      i += 1;
    } else if (token === '--output-dir') {
      parsed.outputDir = readOptionValue(argv, i, token);
      i += 1;
    } else if (token === '--help' || token === '-h') {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!SUPPORTED_MODES.has(parsed.mode)) {
    throw new Error(`Unsupported mode in Phase 1: ${parsed.mode}`);
  }
  if (!SUPPORTED_SUITES.has(parsed.suite)) {
    throw new Error(`Unsupported suite: ${parsed.suite}`);
  }

  return parsed;
}

module.exports = { parseArgs, splitCsv };
