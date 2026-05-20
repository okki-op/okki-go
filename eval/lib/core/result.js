'use strict';

function pass(id, details = {}) {
  return { id, status: 'passed', ...details };
}

function fail(id, reason, details = {}) {
  return { id, status: 'failed', reason, ...details };
}

function warn(id, reason, details = {}) {
  return { id, status: 'warned', reason, ...details };
}

function skipped(id, reason, details = {}) {
  return { id, status: 'skipped', reason, ...details };
}

module.exports = { pass, fail, warn, skipped };
