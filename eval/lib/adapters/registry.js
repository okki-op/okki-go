'use strict';

const { createAccioAdapter } = require('./accio-adapter');
const { createClaudeAdapter } = require('./claude-adapter');
const { createCodexAdapter } = require('./codex-adapter');
const { createNoopAdapter } = require('./noop-adapter');
const { createOpenClawAdapter } = require('./openclaw-adapter');

function createAdapter(agent, options = {}) {
  if (agent === 'accio') return createAccioAdapter(options);
  if (agent === 'codex') return createCodexAdapter(options);
  if (agent === 'openclaw') return createOpenClawAdapter(options);
  if (agent === 'claude' || agent === 'claudecode' || agent === 'claude-code') {
    return createClaudeAdapter(options);
  }
  return createNoopAdapter({ agent, reason: 'agent_not_supported' });
}

module.exports = { createAdapter };
