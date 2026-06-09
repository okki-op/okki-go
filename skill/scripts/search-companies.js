#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const {
  batchIdFromPath,
  budgetedItems,
  compactCompanyRow,
  defaultRawPath,
  nowIso,
  parseFields,
  projectFields,
  responseList,
  responseTotal
} = require('./lib/compact-output');
const { writeJsonFile } = require('./lib/okki-api');
const { writeLatestBatchPointer } = require('./lib/batch-state');

const BASE_URL = process.env.OKKIGO_BASE_URL || 'https://go.okki.ai';
const SKILL_VERSION = process.env.OKKIGO_SKILL_VERSION || '1.2.1';
const SKILL_RUNTIME = process.env.OKKIGO_SKILL_RUNTIME || 'unknown';
const MAX_SIZE = 50;
const KEYWORD_FIELDS = ['companyTypeKeywords', 'productKeywords', 'industryKeywords'];
const SUPPORTED_FIELDS = new Set([
  'companyTypeKeywords',
  'productKeywords',
  'industryKeywords',
  'includeCountry',
  'excludeCountry',
  'withEmails',
  'crossFieldOperator',
  'from',
  'size'
]);

function usage() {
  console.error([
    'Usage:',
    '  node scripts/search-companies.js --json \'<search-advanced payload>\'',
    '  node scripts/search-companies.js --file /path/to/payload.json',
    '  node scripts/search-companies.js --json \'<payload>\' --compact [--locale en-US] [--limit-output 50] [--fields company_name,country_name,email_count,fit] [--save-raw PATH]',
    '',
    'Example:',
    '  node scripts/search-companies.js --json \'{"productKeywords":["auto glass"],"companyTypeKeywords":["importer","distributor"],"includeCountry":["DE"],"withEmails":0,"size":20}\' --compact --locale zh-CN'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = {
    json: null,
    file: null,
    printPayload: false,
    compact: false,
    fields: null,
    limitOutput: null,
    saveRaw: null,
    locale: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      args.json = argv[++i];
    } else if (arg === '--file') {
      args.file = argv[++i];
    } else if (arg === '--print-payload') {
      args.printPayload = true;
    } else if (arg === '--compact') {
      args.compact = true;
    } else if (arg === '--fields') {
      args.fields = argv[++i];
    } else if (arg === '--limit-output') {
      args.limitOutput = parsePositiveInteger(argv[++i], '--limit-output');
    } else if (arg === '--save-raw') {
      args.saveRaw = argv[++i];
    } else if (arg === '--locale') {
      args.locale = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if ((args.json ? 1 : 0) + (args.file ? 1 : 0) !== 1) {
    throw new Error('Provide exactly one of --json or --file.');
  }
  return args;
}

function parsePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return number;
}

function readPayload(args) {
  if (args.json) return parseJson(args.json, '--json');
  return parseJson(fs.readFileSync(args.file, 'utf8'), args.file);
}

function parseJson(source, label) {
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
}

function normalizePayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Payload must be a JSON object.');
  }

  const normalized = {};
  const dropped = [];

  for (const [key, value] of Object.entries(input)) {
    if (!SUPPORTED_FIELDS.has(key)) {
      dropped.push(key);
      continue;
    }
    if (value === undefined || value === null || value === '') continue;
    normalized[key] = value;
  }

  normalizeArrayField(normalized, 'companyTypeKeywords');
  normalizeArrayField(normalized, 'productKeywords');
  normalizeArrayField(normalized, 'industryKeywords');
  normalizeArrayField(normalized, 'includeCountry', true);
  normalizeArrayField(normalized, 'excludeCountry', true);
  validateCountryCodes(normalized, 'includeCountry');
  validateCountryCodes(normalized, 'excludeCountry');
  normalizeWithEmails(normalized);
  normalizeCrossFieldOperator(normalized);
  normalizePagination(normalized);
  ensureSearchable(normalized);

  return { payload: normalized, dropped, warnings: guardrailWarnings(normalized) };
}

