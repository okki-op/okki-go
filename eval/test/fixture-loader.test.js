const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadReplayFixture, listReplayFixtures } = require('../lib/fixtures/loader');

test('loadReplayFixture loads metadata and replay payload files', () => {
  const fixture = loadReplayFixture('vertical-auto-parts-de');

  assert.equal(fixture.name, 'vertical-auto-parts-de');
  assert.equal(fixture.metadata.scenarioId, 'vertical-auto-parts-de');
  assert.ok(Array.isArray(fixture.metadata.tags));
  assert.equal(fixture.payloads['companies-search'].total, 2);
  assert.equal(fixture.payloads['profile-emails'].emails[0].title, 'Procurement Manager');
  assert.equal(fixture.payloadPaths['companies-search'].endsWith('companies-search.json'), true);
});

test('listReplayFixtures returns fixture directories in deterministic order', () => {
  const names = listReplayFixtures();

  assert.ok(names.includes('vertical-auto-parts-de'));
  assert.deepEqual(names, [...names].sort());
});

test('loadReplayFixture rejects missing fixtures and missing metadata', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-fixtures-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  assert.throws(
    () => loadReplayFixture('missing', { fixtureRoot: root }),
    /Replay fixture not found: missing/
  );

  fs.mkdirSync(path.join(root, 'broken'), { recursive: true });
  assert.throws(
    () => loadReplayFixture('broken', { fixtureRoot: root }),
    /Replay fixture missing metadata.json: broken/
  );
});
