#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'channel-packages', 'channels.json');
const PACKAGES_DIR = path.join(ROOT_DIR, 'channel-packages', 'packages');
const MAIN_PACKAGE = '@okki-global/okki-go@latest';
const MAIN_BIN = 'okki-go';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const listOnly = args.has('--list');

function readChannels() {
  const channels = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(channels)) {
    throw new Error('channel-packages/channels.json must contain an array');
  }
  return channels.map(normalizeChannel);
}

function normalizeChannel(channel, index) {
  const required = ['packageName', 'binName', 'channelCode', 'campaignId', 'publicLabel'];
  for (const key of required) {
    if (!channel[key] || typeof channel[key] !== 'string') {
      throw new Error(`Channel ${index + 1} is missing string field: ${key}`);
    }
  }

  if (!/^@[a-z0-9-]+\/[a-z0-9][a-z0-9-]*$/.test(channel.packageName)) {
    throw new Error(`Invalid scoped npm package name: ${channel.packageName}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(channel.binName)) {
    throw new Error(`Invalid bin name: ${channel.binName}`);
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(channel.channelCode)) {
    throw new Error(`Invalid channel code: ${channel.channelCode}`);
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(channel.campaignId)) {
    throw new Error(`Invalid campaign id: ${channel.campaignId}`);
  }

  return {
    packageName: channel.packageName,
    binName: channel.binName,
    channelCode: channel.channelCode,
    campaignId: channel.campaignId,
    publicLabel: channel.publicLabel
  };
}

function packageDirName(packageName) {
  return packageName.split('/').pop();
}

function packageJsonFor(channel) {
  return `${JSON.stringify({
    name: channel.packageName,
    version: '1.0.0',
    description: `OKKI Go ${channel.publicLabel} installer`,
    bin: {
      [channel.binName]: 'bin/install.js'
    },
    files: [
      'bin/'
    ],
    license: 'MIT',
    engines: {
      node: '>=14.0.0'
    },
    publishConfig: {
      access: 'public'
    },
    okkiGoChannel: {
      channelCode: channel.channelCode,
      campaignId: channel.campaignId
    }
  }, null, 2)}\n`;
}

function launcherFor(channel) {
  return `#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const result = spawnSync(npm, [
  'exec',
  '-y',
  '--package',
  '${MAIN_PACKAGE}',
  '--',
  '${MAIN_BIN}',
  ...process.argv.slice(2),
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    OKKIGO_SOURCE_PACKAGE: '${channel.packageName}',
    OKKIGO_CHANNEL_CODE: '${channel.channelCode}',
    OKKIGO_CAMPAIGN_ID: '${channel.campaignId}',
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
`;
}

function writeIfNeeded(filePath, content, mode, changed) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (existing === content) return;

  changed.push(path.relative(ROOT_DIR, filePath));
  if (checkOnly) return;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  if (mode) {
    try { fs.chmodSync(filePath, mode); } catch { /* best effort on Windows */ }
  }
}

function pruneStalePackages(expectedDirs, changed) {
  if (!fs.existsSync(PACKAGES_DIR)) return;

  for (const entry of fs.readdirSync(PACKAGES_DIR).sort()) {
    const packageDir = path.join(PACKAGES_DIR, entry);
    if (!fs.statSync(packageDir).isDirectory()) continue;
    if (expectedDirs.has(packageDir)) continue;

    changed.push(path.relative(ROOT_DIR, packageDir));
    if (!checkOnly) fs.rmSync(packageDir, { recursive: true, force: true });
  }
}

function generate() {
  const channels = readChannels();
  const seenPackages = new Set();
  const seenBins = new Set();
  const expectedDirs = new Set();
  const changed = [];

  for (const channel of channels) {
    if (seenPackages.has(channel.packageName)) throw new Error(`Duplicate package: ${channel.packageName}`);
    if (seenBins.has(channel.binName)) throw new Error(`Duplicate bin: ${channel.binName}`);
    seenPackages.add(channel.packageName);
    seenBins.add(channel.binName);

    if (listOnly) {
      console.log(`${channel.packageName}\t${channel.channelCode}\t${channel.campaignId}`);
      continue;
    }

    const packageDir = path.join(PACKAGES_DIR, packageDirName(channel.packageName));
    expectedDirs.add(packageDir);
    writeIfNeeded(path.join(packageDir, 'package.json'), packageJsonFor(channel), 0o644, changed);
    writeIfNeeded(path.join(packageDir, 'bin', 'install.js'), launcherFor(channel), 0o755, changed);
  }

  if (!listOnly) pruneStalePackages(expectedDirs, changed);

  if (checkOnly && changed.length > 0) {
    console.error('Channel packages are out of date:');
    for (const file of changed) console.error(`  ${file}`);
    process.exit(1);
  }

  if (!listOnly) {
    if (changed.length === 0) console.log('Channel packages are up to date.');
    else console.log(`${checkOnly ? 'Would update' : 'Updated'} ${changed.length} channel package file(s).`);
  }
}

if (require.main === module) {
  try {
    generate();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  generate,
  launcherFor,
  packageJsonFor,
  normalizeChannel
};
