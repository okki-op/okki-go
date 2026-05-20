'use strict';

function pass(id, details = {}) {
  return { ...details, id, status: 'passed' };
}

function fail(id, reason, details = {}) {
  return { ...details, id, status: 'failed', reason };
}

function warn(id, reason, details = {}) {
  return { ...details, id, status: 'warned', reason };
}

function skipped(id, reason, details = {}) {
  return { ...details, id, status: 'skipped', reason };
}

module.exports = { pass, fail, warn, skipped };
