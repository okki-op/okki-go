'use strict';

const { spawnSync } = require('child_process');

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    timeout: options.timeoutMs || 30000
  });

  return {
    command,
    args,
    cwd: options.cwd,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : null
  };
}

module.exports = { runCommand };
