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
      parsed.mode = argv[++i];
    } else if (token === '--suite') {
      parsed.suite = argv[++i];
    } else if (token === '--agents') {
      parsed.agents = splitCsv(argv[++i]);
    } else if (token === '--models') {
      parsed.models = splitCsv(argv[++i]);
    } else if (token === '--scenarios') {
      parsed.scenarios = splitCsv(argv[++i]);
    } else if (token === '--output-dir') {
      parsed.outputDir = argv[++i];
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
