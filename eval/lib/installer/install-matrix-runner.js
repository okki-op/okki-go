'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureDir } = require('../core/fs-utils');
const { fromOkkiRoot } = require('../core/paths');
const { runCommand } = require('../core/process');
const { fail, pass } = require('../core/result');

const DEFAULT_RUNTIMES = ['codex', 'openclaw', 'claude', 'copilot'];
const SKILL_NAME = 'okki-go';
const TIMEOUT_MS = 30000;

const RUNTIME_META = {
  codex: { envVar: 'CODEX_HOME', mainFile: 'skill.md' },
  openclaw: { envVar: 'OPENCLAW_CONFIG_DIR', mainFile: 'SKILL.md' },
  claude: { envVar: 'CLAUDE_CONFIG_DIR', mainFile: 'skill.md' },
  copilot: { envVar: 'COPILOT_CONFIG_DIR', mainFile: 'instructions.md' }
};

const RUNTIME_ENV_VARS = Object.values(RUNTIME_META).map(meta => meta.envVar);

function runInstallerMatrix(options = {}) {
  const runtimes = options.runtimes || DEFAULT_RUNTIMES;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-install-'));

  return runtimes.map(runtime => runInstallerForRuntime(runtime, tmpRoot));
}

function runInstallerForRuntime(runtime, tmpRoot) {
  const id = `install-${runtime}`;
  const meta = RUNTIME_META[runtime];

  if (!meta) {
    return fail(id, `Unsupported runtime: ${runtime}`, { runtime });
  }

  const configDir = path.join(tmpRoot, runtime);
  const skillDir = path.join(configDir, 'skills', SKILL_NAME);
  ensureDir(configDir);

  const env = makeRuntimeEnv(meta.envVar, configDir);
  const commandResult = runCommand(
    process.execPath,
    [fromOkkiRoot('bin', 'install.js'), '--global', `--${runtime}`],
    {
      cwd: fromOkkiRoot(),
      env,
      timeoutMs: TIMEOUT_MS
    }
  );

  if (commandResult.status !== 0) {
    return fail(id, 'Installer command failed', {
      runtime,
      skillDir,
      mainFile: meta.mainFile,
      commandResult
    });
  }

  const validationError = validateInstall(skillDir, runtime, meta.mainFile);
  if (validationError) {
    return fail(id, validationError.reason, {
      runtime,
      skillDir,
      mainFile: meta.mainFile,
      missing: validationError.missing,
      error: validationError.error
    });
  }

  return pass(id, {
    runtime,
    skillDir,
    mainFile: meta.mainFile
  });
}

function makeRuntimeEnv(envVar, configDir) {
  const env = {};
  for (const runtimeEnvVar of RUNTIME_ENV_VARS) {
    env[runtimeEnvVar] = '';
  }
  env[envVar] = configDir;
  return env;
}

function validateInstall(skillDir, runtime, mainFile) {
  const requiredFiles = [
    mainFile,
    path.join('references', 'api-reference.md'),
    'VERSION',
    '.okki-go-manifest.json'
  ];

  const missing = requiredFiles.filter(file => !fs.existsSync(path.join(skillDir, file)));
  const scriptsDir = path.join(skillDir, 'scripts');
  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) {
    missing.push('scripts');
  }

  if (missing.length > 0) {
    return { reason: `Missing installed files: ${missing.join(', ')}`, missing };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(skillDir, '.okki-go-manifest.json'), 'utf8'));
  } catch (error) {
    return { reason: 'Manifest is not valid JSON', error: error.message };
  }

  if (manifest.runtime !== runtime) {
    return {
      reason: `Manifest runtime mismatch: expected ${runtime}, got ${manifest.runtime}`,
      error: manifest.runtime
    };
  }

  return null;
}

module.exports = { runInstallerMatrix };
