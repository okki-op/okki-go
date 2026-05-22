'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { defaultCommandExists, prepareInstalledProfile } = require('./profile-utils');

function createOpenClawAdapter(options = {}) {
  const executable = options.executable || 'openclaw';
  const commandExists = options.commandExists || defaultCommandExists;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));

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

      return {
        agent: 'openclaw',
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
        agent: 'openclaw',
        modelProfile: profile.modelProfile,
        status: 'blocked',
        reason: 'agent_cli_execution_not_implemented',
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

module.exports = { createOpenClawAdapter };
