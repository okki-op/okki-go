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

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
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

test('credential resolver handles GNU stat before BSD stat when checking file permissions', () => {
  const home = makeTempHome();
  const binDir = makeTempDir('okki-fake-stat-bin-');
  const configDir = path.join(home, '.config', 'okki-go');
  const credentialsPath = path.join(configDir, 'credentials.json');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(credentialsPath, JSON.stringify({ apiKey: 'sk-from-file' }));
  fs.chmodSync(credentialsPath, 0o600);

  const statPath = path.join(binDir, 'stat');
  fs.writeFileSync(statPath, [
    '#!/bin/sh',
    'if [ "$1" = "-c" ]; then',
    '  echo 600',
    '  exit 0',
    'fi',
    'if [ "$1" = "-f" ]; then',
    '  echo "not-a-file-mode"',
    '  exit 0',
    'fi',
    'exit 1',
    ''
  ].join('\n'));
  fs.chmodSync(statPath, 0o700);

  const result = runResolver(['--source'], {
    HOME: home,
    PATH: `${binDir}${path.delimiter}${process.env.PATH}`
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), `file:${credentialsPath}`);
});

test('credential resolver does not guess OpenClaw skill config at runtime', () => {
  const home = makeTempHome();
  const openclawDir = path.join(home, '.openclaw');
  const configPath = path.join(openclawDir, 'openclaw.json');
  fs.mkdirSync(openclawDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({
    skills: {
      entries: {
        okkigo: {
          apiKey: 'sk-from-openclaw'
        }
      }
    }
  }));
  fs.chmodSync(configPath, 0o600);

  const result = runResolver(['--print'], { HOME: home });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'NO_KEY');
  assert.equal(result.stdout.includes('sk-from-openclaw'), false);
  assert.equal(result.stderr.includes('sk-from-openclaw'), false);
});

test('credential resolver still accepts explicit env when OpenClaw config exists', () => {
  const home = makeTempHome();
  const openclawDir = path.join(home, '.openclaw');
  const configPath = path.join(openclawDir, 'openclaw.json');
  fs.mkdirSync(openclawDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({
    skills: {
      entries: {
        okkigo: {
          apiKey: 'sk-from-openclaw'
        }
      }
    }
  }));
  fs.chmodSync(configPath, 0o600);

  const result = runResolver(['--source'], {
    HOME: home,
    OKKIGO_API_KEY: 'sk-from-env'
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'env:OKKIGO_API_KEY');
  assert.equal(result.stdout.includes('sk-from-openclaw'), false);
});

test('credential resolver does not guess Accio account skill config at runtime', () => {
  const home = makeTempHome();
  const accountId = 'account-1';
  const skillsDir = path.join(home, '.accio', 'accounts', accountId, 'skills');
  const configPath = path.join(skillsDir, 'skills_config.json');
  fs.mkdirSync(skillsDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({
    'OKKI Go': {
      enabled: true,
      apiKey: 'sk-from-accio'
    }
  }));
  fs.chmodSync(configPath, 0o600);

  const result = runResolver(['--print'], {
    HOME: home,
    OKKIGO_SKILL_RUNTIME: 'accio',
    ACCIO_ACCOUNT_ID: accountId
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'NO_KEY');
  assert.equal(result.stdout.includes('sk-from-accio'), false);
  assert.equal(result.stderr.includes('sk-from-accio'), false);
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
