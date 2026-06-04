const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runCommand } = require('../lib/core/process');
const { fromOkkiRoot } = require('../lib/core/paths');
const { runInstallerMatrix } = require('../lib/installer/install-matrix-runner');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-install-test-'));
}

function assertExactDirEntry(dir, entry) {
  const entries = fs.readdirSync(dir);
  assert.ok(
    entries.includes(entry),
    `Expected exact directory entry ${entry} in ${dir}; saw ${entries.join(', ')}`
  );
}

test('runInstallerMatrix installs codex and openclaw into temp config dirs', () => {
  const tmpRoot = makeTempRoot();

  const results = runInstallerMatrix({ tmpRoot, runtimes: ['codex', 'openclaw'] });

  assert.equal(results.length, 2);

  const codex = results.find(result => result.runtime === 'codex');
  assert.equal(codex.status, 'passed');
  assert.equal(codex.id, 'install-codex');
  assert.equal(codex.mainFile, 'SKILL.md');
  assert.equal(codex.skillDir, path.join(tmpRoot, 'codex', 'skills', 'okki-go'));
  assertExactDirEntry(codex.skillDir, 'SKILL.md');
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'references', 'api-reference.md')));
  assert.ok(fs.statSync(path.join(codex.skillDir, 'scripts')).isDirectory());
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'scripts', 'resolve-api-key.sh')));
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'scripts', 'lib', 'batch-state.js')));
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'scripts', 'lib', 'compact-output.js')));
  assert.ok(fs.existsSync(path.join(codex.skillDir, 'scripts', 'lib', 'okki-api.js')));
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
  assertExactDirEntry(openclaw.skillDir, 'SKILL.md');
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'references', 'api-reference.md')));
  assert.ok(fs.statSync(path.join(openclaw.skillDir, 'scripts')).isDirectory());
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'scripts', 'resolve-api-key.sh')));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'scripts', 'lib', 'batch-state.js')));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'scripts', 'lib', 'compact-output.js')));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'scripts', 'lib', 'okki-api.js')));
  assert.ok(fs.existsSync(path.join(openclaw.skillDir, 'VERSION')));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(openclaw.skillDir, '.okki-go-manifest.json'), 'utf8')).runtime,
    'openclaw'
  );
});

