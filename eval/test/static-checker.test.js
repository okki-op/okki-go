const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runStaticChecks } = require('../lib/static/static-checker');

test('runStaticChecks passes required repository consistency checks', () => {
  const results = runStaticChecks();

  assert.equal(resultById(results, 'package-files-exclude-eval').status, 'passed');
  assert.equal(resultById(results, 'skill-routing-and-env-present').status, 'passed');
  assert.equal(resultById(results, 'skill-credential-resolution-present').status, 'passed');
  assert.equal(resultById(results, 'installer-runtime-list-present').status, 'passed');
  assert.equal(resultById(results, 'release-version-consistency').status, 'passed');
  assert.equal(resultById(results, 'company-search-pagination-guardrail').status, 'passed');
  assert.equal(resultById(results, 'current-turn-merchant-seed-guardrail').status, 'passed');
  assert.equal(resultById(results, 'prospecting-audit-remediation-guardrails').status, 'passed');
  assert.equal(resultById(results, 'okki-index-language-preference-guardrail').status, 'passed');
  assert.equal(resultById(results, 'discovery-recovery-gradient-guardrail').status, 'passed');
  assert.equal(resultById(results, 'compact-output-guardrails').status, 'passed');
});

test('runStaticChecks warns with relative file paths for legacy runtime flags', () => {
  const root = makeOkkiRoot({
    files: ['bin/', 'skill/'],
    skill: 'OKKIGO_API_KEY\nDo NOT use this skill\n',
    readme: 'Use --runtime=codex here.\n',
    install: 'Use --runtime=claude here.\n',
    docs: {
      'guide.md': 'Use --runtime=openclaw here.\n',
      'ignore.txt': 'Use --runtime=claude here.\n'
    },
    installer: 'const SUPPORTED_RUNTIMES = [\'codex\'];\n'
  });

  const results = runStaticChecks({ okkiRoot: root });
  const result = resultById(results, 'docs-legacy-runtime-flag');

  assert.equal(result.status, 'warned');
  assert.equal(result.reason, 'documentation references legacy --runtime= flag');
  assert.deepEqual(result.files, ['README.md', 'INSTALL.md', 'docs/guide.md']);
});

test('runStaticChecks passes docs legacy runtime check when docs are current', () => {
  const root = makeOkkiRoot();
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'docs-legacy-runtime-flag');

  assert.equal(result.status, 'passed');
});

test('runStaticChecks fails when package files include eval', () => {
  for (const files of [['eval'], ['eval/'], ['./eval'], ['eval/**'], ['.'], ['./'], ['*']]) {
    const root = makeOkkiRoot({ files });
    const result = resultById(runStaticChecks({ okkiRoot: root }), 'package-files-exclude-eval');

    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'package files must not include eval/');
  }
});

test('runStaticChecks fails when package files are missing or invalid', () => {
  for (const files of [undefined, null, 'bin/']) {
    const root = makeOkkiRoot({ files });
    const packagePath = path.join(root, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (files === undefined) {
      delete packageJson.files;
    } else {
      packageJson.files = files;
    }
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

    const result = resultById(runStaticChecks({ okkiRoot: root }), 'package-files-exclude-eval');

    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'package files must explicitly exclude eval/');
  }
});

test('runStaticChecks fails when skill routing or environment text is missing', () => {
  const root = makeOkkiRoot({ skill: 'OKKIGO_API_KEY only\n' });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'skill-routing-and-env-present');

  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'skill must include OKKIGO_API_KEY and routing boundary text');
});

test('runStaticChecks fails when credential resolver guidance is missing', () => {
  const root = makeOkkiRoot({
    skill: 'OKKIGO_API_KEY\nDo NOT use this skill\n',
    scripts: {}
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'skill-credential-resolution-present');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must document credential resolution and include scripts/resolve-api-key.sh plus scripts/okki-auth.js'
  );
});

test('runStaticChecks fails when installer runtime list, codex, or accio is missing', () => {
  const root = makeOkkiRoot({ installer: 'const SUPPORTED_RUNTIMES = [\'openclaw\'];\n' });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'installer-runtime-list-present');

  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'installer must include SUPPORTED_RUNTIMES, codex, and accio');
});

