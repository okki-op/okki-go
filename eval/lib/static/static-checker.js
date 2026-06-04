'use strict';

const fs = require('fs');
const path = require('path');
const { fromOkkiRoot } = require('../core/paths');
const { readJson, readText } = require('../core/fs-utils');
const { fail, pass, warn } = require('../core/result');

function runStaticChecks(options = {}) {
  const okkiRoot = options.okkiRoot || fromOkkiRoot();

  return [
    checkPackageFilesExcludeEval(okkiRoot),
    checkSkillRoutingAndEnvPresent(okkiRoot),
    checkSkillCredentialResolutionPresent(okkiRoot),
    checkDocsLegacyRuntimeFlag(okkiRoot),
    checkInstallerRuntimeListPresent(okkiRoot),
    checkReleaseVersionConsistency(okkiRoot),
    checkCompanySearchPaginationGuardrail(okkiRoot),
    checkCurrentTurnMerchantSeedGuardrail(okkiRoot),
    checkProspectingAuditRemediationGuardrails(okkiRoot),
    checkOkkiIndexLanguagePreferenceGuardrail(okkiRoot),
    checkDiscoveryRecoveryGradientGuardrail(okkiRoot),
    checkCompactOutputGuardrails(okkiRoot)
  ];
}

function checkPackageFilesExcludeEval(okkiRoot) {
  const packageJson = readJson(path.join(okkiRoot, 'package.json'));
  if (!Array.isArray(packageJson.files)) {
    return fail('package-files-exclude-eval', 'package files must explicitly exclude eval/');
  }

  const hasUnsafeEntry = packageJson.files.some((entry) => canIncludeEval(entry));

  if (hasUnsafeEntry) {
    return fail('package-files-exclude-eval', 'package files must not include eval/');
  }

  return pass('package-files-exclude-eval');
}