function normalizeArrayField(payload, key, uppercase) {
  if (!(key in payload)) return;

  const values = Array.isArray(payload[key]) ? payload[key] : [payload[key]];
  const cleaned = values
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((value) => uppercase ? value.toUpperCase() : value);

  if (cleaned.length === 0) {
    delete payload[key];
  } else {
    payload[key] = Array.from(new Set(cleaned));
  }
}

function validateCountryCodes(payload, key) {
  if (!(key in payload)) return;

  const invalid = payload[key].filter((value) => !/^[A-Z]{2}$/.test(value));
  if (invalid.length > 0) {
    throw new Error(`${key} must contain ISO 3166-1 alpha-2 country codes. Invalid: ${invalid.join(', ')}`);
  }
}

function normalizeWithEmails(payload) {
  if (!('withEmails' in payload)) return;

  const value = payload.withEmails;
  if (value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true') {
    payload.withEmails = 1;
  } else if (value === false || value === 0 || value === '0' || String(value).toLowerCase() === 'false') {
    payload.withEmails = 0;
  } else {
    throw new Error('withEmails must be 0 or 1.');
  }
}

function normalizeCrossFieldOperator(payload) {
  if (!('crossFieldOperator' in payload)) return;

  const value = String(payload.crossFieldOperator).trim().toUpperCase();
  if (value !== 'AND' && value !== 'OR') {
    throw new Error('crossFieldOperator must be "AND" or "OR".');
  }
  payload.crossFieldOperator = value;
}

function normalizePagination(payload) {
  const from = payload.from === undefined ? 0 : Number(payload.from);
  const size = payload.size === undefined ? 10 : Number(payload.size);

  if (!Number.isInteger(from) || from < 0) {
    throw new Error('from must be a non-negative integer.');
  }
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('size must be a positive integer.');
  }

  payload.from = from;
  payload.size = Math.min(size, MAX_SIZE);
}

function ensureSearchable(payload) {
  const hasKeywords = KEYWORD_FIELDS
    .some((key) => Array.isArray(payload[key]) && payload[key].length > 0);
  const hasCountry = Array.isArray(payload.includeCountry) && payload.includeCountry.length > 0;

  if (!hasKeywords && !hasCountry) {
    throw new Error('Payload must include at least one keyword field or includeCountry.');
  }
}

function guardrailWarnings(payload) {
  const warnings = [];
  const usedKeywordFields = KEYWORD_FIELDS
    .filter((key) => Array.isArray(payload[key]) && payload[key].length > 0);

  if (payload.withEmails === 1) {
    warnings.push('withEmails:1 narrows company discovery; use it only when the user asked for email-only leads.');
  }

  if (payload.crossFieldOperator === 'AND' && usedKeywordFields.length === KEYWORD_FIELDS.length) {
    warnings.push('AND with productKeywords + companyTypeKeywords + industryKeywords can over-narrow the first search.');
  }

  if (payload.crossFieldOperator === 'OR' && Array.isArray(payload.includeCountry) && payload.includeCountry.length > 0) {
    warnings.push('Global OR with includeCountry can be noisy; prefer changing target-side terms before using OR.');
  }

  return warnings;
}

function resolveApiKey() {
  const resolver = path.join(__dirname, 'resolve-api-key.sh');
  const result = spawnSync('bash', [resolver, '--print'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    throw new Error(`API key resolver failed: ${(result.stderr || result.stdout || '').trim()}`);
  }

  const key = String(result.stdout || '').trim().split(/\r?\n/)[0];
  if (!key || !key.startsWith('sk-')) {
    throw new Error('No OKKI Go API key resolved.');
  }
  return key;
}

function resolveInstallId() {
  const fromEnv = process.env.OKKIGO_INSTALL_ID || process.env.OKKI_GO_INSTALL_ID;
  if (fromEnv) return firstLine(fromEnv);

  const manifestPath = path.join(__dirname, '..', '.okki-go-manifest.json');
  const manifestId = readJsonInstallId(manifestPath);
  if (manifestId) return manifestId;

  const configHome = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '', '.config');
  if (configHome) {
    const installIdPath = path.join(configHome, 'okki-go', 'install-id');
    if (fs.existsSync(installIdPath)) {
      return firstLine(fs.readFileSync(installIdPath, 'utf8'));
    }
  }

  return '';
}

