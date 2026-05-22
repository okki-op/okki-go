'use strict';

function createNoopAdapter(options = {}) {
  const name = options.agent || 'noop';
  const reason = options.reason || 'agent_not_installed';

  return {
    name,
    detect() {
      return {
        installed: false,
        reason
      };
    }
  };
}

module.exports = { createNoopAdapter };
