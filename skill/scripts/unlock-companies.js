#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
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
  compactList,
  countryCode,
  countryName,
  defaultRawPath,
  nowIso,
  outputBudgetMetadata,
  applyDebugMetadata,
  selectedRows,
  truncateText
} = require('./lib/compact-output');
const { resolveBatchPath } = require('./lib/batch-state');

const VIEWED_STATE_WARNING = '公司已解锁，但本地已查看记录未更新。解锁结果仍然有效；不要因此重新解锁。下次使用 --mark-unlocked 前，可预先授权 OKKI Go viewed 状态目录写入权限以保存本地记录。';

function usage() {
  console.error([
    'Usage:',
    '  node scripts/unlock-companies.js --batch batch.json --rows ROWS --compact [--locale en-US] [--mark-unlocked] [--raw-file PATH] [--markdown-file PATH] [--debug-metadata]',
    '  node scripts/unlock-companies.js --batch latest --rows ROWS --compact [--locale en-US] [--mark-unlocked] [--raw-file PATH] [--markdown-file PATH] [--debug-metadata]',
    '  node scripts/unlock-companies.js --batch batch.json --rows ROWS --detail [--locale en-US] [--raw-file PATH] [--markdown-file PATH] [--debug-metadata]'
  ].join('\n'));
}

function parseArgs(argv) {
  const args = {
    batch: null,
    rows: null,
    compact: false,
    detail: false,
    rawFile: null,
    markdownFile: null,
    markUnlocked: false,
    now: null,
    locale: null,
    debugMetadata: false
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
    } else if (arg === '--markdown-file') {
      args.markdownFile = argv[++i];
    } else if (arg === '--mark-unlocked') {
      args.markUnlocked = true;
    } else if (arg === '--now') {
      args.now = argv[++i];
    } else if (arg === '--locale') {
      args.locale = argv[++i];
    } else if (arg === '--debug-metadata') {
      args.debugMetadata = true;
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
  const emails = [];
  const seen = new Set();
  for (const row of rows) {
    collectEmailValues(row, emails, seen);
  }
  return emails;
}

function collectEmailValues(value, emails, seen) {
  if (Array.isArray(value)) {
    for (const item of value) collectEmailValues(item, emails, seen);
    return;
  }
  if (typeof value === 'string') {
    addEmail(value, emails, seen);
    return;
  }
  if (!value || typeof value !== 'object') return;
  addEmail(value.email, emails, seen);
  addEmail(value.value, emails, seen);
  collectEmailValues(value.emails, emails, seen);
}

function addEmail(value, emails, seen) {
  const email = cleanString(value).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) return;
  seen.add(email);
  emails.push(email);
}

function phonesFrom(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object') return [];
  const rows = Array.isArray(profileEmails.emails) ? profileEmails.emails : [];
  const phones = [];
  const seen = new Set();
  for (const row of rows) {
    collectPhoneValues(row.phone, phones, seen);
    collectPhoneValues(row.phone_number, phones, seen);
    collectPhoneValues(row.phone_numbers, phones, seen);
  }
  return phones;
}

function collectPhoneValues(value, phones, seen) {
  if (Array.isArray(value)) {
    for (const item of value) collectPhoneValues(item, phones, seen);
    return;
  }
  const phone = cleanString(value);
  if (!phone || seen.has(phone)) return;
  seen.add(phone);
  phones.push(phone);
}

function emailTotal(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object') return 0;
  if (Number.isFinite(Number(profileEmails.total))) return Number(profileEmails.total);
  return emailsFrom(profileEmails).length;
}

function profileDescription(profile) {
  if (!profile || typeof profile !== 'object') return '';
  return cleanString(profile.description || profile.company_profile || profile.profile || '');
}

