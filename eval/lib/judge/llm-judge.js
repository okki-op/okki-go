'use strict';

function createLlmJudge(options = {}) {
  if (typeof options.evaluate !== 'function') {
    return {
      async evaluate() {
        return {
          status: 'skipped',
          reason: 'llm_judge_not_configured'
        };
      }
    };
  }

  return {
    evaluate(input) {
      return options.evaluate(input);
    }
  };
}

module.exports = { createLlmJudge };
