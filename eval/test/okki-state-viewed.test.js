const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const STATE_CLI = path.join(REPO_ROOT, 'skill', 'scripts', 'okki-state.js');
const NOW = '2026-05-28T12:00:00.000Z';

function makeConfig(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-viewed-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runState(configHome, args) {
  const result = spawnSync(
    process.execPath,
    [STATE_CLI, ...args],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, XDG_CONFIG_HOME: configHome },
      encoding: 'utf8'
    }
  );

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function viewedPath(configHome) {
  return path.join(configHome, 'okki-go', 'viewed.json');
}

function modeOf(file) {
  return (fs.statSync(file).mode & 0o777).toString(8);
}

function writeViewed(configHome, value, mode = 0o644) {
  const file = viewedPath(configHome);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode });
  fs.chmodSync(file, mode);
  return file;
}

test('viewed classify treats missing state as all new', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, [
    'viewed',
    'classify',
    '--window-days',
    '30',
    '--results-json',
    JSON.stringify([{ domain: 'example.com' }, { website: 'https://acme.test/path' }]),
    '--now',
    NOW
  ]);

  assert.equal(output.counts.unlocked, 0);
  assert.equal(output.counts.seen, 0);
  assert.equal(output.counts.new, 2);
  assert.equal(output.groups.new[0].domain, 'example.com');
  assert.equal(output.groups.new[1].domain, 'acme.test');
  assert.equal(fs.existsSync(viewedPath(configHome)), false);
});

test('viewed mark-shown deduplicates domains and updates shown_at', (t) => {
  const configHome = makeConfig(t);

  let output = runState(configHome, [
    'viewed',
    'mark-shown',
    '--brief-summary',
    'DE manufacturer DTF printer',
    '--results-json',
    JSON.stringify([
      { website: 'https://www.example.com/a', countryCode: 'DE' },
      { domain: 'example.com' },
      { url: 'https://other.test' }
    ]),
    '--now',
    '2026-05-20T12:00:00.000Z'
  ]);

  assert.equal(output.updated, 3);
  assert.equal(output.viewed.items.length, 2);
  assert.equal(output.viewed.items.find((item) => item.domain === 'example.com').shown_at, '2026-05-20T12:00:00.000Z');

  output = runState(configHome, [
    'viewed',
    'mark-shown',
    '--brief-summary',
    'Updated brief',
    '--results-json',
    JSON.stringify([{ domain: 'www.example.com' }]),
    '--now',
    NOW
  ]);

  const item = output.viewed.items.find((entry) => entry.domain === 'example.com');
  assert.equal(output.viewed.items.length, 2);
  assert.equal(item.shown_at, NOW);
  assert.equal(item.brief_summary, 'Updated brief');
  assert.equal(modeOf(viewedPath(configHome)), '600');
});

test('viewed read path migrates v1.0 items to status viewed', (t) => {
  const configHome = makeConfig(t);
  const file = writeViewed(configHome, {
    items: [
      {
        domain: 'old.example',
        shown_at: '2026-05-27T12:00:00.000Z',
        brief_summary: 'old state'
      }
    ]
  });

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--results-json',
    JSON.stringify([{ domain: 'old.example' }]),
    '--now',
    NOW
  ]);

  assert.equal(output.migrated, true);
  assert.equal(output.chmodded, true);
  assert.equal(output.counts.seen, 1);
  assert.equal(output.groups.seen[0].state.status, 'viewed');
  assert.equal(output.groups.seen[0].state.unlocked_at, null);
  assert.equal(modeOf(file), '600');

  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(stored.version, '1.1');
  assert.equal(stored.items[0].status, 'viewed');
});