test('runStaticChecks fails when release version references drift', () => {
  const root = makeOkkiRoot({
    packageVersion: '1.2.0',
    skill: [
      '---',
      'version: 1.2.0',
      '---',
      'OKKIGO_API_KEY',
      'Do NOT use this skill',
      ...credentialSkillLines(),
      'scripts/resolve-api-key.sh'
    ].join('\n'),
    installer: [
      'const VERSION = \'1.0.12\';',
      'const SUPPORTED_RUNTIMES = [\'codex\', \'accio\'];'
    ].join('\n'),
    scripts: {
      'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.0.12}"\n',
      'okki-auth.js': '#!/usr/bin/env node\n'
    },
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.0.12\n',
      'authentication.md': credentialAuthText()
    },
    readme: '**Current**: 1.0.12\n',
    install: '**当前版本**: 1.0.12\n'
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'release-version-consistency');

  assert.equal(result.status, 'failed');
  assert.match(result.reason, /release version references must match package version 1\.2\.0/);
  assert.deepEqual(result.files, [
    'bin/install.js',
    'skill/scripts/resolve-api-key.sh',
    'skill/references/api-reference.md',
    'README.md',
    'INSTALL.md'
  ]);
});

test('runStaticChecks fails when free company search pagination guardrail is missing', () => {
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n',
      'discovery-playbook.md': [
        'Call search-advanced.',
        'Company search is free.'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'company-search-pagination-guardrail');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must require free paginated company search for target_count above search-advanced page size'
  );
});

test('runStaticChecks fails when current-turn merchant seed guardrail is missing', () => {
  const root = makeOkkiRoot({
    skill: [
      '---',
      'version: 1.2.0',
      '---',
      'OKKIGO_API_KEY',
      'Do NOT use this skill',
      ...credentialSkillLines(),
      'scripts/resolve-api-key.sh'
    ].join('\n'),
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.'
      ].join('\n'),
      'merchant-profile-playbook.md': 'user_provided may be used as a default.'
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'current-turn-merchant-seed-guardrail');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must extract current-turn merchant facts before PMF Gate and avoid repeated profile questions'
  );
});

test('runStaticChecks fails when prospecting audit remediation guardrails are missing', () => {
  const root = makeOkkiRoot({
    skill: [
      '---',
      'version: 1.2.0',
      '---',
      'OKKIGO_API_KEY',
      'Do NOT use this skill',
      ...credentialSkillLines(),
      'scripts/resolve-api-key.sh',
      'Current-Turn Merchant Seed',
      'user_provided_current_turn',
      'current_turn_merchant_seed_extracted',
      'Do not repeat questions for merchant facts the user already provided',
      'trade_mode_unknown_degraded_not_blocked'
    ].join('\n'),
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked'
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    },
    scripts: {
      'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.2.0}"\n',
      'okki-auth.js': '#!/usr/bin/env node\n',
      'okki-state.js': 'Usage: node skill/scripts/okki-state.js viewed classify --results-json JSON\n'
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'prospecting-audit-remediation-guardrails');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must include audit remediation contracts for preflight, paths, free output, unlock, and viewed input'
  );
});

test('runStaticChecks fails when discovery recovery gradient is missing', () => {
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked'
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'discovery-recovery-gradient-guardrail');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must define the first-search and automatic recovery gradient'
  );
});

test('runStaticChecks fails when OKKI index-language preference is missing', () => {
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked'
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'okki-index-language-preference-guardrail');

  assert.equal(result.status, 'failed');
  assert.equal(
    result.reason,
    'skill must define weak-model-friendly OKKI index-language search preferences before first search'
  );
});

test('runStaticChecks passes when OKKI index-language preference is explicit', () => {
  const preferenceText = [
    'Round 1 Search Preference',
    'Prefer concrete product or business-scope terms that may appear in target-company profiles',
    'Use fewer abstract industry labels, such as FMCG, food and beverage, and contract packaging',
    'In Round 1, avoid combining multiple search dimensions',
    'productKeywords + companyTypeKeywords + industryKeywords + AND',
    'unless the user explicitly specifies them'
  ].join('\n');
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked',
        preferenceText
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'okki-index-language-preference-guardrail');

  assert.equal(result.status, 'passed');
});

