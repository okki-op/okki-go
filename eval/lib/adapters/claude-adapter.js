'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defaultCommandExists, prepareInstalledProfile } = require('./profile-utils');

function createClaudeAdapter(options = {}) {
  const executable = options.executable || 'claude';
  const commandExists = options.commandExists || defaultCommandExists;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));

  return {
    name: 'claude',
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
        runtime: 'claude',
        agent: 'claude',
        modelProfile,
        tmpRoot,
        envVar: 'CLAUDE_CONFIG_DIR'
      });

      return {
        agent: 'claude',
        modelProfile,
        profileRoot: installed.profileRoot,
        skillDir: installed.skillDir,
        env: installed.env
      };
    },
    runScenario(profile, scenario) {
      return {
        caseId: scenario.id,
        suite: scenario.suite,
        agent: 'claude',
        modelProfile: profile.modelProfile,
        status: 'blocked',
        reason: 'agent_cli_execution_not_implemented',
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

module.exports = { createClaudeAdapter };
