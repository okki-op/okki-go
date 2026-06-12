const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SKILL_DIR = path.resolve(__dirname, '..', '..');
const ALLOWED_FRONTMATTER_KEYS = new Set([
  'allowed-tools',
  'description',
  'license',
  'metadata',
  'name'
]);

function read(relativePath) {
  return fs.readFileSync(path.join(SKILL_DIR, relativePath), 'utf8');
}

function frontmatterKeys(skillMarkdown) {
  const match = skillMarkdown.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'SKILL.md should start with YAML frontmatter');
  return match[1]
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith(' '))
    .map((line) => line.split(':')[0]);
}

test('SKILL.md frontmatter stays compatible with skill-creator validation', () => {
  const skill = read('SKILL.md');
  const keys = frontmatterKeys(skill);

  assert.equal(skill.includes('name: okki-go'), true);
  assert.equal(skill.includes('description:'), true);
  assert.deepEqual(
    keys.filter((key) => !ALLOWED_FRONTMATTER_KEYS.has(key)),
    []
  );
});

test('update scripts read current version from the installed VERSION file', () => {
  const checkUpdate = read('scripts/check-update.sh');
  const enableNotifications = read('scripts/enable-notifications.sh');

  assert.match(checkUpdate, /"\$SKILL_DIR\/VERSION"/);
  assert.match(enableNotifications, /skills\/okki-go\/VERSION/);
});

test('authentication reference defines agent-led install execution wizard', () => {
  const auth = read('references/authentication.md');

  assert.match(auth, /Agent-led install wizard/i);
  assert.match(auth, /Do not ask the user to choose a language/i);
  assert.doesNotMatch(auth, /Language \/ 语言选择/);

  for (const runtime of [
    'Claude Code',
    'OpenClaw',
    'OpenCode',
    'Gemini CLI',
    'Cursor',
    'Windsurf',
    'Codex',
    'GitHub Copilot',
    'Cline',
    'Accio Work'
  ]) {
    assert.match(auth, new RegExp(runtime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(auth, /--all/);
  assert.match(auth, /--custom=<name>/);
  assert.match(auth, /--global/);
  assert.match(auth, /--local/);
  assert.match(auth, /--path <dir>/);
  assert.match(auth, /npx -y @okki-global\/okki-go@latest/);

  assert.match(auth, /execute the installer/i);
  assert.match(auth, /not just display the command/i);
  assert.match(auth, /one-step execution path/i);
  assert.match(auth, /known runtime/i);

  assert.match(auth, /Get your API Key/i);
  assert.match(auth, /Configure your key/i);
  assert.match(auth, /restart/i);
  assert.match(auth, /bash scripts\/resolve-api-key\.sh --check/);
});
