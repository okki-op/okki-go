const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { runCommand } = require('../lib/core/process');
const { fromOkkiRoot } = require('../lib/core/paths');

test('package exposes OKKIGo aliases and help documents Accio install', () => {
  const pkg = JSON.parse(fs.readFileSync(fromOkkiRoot('package.json'), 'utf8'));

  assert.equal(pkg.bin['okki-go'], 'bin/install.js');
  assert.equal(pkg.bin.OKKIGo, 'bin/install.js');

  const result = runCommand(process.execPath, [fromOkkiRoot('bin', 'install.js'), '--help'], {
    cwd: fromOkkiRoot()
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /--accio/);
  assert.match(result.stdout, /node install\.js --global --accio/);
});