test('runStaticChecks fails when OKKI index-language preference keeps the old long cold-start wording', () => {
  const oldPreferenceText = [
    'OKKI Index-Language Search Preference',
    'Cold start: before any OKKI result is available, choose concrete target-company profile words by business reasoning',
    'Do not assume the model knows OKKI internal index terms before the first search',
    'Observed results: after any OKKI result is returned, use terms from `company_type`, `industry`, `main_products`, and `company_profile` for recovery',
    'Start with concrete product, inventory, application, or operating-category words',
    'Do not start with abstract labels such as FMCG, food and beverage, contract packaging',
    'Do not start with productKeywords + companyTypeKeywords + industryKeywords + crossFieldOperator: "AND"',
    'For multilingual markets, try local-language or Chinese profile words when English abstract terms return weak results',
    'First get recall, then filter returned companies locally'
  ].join('\n');
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked',
        oldPreferenceText
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'okki-index-language-preference-guardrail');

  assert.equal(result.status, 'failed');
  assert.ok(result.forbidden.includes('Cold start: before any OKKI result is available, choose concrete target-company profile words by business reasoning'));
});

test('runStaticChecks passes when discovery recovery gradient is explicit', () => {
  const gradientText = [
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
  ].join('\n');
  const root = makeOkkiRoot({
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked',
        gradientText
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'discovery-recovery-gradient-guardrail');

  assert.equal(result.status, 'passed');
});

test('compact output guardrails fail when compact wrappers and docs are missing', () => {
  const root = makeOkkiRoot({
    scripts: {
      'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.2.0}"\n',
      'okki-auth.js': '#!/usr/bin/env node\n',
      'okki-state.js': [
        'Usage:',
        'node scripts/okki-state.js profile read',
        'node scripts/okki-state.js viewed classify --results-json JSON --results-file PATH --results-file -'
      ].join('\n'),
      'search-companies.js': [
        'node scripts/search-companies.js --json',
        'X-Okki-Install-Id',
        'validateCountryCodes',
        'payload.withEmails = 1',
        'payload.crossFieldOperator = value'
      ].join('\n')
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'compact-output-guardrails');

  assert.equal(result.status, 'failed');
  assert.match(result.reason, /compact wrappers/);
  assert.ok(result.missing.includes('skill/scripts/discover-companies-batch.js'));
});

test('compact output guardrails pass when wrappers, raw preservation, and paid confirmation text exist', () => {
  const compactText = [
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
  ].join('\n');
  const root = makeOkkiRoot({
    skill: [
      '---',
      'version: 1.2.0',
      '---',
      'OKKIGO_API_KEY',
      'Do NOT use this skill',
      ...credentialSkillLines(),
      'scripts/resolve-api-key.sh',
      compactText
    ].join('\n'),
    scripts: {
      'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.2.0}"\n',
      'okki-auth.js': '#!/usr/bin/env node\n',
      'okki-state.js': [
        'Usage:',
        'node scripts/okki-state.js profile read',
        'node scripts/okki-state.js viewed classify --results-json JSON --results-file PATH --results-file -',
        compactText
      ].join('\n'),
      'search-companies.js': [
        'node scripts/search-companies.js --json',
        'X-Okki-Install-Id',
        'validateCountryCodes',
        'payload.withEmails = 1',
        'payload.crossFieldOperator = value',
        compactText
      ].join('\n'),
      'discover-companies-batch.js': compactText,
      'unlock-companies.js': compactText,
      'search-contacts.js': compactText,
      'email-status.js': compactText,
      'lib/batch-state.js': compactText,
      'lib/compact-output.js': compactText,
      'README.md': compactText
    },
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
      'authentication.md': credentialAuthText(),
      'discovery-playbook.md': [
        'search-advanced page size must never exceed 50.',
        'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
        'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'current_turn_merchant_seed_extracted',
        'Do not repeat questions for merchant facts the user already provided',
        'trade_mode_unknown_degraded_not_blocked',
        'Do not display `domain`, website, homepage, URL, or link fields in free company-search results',
        'A user-selected company is not enough to spend credits; ask for explicit unlock confirmation first',
        'We manufacture paper packaging with EU environmental certification; find prospects in Italy',
        'Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search',
        'search-advanced supports only'
      ].join('\n'),
      'merchant-profile-playbook.md': [
        'Current-Turn Merchant Seed',
        'user_provided_current_turn',
        'Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search'
      ].join('\n'),
      'workflows.md': compactText
    }
  });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'compact-output-guardrails');

  assert.equal(result.status, 'passed');
});

function resultById(results, id) {
  const result = results.find((candidate) => candidate.id === id);
  assert.ok(result, `missing result ${id}`);
  return result;
}

function makeOkkiRoot(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-static-checker-'));
  fs.mkdirSync(path.join(root, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skill'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skill', 'references'), { recursive: true });

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: '@okki/go-skill',
    version: overrides.packageVersion || '1.2.0',
    files: Object.hasOwn(overrides, 'files') ? overrides.files : ['bin/', 'skill/', 'README.md', 'INSTALL.md']
  }, null, 2));
  fs.writeFileSync(path.join(root, 'README.md'), overrides.readme || '**Current**: 1.2.0\n');
  fs.writeFileSync(path.join(root, 'INSTALL.md'), overrides.install || '**当前版本**: 1.2.0\n');
  fs.writeFileSync(
    path.join(root, 'skill', 'SKILL.md'),
    overrides.skill || [
      '---',
      'version: 1.2.0',
      '---',
      'OKKIGO_API_KEY',
      'Do NOT use this skill',
      ...credentialSkillLines(),
      'scripts/resolve-api-key.sh'
    ].join('\n')
  );
  fs.mkdirSync(path.join(root, 'skill', 'scripts'), { recursive: true });
  for (const [fileName, content] of Object.entries(overrides.scripts || {
    'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.2.0}"\n',
    'okki-auth.js': '#!/usr/bin/env node\n',
    'okki-state.js': [
      'Usage:',
      'node scripts/okki-state.js profile read',
      'node scripts/okki-state.js viewed classify --results-json JSON --results-file PATH --results-file -'
    ].join('\n'),
    'search-companies.js': [
      'node scripts/search-companies.js --json',
      'X-Okki-Install-Id',
      'validateCountryCodes',
      'payload.withEmails = 1',
      'payload.crossFieldOperator = value'
    ].join('\n')
  })) {
    const scriptPath = path.join(root, 'skill', 'scripts', fileName);
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, content);
  }
  for (const [fileName, content] of Object.entries(overrides.references || {
    'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n| `withEmails` | integer |\n',
    'authentication.md': credentialAuthText(),
    'discovery-playbook.md': [
      'search-advanced page size must never exceed 50.',
      'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
      'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.',
      'Current-Turn Merchant Seed',
      'user_provided_current_turn',
      'current_turn_merchant_seed_extracted',
      'Do not repeat questions for merchant facts the user already provided',
      'trade_mode_unknown_degraded_not_blocked',
      'Do not display `domain`, website, homepage, URL, or link fields in free company-search results',
      'A user-selected company is not enough to spend credits; ask for explicit unlock confirmation first',
      'We manufacture paper packaging with EU environmental certification; find prospects in Italy',
      'Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search',
      'search-advanced supports only'
    ].join('\n'),
    'merchant-profile-playbook.md': [
      'Current-Turn Merchant Seed',
      'user_provided_current_turn',
      'Lite Onboarding asks merchant-profile defaults for future reuse; PMF Gate asks only what is needed for the current search'
    ].join('\n')
  })) {
    fs.writeFileSync(path.join(root, 'skill', 'references', fileName), content);
  }
  fs.writeFileSync(
    path.join(root, 'bin', 'install.js'),
    overrides.installer || 'const VERSION = \'1.2.0\';\nconst SUPPORTED_RUNTIMES = [\'codex\', \'accio\'];\n'
  );

  for (const [fileName, content] of Object.entries(overrides.docs || {})) {
    fs.writeFileSync(path.join(root, 'docs', fileName), content);
  }

  return root;
}

function credentialSkillLines() {
  return [
    'Codex-style credential flow',
    'Explicit environment override',
    'credentials.json',
    'does not scan platform-specific config directories'
  ];
}

function credentialAuthText() {
  return [
    'Codex-style credential flow',
    'Explicit environment override',
    'OKKIGO_API_KEY',
    'credentials.json',
    'does not scan platform-specific config directories',
    'scripts/okki-auth.js'
  ].join('\n');
}