function readJsonInstallId(filePath) {
  if (!fs.existsSync(filePath)) return '';
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const id = data.installId || data.install_id;
    return typeof id === 'string' ? firstLine(id) : '';
  } catch (_) {
    return '';
  }
}

function firstLine(value) {
  return String(value || '').trim().split(/\r?\n/)[0];
}

function postJson(urlString, headers, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === 'http:' ? http : https;
    const body = JSON.stringify(payload);
    const request = transport.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'http:' ? 80 : 443),
      path: `${url.pathname}${url.search}`,
      headers: Object.assign({}, headers, {
        'Content-Length': Buffer.byteLength(body)
      })
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode || 0,
          body: Buffer.concat(chunks).toString('utf8')
        });
      });
    });
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { payload, dropped, warnings } = normalizePayload(readPayload(args));

  if (args.printPayload) {
    console.error(JSON.stringify({ payload, dropped, warnings }, null, 2));
    return;
  } else if (dropped.length > 0) {
    console.error(`Dropped unsupported fields: ${dropped.join(', ')}`);
  }
  for (const warning of warnings) {
    console.error(`Search guardrail warning: ${warning}`);
  }

  const apiKey = resolveApiKey();
  const installId = resolveInstallId();
  const headers = {
    Authorization: `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
    'X-Okki-Skill-Version': SKILL_VERSION,
    'X-Okki-Skill-Runtime': SKILL_RUNTIME
  };
  if (installId) headers['X-Okki-Install-Id'] = installId;

  const response = await postJson(`${BASE_URL}/api/v1/companies/search-advanced`, headers, payload);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    console.error(response.body);
    process.exit(response.statusCode >= 400 && response.statusCode < 600 ? 1 : 2);
  }
  if (args.compact) {
    const body = parseJson(response.body || '{}', 'OKKI Go response');
    const rawPath = args.saveRaw || defaultRawPath('search-companies');
    const compact = compactSearchResponse(body, {
      payload,
      rawPath,
      fields: parseFields(args.fields),
      limitOutput: args.limitOutput || payload.size || 50,
      locale: args.locale
    });
    writeJsonFile(rawPath, compact.raw);
    writeLatestBatchPointer({
      batchPath: rawPath,
      displayedRows: compact.output.returned,
      requestSummary: compact.raw.request_summary
    });
    process.stdout.write(`${JSON.stringify(compact.output, null, 2)}\n`);
    return;
  }
  process.stdout.write(response.body);
  if (response.body && !response.body.endsWith('\n')) process.stdout.write('\n');
}

function compactSearchResponse(body, options) {
  const list = responseList(body);
  const total = responseTotal(body, list.length);
  const budgeted = budgetedItems(list, {
    defaultCap: 50,
    hardCap: 100,
    requestedLimit: options.limitOutput,
    available: total
  });
  const fields = options.fields;
  const rows = budgeted.items.map((record, index) => (
    projectFields(compactCompanyRow(record, index + 1, { locale: options.locale }), fields)
  ));
  const rawRows = list.map((record, index) => ({
    row: index + 1,
    domain: record.domain || record.companyDomain || record.company_domain || null,
    country_code: record.country_code || record.countryCode || null,
    company_name: record.company_name || record.companyName || record.name || null,
    id: record.id || record.companyHashId || record.company_hash_id || null,
    raw: record
  }));
  const output = {
    total,
    batch_id: batchIdFromPath(options.rawPath),
    rows,
    private_mapping_saved: true,
    raw_path: options.rawPath,
    ...budgeted.metadata
  };
  return {
    output,
    raw: {
      version: '1.0',
      created_at: nowIso(),
      request_summary: summarizePayload(options.payload),
      rows: rawRows
    }
  };
}

function summarizePayload(payload) {
  const countries = Array.isArray(payload.includeCountry) ? payload.includeCountry.join(',') : '';
  const keywords = KEYWORD_FIELDS
    .flatMap((key) => Array.isArray(payload[key]) ? payload[key] : [])
    .slice(0, 8)
    .join(', ');
  return [countries, keywords].filter(Boolean).join(' ');
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(2);
});
