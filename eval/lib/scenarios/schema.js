'use strict';

function validateScenario(scenario) {
  const errors = [];
  if (!scenario || typeof scenario !== 'object') errors.push('scenario must be an object');
  if (!scenario.id) errors.push('id is required');
  if (!scenario.suite) errors.push('suite is required');
  if (!scenario.name) errors.push('name is required');
  if (!Array.isArray(scenario.userTurns) || scenario.userTurns.length === 0) {
    errors.push('userTurns must contain at least one turn');
  }
  if (!scenario.expected) errors.push('expected is required');

  if (Array.isArray(scenario.userTurns)) {
    scenario.userTurns.forEach((turn, index) => {
      if (turn.role !== 'user') errors.push(`userTurns[${index}].role must be user`);
      if (!turn.content) errors.push(`userTurns[${index}].content is required`);
    });
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateScenario };
