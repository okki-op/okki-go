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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-profile-test-'));
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

function profilePath(configHome) {
  return path.join(configHome, 'okki-go', 'profile.json');
}

function modeOf(file) {
  return (fs.statSync(file).mode & 0o777).toString(8);
}

function writeProfile(configHome, value, mode = 0o644) {
  const file = profilePath(configHome);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode });
  fs.chmodSync(file, mode);
  return file;
}

test('profile read returns zero state when missing', (t) => {
  const configHome = makeConfig(t);
  const output = runState(configHome, ['profile', 'read', '--now', NOW]);

  assert.equal(output.ok, true);
  assert.equal(output.recovered, false);
  assert.equal(output.migrated, false);
  assert.equal(output.profile.version, '1.1');
  assert.equal(output.profile.completeness, 0);
  assert.equal(output.profile.updated_at, null);
  assert.equal(fs.existsSync(profilePath(configHome)), false);
});

test('profile read migrates old profile and downgrades missing B-class source', (t) => {
  const configHome = makeConfig(t);
  const file = writeProfile(configHome, {
    company: {
      country: 'CN'
    },
    offerings: {
      primary_products: ['DTF printer'],
      usps: ['fast delivery', { value: 'in-house R&D', source: 'user_confirmed' }]
    },
    target_baseline: {
      regions_primary: [{ value: 'US' }],
      decision_roles: [{ value: 'Procurement Manager', source: 'imported' }]
    }
  });

  const output = runState(configHome, ['profile', 'read', '--now', NOW]);

  assert.equal(output.migrated, true);
  assert.equal(output.chmodded, true);
  assert.equal(output.profile.version, '1.1');
  assert.equal(output.profile.offerings.usps[0].source, 'agent_inferred');
  assert.equal(output.profile.offerings.usps[0].updated_at, '2026-05-28');
  assert.equal(output.profile.offerings.usps[1].source, 'user_confirmed');
  assert.equal(output.profile.target_baseline.regions_primary[0].source, 'agent_inferred');
  assert.equal(output.profile.target_baseline.decision_roles[0].source, 'imported');
  assert.equal(output.profile.completeness, 0.6);
  assert.equal(modeOf(file), '600');

  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(stored.version, '1.1');
  assert.equal(stored.offerings.usps[0].source, 'agent_inferred');
});

test('profile upsert preserves source metadata and recomputes completeness', (t) => {
  const configHome = makeConfig(t);
  const patch = {
    company: {
      country: 'CN',
      name: 'Example Manufacturing Co.'
    },
    offerings: {
      primary_products: ['DTF printer'],
      usps: [
        { value: 'Tier-1 components', source: 'user_confirmed', updated_at: '2026-05-26' }
      ]
    },
    target_baseline: {
      regions_primary: [
        { value: 'US', source: 'user_confirmed', updated_at: '2026-05-26' }
      ],
      decision_roles: [
        { value: 'Procurement Manager', source: 'agent_inferred', updated_at: '2026-05-28' }
      ]
    },
    sales_context: {
      goal: 'expand_new_market',
      source: 'user_confirmed',
      updated_at: '2026-05-28'
    }
  };

  const output = runState(configHome, [
    'profile',
    'upsert',
    '--json',
    JSON.stringify(patch),
    '--now',
    NOW
  ]);

  assert.equal(output.profile.updated_at, NOW);
  assert.equal(output.profile.offerings.usps[0].source, 'user_confirmed');
  assert.equal(output.profile.target_baseline.decision_roles[0].source, 'agent_inferred');
  assert.equal(output.profile.completeness, 0.8);
  assert.equal(modeOf(profilePath(configHome)), '600');
});

