'use strict';

const path = require('path');

const evalRoot = path.resolve(__dirname, '..', '..');
const okkiRoot = path.resolve(evalRoot, '..');

function fromEvalRoot(...parts) {
  return path.join(evalRoot, ...parts);
}

function fromOkkiRoot(...parts) {
  return path.join(okkiRoot, ...parts);
}

function makeRunId(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

module.exports = { evalRoot, okkiRoot, fromEvalRoot, fromOkkiRoot, makeRunId };
