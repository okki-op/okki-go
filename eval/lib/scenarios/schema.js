'use strict';

const ROUTING_DECISIONS = new Set(['should_trigger', 'should_not_trigger']);
const API_MATCHER_FIELDS = ['path', 'pathPattern', 'pathPrefix'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateScenario(scenario) {
  const errors = [];
  if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) {
    return { valid: false, errors: ['scenario must be an object'] };
  }

  if (!isNonEmptyString(scenario.id)) errors.push('id must be a non-empty string');
  if (!isNonEmptyString(scenario.suite)) errors.push('suite must be a non-empty string');
  if (!isNonEmptyString(scenario.name)) errors.push('name must be a non-empty string');
  if (!Array.isArray(scenario.userTurns) || scenario.userTurns.length === 0) {
    errors.push('userTurns must contain at least one turn');
  }
  if (!scenario.expected) {
    errors.push('expected is required');
  } else if (typeof scenario.expected !== 'object' || Array.isArray(scenario.expected)) {
    errors.push('expected must be an object');
  }

  if (Array.isArray(scenario.userTurns)) {
    scenario.userTurns.forEach((turn, index) => {
      if (!turn || typeof turn !== 'object' || Array.isArray(turn)) {
        errors.push(`userTurns[${index}] must be an object`);
        return;
      }
      if (turn.role !== 'user') errors.push(`userTurns[${index}].role must be user`);
      if (!isNonEmptyString(turn.content)) errors.push(`userTurns[${index}].content must be a non-empty string`);
    });
  }

  validateExpected(scenario.expected, errors);

  return { valid: errors.length === 0, errors };
}

function validateExpected(expected, errors) {
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return;

  if (expected.routing && typeof expected.routing === 'object') {
    const { expectedDecision } = expected.routing;
    if (expectedDecision !== undefined && !ROUTING_DECISIONS.has(expectedDecision)) {
      errors.push('expected.routing.expectedDecision must be should_trigger or should_not_trigger');
    }
  }

  if (expected.api && typeof expected.api === 'object' && !Array.isArray(expected.api)) {
    validateApiMatcherList(expected.api.mustCall, 'expected.api.mustCall', errors);
    validateApiMatcherList(expected.api.mustNotCall, 'expected.api.mustNotCall', errors);
    validateApiMatcherList(
      expected.api.mustNotCallBeforeConfirmation,
      'expected.api.mustNotCallBeforeConfirmation',
      errors
    );
  }

  if (expected.safety && typeof expected.safety === 'object' && !Array.isArray(expected.safety)) {
    Object.entries(expected.safety).forEach(([key, value]) => {
      if (typeof value !== 'boolean') {
        errors.push(`expected.safety.${key} must be a boolean`);
      }
    });
  }
}

function validateApiMatcherList(value, path, errors) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((matcher, index) => {
    const matcherPath = `${path}[${index}]`;
    if (!matcher || typeof matcher !== 'object' || Array.isArray(matcher)) {
      errors.push(`${matcherPath} must be an object`);
      return;
    }
    if (!API_MATCHER_FIELDS.some((field) => isNonEmptyString(matcher[field]))) {
      errors.push(`${matcherPath} must include path, pathPattern, or pathPrefix`);
    }
    if (matcher.method !== undefined && typeof matcher.method !== 'string') {
      errors.push(`${matcherPath}.method must be a string`);
    }
  });
}

module.exports = { validateScenario };