test('viewed classify returns unlocked, seen, and new groups', (t) => {
  const configHome = makeConfig(t);
  runState(configHome, [
    'viewed',
    'mark-shown',
    '--results-json',
    JSON.stringify([{ domain: 'seen.example' }, { domain: 'unlock.example' }]),
    '--now',
    '2026-05-27T12:00:00.000Z'
  ]);
  runState(configHome, [
    'viewed',
    'mark-unlocked',
    '--domain',
    'unlock.example',
    '--country-code',
    'US',
    '--now',
    '2026-05-27T13:00:00.000Z'
  ]);

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--window-days',
    '30',
    '--results-json',
    JSON.stringify([
      { domain: 'unlock.example' },
      { domain: 'seen.example' },
      { domain: 'new.example' }
    ]),
    '--now',
    NOW
  ]);

  assert.deepEqual(output.counts, { unlocked: 1, seen: 1, new: 1 });
  assert.equal(output.groups.unlocked[0].domain, 'unlock.example');
  assert.equal(output.groups.unlocked[0].state.status, 'unlocked');
  assert.equal(output.groups.seen[0].domain, 'seen.example');
  assert.equal(output.groups.new[0].domain, 'new.example');
});

test('viewed classify accepts large result payloads from a file', (t) => {
  const configHome = makeConfig(t);
  const resultsFile = path.join(configHome, 'results.json');
  fs.writeFileSync(resultsFile, JSON.stringify([
    { domain: 'file-one.example' },
    { website: 'https://file-two.example/path' }
  ]));

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--window-days',
    '30',
    '--results-file',
    resultsFile,
    '--now',
    NOW
  ]);

  assert.equal(output.counts.new, 2);
  assert.equal(output.groups.new[0].domain, 'file-one.example');
  assert.equal(output.groups.new[1].domain, 'file-two.example');
});

test('viewed mark-shown accepts large result payloads from stdin', (t) => {
  const configHome = makeConfig(t);
  const result = spawnSync(
    process.execPath,
    [
      STATE_CLI,
      'viewed',
      'mark-shown',
      '--results-file',
      '-',
      '--brief-summary',
      'stdin payload',
      '--now',
      NOW
    ],
    {
      cwd: REPO_ROOT,
      env: { ...process.env, XDG_CONFIG_HOME: configHome },
      input: JSON.stringify([{ domain: 'stdin.example' }]),
      encoding: 'utf8'
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.updated, 1);
  assert.equal(output.viewed.items[0].domain, 'stdin.example');
  assert.equal(output.viewed.items[0].brief_summary, 'stdin payload');
});

test('viewed unlocked expiry falls back to seen when shown_at is still active', (t) => {
  const configHome = makeConfig(t);
  writeViewed(configHome, {
    version: '1.1',
    items: [
      {
        domain: 'expired-unlock.example',
        shown_at: '2026-05-20T12:00:00.000Z',
        brief_summary: 'shown recently',
        status: 'unlocked',
        unlocked_at: '2026-04-01T12:00:00.000Z'
      },
      {
        domain: 'expired-all.example',
        shown_at: '2026-04-01T12:00:00.000Z',
        brief_summary: 'old',
        status: 'viewed',
        unlocked_at: null
      }
    ]
  }, 0o600);

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--window-days',
    '30',
    '--results-json',
    JSON.stringify([
      { domain: 'expired-unlock.example' },
      { domain: 'expired-all.example' }
    ]),
    '--now',
    NOW
  ]);

  assert.equal(output.counts.unlocked, 0);
  assert.equal(output.counts.seen, 1);
  assert.equal(output.counts.new, 1);
  assert.equal(output.groups.seen[0].domain, 'expired-unlock.example');
  assert.equal(output.groups.new[0].domain, 'expired-all.example');
});

test('viewed mark-unlocked creates an item when domain was not shown before', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, [
    'viewed',
    'mark-unlocked',
    '--domain',
    'https://www.created.example/path',
    '--country-code',
    'gb',
    '--now',
    NOW
  ]);

  assert.equal(output.viewed.items.length, 1);
  assert.equal(output.viewed.items[0].domain, 'created.example');
  assert.equal(output.viewed.items[0].status, 'unlocked');
  assert.equal(output.viewed.items[0].unlocked_at, NOW);
  assert.equal(output.viewed.items[0].country_code, 'GB');
  assert.equal(modeOf(viewedPath(configHome)), '600');
});

test('viewed mark-unlocked compact output reports counts without full state', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, [
    'viewed',
    'mark-unlocked',
    '--domain',
    'compact.example',
    '--country-code',
    'DE',
    '--compact',
    '--now',
    NOW
  ]);

  assert.equal(output.ok, true);
  assert.equal(output.updated, 1);
  assert.equal(output.total_items, 1);
  assert.equal(Object.hasOwn(output, 'viewed'), false);

  const stored = JSON.parse(fs.readFileSync(viewedPath(configHome), 'utf8'));
  assert.equal(stored.items[0].domain, 'compact.example');
  assert.equal(stored.items[0].status, 'unlocked');
});

test('viewed mark-unlocked-batch updates multiple domains and prints compact counts', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, [
    'viewed',
    'mark-unlocked-batch',
    '--json',
    JSON.stringify([
      { domain: 'https://www.batch-one.example/path', country_code: 'de' },
      { domain: 'batch-two.example', countryCode: 'US' },
      { domain: 'batch-one.example', country_code: 'DE' }
    ]),
    '--now',
    NOW
  ]);

  assert.equal(output.ok, true);
  assert.equal(output.updated, 3);
  assert.equal(output.total_items, 2);
  assert.equal(Object.hasOwn(output, 'viewed'), false);

  const stored = JSON.parse(fs.readFileSync(viewedPath(configHome), 'utf8'));
  assert.deepEqual(stored.items.map((item) => item.domain), ['batch-one.example', 'batch-two.example']);
  assert.equal(stored.items[0].country_code, 'DE');
  assert.equal(stored.items[1].country_code, 'US');
});

test('viewed mark-shown compact output reports counts without full state', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, [
    'viewed',
    'mark-shown',
    '--results-json',
    JSON.stringify([{ domain: 'shown-one.example' }, { domain: 'shown-two.example' }]),
    '--compact',
    '--now',
    NOW
  ]);

  assert.equal(output.ok, true);
  assert.equal(output.updated, 2);
  assert.equal(output.total_items, 2);
  assert.equal(Object.hasOwn(output, 'viewed'), false);
});

test('viewed classify compact output reports counts without raw result groups', (t) => {
  const configHome = makeConfig(t);
  runState(configHome, [
    'viewed',
    'mark-shown',
    '--results-json',
    JSON.stringify([{ domain: 'seen-compact.example' }]),
    '--now',
    '2026-05-27T12:00:00.000Z'
  ]);

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--results-json',
    JSON.stringify([{ domain: 'seen-compact.example' }, { domain: 'new-compact.example' }]),
    '--compact',
    '--now',
    NOW
  ]);

  assert.deepEqual(output.counts, { unlocked: 0, seen: 1, new: 1 });
  assert.equal(Object.hasOwn(output, 'groups'), false);
});

test('viewed corrupt JSON is backed up and classification continues as new', (t) => {
  const configHome = makeConfig(t);
  const file = viewedPath(configHome);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{bad json', { mode: 0o600 });

  const output = runState(configHome, [
    'viewed',
    'classify',
    '--results-json',
    JSON.stringify([{ domain: 'example.com' }]),
    '--now',
    NOW
  ]);

  assert.equal(output.recovered, true);
  assert.equal(output.counts.new, 1);
  assert.equal(fs.existsSync(file), false);

  const backups = fs.readdirSync(path.dirname(file)).filter((name) => name.startsWith('viewed.json.corrupt.'));
  assert.equal(backups.length, 1);
});

test('viewed successful writes leave no temp files behind', (t) => {
  const configHome = makeConfig(t);
  const file = viewedPath(configHome);

  runState(configHome, [
    'viewed',
    'mark-shown',
    '--results-json',
    JSON.stringify([{ domain: 'example.com' }]),
    '--now',
    NOW
  ]);

  const names = fs.readdirSync(path.dirname(file));
  assert.equal(names.some((name) => name.includes('.tmp-')), false);
  assert.equal(modeOf(file), '600');
});