test('profile completeness excludes agent-inferred B-class defaults until confirmed', (t) => {
  const configHome = makeConfig(t);

  let output = runState(configHome, [
    'profile',
    'upsert',
    '--json',
    JSON.stringify({
      company: {
        country: 'CN'
      },
      offerings: {
        usps: [
          { value: 'fast delivery', source: 'agent_inferred', updated_at: '2026-05-28' }
        ]
      },
      target_baseline: {
        regions_primary: [
          { value: 'DE', source: 'agent_inferred', updated_at: '2026-05-28' }
        ],
        decision_roles: [
          { value: 'Procurement Manager', source: 'agent_inferred', updated_at: '2026-05-28' }
        ]
      }
    }),
    '--now',
    NOW
  ]);

  assert.equal(output.profile.completeness, 0.2);

  output = runState(configHome, [
    'profile',
    'upsert',
    '--json',
    JSON.stringify({
      offerings: {
        usps: [
          { value: 'fast delivery', source: 'user_confirmed', updated_at: '2026-05-28' }
        ]
      },
      target_baseline: {
        regions_primary: [
          { value: 'DE', source: 'imported', updated_at: '2026-05-28' }
        ]
      }
    }),
    '--now',
    NOW
  ]);

  assert.equal(output.profile.completeness, 0.6);
  assert.equal(output.profile.offerings.usps[0].source, 'user_confirmed');
  assert.equal(output.profile.target_baseline.regions_primary[0].source, 'imported');
});

test('profile redact hides sender email and sender name by default', (t) => {
  const configHome = makeConfig(t);
  runState(configHome, [
    'profile',
    'upsert',
    '--json',
    JSON.stringify({
      outreach_identity: {
        sender_name: 'Carrie Chen',
        sender_email: 'carrie@example.com',
        sender_title: 'Sales Manager'
      }
    }),
    '--now',
    NOW
  ]);

  const output = runState(configHome, ['profile', 'redact', '--now', NOW]);

  assert.equal(output.redacted, true);
  assert.equal(output.profile.outreach_identity.sender_name, 'C***');
  assert.equal(output.profile.outreach_identity.sender_email, 'c***@example.com');
  assert.equal(output.profile.outreach_identity.sender_title, 'Sales Manager');
});

test('profile update-history merges axes and increments search count', (t) => {
  const configHome = makeConfig(t);

  let output = runState(configHome, [
    'profile',
    'update-history',
    '--json',
    JSON.stringify({ geo: ['DE'], industry: ['textile printing'] }),
    '--now',
    NOW
  ]);

  assert.deepEqual(output.profile.history.last_used_axes.geo, ['DE']);
  assert.deepEqual(output.profile.history.last_used_axes.industry, ['textile printing']);
  assert.equal(output.profile.history.search_count, 1);

  output = runState(configHome, [
    'profile',
    'update-history',
    '--json',
    JSON.stringify({ last_used_axes: { decision_role: ['Procurement Manager'] } }),
    '--now',
    NOW
  ]);

  assert.deepEqual(output.profile.history.last_used_axes.geo, ['DE']);
  assert.deepEqual(output.profile.history.last_used_axes.decision_role, ['Procurement Manager']);
  assert.equal(output.profile.history.search_count, 2);
});

test('profile corrupt JSON is backed up and read as zero state', (t) => {
  const configHome = makeConfig(t);
  const file = profilePath(configHome);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '{bad json', { mode: 0o600 });

  const output = runState(configHome, ['profile', 'read', '--now', NOW]);

  assert.equal(output.recovered, true);
  assert.equal(output.profile.completeness, 0);
  assert.equal(fs.existsSync(file), false);

  const backups = fs.readdirSync(path.dirname(file)).filter((name) => name.startsWith('profile.json.corrupt.'));
  assert.equal(backups.length, 1);
});

test('profile successful writes leave no temp files behind', (t) => {
  const configHome = makeConfig(t);
  const file = profilePath(configHome);

  runState(configHome, [
    'profile',
    'upsert',
    '--json',
    JSON.stringify({ company: { country: 'CN' } }),
    '--now',
    NOW
  ]);

  const names = fs.readdirSync(path.dirname(file));
  assert.equal(names.some((name) => name.includes('.tmp-')), false);
  assert.equal(modeOf(file), '600');
});