test('runInstallerMatrix installs accio into the selected account skill directory', () => {
  const tmpRoot = makeTempRoot();
  const accountId = 'test-account';
  const agentId = 'DID-TEST-AGENT';
  const agentCoreSkillsDir = path.join(
    tmpRoot,
    'accio',
    'accounts',
    accountId,
    'agents',
    agentId,
    'agent-core',
    'skills'
  );
  fs.mkdirSync(agentCoreSkillsDir, { recursive: true });
  fs.writeFileSync(path.join(agentCoreSkillsDir, 'skills.jsonc'), JSON.stringify({ skills: [] }, null, 2));

  const results = runInstallerMatrix({ tmpRoot, runtimes: ['accio'], accioAccountId: accountId });

  assert.equal(results.length, 1);

  const accio = results[0];
  assert.equal(accio.status, 'passed');
  assert.equal(accio.id, 'install-accio');
  assert.equal(accio.mainFile, 'SKILL.md');
  assert.equal(
    accio.skillDir,
    path.join(tmpRoot, 'accio', 'accounts', accountId, 'skills', 'okki-go')
  );
  assertExactDirEntry(accio.skillDir, 'SKILL.md');
  assert.ok(fs.existsSync(path.join(accio.skillDir, 'references', 'api-reference.md')));
  assert.ok(fs.statSync(path.join(accio.skillDir, 'scripts')).isDirectory());
  assert.ok(fs.existsSync(path.join(accio.skillDir, 'scripts', 'resolve-api-key.sh')));
  assert.ok(fs.existsSync(path.join(accio.skillDir, 'VERSION')));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(accio.skillDir, '.okki-go-manifest.json'), 'utf8')).runtime,
    'accio'
  );

  const skillsConfig = JSON.parse(
    fs.readFileSync(path.join(tmpRoot, 'accio', 'accounts', accountId, 'skills', 'skills_config.json'), 'utf8')
  );
  assert.deepEqual(skillsConfig['OKKI Go'], {
    enabled: true,
    installedVersion: JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).version
  });

  const agentSkillDir = path.join(
    tmpRoot,
    'accio',
    'accounts',
    accountId,
    'agents',
    agentId,
    'skills',
    'okki-go'
  );
  assertExactDirEntry(agentSkillDir, 'SKILL.md');

  const agentSkillsConfig = JSON.parse(
    fs.readFileSync(path.join(agentCoreSkillsDir, 'skills.jsonc'), 'utf8')
  );
  assert.equal(agentSkillsConfig.skills.length, 1);
  assert.equal(agentSkillsConfig.skills[0].name, 'OKKI Go');
  assert.equal(agentSkillsConfig.skills[0].path, path.join(agentSkillDir, 'SKILL.md'));
  assert.equal(agentSkillsConfig.skills[0].enabled, true);
  assert.equal(
    agentSkillsConfig.skills[0].installedVersion,
    JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')).version
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

test('installer --all skips accio when no Accio account is configured', () => {
  const tmpRoot = makeTempRoot();
  const accioConfigDir = path.join(tmpRoot, 'empty-accio');

  const result = runCommand(
    process.execPath,
    [fromOkkiRoot('bin', 'install.js'), '--global', '--all'],
    {
      cwd: fromOkkiRoot(),
      env: {
        CLAUDE_CONFIG_DIR: path.join(tmpRoot, 'claude'),
        OPENCLAW_CONFIG_DIR: path.join(tmpRoot, 'openclaw'),
        OPENCODE_CONFIG_DIR: path.join(tmpRoot, 'opencode'),
        GEMINI_CONFIG_DIR: path.join(tmpRoot, 'gemini'),
        CURSOR_CONFIG_DIR: path.join(tmpRoot, 'cursor'),
        WINDSURF_CONFIG_DIR: path.join(tmpRoot, 'windsurf'),
        CODEX_HOME: path.join(tmpRoot, 'codex'),
        COPILOT_CONFIG_DIR: path.join(tmpRoot, 'copilot'),
        CLINE_CONFIG_DIR: path.join(tmpRoot, 'cline'),
        ACCIO_CONFIG_DIR: accioConfigDir
      }
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Skipping Accio Work/);
  assertExactDirEntry(path.join(tmpRoot, 'codex', 'skills', 'okki-go'), 'SKILL.md');
  assert.equal(fs.existsSync(path.join(accioConfigDir, 'accounts')), false);
});

test('installer --all uninstall skips accio when no Accio account is configured', () => {
  const tmpRoot = makeTempRoot();
  const accioConfigDir = path.join(tmpRoot, 'empty-accio');

  const result = runCommand(
    process.execPath,
    [fromOkkiRoot('bin', 'install.js'), '--uninstall', '--global', '--all'],
    {
      cwd: fromOkkiRoot(),
      env: {
        CLAUDE_CONFIG_DIR: path.join(tmpRoot, 'claude'),
        OPENCLAW_CONFIG_DIR: path.join(tmpRoot, 'openclaw'),
        OPENCODE_CONFIG_DIR: path.join(tmpRoot, 'opencode'),
        GEMINI_CONFIG_DIR: path.join(tmpRoot, 'gemini'),
        CURSOR_CONFIG_DIR: path.join(tmpRoot, 'cursor'),
        WINDSURF_CONFIG_DIR: path.join(tmpRoot, 'windsurf'),
        CODEX_HOME: path.join(tmpRoot, 'codex'),
        COPILOT_CONFIG_DIR: path.join(tmpRoot, 'copilot'),
        CLINE_CONFIG_DIR: path.join(tmpRoot, 'cline'),
        ACCIO_CONFIG_DIR: accioConfigDir
      }
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Skipping Accio Work/);
});

test('installer rejects local accio installs because Accio skills are account scoped', () => {
  const tmpRoot = makeTempRoot();
  const accountId = 'test-account';

  const result = runCommand(
    process.execPath,
    [fromOkkiRoot('bin', 'install.js'), '--local', '--accio'],
    {
      cwd: tmpRoot,
      env: {
        ACCIO_CONFIG_DIR: path.join(tmpRoot, 'accio'),
        ACCIO_ACCOUNT_ID: accountId
      }
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Accio Work skills are account-scoped/);
  assert.equal(fs.existsSync(path.join(tmpRoot, 'skills')), false);
});
