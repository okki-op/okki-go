#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const {
  getJson,
  readJsonFile,
  postJson,
  writeJsonFile
} = require('./lib/okki-api');
const {
  batchIdFromPath,
  cleanString,
  countryCode,
  defaultRawPath,
  nowIso,
  outputBudgetMetadata,
  selectedRows,
  truncateText
} = require('./lib/compact-output');
const { resolveBatchPath } = require('./lib/batch-state');

function usage() {
  console.error([
    'Usage:',
    '  node scripts/unlock-companies.js --batch batch.json --rows ROWS --compact [--mark-unlocked] [--raw-file PATH]',
    '  node scripts/unlock-companies.js --batch latest --rows ROWS --compact [--mark-unlocked] [--raw-file PATH]',
    '  node scripts/unlock-companies.js --batch batch.json --rows ROWS --detail [--raw-file PATH]'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = {
    batch: null,
    rows: null,
    compact: false,
    detail: false,
    rawFile: null,
    markUnlocked: false,
    now: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--batch') {
      args.batch = argv[++i];
    } else if (arg === '--rows') {
      args.rows = argv[++i];
    } else if (arg === '--compact') {
      args.compact = true;
    } else if (arg === '--detail') {
      args.detail = true;
    } else if (arg === '--raw-file') {
      args.rawFile = argv[++i];
    } else if (arg === '--mark-unlocked') {
      args.markUnlocked = true;
    } else if (arg === '--now') {
      args.now = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.batch) throw new Error('Missing --batch');
  if (!args.rows) throw new Error('Missing --rows');
  return args;
}

function validateBatchRows(rows) {
  if (rows.length > 50) {
    throw new Error('Selected rows exceed compact unlock hard cap 50. Split the unlock into smaller confirmed batches.');
  }
  for (const row of rows) {
    if (!row.domain) throw new Error(`Selected row ${row.row} is missing domain.`);
    if (!countryCode(row)) throw new Error(`Selected row ${row.row} is missing country_code.`);
  }
}

function validateLatestBatchPointer(resolvedBatch, batch) {
  if (!resolvedBatch.latestBatchUsed) return;
  const pointerSummary = cleanString(resolvedBatch.pointer && resolvedBatch.pointer.request_summary);
  const batchSummary = cleanString(batch && batch.request_summary);
  if (pointerSummary && batchSummary && pointerSummary !== batchSummary) {
    throw new Error('Latest batch request summary does not match the batch file; re-run a free lookup before using row selections.');
  }
}

async function unlockOne(row) {
  const unlock = await postJson('/api/v1/companies/unlock', {
    domain: row.domain,
    countryCode: countryCode(row)
  });
  const hash = unlock.companyHashId || unlock.company_hash_id;
  let profile = null;
  let profileEmails = null;
  if (hash) {
    const encoded = encodeURIComponent(hash);
    [profile, profileEmails] = await Promise.all([
      getJson(`/api/v1/companies/${encoded}/profile`).catch((error) => ({ error: error.message })),
      getJson(`/api/v1/companies/${encoded}/profileEmails`).catch((error) => ({ error: error.message }))
    ]);
  }
  return { row, unlock, profile, profileEmails };
}

function emailsFrom(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object') return [];
  const rows = Array.isArray(profileEmails.emails) ? profileEmails.emails : [];
  return rows.map((email) => email.email).filter(Boolean);
}

function phonesFrom(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object') return [];
  const rows = Array.isArray(profileEmails.emails) ? profileEmails.emails : [];
  return rows.map((email) => email.phone).filter(Boolean);
}

function emailTotal(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object') return 0;
  if (Number.isFinite(Number(profileEmails.total))) return Number(profileEmails.total);
  return Array.isArray(profileEmails.emails) ? profileEmails.emails.length : 0;
}

function profileDescription(profile) {
  if (!profile || typeof profile !== 'object') return '';
  return cleanString(profile.description || profile.company_profile || profile.profile || '');
}

function compactResult(item, mode) {
  const profile = item.profile && !item.profile.error ? item.profile : null;
  const profileEmails = item.profileEmails && !item.profileEmails.error ? item.profileEmails : null;
  const result = {
    row: item.row.row,
    company_name: item.row.company_name || item.unlock.companyName || 'Unknown company',
    status: item.unlock.companyHashId ? 'unlocked' : 'failed',
    charged: Boolean(item.unlock.charged),
    summary: profile ? cleanString(profile.industry || profile.company_type || '') : '',
    description_preview: truncateText(profileDescription(profile), mode === 'detail' ? 600 : 240),
    emails: emailsFrom(profileEmails).slice(0, mode === 'detail' ? 20 : 3),
    phones: phonesFrom(profileEmails).slice(0, mode === 'detail' ? 10 : 3),
    profile_available: Boolean(profile),
    emails_total: emailTotal(profileEmails)
  };
  if (mode === 'detail' && profile && profile.website) {
    result.website = profile.website;
  }
  return result;
}

function rawRows(results) {
  return results.map((item) => ({
    row: item.row.row,
    domain: item.row.domain,
    country_code: countryCode(item.row),
    company_name: item.row.company_name || null,
    unlock: item.unlock,
    profile: item.profile,
    profileEmails: item.profileEmails
  }));
}

function markUnlockedBatch(rows) {
  const stateScript = path.join(__dirname, 'okki-state.js');
  const payload = rows.map((row) => ({ domain: row.domain, country_code: countryCode(row) }));
  const result = spawnSync(process.execPath, [
    stateScript,
    'viewed',
    'mark-unlocked-batch',
    '--json',
    JSON.stringify(payload)
  ], {
    cwd: path.join(__dirname, '..', '..'),
    env: process.env,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    throw new Error(`mark-unlocked-batch failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const resolvedBatch = resolveBatchPath(args.batch, { now: args.now });
  const batch = readJsonFile(resolvedBatch.batchPath);
  validateLatestBatchPointer(resolvedBatch, batch);
  const rows = Array.isArray(batch.rows) ? batch.rows : [];
  const selected = selectedRows(rows, args.rows);
  validateBatchRows(selected);
  const rawPath = args.rawFile || defaultRawPath('unlock-companies');

  const results = [];
  for (const row of selected) {
    try {
      results.push(await unlockOne(row));
    } catch (error) {
      if (error.statusCode === 402) {
        break;
      }
      results.push({
        row,
        unlock: { charged: false, error: error.message },
        profile: null,
        profileEmails: null
      });
    }
  }

  const balance = await getJson('/api/v1/credit/balance').catch(() => null);
  const raw = {
    version: '1.0',
    created_at: nowIso(),
    batch_id: batchIdFromPath(resolvedBatch.batchPath),
    rows: rawRows(results),
    balance
  };
  writeJsonFile(rawPath, raw);
  const state = args.markUnlocked ? markUnlockedBatch(results.map((item) => item.row)) : null;
  const mode = args.detail ? 'detail' : 'compact';
  const compactResults = results.map((item) => compactResult(item, mode));
  const output = {
    batch_id: batchIdFromPath(resolvedBatch.batchPath),
    latest_batch_used: resolvedBatch.latestBatchUsed,
    charged_count: results.filter((item) => item.unlock && item.unlock.charged).length,
    balance,
    results: compactResults,
    raw_saved: true,
    raw_path: rawPath,
    ...outputBudgetMetadata({
      defaultCap: mode === 'detail' ? 50 : 50,
      hardCap: 50,
      requestedLimit: selected.length,
      returned: compactResults.length,
      available: selected.length
    })
  };
  if (state) output.state_updated = state.updated;

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(2);
});
