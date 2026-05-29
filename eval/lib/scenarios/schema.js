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

  if (expected.routing !== undefined && !isPlainObject(expected.routing)) {
    errors.push('expected.routing must be an object');
  } else if (expected.routing) {
    const { expectedDecision } = expected.routing;
    if (expectedDecision !== undefined && !ROUTING_DECISIONS.has(expectedDecision)) {
      errors.push('expected.routing.expectedDecision must be should_trigger or should_not_trigger');
    }
  }

  if (expected.api !== undefined && !isPlainObject(expected.api)) {
    errors.push('expected.api must be an object');
  } else if (expected.api) {
    validateApiMatcherList(expected.api.mustCall, 'expected.api.mustCall', errors);
    validateApiMatcherList(expected.api.mustNotCall, 'expected.api.mustNotCall', errors);
    validateApiMatcherList(
      expected.api.mustNotCallBeforeConfirmation,
      'expected.api.mustNotCallBeforeConfirmation',
      errors
    );
  }

  if (expected.safety !== undefined && !isPlainObject(expected.safety)) {
    errors.push('expected.safety must be an object');
  } else if (expected.safety) {
    Object.entries(expected.safety).forEach(([key, value]) => {
      if (typeof value !== 'boolean') {
        errors.push(`expected.safety.${key} must be a boolean`);
      }
    });
  }

  if (expected.behavior !== undefined && !isPlainObject(expected.behavior)) {
    errors.push('expected.behavior must be an object');
  } else if (expected.behavior) {
    validateStringList(expected.behavior.mustEmit, 'expected.behavior.mustEmit', errors);
    validateStringList(expected.behavior.mustNotEmit, 'expected.behavior.mustNotEmit', errors);
    validateOrderedBehaviorList(expected.behavior.ordered, 'expected.behavior.ordered', errors);
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
    if (matcher.method !== undefined) {
      if (typeof matcher.method !== 'string') {
        errors.push(`${matcherPath}.method must be a string`);
      } else if (!isNonEmptyString(matcher.method)) {
        errors.push(`${matcherPath}.method must be a non-empty string`);
      }
    }
  });
}

function validateStringList(value, path, errors) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function validateOrderedBehaviorList(value, path, errors) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }

  value.forEach((pair, index) => {
    const pairPath = `${path}[${index}]`;
    if (!Array.isArray(pair) || pair.length !== 2) {
      errors.push(`${pairPath} must be a two-item array`);
      return;
    }

    pair.forEach((item, itemIndex) => {
      if (!isNonEmptyString(item)) {
        errors.push(`${pairPath}[${itemIndex}] must be a non-empty string`);
      }
    });
  });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

module.exports = { validateScenario };
