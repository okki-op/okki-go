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
  assert.equal(resultById(results, 'installer-runtime-list-present').status, 'passed');
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

test('runStaticChecks fails when installer runtime list or codex is missing', () => {
  const root = makeOkkiRoot({ installer: 'const SUPPORTED_RUNTIMES = [\'openclaw\'];\n' });
  const result = resultById(runStaticChecks({ okkiRoot: root }), 'installer-runtime-list-present');

  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'installer must include SUPPORTED_RUNTIMES and codex');
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

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: '@okki/go-skill',
    files: Object.hasOwn(overrides, 'files') ? overrides.files : ['bin/', 'skill/', 'README.md', 'INSTALL.md']
  }, null, 2));
  fs.writeFileSync(path.join(root, 'README.md'), overrides.readme || 'Current README.\n');
  fs.writeFileSync(path.join(root, 'INSTALL.md'), overrides.install || 'Current install docs.\n');
  fs.writeFileSync(
    path.join(root, 'skill', 'SKILL.md'),
    overrides.skill || 'OKKIGO_API_KEY\nDo NOT use this skill\n'
  );
  fs.writeFileSync(
    path.join(root, 'bin', 'install.js'),
    overrides.installer || 'const SUPPORTED_RUNTIMES = [\'codex\'];\n'
  );

  for (const [fileName, content] of Object.entries(overrides.docs || {})) {
    fs.writeFileSync(path.join(root, 'docs', fileName), content);
  }

  return root;
}
