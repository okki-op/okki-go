const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_DIR = path.resolve(__dirname, '..', '..');

function readSkillFile(relativePath) {
  return fs.readFileSync(path.join(SKILL_DIR, relativePath), 'utf8');
}

test('hot path relies on output-contracts for script-owned field handling', () => {
  const skill = readSkillFile('SKILL.md');

  assert.match(skill, /Use compact wrappers and `--batch latest`/);
  assert.doesNotMatch(skill, /Do not print raw API JSON, full profiles, full local state, full email bodies, internal IDs, unlock keys, domains, websites, homepages, URLs, or link fields/);
  assert.doesNotMatch(skill, /Do not show wrapper metadata such as `batch_id`, `raw_path`, `private_mapping_saved`, or verbose `output_budget`/);
});

test('non-owner references avoid duplicating script-owned privacy field lists', () => {
  const fastPath = readSkillFile('references/search-fast-path.md');
  const paidActions = readSkillFile('references/paid-actions.md');
  const outputContracts = readSkillFile('references/output-contracts.md');

  assert.match(outputContracts, /Field Ownership/);
  assert.match(outputContracts, /Do not replace deterministic script ownership/);

  assert.doesNotMatch(fastPath, /Do not display domains, URLs, internal IDs, raw paths, batch IDs, raw API JSON, or private mapping status/);
  assert.doesNotMatch(paidActions, /Do not print domains, company hash IDs, raw paths, batch IDs, or raw payloads/);
  assert.doesNotMatch(paidActions, /Do not print internal contact IDs/);
});
