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
    'skill must document credential resolution and include scripts/resolve-api-key.sh'
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
      'four-tier credential resolution',
      'platform config/secrets',
      'local credentials file',
      'scripts/resolve-api-key.sh'
    ].join('\n'),
    installer: [
      'const VERSION = \'1.0.12\';',
      'const SUPPORTED_RUNTIMES = [\'codex\', \'accio\'];'
    ].join('\n'),
    scripts: {
      'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.0.12}"\n'
    },
    references: {
      'api-reference.md': 'X-Okki-Skill-Version: 1.0.12\n'
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
      'four-tier credential resolution',
      'platform config/secrets',
      'local credentials file',
      'scripts/resolve-api-key.sh'
    ].join('\n')
  );
  fs.mkdirSync(path.join(root, 'skill', 'scripts'), { recursive: true });
  for (const [fileName, content] of Object.entries(overrides.scripts || {
    'resolve-api-key.sh': 'SKILL_VERSION="${OKKIGO_SKILL_VERSION:-1.2.0}"\n'
  })) {
    fs.writeFileSync(path.join(root, 'skill', 'scripts', fileName), content);
  }
  for (const [fileName, content] of Object.entries(overrides.references || {
    'api-reference.md': 'X-Okki-Skill-Version: 1.2.0\n',
    'discovery-playbook.md': [
      'search-advanced page size must never exceed 50.',
      'When target_count > 50, use free pagination with size: 50, from: 0, then from: 50.',
      'Do not call /contacts/search or /companies/unlock to satisfy company-count targets.'
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
