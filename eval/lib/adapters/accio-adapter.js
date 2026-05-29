'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { judgeScenarioRun } = require('../judge/rule-judge');
const { buildScenarioPrompt, runAgentCli } = require('./agent-execution');
const { copyDirectory, defaultCommandExists, prepareInstalledProfile } = require('./profile-utils');

function createAccioAdapter(options = {}) {
  const configRoot = options.configRoot || process.env.ACCIO_CONFIG_DIR || path.join(os.homedir(), '.accio');
  const accountId = options.accountId || process.env.ACCIO_ACCOUNT_ID || null;
  const tmpRoot = options.tmpRoot || fs.mkdtempSync(path.join(os.tmpdir(), 'okki-eval-agents-'));
  const commandExists = options.commandExists || defaultCommandExists;
  const candidateExecutables = options.candidateExecutables || buildAccioExecutableCandidates(configRoot);
  const explicitExecutable = options.executable || null;
  const resolvedCli = resolveAccioCli({
    executable: explicitExecutable,
    commandExists,
    candidateExecutables
  });
  const executable = resolvedCli.executable;
  const commandArgs = options.commandArgs || (resolvedCli.available ? options.defaultCommandArgs || [
    'agent',
    '--message',
    '{prompt}',
    '--json'
  ] : null);
  const timeoutMs = options.timeoutMs || 120000;

  return {
    name: 'accio',
    executable,
    detect() {
      return detectAccount(configRoot, accountId, resolvedCli);
    },
    prepareProfile({ modelProfile = 'default' } = {}) {
      const detection = detectAccount(configRoot, accountId, resolvedCli);
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
      if (!commandArgs) {
        return {
          caseId: scenario.id,
          suite: scenario.suite,
          agent: 'accio',
          modelProfile: profile.modelProfile,
          accountId: profile.accountId,
          status: 'blocked',
          reason: 'agent_cli_not_found',
          candidateExecutables,
          profileRoot: profile.profileRoot,
          skillDir: profile.skillDir
        };
      }

      const execution = runAgentCli({
        executable,
        args: commandArgs,
        cwd: options.cwd,
        env: profile.env,
        prompt: buildScenarioPrompt(scenario),
        timeoutMs,
        templateValues: {
          accountId: profile.accountId,
          accountDir: profile.accountDir,
          profileRoot: profile.profileRoot,
          skillDir: profile.skillDir,
          modelProfile: profile.modelProfile
        }
      });
      if (execution.exitCode !== 0) {
        return {
          caseId: scenario.id,
          suite: scenario.suite,
          agent: 'accio',
          modelProfile: profile.modelProfile,
          accountId: profile.accountId,
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
        agent: 'accio',
        modelProfile: profile.modelProfile,
        accountId: profile.accountId,
        profileRoot: profile.profileRoot,
        skillDir: profile.skillDir
      };
    }
  };
}

function detectAccount(configRoot, requestedAccountId, cli) {
  const accountsDir = path.join(configRoot, 'accounts');

  if (requestedAccountId) {
    const accountDir = path.join(accountsDir, requestedAccountId);
    if (fs.existsSync(accountDir) && fs.statSync(accountDir).isDirectory()) {
      return {
        installed: true,
        ...cliDetection(cli),
        accountId: requestedAccountId,
        accountDir
      };
    }

    return {
      installed: false,
      executable: cli.executable,
      reason: 'accio_account_not_found'
    };
  }

  if (!fs.existsSync(accountsDir) || !fs.statSync(accountsDir).isDirectory()) {
    return {
      installed: false,
      executable: cli.executable,
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
      executable: cli.executable,
      reason: 'accio_account_not_found'
    };
  }

  if (accounts.length > 1) {
    return {
      installed: false,
      executable: cli.executable,
      reason: 'accio_multiple_accounts',
      accounts
    };
  }

  const accountId = accounts[0];
  return {
    installed: true,
    ...cliDetection(cli),
    accountId,
    accountDir: path.join(accountsDir, accountId)
  };
}

function resolveAccioCli({ executable, commandExists, candidateExecutables }) {
  if (executable) {
    return {
      executable,
      available: commandExists(executable),
      explicit: true
    };
  }

  for (const candidate of candidateExecutables) {
    if (commandExists(candidate)) {
      return {
        executable: candidate,
        available: true,
        discovered: true
      };
    }
  }

  return {
    executable: candidateExecutables[0] || 'accio',
    available: false,
    discovered: false
  };
}

function cliDetection(cli) {
  const detection = {
    executable: cli.executable
  };
  if (cli.discovered) detection.cliDiscovered = true;
  if (cli.explicit) detection.cliExplicit = true;
  return detection;
}

function buildAccioExecutableCandidates(configRoot) {
  return [
    'accio',
    path.join(configRoot, 'bin', 'accio')
  ];
}

module.exports = { createAccioAdapter };