function companyDetails(item, mode, options = {}) {
  const profile = item.profile && !item.profile.error ? item.profile : null;
  const profileEmails = item.profileEmails && !item.profileEmails.error ? item.profileEmails : null;
  const raw = item.row.raw && typeof item.row.raw === 'object' ? item.row.raw : {};
  const code = countryCode(item.row);
  const emails = emailsFrom(profileEmails);
  const phones = phonesFrom(profileEmails);
  const contacts = contactRows(profileEmails).slice(0, mode === 'detail' ? 20 : 5);
  const displayWebsite = cleanString(profile && (profile.website || profile.domain)) || cleanString(item.row.domain);
  const result = {
    row: item.row.row,
    company_name: cleanString(profile && (profile.name || profile.company_name)) ||
      item.row.company_name ||
      item.unlock.companyName ||
      'Unknown company',
    country_code: code || null,
    country_name: countryName(code, options.locale) || null,
    status: item.unlock.companyHashId ? 'unlocked' : 'failed',
    charged: Boolean(item.unlock.charged),
    display_website: displayWebsite || null,
    founded_year: firstVisible(raw.founding_time, raw.foundingTime, profile && (profile.founded_year || profile.founding_year), profile && profile.foundedYear),
    employees: firstVisible(profile && (profile.employee_desc || profile.employeeCount || profile.employee_count), raw.employees_count, raw.employeeCount, raw.employeesCount, raw.employee_range),
    company_type: compactList(firstVisible(raw.company_type, raw.companyType, profile && (profile.company_type || profile.industry), raw.industry), 2),
    main_products: visibleList(firstVisible(raw.main_products, raw.mainProducts, raw.products), 8),
    has_email: emailTotal(profileEmails) > 0 || emails.length > 0,
    has_whatsapp: positiveCount(firstVisible(raw.whatsapp_count, raw.whatsappCount, profile && (profile.whatsapp_count || profile.whatsappCount))),
    email_preview: emails.slice(0, mode === 'detail' ? 20 : 3),
    phone_preview: phones.slice(0, mode === 'detail' ? 10 : 3),
    social_links: visibleList(profile && profile.social_links, mode === 'detail' ? 20 : 5),
    description: truncateText(profileDescription(profile), mode === 'detail' ? 1200 : 360),
    contacts,
    profile_available: Boolean(profile),
    emails_total: emailTotal(profileEmails)
  };
  return result;
}

function firstVisible(...values) {
  for (const value of values) {
    if (value === 0) return value;
    if (Array.isArray(value) && value.length > 0) return value;
    if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  }
  return null;
}

function positiveCount(value) {
  if (value === null || value === undefined || value === '') return false;
  const number = Number(value);
  return Number.isFinite(number) ? number > 0 : false;
}

function visibleList(value, maxItems) {
  if (Array.isArray(value)) {
    return value.map(cleanString).filter(Boolean).slice(0, maxItems);
  }
  const text = cleanString(value);
  return text ? [text].slice(0, maxItems) : [];
}

function contactRows(profileEmails) {
  if (!profileEmails || typeof profileEmails !== 'object' || !Array.isArray(profileEmails.emails)) return [];
  return profileEmails.emails.map((row) => ({
    name: cleanString(row.name || [row.first_name, row.last_name].filter(Boolean).join(' ')) || null,
    position: cleanString(row.position || row.title) || null,
    email: emailsFrom({ emails: [row] })[0] || null,
    phone: phonesFrom({ emails: [row] })[0] || null,
    linkedin: cleanString(row.linkedin) || null
  }));
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

function tryMarkUnlockedBatch(rows) {
  try {
    return { state: markUnlockedBatch(rows) };
  } catch (error) {
    return { error: localStateErrorMessage(error) };
  }
}

function viewedStatePreflight() {
  const file = viewedStatePath();
  try {
    if (fs.existsSync(file)) {
      fs.accessSync(file, fs.constants.W_OK);
      return { ok: true };
    }

    const dir = path.dirname(file);
    if (fs.existsSync(dir)) {
      fs.accessSync(dir, fs.constants.W_OK);
      return { ok: true };
    }

    fs.accessSync(nearestExistingParent(dir), fs.constants.W_OK);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: localStateErrorMessage(error) };
  }
}

function viewedStatePath() {
  const configHome = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || os.homedir(), '.config');
  return path.join(configHome, 'okki-go', 'viewed.json');
}

function nearestExistingParent(filePath) {
  let current = filePath;
  while (current && !fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return current || path.dirname(filePath);
}

function localStateErrorMessage(error) {
  const text = String(error && (error.stderr || error.stdout || error.message || error) || '');
  const code = text.match(/\b(EPERM|EACCES|EROFS|ENOENT|ENOTDIR|EISDIR|EINVAL)\b/);
  if (code) return `local viewed state update failed (${code[1]}).`;
  if (/permission denied/i.test(text)) return 'local viewed state update failed (permission denied).';
  return 'local viewed state update failed.';
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
  const markdownPath = args.markdownFile || defaultRawPath('company-details').replace(/\.json$/i, '.md');
  const statePreflight = args.markUnlocked ? viewedStatePreflight() : null;

  const results = [];
  for (const row of selected) {
    results.push(await unlockOne(row));
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
  const stateUpdate = args.markUnlocked ? tryMarkUnlockedBatch(results.map((item) => item.row)) : null;
  const mode = args.detail ? 'detail' : 'compact';
  const details = results.map((item) => companyDetails(item, mode, { locale: args.locale }));
  writeMarkdownFile(markdownPath, {
    createdAt: raw.created_at,
    chargedCount: results.filter((item) => item.unlock && item.unlock.charged).length,
    balance,
    details
  });
  const visibleDetails = details.slice(0, 5);
  const warnings = [];
  if (stateUpdate && stateUpdate.error) {
    warnings.push(VIEWED_STATE_WARNING);
    if (statePreflight && !statePreflight.ok) {
      warnings.push('Local viewed state was not writable before unlock; callers in restricted sandboxes can request file_system write permission for the OKKI Go viewed state directory before the next --mark-unlocked run.');
    }
  }
  const output = {
    batch_id: batchIdFromPath(resolvedBatch.batchPath),
    latest_batch_used: resolvedBatch.latestBatchUsed,
    charged_count: results.filter((item) => item.unlock && item.unlock.charged).length,
    balance,
    company_details: visibleDetails,
    total_details_count: details.length,
    displayed_details_count: visibleDetails.length,
    details_markdown_saved: true,
    details_markdown_path: markdownPath,
    raw_saved: true,
    raw_path: rawPath,
    ...outputBudgetMetadata({
      defaultCap: mode === 'detail' ? 50 : 50,
      hardCap: 50,
      requestedLimit: selected.length,
      returned: visibleDetails.length,
      available: selected.length
    })
  };
  if (stateUpdate && stateUpdate.state) output.state_updated = stateUpdate.state.updated;
  if (stateUpdate && stateUpdate.error) {
    output.state_update_failed = true;
    output.state_update_error = stateUpdate.error;
  }
  if (warnings.length > 0) output.warnings = warnings;

  process.stdout.write(`${JSON.stringify(unlockNormalOutput(output, args.debugMetadata), null, 2)}\n`);
}

function writeMarkdownFile(filePath, context) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, renderMarkdown(context), 'utf8');
}

