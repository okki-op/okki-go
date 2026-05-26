'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runInstallerMatrix } = require('../installer/install-matrix-runner');

function defaultCommandExists(command) {
  if (String(command).includes(path.sep) || (path.sep === '\\' && String(command).includes('/'))) {
    try {
      fs.accessSync(command, fs.constants.X_OK);
      return fs.statSync(command).isFile();
    } catch {
      return false;
    }
  }

  const pathValue = process.env.PATH || '';
  const extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];

  for (const dir of pathValue.split(path.delimiter)) {
    if (!dir) continue;
    for (const extension of extensions) {
      const candidate = path.join(dir, `${command}${extension}`);
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true;
      } catch {
        // Ignore unreadable PATH entries.
      }
    }
  }

  return false;
}

function prepareInstalledProfile({
  runtime,
  agent,
  modelProfile,
  tmpRoot,
  envVar,
  accountId
}) {
  const profileRoot = path.join(tmpRoot, agent, modelProfile);
  const installRoot = path.join(tmpRoot, `${agent}-install`, modelProfile);
  const installOptions = {
    tmpRoot: installRoot,
    runtimes: [runtime]
  };
  if (accountId) installOptions.accioAccountId = accountId;

  const installResults = runInstallerMatrix(installOptions);
  const installResult = installResults[0];
  if (!installResult || installResult.status !== 'passed') {
    throw new Error(`${agent} skill install failed: ${installResult && (installResult.reason || installResult.status)}`);
  }

  fs.mkdirSync(profileRoot, { recursive: true });
  copyDirectory(path.join(installRoot, runtime), profileRoot);

  return {
    profileRoot,
    skillDir: installResult.skillDir.replace(path.join(installRoot, runtime), profileRoot),
    env: {
      [envVar]: profileRoot
    }
  };
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

module.exports = { defaultCommandExists, prepareInstalledProfile, copyDirectory };
