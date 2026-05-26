'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { judgeScenarioRun } = require('../judge/rule-judge');
const { buildScenarioPrompt, runAgentCli } = require('./agent-execution');
const { defaultCommandExists, prepareInstalledProfile } = require('./profile-utils');

function createOpenClawAdapter(options = {}) {
  const executable = options.executable || 'openclaw';
  const commandExists = options.commandExists || defaultCommandExists;
  const commandArgs = options.commandArgs || [
    'agent',
    '--agent',
    options.agentId || 'main',
    '--message',
    '{prompt}',
    '--local',
    '--json'
  ];
  const timeoutMs = options.timeoutMs || 120000;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));
  const realOpenClawConfigPath = options.realOpenClawConfigPath || path.join(os.homedir(), '.openclaw', 'openclaw.json');

  return {
    name: 'openclaw',
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
        runtime: 'openclaw',
        agent: 'openclaw',
        modelProfile,
        tmpRoot,
        envVar: 'OPENCLAW_CONFIG_DIR'
      });

      const configPath = path.join(installed.profileRoot, 'openclaw.json');
      if (options.useRealAgentConfig) {
        seedOpenClawRuntimeConfig(realOpenClawConfigPath, configPath, installed.profileRoot);
      } else {
        writeOpenClawRuntimeConfig(configPath, installed.profileRoot);
      }

      const env = {
        ...installed.env,
        OPENCLAW_CONFIG_DIR: installed.profileRoot,
        OPENCLAW_STATE_DIR: installed.profileRoot,
        OPENCLAW_CONFIG_PATH: configPath
      };

      return {
        agent: 'openclaw',
        modelProfile,
        profileRoot: installed.profileRoot,
        skillDir: installed.skillDir,
        env
      };
    },
    runScenario(profile, scenario) {
      const execution = runAgentCli({
        executable,
        args: commandArgs,
        cwd: options.cwd,
        env: profile.env,
        prompt: buildScenarioPrompt(scenario),
        timeoutMs,
        templateValues: {
          profileRoot: profile.profileRoot,
          skillDir: profile.skillDir,
          modelProfile: profile.modelProfile
        }
      });
      if (execution.exitCode !== 0) {
        return {
          caseId: scenario.id,
          suite: scenario.suite,
          agent: 'openclaw',
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
        agent: 'openclaw',
        modelProfile: profile.modelProfile,
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

function seedOpenClawRuntimeConfig(sourcePath, targetPath, profileRoot) {
  let sourceConfig = {};
  if (fs.existsSync(sourcePath)) {
    sourceConfig = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  }
  writeOpenClawRuntimeConfig(targetPath, profileRoot, sourceConfig);
}

function writeOpenClawRuntimeConfig(targetPath, profileRoot, sourceConfig = {}) {
  const config = {
    ...sourceConfig,
    agents: {
      ...(sourceConfig.agents || {}),
      defaults: {
        ...((sourceConfig.agents && sourceConfig.agents.defaults) || {}),
        workspace: profileRoot
      }
    },
    commands: {
      native: 'auto',
      nativeSkills: 'auto',
      ...(sourceConfig.commands || {})
    }
  };

  fs.writeFileSync(targetPath, `${JSON.stringify(config, null, 2)}\n`);
}

module.exports = { createOpenClawAdapter };
