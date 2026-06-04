const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runCommand } = require('../lib/core/process');
const { fromOkkiRoot } = require('../lib/core/paths');

const authPath = fromOkkiRoot('skill', 'scripts', 'okki-auth.js');
const resolverPath = fromOkkiRoot('skill', 'scripts', 'resolve-api-key.sh');

function makeTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'okki-auth-home-'));
}

function envFor(home, overrides = {}) {
  return {
    ...process.env,
    HOME: home,
    XDG_CONFIG_HOME: '',
    OKKIGO_API_KEY: '',
    OKKI_GO_API_KEY: '',
    OKKIGO_SKILL_API_KEY: '',
    OKKIGO_ANALYTICS_DISABLED: '1',
    ...overrides
  };
}

function runAuth(args, options = {}) {
  return spawnSync(process.execPath, [authPath, ...args], {
    cwd: fromOkkiRoot(),
    env: envFor(options.home || makeTempHome(), options.env),
    input: options.input || '',
    encoding: 'utf8',
    timeout: 30000
  });
}

function runResolver(args, home, env = {}) {
  return runCommand('bash', [resolverPath, ...args], {
    cwd: fromOkkiRoot(),
    env: envFor(home, env)
  });
}

function modeOf(file) {
  return (fs.statSync(file).mode & 0o777).toString(8);
}

test('okki-auth login stores a redacted user-level credentials cache', () => {
  const home = makeTempHome();
  const result = runAuth(['login', '--with-api-key', '--json'], {
    home,
    input: 'sk-from-login\n'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes('sk-from-login'), false);

  const body = JSON.parse(result.stdout);
  const credentialsPath = path.join(home, '.config', 'okki-go', 'credentials.json');
  const sourcePath = path.join(home, '.config', 'okki-go', 'auth-source.json');

  assert.equal(body.ok, true);
  assert.equal(body.source, `file:${credentialsPath}`);
  assert.equal(body.redacted, true);
  assert.equal(fs.existsSync(credentialsPath), true);
  assert.equal(fs.existsSync(sourcePath), true);
  assert.equal(modeOf(credentialsPath), '600');
  assert.equal(modeOf(sourcePath), '600');
  assert.equal(fs.readFileSync(sourcePath, 'utf8').includes('sk-from-login'), false);
});

test('okki-auth status reports saved credentials without printing the secret', () => {
  const home = makeTempHome();
  runAuth(['login', '--with-api-key', '--json'], {
    home,
    input: 'sk-from-login\n'
  });

  const result = runAuth(['status', '--json'], { home });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes('sk-from-login'), false);

  const body = JSON.parse(result.stdout);
  assert.equal(body.configured, true);
  assert.match(body.source, /^file:/);
  assert.equal(body.redacted, true);
});

test('okki-auth login rejects invalid keys without a stack trace', () => {
  const home = makeTempHome();
  const result = runAuth(['login', '--with-api-key', '--json'], {
    home,
    input: 'not-a-key\n'
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Invalid OKKI Go API key format/);
  assert.equal(result.stderr.includes('at '), false);
});

test('resolve-api-key shim uses okki-auth cached credentials', () => {
  const home = makeTempHome();
  runAuth(['login', '--with-api-key', '--json'], {
    home,
    input: 'sk-from-login\n'
  });
  const credentialsPath = path.join(home, '.config', 'okki-go', 'credentials.json');

  const check = runResolver(['--check'], home);
  const source = runResolver(['--source'], home);
  const print = runResolver(['--print'], home);

  assert.equal(check.status, 0, check.stderr);
  assert.equal(check.stdout.trim(), 'KEY_SET');
  assert.equal(source.status, 0, source.stderr);
  assert.equal(source.stdout.trim(), `file:${credentialsPath}`);
  assert.equal(source.stdout.includes('sk-from-login'), false);
  assert.equal(print.status, 0, print.stderr);
  assert.equal(print.stdout.trim(), 'sk-from-login');
});

test('okki-auth rejects broadly readable local credentials with redacted diagnostics', () => {
  const home = makeTempHome();
  const configDir = path.join(home, '.config', 'okki-go');
  const credentialsPath = path.join(configDir, 'credentials.json');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify({ apiKey: 'sk-from-file' }));
  fs.chmodSync(credentialsPath, 0o644);

  const result = runAuth(['status', '--json'], { home });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.includes('sk-from-file'), false);
  assert.equal(result.stderr.includes('sk-from-file'), false);

  const body = JSON.parse(result.stdout);
  assert.equal(body.configured, false);
  assert.equal(body.reason, 'insecure_permissions');
  assert.match(body.diagnostics[0].message, /permissions must be 600/);
});

test('okki-auth falls back to env when registered file source is unavailable', () => {
  const home = makeTempHome();
  const configDir = path.join(home, '.config', 'okki-go');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'auth-source.json'),
    JSON.stringify({
      version: 1,
      preferred: { type: 'file', path: path.join(configDir, 'missing.json') }
    })
  );
  fs.chmodSync(path.join(configDir, 'auth-source.json'), 0o600);

  const result = runAuth(['status', '--json'], {
    home,
    env: { OKKIGO_API_KEY: 'sk-from-env' }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes('sk-from-env'), false);

  const body = JSON.parse(result.stdout);
  assert.equal(body.configured, true);
  assert.equal(body.source, 'env:OKKIGO_API_KEY');
});