function renderMarkdown(context) {
  const lines = [
    '# OKKI Go 公司详情',
    '',
    `生成时间: ${context.createdAt}`,
    `解锁数量: ${context.details.length}`,
    `本次扣费: ${context.chargedCount}`
  ];
  const balanceText = balanceSummary(context.balance);
  if (balanceText) lines.push(`剩余积分: ${balanceText}`);
  lines.push('', '> 完整资料包含本次已解锁的全部公司。', '');

  context.details.forEach((detail, index) => {
    lines.push(`## ${index + 1}. ${detail.company_name}`);
    lines.push('');
    lines.push(`- 原序号: ${valueOrDash(detail.row)}`);
    lines.push(`- 官网/域名: ${valueOrDash(detail.display_website)}`);
    lines.push(`- 国家/地区: ${valueOrDash(detail.country_name || detail.country_code)}`);
    lines.push(`- 成立时间: ${valueOrDash(detail.founded_year)}`);
    lines.push(`- 员工规模: ${valueOrDash(detail.employees)}`);
    lines.push(`- 公司类型: ${valueOrDash(detail.company_type)}`);
    lines.push(`- 主营产品: ${valueOrDash(detail.main_products.join(', '))}`);
    lines.push(`- 有邮箱: ${detail.has_email ? '是' : '否'}`);
    lines.push(`- 有 WhatsApp: ${detail.has_whatsapp ? '是' : '否'}`);
    lines.push(`- 邮箱预览: ${valueOrDash(detail.email_preview.join(', '))}`);
    lines.push(`- 电话预览: ${valueOrDash(detail.phone_preview.join(', '))}`);
    lines.push(`- 社交链接: ${valueOrDash(detail.social_links.join(', '))}`);
    lines.push('');
    lines.push('### 公司简介');
    lines.push('');
    lines.push(valueOrDash(detail.description));
    lines.push('');
    lines.push('### 联系人/邮箱');
    lines.push('');
    lines.push('| 姓名 | 职位 | 邮箱 | 电话 | LinkedIn |');
    lines.push('|---|---|---|---|---|');
    if (detail.contacts.length === 0) {
      lines.push('| - | - | - | - | - |');
    } else {
      for (const contact of detail.contacts) {
        lines.push(`| ${mdCell(contact.name)} | ${mdCell(contact.position)} | ${mdCell(contact.email)} | ${mdCell(contact.phone)} | ${mdCell(contact.linkedin)} |`);
      }
    }
    lines.push('');
  });

  return `${lines.join('\n')}\n`;
}

function balanceSummary(balance) {
  if (!balance || typeof balance !== 'object') return '';
  const parts = [];
  if (Number.isFinite(Number(balance.monthlyPoints))) parts.push(`monthlyPoints ${balance.monthlyPoints}`);
  if (Number.isFinite(Number(balance.addonPoints))) parts.push(`addonPoints ${balance.addonPoints}`);
  return parts.join(', ');
}

function valueOrDash(value) {
  const text = cleanString(value);
  return text || '-';
}

function mdCell(value) {
  return valueOrDash(value).replace(/\|/g, '\\|');
}

function unlockNormalOutput(output, debugMetadata) {
  return applyDebugMetadata(output, [
    'batch_id',
    'raw_path',
    'output_budget'
  ], debugMetadata);
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(2);
});
