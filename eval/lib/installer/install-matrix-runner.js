'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureDir } = require('../core/fs-utils');
const { fromOkkiRoot } = require('../core/paths');
const { runCommand } = require('../core/process');
const { fail, pass } = require('../core/result');

const DEFAULT_RUNTIMES = ['codex', 'openclaw', 'claude', 'copilot', 'accio'];
const SKILL_NAME = 'okki-go';
const TIMEOUT_MS = 30000;

const RUNTIME_META = {
  codex: { envVar: 'CODEX_HOME', mainFile: 'skill.md' },
  openclaw: { envVar: 'OPENCLAW_CONFIG_DIR', mainFile: 'SKILL.md' },
  claude: { envVar: 'CLAUDE_CONFIG_DIR', mainFile: 'skill.md' },
  copilot: { envVar: 'COPILOT_CONFIG_DIR', mainFile: 'instructions.md' },
  accio: { envVar: 'ACCIO_CONFIG_DIR', mainFile: 'SKILL.md', accountScoped: true }
};

const RUNTIME_ENV_VARS = Object.values(RUNTIME_META).map(meta => meta.envVar);

function runInstallerMatrix(options = {}) {
  const runtimes = options.runtimes || DEFAULT_RUNTIMES;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-install-'));

  return runtimes.map(runtime => runInstallerForRuntime(runtime, tmpRoot, options));
}

function runInstallerForRuntime(runtime, tmpRoot, options = {}) {
  const id = `install-${runtime}`;
  const meta = RUNTIME_META[runtime];

  if (!meta) {
    return fail(id, `Unsupported runtime: ${runtime}`, { runtime });
  }

  const configDir = path.join(tmpRoot, runtime);
  const accioAccountId = options.accioAccountId || 'default-account';
  const skillDir = meta.accountScoped
    ? path.join(configDir, 'accounts', accioAccountId, 'skills', SKILL_NAME)
    : path.join(configDir, 'skills', SKILL_NAME);
  ensureDir(configDir);

  const env = makeRuntimeEnv(meta.envVar, configDir);
  if (runtime === 'accio') {
    env.ACCIO_ACCOUNT_ID = accioAccountId;
  }
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

  if (runtime === 'accio') {
    const configPath = path.join(path.dirname(skillDir), 'skills_config.json');
    let skillsConfig;
    try {
      skillsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      return { reason: 'Accio skills_config.json is missing or invalid', error: error.message };
    }

    if (
      !skillsConfig['OKKI Go'] ||
      skillsConfig['OKKI Go'].enabled !== true ||
      typeof skillsConfig['OKKI Go'].installedVersion !== 'string'
    ) {
      return { reason: 'Accio skills_config.json does not enable OKKI Go', error: skillsConfig['OKKI Go'] };
    }

    const accountDir = path.dirname(path.dirname(skillDir));
    const agentsDir = path.join(accountDir, 'agents');
    if (fs.existsSync(agentsDir)) {
      const invalidAgent = fs.readdirSync(agentsDir)
        .filter(name => !name.startsWith('.'))
        .map(name => path.join(agentsDir, name))
        .find(agentDir => {
          const agentSkillsConfigPath = path.join(agentDir, 'agent-core', 'skills', 'skills.jsonc');
          if (!fs.existsSync(agentSkillsConfigPath)) return false;

          const agentSkillDir = path.join(agentDir, 'skills', SKILL_NAME);
          if (!fs.existsSync(path.join(agentSkillDir, 'SKILL.md'))) return true;

          let agentSkillsConfig;
          try {
            agentSkillsConfig = JSON.parse(fs.readFileSync(agentSkillsConfigPath, 'utf8'));
          } catch {
            return true;
          }

          return !Array.isArray(agentSkillsConfig.skills) ||
            !agentSkillsConfig.skills.some(entry =>
              entry &&
              entry.name === 'OKKI Go' &&
              entry.path === path.join(agentSkillDir, 'SKILL.md') &&
              entry.enabled === true
            );
        });

      if (invalidAgent) {
        return { reason: 'Accio agent skill selection is missing OKKI Go', error: invalidAgent };
      }
    }
  }

  return null;
}

module.exports = { runInstallerMatrix };
