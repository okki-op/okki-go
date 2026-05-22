'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { fromEvalRoot } = require('../core/paths');

const DEFAULT_FIXTURE_ROOT = fromEvalRoot('fixtures', 'live-captures');

function listReplayFixtures(options = {}) {
  const fixtureRoot = options.fixtureRoot || DEFAULT_FIXTURE_ROOT;
  if (!fs.existsSync(fixtureRoot)) return [];

  return fs.readdirSync(fixtureRoot)
    .filter((name) => fs.statSync(path.join(fixtureRoot, name)).isDirectory())
    .sort();
}

function loadReplayFixture(name, options = {}) {
  if (!name) throw new Error('Replay fixture name is required');

  const fixtureRoot = options.fixtureRoot || DEFAULT_FIXTURE_ROOT;
  const fixtureDir = path.join(fixtureRoot, name);
  if (!fs.existsSync(fixtureDir) || !fs.statSync(fixtureDir).isDirectory()) {
    throw new Error(`Replay fixture not found: ${name}`);
  }

  const metadataPath = path.join(fixtureDir, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Replay fixture missing metadata.json: ${name}`);
  }

  const payloads = {};
  const payloadPaths = {};
  for (const fileName of fs.readdirSync(fixtureDir).sort()) {
    if (!fileName.endsWith('.json') || fileName === 'metadata.json' || fileName === 'redaction-map.json') {
      continue;
    }
    const payloadName = fileName.replace(/\.json$/, '');
    const payloadPath = path.join(fixtureDir, fileName);
    payloads[payloadName] = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    payloadPaths[payloadName] = payloadPath;
  }

  return {
    name,
    dir: fixtureDir,
    metadata: JSON.parse(fs.readFileSync(metadataPath, 'utf8')),
    payloads,
    payloadPaths
  };
}

module.exports = { loadReplayFixture, listReplayFixtures };
