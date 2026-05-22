'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { judgeScenarioRun } = require('../judge/rule-judge');
const { buildScenarioPrompt, runAgentCli } = require('./agent-execution');
const { defaultCommandExists, prepareInstalledProfile } = require('./profile-utils');

function createCodexAdapter(options = {}) {
  const executable = options.executable || 'codex';
  const commandExists = options.commandExists || defaultCommandExists;
  const commandArgs = options.commandArgs || ['exec', '--sandbox', 'read-only'];
  const timeoutMs = options.timeoutMs || 120000;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));
  const realCodexHome = options.realCodexHome || path.join(os.homedir(), '.codex');

  return {
    name: 'codex',
    executable,
    detect() {
      if (!commandExists(executable)) {
        return {
          installed: false,
          executable,
          reason: 'agent_not_installed'
        };
      }

      return {
        installed: true,
        executable
      };
    },
    prepareProfile({ modelProfile = 'default' } = {}) {
      const installed = prepareInstalledProfile({
        runtime: 'codex',
        agent: 'codex',
        modelProfile,
        tmpRoot,
        envVar: 'CODEX_HOME'
      });
      if (options.useRealAgentConfig) {
        seedCodexRuntimeConfig(realCodexHome, installed.profileRoot);
      }

      return {
        agent: 'codex',
        modelProfile,
        profileRoot: installed.profileRoot,
        skillDir: installed.skillDir,
        env: installed.env
      };
    },
    runScenario(profile, scenario) {
      const execution = runAgentCli({
        executable,
        args: commandArgs,
        cwd: options.cwd,
        env: profile.env,
        prompt: buildScenarioPrompt(scenario),
        timeoutMs
      });
      if (execution.exitCode !== 0) {
        return {
          caseId: scenario.id,
          suite: scenario.suite,
          agent: 'codex',
          modelProfile: profile.modelProfile,
          status: 'blocked',
          reason: 'agent_cli_execution_failed',
          profileRoot: profile.profileRoot,
          skillDir: profile.skillDir,
          run: {
            ...execution,
            routingDecision: null,
            apiCalls: []
          }
        };
      }
      const judged = judgeScenarioRun(scenario, execution);

      return {
        ...judged,
        agent: 'codex',
        modelProfile: profile.modelProfile,
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

function seedCodexRuntimeConfig(sourceHome, profileRoot) {
  for (const fileName of ['auth.json', 'config.toml', 'version.json', 'installation_id']) {
    const sourcePath = path.join(sourceHome, fileName);
    const targetPath = path.join(profileRoot, fileName);
    if (!fs.existsSync(sourcePath)) continue;
    fs.copyFileSync(sourcePath, targetPath);
  }
}

module.exports = { createCodexAdapter };
