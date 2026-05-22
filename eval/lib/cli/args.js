'use strict';

const SUPPORTED_MODES = new Set(['local-core', 'mock', 'replay', 'local-agent']);
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
    command: 'run',
    subcommand: null,
    mode: 'local-core',
    suite: 'all',
    report: false,
    agents: [],
    models: [],
    scenarios: [],
    outputDir: null,
    fixture: null,
    repeat: 1,
    scenario: null,
    allowRealApi: false,
    allowEmailSend: false,
    emailAllowlist: [],
    maxPaidCredits: 0,
    maxEdmSends: 0,
    useRealAgentConfig: false
  };

  let startIndex = 0;
  if (argv[0] === 'fixtures') {
    parsed.command = 'fixtures';
    parsed.subcommand = argv[1] || null;
    if (parsed.subcommand !== 'capture') {
      throw new Error('Unsupported fixtures command: expected capture');
    }
    startIndex = 2;
  }

  for (let i = startIndex; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--report') {
      parsed.report = true;
    } else if (token === '--use-real-agent-config') {
      parsed.useRealAgentConfig = true;
    } else if (token === '--allow-real-api') {
      parsed.allowRealApi = true;
    } else if (token === '--allow-email-send') {
      parsed.allowEmailSend = true;
    } else if (token === '--no-email-send') {
      parsed.allowEmailSend = false;
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
    } else if (token === '--fixture') {
      parsed.fixture = readOptionValue(argv, i, token);
      i += 1;
    } else if (token === '--repeat') {
      parsed.repeat = parsePositiveInteger(readOptionValue(argv, i, token), token);
      i += 1;
    } else if (token === '--scenario') {
      parsed.scenario = readOptionValue(argv, i, token);
      i += 1;
    } else if (token === '--email-allowlist') {
      parsed.emailAllowlist = splitCsv(readOptionValue(argv, i, token));
      i += 1;
    } else if (token === '--max-paid-credits') {
      parsed.maxPaidCredits = parseNonNegativeInteger(readOptionValue(argv, i, token), token);
      i += 1;
    } else if (token === '--max-edm-sends') {
      parsed.maxEdmSends = parseNonNegativeInteger(readOptionValue(argv, i, token), token);
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

  if (parsed.command === 'fixtures') {
    if (!parsed.scenario) throw new Error('fixtures capture requires --scenario');
    return parsed;
  }

  if (!SUPPORTED_MODES.has(parsed.mode)) {
    throw new Error(`Unsupported mode in Phase 1/2: ${parsed.mode}`);
  }
  if (!SUPPORTED_SUITES.has(parsed.suite)) {
    throw new Error(`Unsupported suite: ${parsed.suite}`);
  }

  return parsed;
}

function parsePositiveInteger(value, optionName) {
  if (!/^[1-9]\d*$/.test(String(value))) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return Number(value);
}

function parseNonNegativeInteger(value, optionName) {
  if (!/^(0|[1-9]\d*)$/.test(String(value))) {
    throw new Error(`${optionName} must be a non-negative integer`);
  }
  return Number(value);
}

module.exports = { parseArgs, splitCsv };
