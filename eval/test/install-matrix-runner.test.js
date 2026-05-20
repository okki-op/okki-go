const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runInstallerMatrix } = require('../lib/installer/install-matrix-runner');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-install-test-'));
}

test('runInstallerMatrix installs codex and openclaw into temp config dirs', () => {
  const tmpRoot = makeTempRoot();

  const results = runInstallerMatrix({ tmpRoot, runtimes: ['codex', 'openclaw'] });

  assert.equal(results.length, 2);

  const codex = results.find(result => result.runtime === 'codex');
  assert.equal(codex.status, 'passed');
  assert.equal(codex.id, 'install-codex');
  assert.equal(codex.mainFile, 'skill.md');
  assert.equal(codex.skillDir, path.join(tmpRoot, 'codex', 'skills', 'okki-go'));
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'skill.md')));
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'references', 'api-reference.md')));
  assert.ok(fs.statSync(path.join(codex.skillDir, 'scripts')).isDirectory());
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'VERSION')));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(codex.skillDir, '.okki-go-manifest.json'), 'utf8')).runtime,
    'codex'
  );

  const openclaw = results.find(result => result.runtime === 'openclaw');
  assert.equal(openclaw.status, 'passed');
  assert.equal(openclaw.id, 'install-openclaw');
  assert.equal(openclaw.mainFile, 'SKILL.md');
  assert.equal(openclaw.skillDir, path.join(tmpRoot, 'openclaw', 'skills', 'okki-go'));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'references', 'api-reference.md')));
  assert.ok(fs.statSync(path.join(openclaw.skillDir, 'scripts')).isDirectory());
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'VERSION')));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(openclaw.skillDir, '.okki-go-manifest.json'), 'utf8')).runtime,
    'openclaw'
  );
});

test('runInstallerMatrix rejects unsupported runtimes without installing', () => {
  const tmpRoot = makeTempRoot();

  const results = runInstallerMatrix({ tmpRoot, runtimes: ['bogus'] });

  assert.deepEqual(results, [
    {
      id: 'install-bogus',
      status: 'failed',
      reason: 'Unsupported runtime: bogus',
      runtime: 'bogus'
    }
  ]);
  assert.equal(fs.existsSync(path.join(tmpRoot, 'bogus')), false);
});

test('runInstallerMatrix ignores inherited config env vars for unselected runtimes', () => {
  const tmpRoot = makeTempRoot();
  const inheritedCodexHome = path.join(tmpRoot, 'inherited-codex-home');
  const previousCodexHome = process.env.CODEX_HOME;
  process.env.CODEX_HOME = inheritedCodexHome;

  try {
    const results = runInstallerMatrix({ tmpRoot, runtimes: ['openclaw'] });

    assert.equal(results[0].status, 'passed');
    assert.equal(results[0].skillDir, path.join(tmpRoot, 'openclaw', 'skills', 'okki-go'));
    assert.equal(fs.existsSync(path.join(inheritedCodexHome, 'skills', 'okki-go')), false);
  } finally {
    if (previousCodexHome === undefined) {
      delete process.env.CODEX_HOME;
    } else {
      process.env.CODEX_HOME = previousCodexHome;
    }
  }
});