function canIncludeEval(entry) {
  if (typeof entry !== 'string') return false;
  const normalized = entry.replace(/\\/g, '/').replace(/\/+$/, '').replace(/^\.\//, '');
  return normalized === 'eval' ||
    normalized.startsWith('eval/') ||
    normalized === '.' ||
    normalized === '*' ||
    normalized === '**';
}

function checkSkillRoutingAndEnvPresent(okkiRoot) {
  const skill = readText(path.join(okkiRoot, 'skill', 'SKILL.md'));

  if (skill.includes('OKKIGO_API_KEY') && skill.includes('Do NOT use this skill')) {
    return pass('skill-routing-and-env-present');
  }

  return fail(
    'skill-routing-and-env-present',
    'skill must include OKKIGO_API_KEY and routing boundary text'
  );
}

function checkSkillCredentialResolutionPresent(okkiRoot) {
  const skill = readText(path.join(okkiRoot, 'skill', 'SKILL.md'));
  const authPath = path.join(okkiRoot, 'skill', 'references', 'authentication.md');
  const auth = fs.existsSync(authPath) ? readText(authPath) : '';
  const resolverPath = path.join(okkiRoot, 'skill', 'scripts', 'resolve-api-key.sh');
  const authHelperPath = path.join(okkiRoot, 'skill', 'scripts', 'okki-auth.js');
  const combined = `${skill}\n${auth}`;

  if (
    fs.existsSync(resolverPath) &&
    fs.existsSync(authHelperPath) &&
    combined.includes('Codex-style credential flow') &&
    combined.includes('Explicit environment override') &&
    combined.includes('OKKIGO_API_KEY') &&
    combined.includes('credentials.json') &&
    combined.includes('does not scan platform-specific config directories') &&
    !combined.includes('Accio Work account config') &&
    skill.includes('scripts/resolve-api-key.sh') &&
    auth.includes('scripts/okki-auth.js')
  ) {
    return pass('skill-credential-resolution-present');
  }

  return fail(
    'skill-credential-resolution-present',
    'skill must document credential resolution and include scripts/resolve-api-key.sh plus scripts/okki-auth.js'
  );
}

function checkDocsLegacyRuntimeFlag(okkiRoot) {
  const docs = getDocumentationFiles(okkiRoot);
  const files = docs
    .filter((filePath) => readText(filePath).includes('--runtime='))
    .map((filePath) => toRelativePath(okkiRoot, filePath));

  if (files.length > 0) {
    return warn('docs-legacy-runtime-flag', 'documentation references legacy --runtime= flag', {
      files
    });
  }

  return pass('docs-legacy-runtime-flag');
}

function checkInstallerRuntimeListPresent(okkiRoot) {
  const installScript = readText(path.join(okkiRoot, 'bin', 'install.js'));

  if (
    installScript.includes('SUPPORTED_RUNTIMES') &&
    installScript.includes('codex') &&
    installScript.includes('accio')
  ) {
    return pass('installer-runtime-list-present');
  }

  return fail(
    'installer-runtime-list-present',
    'installer must include SUPPORTED_RUNTIMES, codex, and accio'
  );
}

function checkReleaseVersionConsistency(okkiRoot) {
  const packageJson = readJson(path.join(okkiRoot, 'package.json'));
  const version = typeof packageJson.version === 'string' ? packageJson.version.trim() : '';
  if (!version) {
    return fail('release-version-consistency', 'package version must be set');
  }

  const references = [
    {
      file: 'skill/SKILL.md',
      ok: () => frontmatterVersion(readText(path.join(okkiRoot, 'skill', 'SKILL.md'))) === version
    },
    {
      file: 'bin/install.js',
      ok: () => hasQuotedAssignment(readText(path.join(okkiRoot, 'bin', 'install.js')), 'VERSION', version)
    },
    {
      file: 'skill/scripts/resolve-api-key.sh',
      ok: () => fileIncludes(path.join(okkiRoot, 'skill', 'scripts', 'resolve-api-key.sh'), `OKKIGO_SKILL_VERSION:-${version}`)
    },
    {
      file: 'skill/references/api-reference.md',
      ok: () => fileIncludes(path.join(okkiRoot, 'skill', 'references', 'api-reference.md'), `X-Okki-Skill-Version: ${version}`)
    },
    {
      file: 'README.md',
      ok: () => readText(path.join(okkiRoot, 'README.md')).includes(`**Current**: ${version}`)
    },
    {
      file: 'INSTALL.md',
      ok: () => readText(path.join(okkiRoot, 'INSTALL.md')).includes(`**当前版本**: ${version}`)
    }
  ];

  const mismatches = references
    .filter((reference) => !reference.ok())
    .map((reference) => reference.file);

  if (mismatches.length > 0) {
    return fail(
      'release-version-consistency',
      `release version references must match package version ${version}`,
      { files: mismatches }
    );
  }

  return pass('release-version-consistency');
}

function checkCompanySearchPaginationGuardrail(okkiRoot) {
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  if (!fs.existsSync(discoveryPath)) {
    return fail(
      'company-search-pagination-guardrail',
      'skill must require free paginated company search for target_count above search-advanced page size'
    );
  }

  const discovery = readText(discoveryPath);

  if (
    discovery.includes('target_count > 50') &&
    discovery.includes('size: 50') &&
    discovery.includes('from: 0') &&
    discovery.includes('from: 50') &&
    discovery.includes('/contacts/search') &&
    discovery.includes('/companies/unlock') &&
    discovery.includes('company-count targets')
  ) {
    return pass('company-search-pagination-guardrail');
  }

  return fail(
    'company-search-pagination-guardrail',
    'skill must require free paginated company search for target_count above search-advanced page size'
  );
}

function checkCurrentTurnMerchantSeedGuardrail(okkiRoot) {
  const skillPath = path.join(okkiRoot, 'skill', 'SKILL.md');
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  const profilePath = path.join(okkiRoot, 'skill', 'references', 'merchant-profile-playbook.md');

  if (!fs.existsSync(skillPath) || !fs.existsSync(discoveryPath) || !fs.existsSync(profilePath)) {
    return fail(
      'current-turn-merchant-seed-guardrail',
      'skill must extract current-turn merchant facts before PMF Gate and avoid repeated profile questions'
    );
  }

  const combined = [
    readText(skillPath),
    readText(discoveryPath),
    readText(profilePath)
  ].join('\n');

  if (
    combined.includes('Current-Turn Merchant Seed') &&
    combined.includes('user_provided_current_turn') &&
    combined.includes('current_turn_merchant_seed_extracted') &&
    combined.includes('Do not repeat questions for merchant facts the user already provided') &&
    combined.includes('trade_mode_unknown_degraded_not_blocked')
  ) {
    return pass('current-turn-merchant-seed-guardrail');
  }

  return fail(
    'current-turn-merchant-seed-guardrail',
    'skill must extract current-turn merchant facts before PMF Gate and avoid repeated profile questions'
  );
}

function checkProspectingAuditRemediationGuardrails(okkiRoot) {
  const skillPath = path.join(okkiRoot, 'skill', 'SKILL.md');
  const apiPath = path.join(okkiRoot, 'skill', 'references', 'api-reference.md');
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  const profilePath = path.join(okkiRoot, 'skill', 'references', 'merchant-profile-playbook.md');
  const statePath = path.join(okkiRoot, 'skill', 'scripts', 'okki-state.js');
  const searchScriptPath = path.join(okkiRoot, 'skill', 'scripts', 'search-companies.js');

  if (![skillPath, apiPath, discoveryPath, profilePath, statePath, searchScriptPath].every((filePath) => fs.existsSync(filePath))) {
    return fail(
      'prospecting-audit-remediation-guardrails',
      'skill must include audit remediation contracts for preflight, paths, free output, unlock, and viewed input'
    );
  }

  const skill = readText(skillPath);
  const combined = [
    skill,
    readText(apiPath),
    readText(discoveryPath),
    readText(profilePath),
    readText(statePath),
    readText(searchScriptPath)
  ].join('\n');

  const skillLineCount = skill.split(/\r?\n/).length;
  const required = [
    '## Mandatory Prospecting Preflight',
    'node scripts/okki-state.js profile read',
    'Do not display `domain`, website, homepage, URL, or link fields in free company-search results',
    'A user-selected company is not enough to spend credits; ask for explicit unlock confirmation first',
    'We manufacture paper packaging with EU environmental certification; find prospects in Italy',
    'Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search',
    '--results-file PATH',
    '--results-file -',
    'search-advanced supports only',
    'node scripts/search-companies.js --json',
    '| `withEmails` | integer |',
    'X-Okki-Install-Id',
    'validateCountryCodes',
    'payload.withEmails = 1',
    'payload.crossFieldOperator = value'
  ];

  const missing = required.filter((needle) => !combined.includes(needle));
  if (skillLineCount > 500) {
    missing.push(`SKILL.md has ${skillLineCount} lines, expected <= 500`);
  }

  if (missing.length === 0) {
    return pass('prospecting-audit-remediation-guardrails');
  }

  return fail(
    'prospecting-audit-remediation-guardrails',
    'skill must include audit remediation contracts for preflight, paths, free output, unlock, and viewed input',
    { missing }
  );
}

function checkOkkiIndexLanguagePreferenceGuardrail(okkiRoot) {
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  if (!fs.existsSync(discoveryPath)) {
    return fail(
      'okki-index-language-preference-guardrail',
      'skill must define weak-model-friendly OKKI index-language search preferences before first search'
    );
  }

  const discovery = readText(discoveryPath);
  const required = [
    'Round 1 Search Preference',
    'Prefer concrete product or business-scope terms that may appear in target-company profiles',
    'Use fewer abstract industry labels, such as FMCG, food and beverage, and contract packaging',
    'In Round 1, avoid combining multiple search dimensions',
    'productKeywords + companyTypeKeywords + industryKeywords + AND',
    'unless the user explicitly specifies them'
  ];
  const forbidden = [
    'Cold start: before any OKKI result is available, choose concrete target-company profile words by business reasoning',
    'Do not assume the model knows OKKI internal index terms before the first search',
    'Observed results: after any OKKI result is returned, use terms from `company_type`, `industry`, `main_products`, and `company_profile` for recovery'
  ];

  const missing = required.filter((needle) => !discovery.includes(needle));
  const presentForbidden = forbidden.filter((needle) => discovery.includes(needle));
  if (missing.length === 0 && presentForbidden.length === 0) {
    return pass('okki-index-language-preference-guardrail');
  }

  return fail(
    'okki-index-language-preference-guardrail',
    'skill must define weak-model-friendly OKKI index-language search preferences before first search',
    { missing, forbidden: presentForbidden }
  );
}

function checkDiscoveryRecoveryGradientGuardrail(okkiRoot) {
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  if (!fs.existsSync(discoveryPath)) {
    return fail(
      'discovery-recovery-gradient-guardrail',
      'skill must define the first-search and automatic recovery gradient'
    );
  }

  const discovery = readText(discoveryPath);
  const required = [
    'Automatic recovery gradient',
    'Round 1: model-judgment first search',
    'Recovery 1: target-side rewrite',
    'Recovery 2: buyer-route shift',
    'Recovery 3: narrow-field cleanup',
    'Stop after the recovery budget',
    'merchant_offer_anchor',
    'target_side_projection',
    'direct target-company request',
    'Do not rewrite the user-specified company type in Recovery 1',
    'Do not use global `OR`',
    'Do not combine unrelated buyer routes'
  ];

  const missing = required.filter((needle) => !discovery.includes(needle));
  if (missing.length === 0) {
    return pass('discovery-recovery-gradient-guardrail');
  }

  return fail(
    'discovery-recovery-gradient-guardrail',
    'skill must define the first-search and automatic recovery gradient',
    { missing }
  );
}

function checkCompactOutputGuardrails(okkiRoot) {
  const requiredFiles = [
    path.join(okkiRoot, 'skill', 'SKILL.md'),
    path.join(okkiRoot, 'skill', 'references', 'workflows.md'),
    path.join(okkiRoot, 'skill', 'scripts', 'README.md'),
    path.join(okkiRoot, 'skill', 'scripts', 'search-companies.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'discover-companies-batch.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'unlock-companies.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'search-contacts.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'email-status.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'lib', 'batch-state.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'lib', 'compact-output.js'),
    path.join(okkiRoot, 'skill', 'scripts', 'okki-state.js')
  ];

  const missingFiles = requiredFiles
    .filter((filePath) => !fs.existsSync(filePath))
    .map((filePath) => toRelativePath(okkiRoot, filePath));

  if (missingFiles.length > 0) {
    return fail(
      'compact-output-guardrails',
      'OKKI Go must use compact wrappers, private raw files, and unchanged paid confirmation rules',
      { missing: missingFiles }
    );
  }

  const combined = requiredFiles.map((filePath) => readText(filePath)).join('\n');
  const required = [
    'Normal OKKI Go tool output must be compact and user-facing',
    'Raw API JSON, long email bodies, full profile objects, full local state, and internal identifiers must not be streamed into the model unless the user explicitly asks for raw/debug output',
    'discover-companies-batch.js --compact',
    'search-companies.js --json',
    '--compact',
    '--save-raw',
    '--limit-output',
    '--fields',
    'private_mapping_saved',
    'raw_path',
    'unlock-companies.js --rows',
    'After confirmation, use `unlock-companies.js --rows',
    'A user-selected company is not enough to spend credits; ask for explicit unlock confirmation first',
    'search-contacts.js --compact',
    'Before the first `POST /contacts/search`',
    'email-status.js --compact',
    'Do not display full email content unless explicitly requested',
    'mark-unlocked-batch',
    'full local state',
    'output_budget',
    'truncated',
    'available',
    'next_offset',
    '--batch latest',
    '24h TTL',
    'latest batch pointer',
    'Latest batch reuse never replaces the required paid confirmation',
    'OKKIGO_BATCH_STATE_FILE',
    'resolveBatchPath'
  ];
  const missing = required.filter((needle) => !combined.includes(needle));

  if (missing.length === 0) {
    return pass('compact-output-guardrails');
  }

  return fail(
    'compact-output-guardrails',
    'OKKI Go must use compact wrappers, private raw files, and unchanged paid confirmation rules',
    { missing }
  );
}

function fileIncludes(filePath, value) {
  return fs.existsSync(filePath) && readText(filePath).includes(value);
}

function frontmatterVersion(markdown) {
  const match = String(markdown || '').match(/^---\n[\s\S]*?^version:\s*([^\s]+)\s*$/m);
  return match ? match[1].trim() : null;
}

function hasQuotedAssignment(source, name, value) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*['"]${escapeRegex(value)}['"]`);
  return pattern.test(String(source || ''));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getDocumentationFiles(okkiRoot) {
  const files = [
    path.join(okkiRoot, 'README.md'),
    path.join(okkiRoot, 'INSTALL.md')
  ];
  const docsDir = path.join(okkiRoot, 'docs');

  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => path.join(docsDir, entry));
    files.push(...docFiles);
  }

  return files;
}

function toRelativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

module.exports = { runStaticChecks };
