const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCommand } = require('../lib/core/process');
const { fromOkkiRoot } = require('../lib/core/paths');

const resolverPath = fromOkkiRoot('skill', 'scripts', 'resolve-api-key.sh');

function makeTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'okki-credentials-home-'));
}

function runResolver(args, env = {}) {
  return runCommand('bash', [resolverPath, ...args], {
    cwd: fromOkkiRoot(),
    env: {
      OKKIGO_API_KEY: '',
      OKKI_GO_API_KEY: '',
      OKKIGO_SKILL_API_KEY: '',
      XDG_CONFIG_HOME: '',
      ...env
    }
  });
}

test('credential resolver --check reports KEY_SET when standard env var is present', () => {
  const result = runResolver(['--check'], { OKKIGO_API_KEY: 'sk-from-env' });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'KEY_SET');
});

test('credential resolver --source identifies environment variable without printing the key', () => {
  const result = runResolver(['--source'], { OKKIGO_API_KEY: 'sk-from-env' });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'env:OKKIGO_API_KEY');
  assert.equal(result.stdout.includes('sk-from-env'), false);
});

test('credential resolver reads secure local credentials file after env vars', () => {
  const home = makeTempHome();
  const configDir = path.join(home, '.config', 'okki-go');
  const credentialsPath = path.join(configDir, 'credentials.json');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify({ apiKey: 'sk-from-file' }));
  fs.chmodSync(credentialsPath, 0o600);

  const result = runResolver(['--print'], { HOME: home });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'sk-from-file');
});

test('credential resolver refuses local credentials files with broad permissions', () => {
  const home = makeTempHome();
  const configDir = path.join(home, '.config', 'okki-go');
  const credentialsPath = path.join(configDir, 'credentials.json');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify({ apiKey: 'sk-from-file' }));
  fs.chmodSync(credentialsPath, 0o644);

  const result = runResolver(['--check'], { HOME: home });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'NO_KEY');
  assert.match(result.stderr, /permissions must be 600/);
});

test('credential resolver reports NO_KEY when no supported source is configured', () => {
  const home = makeTempHome();
  const result = runResolver(['--check'], { HOME: home });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'NO_KEY');
});
