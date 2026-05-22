'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { copyDirectory, prepareInstalledProfile } = require('./profile-utils');

function createAccioAdapter(options = {}) {
  const executable = options.executable || 'accio';
  const configRoot = options.configRoot || process.env.ACCIO_CONFIG_DIR || path.join(os.homedir(), '.accio');
  const accountId = options.accountId || process.env.ACCIO_ACCOUNT_ID || null;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));

  return {
    name: 'accio',
    executable,
    detect() {
      const account = detectAccount(configRoot, accountId, executable);
      return account;
    },
    prepareProfile({ modelProfile = 'default' } = {}) {
      const detection = detectAccount(configRoot, accountId, executable);
      if (!detection.installed) {
        throw new Error(`Accio account is not available: ${detection.reason}`);
      }

      const installed = prepareInstalledProfile({
        runtime: 'accio',
        agent: 'accio',
        modelProfile,
        tmpRoot,
        envVar: 'ACCIO_CONFIG_DIR',
        accountId: detection.accountId
      });
      installed.env.ACCIO_ACCOUNT_ID = detection.accountId;

      return {
        agent: 'accio',
        modelProfile,
        profileRoot: installed.profileRoot,
        accountId: detection.accountId,
        accountDir: path.join(installed.profileRoot, 'accounts', detection.accountId),
        skillDir: installed.skillDir,
        env: installed.env
      };
    },
    runScenario(profile, scenario) {
      return {
        caseId: scenario.id,
        suite: scenario.suite,
        agent: 'accio',
        modelProfile: profile.modelProfile,
        accountId: profile.accountId,
        status: 'blocked',
        reason: 'agent_cli_execution_not_implemented',
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

function detectAccount(configRoot, requestedAccountId, executable) {
  const accountsDir = path.join(configRoot, 'accounts');

  if (requestedAccountId) {
    const accountDir = path.join(accountsDir, requestedAccountId);
    if (fs.existsSync(accountDir) && fs.statSync(accountDir).isDirectory()) {
      return {
        installed: true,
        executable,
        accountId: requestedAccountId,
        accountDir
      };
    }

    return {
      installed: false,
      executable,
      reason: 'accio_account_not_found'
    };
  }

  if (!fs.existsSync(accountsDir) || !fs.statSync(accountsDir).isDirectory()) {
    return {
      installed: false,
      executable,
      reason: 'accio_account_not_found'
    };
  }

  const accounts = fs.readdirSync(accountsDir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => fs.statSync(path.join(accountsDir, name)).isDirectory())
    .sort();

  if (accounts.length === 0) {
    return {
      installed: false,
      executable,
      reason: 'accio_account_not_found'
    };
  }

  if (accounts.length > 1) {
    return {
      installed: false,
      executable,
      reason: 'accio_multiple_accounts',
      accounts
    };
  }

  const accountId = accounts[0];
  return {
    installed: true,
    executable,
    accountId,
    accountDir: path.join(accountsDir, accountId)
  };
}

module.exports = { createAccioAdapter };
