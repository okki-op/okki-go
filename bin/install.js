#!/usr/bin/env node
/**
 * Okki Go Skill Installer
 * Multi-runtime installation for AI coding assistants.
 *
 * Usage:
 *   node install.js --global --claude
 *   node install.js --global --openclaw
 *   node install.js --global --all
 *   node install.js --uninstall --claude
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');
const https = require('https');

// ─── Terminal colors ──────────────────────────────────────────────────────────
const reset  = '\x1b[0m';
const red    = '\x1b[31m';
const green  = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan   = '\x1b[36m';
const bold   = '\x1b[1m';

// ─── Skill metadata ───────────────────────────────────────────────────────────
const SKILL_NAME = 'okki-go';
const DISPLAY_NAME = 'OKKI Go';
const VERSION    = '1.2.0';

// Friendly display names for each runtime
const RUNTIME_LABELS = {
  accio:    'Accio Work',
  claude:   'Claude Code',
  openclaw: 'OpenClaw',
  opencode: 'OpenCode',
  gemini:   'Gemini CLI',
  cursor:   'Cursor',
  windsurf: 'Windsurf',
  codex:    'Codex',
  copilot:  'GitHub Copilot',
  cline:    'Cline',
};
function runtimeLabel(r) {
  return RUNTIME_LABELS[r] || r;
}

// ─── i18n ────────────────────────────────────────────────────────────────────
let lang = 'en';

const messages = {
  langPrompt:       { en: 'Language / 语言选择：',                          zh: 'Language / 语言选择：' },
  langEn:           { en: '1. English (default)',                           zh: '1. English' },
  langZh:           { en: '2. 中文',                                        zh: '2. 中文（默认）' },
  langChoose:       { en: 'Choose (1-2) [1]: ',                             zh: '请选择 (1-2) [2]: ' },
  welcome:          { en: 'Welcome to Okki Go Installer!',                  zh: '欢迎使用 Okki Go 安装向导！' },
  welcomeDesc:      { en: 'This will install Okki Go AI prospecting capabilities to your AI assistant.', zh: '接下来会把 Okki Go 的 AI 获客能力安装到你的 AI 助手中。' },
  selectRuntime:    { en: 'Select your AI assistant (enter a number):',     zh: '请选择你使用的 AI 助手（输入编号即可）：' },
  allRuntimes:      { en: 'Install all',                                    zh: '全部安装' },
  otherRuntime:     { en: 'Other (enter name manually)',                    zh: '其他（手动输入名称）' },
  enterNumber:      { en: 'Enter number: ',                                 zh: '请输入编号：' },
  enterCustomName:  { en: 'Enter your AI assistant name: ',                 zh: '请输入你的 AI 助手名称：' },
  nameEmpty:        { en: 'Name cannot be empty',                           zh: '名称不能为空' },
  customNote:       { en: 'Note: Will install to ~/.%s. Set %s_CONFIG_DIR to customize.', zh: '提示：将安装到 ~/.%s 目录下。如需更改，可设置环境变量 %s_CONFIG_DIR。' },
  invalidChoice:    { en: 'Invalid choice, please try again',               zh: '输入无效，请重新运行' },
  selectLocation:   { en: 'Select install location:',                       zh: '请选择安装位置：' },
  locDefault:       { en: '1. Default (recommended)',                       zh: '1. 默认位置（推荐）' },
  locDefaultDesc:   { en: "   Install to your AI assistant's config directory", zh: '   安装到 AI 助手的配置目录' },
  locCurrent:       { en: '2. Current directory',                           zh: '2. 当前目录' },
  locCurrentDesc:   { en: '   Install under your current folder',           zh: '   安装到你现在所在的文件夹' },
  locCustom:        { en: '3. Custom path',                                 zh: '3. 自定义路径' },
  locCustomDesc:    { en: '   Install to a directory you specify',          zh: '   安装到你指定的文件夹' },
  chooseLocation:   { en: 'Choose (1-3) [1]: ',                             zh: '请选择（1-3，直接回车选 1）：' },
  installingToCwd:  { en: 'Installing to current directory: %s',            zh: '将安装到当前目录：%s' },
  enterCustomPath:  { en: 'Enter install directory path: ',                 zh: '请输入安装目录路径：' },
  pathEmpty:        { en: 'Path cannot be empty',                           zh: '路径不能为空' },
  installTarget:    { en: 'Will install to: %s',                            zh: '将安装到：%s' },
  windowsNote:      { en: 'Note: Windows detected. Shell scripts (.sh) require WSL or Git Bash to run.', zh: '提示：检测到 Windows 系统。部分脚本需要 WSL 或 Git Bash 才能运行。' },
  installProgress:  { en: 'Installation Progress',                          zh: '安装进度' },
  installComplete:  { en: 'Installation Complete!',                         zh: '安装完成！' },
  uninstallComplete:{ en: 'Uninstall Complete!',                            zh: '卸载完成！' },
  installingTo:     { en: 'Installing to %s...',                            zh: '正在安装到 %s 个平台...' },
  uninstallingFrom: { en: 'Uninstalling from %s...',                        zh: '正在卸载 %s 个平台...' },
  errNoLocation:    { en: 'Error: specify --global, --local, or --path <dir>', zh: '错误：请指定安装位置（--global / --local / --path <目录>）' },
  errNoRuntime:     { en: 'Error: specify at least one AI assistant (e.g. --claude, --all)', zh: '错误：请指定至少一个 AI 助手（如 --claude、--all）' },
  rtInstalling:     { en: 'Installing to',                                  zh: '正在安装到' },
  rtUpgrading:      { en: 'Upgrading v%s to v%s',                           zh: '检测到旧版本 v%s，正在升级到 v%s' },
  rtVerifyFail:     { en: 'Verification failed — missing: %s',              zh: '安装验证失败 — 缺少：%s' },
  rtSuccess:        { en: 'Installation successful',                        zh: '安装成功' },
  rtNotInstalled:   { en: 'Not installed: %s',                              zh: '未安装：%s' },
  rtRemoved:        { en: 'Removed %s',                                     zh: '已卸载 %s' },
  nextStepsTitle:   { en: 'Just 3 steps to get started:',                   zh: '接下来只需 3 步：' },
  step1Title:       { en: 'Get your API Key',                               zh: '获取 API Key（密钥）' },
  step1Desc:        { en: 'Visit %s to sign up and get your %s key',        zh: '打开 %s 注册并获取你的 %s 密钥' },
  step2Title:       { en: 'Configure your key',                             zh: '配置密钥' },
  step2Desc:        { en: 'Use the first configuration method your AI assistant supports:', zh: '使用你的 AI 助手支持的第一种配置方式：' },
  step2Cmd:         { en: 'export OKKIGO_API_KEY="sk-xxx"',                 zh: 'export OKKIGO_API_KEY="sk-xxx"' },
  step2Note:        { en: 'Then run: %s ~/.bashrc (or %s terminal)',        zh: '然后执行：%s ~/.bashrc（或%s终端）' },
  step3Title:       { en: 'Start using',                                    zh: '开始使用' },
  step3Desc:        { en: 'Restart your AI assistant and try:',             zh: '重启你的 AI 助手，然后试试说：' },
  step3Example:     { en: '"Find electronics suppliers in Japan"',          zh: '"帮我找日本的电子产品供应商"' },
  docLabel:         { en: 'Docs:',                                          zh: '文档：' },
  supportLabel:     { en: 'Support:',                                       zh: '客服：' },
};

function t(key) {
  const entry = messages[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

// Source directory: bin/ is sibling to skill/, so skill content lives at ../skill/
const SRC_DIR = path.resolve(__dirname, '..', 'skill');

// ─── Best-effort analytics ────────────────────────────────────────────────────
const ANALYTICS_ENDPOINT = process.env.OKKIGO_ANALYTICS_URL || process.env.SENSORS_SERVER_URL || 'https://datasink-sensorsdata.okki.ai/sa?project=production';
const analyticsPromises = [];

function analyticsDisabled() {
  const value = String(process.env.OKKIGO_ANALYTICS_DISABLED || process.env.ANALYTICS_DISABLED || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function getOkkiConfigDir() {
  const configHome = process.env.XDG_CONFIG_HOME ? expandTilde(process.env.XDG_CONFIG_HOME) : path.join(os.homedir(), '.config');
  return path.join(configHome, 'okki-go');
}

function newInstallId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function ensureInstallId() {
  const dir = getOkkiConfigDir();
  const file = path.join(dir, 'install-id');
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return existing;
  }
  const installId = newInstallId();
  ensureDir(dir);
  fs.writeFileSync(file, installId + '\n', { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* best effort */ }
  return installId;
}

function safeInstallId() {
  try { return ensureInstallId(); } catch { return undefined; }
}

function trackInstallerEvent(event, properties = {}) {
  if (analyticsDisabled()) return;
  const installId = properties.install_id || safeInstallId();
  if (!installId) return;

  const payload = JSON.stringify({
    event,
    distinct_id: installId,
    properties: {
      app_name: 'okki-go',
      product_line: 'okki_go_plg',
      app_platform: 'skill_installer',
      install_id: installId,
      skill_version: VERSION,
      node_version: process.version,
      os_platform: process.platform,
      ...properties,
    },
  });

  const task = new Promise(resolve => {
    try {
      const url = new URL(ANALYTICS_ENDPOINT);
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, res => {
        res.resume();
        res.on('end', resolve);
      });
      req.setTimeout(1000, () => { req.destroy(); resolve(); });
      req.on('error', resolve);
      req.write(payload);
      req.end();
    } catch {
      resolve();
    }
  });
  analyticsPromises.push(task);
}

async function flushAnalytics() {
  const pending = analyticsPromises.splice(0);
  if (pending.length > 0) await Promise.allSettled(pending);
}

// ─── Argument parsing ────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const isGlobal    = args.includes('--global') || args.includes('-g');
const isLocal     = args.includes('--local')  || args.includes('-l');
const isUninstall = args.includes('--uninstall') || args.includes('-u');
const isAll       = args.includes('--all');

let customBasePath = null;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--path') {
    customBasePath = args[i + 1] || null;
    i += 1;
  } else if (arg.startsWith('--path=')) {
    customBasePath = arg.substring(7).trim() || null;
  }
}

const SUPPORTED_RUNTIMES = ['claude', 'openclaw', 'opencode', 'gemini', 'cursor', 'windsurf', 'codex', 'copilot', 'cline', 'accio'];

let selectedRuntimes = [];
if (isAll) {
  selectedRuntimes = [...SUPPORTED_RUNTIMES];
} else {
  for (const r of SUPPORTED_RUNTIMES) {
    if (args.includes(`--${r}`)) selectedRuntimes.push(r);
  }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--custom=')) {
      const customName = arg.substring(9).trim();
      if (customName) selectedRuntimes.push(customName);
    } else if (arg === '--custom') {
      const customName = (args[i + 1] || '').trim();
      if (customName) {
        selectedRuntimes.push(customName);
        i += 1;
      }
    }
  }
}

// ─── Path resolution (env vars → XDG → defaults) ────────────────────────────
function expandTilde(p) {
  if (p && p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function getGlobalDir(runtime) {
  switch (runtime) {
    case 'accio':
      return getAccioAccountDir();
    case 'opencode':
      if (process.env.OPENCODE_CONFIG_DIR) return expandTilde(process.env.OPENCODE_CONFIG_DIR);
      if (process.env.XDG_CONFIG_HOME)     return path.join(expandTilde(process.env.XDG_CONFIG_HOME), 'opencode');
      return path.join(os.homedir(), '.config', 'opencode');
    case 'openclaw':
      if (process.env.OPENCLAW_CONFIG_DIR) return expandTilde(process.env.OPENCLAW_CONFIG_DIR);
      return path.join(os.homedir(), '.openclaw', 'workspace');
    case 'gemini':
      if (process.env.GEMINI_CONFIG_DIR) return expandTilde(process.env.GEMINI_CONFIG_DIR);
      return path.join(os.homedir(), '.gemini');
    case 'codex':
      if (process.env.CODEX_HOME) return expandTilde(process.env.CODEX_HOME);
      return path.join(os.homedir(), '.codex');
    case 'copilot':
      if (process.env.COPILOT_CONFIG_DIR) return expandTilde(process.env.COPILOT_CONFIG_DIR);
      return path.join(os.homedir(), '.copilot');
    case 'cursor':
      if (process.env.CURSOR_CONFIG_DIR) return expandTilde(process.env.CURSOR_CONFIG_DIR);
      return path.join(os.homedir(), '.cursor');
    case 'windsurf':
      if (process.env.WINDSURF_CONFIG_DIR) return expandTilde(process.env.WINDSURF_CONFIG_DIR);
      return path.join(os.homedir(), '.codeium', 'windsurf');
    case 'cline':
      if (process.env.CLINE_CONFIG_DIR) return expandTilde(process.env.CLINE_CONFIG_DIR);
      return path.join(os.homedir(), '.cline');
    default: // claude
      if (process.env.CLAUDE_CONFIG_DIR) return expandTilde(process.env.CLAUDE_CONFIG_DIR);
      return path.join(os.homedir(), '.claude');
  }
}

function getAccioRoot() {
  if (process.env.ACCIO_CONFIG_DIR) return expandTilde(process.env.ACCIO_CONFIG_DIR);
  return path.join(os.homedir(), '.accio');
}

function getAccioAccountDir() {
  if (process.env.ACCIO_ACCOUNT_DIR) return expandTilde(process.env.ACCIO_ACCOUNT_DIR);

  const root = getAccioRoot();
  const accountsDir = path.join(root, 'accounts');

  if (process.env.ACCIO_ACCOUNT_ID) {
    return path.join(accountsDir, process.env.ACCIO_ACCOUNT_ID);
  }

  if (!fs.existsSync(accountsDir)) {
    throw new Error('Accio account directory not found. Open Accio Work and sign in, or set ACCIO_ACCOUNT_ID.');
  }

  const accountIds = fs.readdirSync(accountsDir)
    .filter(name => fs.statSync(path.join(accountsDir, name)).isDirectory())
    .filter(name => !name.startsWith('.'));

  if (accountIds.length === 0) {
    throw new Error('No Accio accounts found. Open Accio Work and sign in, or set ACCIO_ACCOUNT_ID.');
  }

  if (accountIds.length > 1) {
    throw new Error(`Multiple Accio accounts found (${accountIds.join(', ')}). Set ACCIO_ACCOUNT_ID to choose one.`);
  }

  return path.join(accountsDir, accountIds[0]);
}

// Where skills live inside the config dir, and what the main file is called
function getSkillMeta(runtime) {
  switch (runtime) {
    case 'copilot':
      return { subdir: 'skills',   mainFile: 'instructions.md' };
    default:
      return { subdir: 'skills',   mainFile: 'SKILL.md' };
  }
}

function getSkillDir(runtime, installMode, customPath) {
  if (runtime === 'accio' && installMode !== 'global') {
    throw new Error('Accio Work skills are account-scoped. Use --global --accio.');
  }

  let base;
  if (installMode === 'custom') {
    base = expandTilde(customPath);
  } else if (installMode === 'global') {
    base = getGlobalDir(runtime);
  } else {
    base = process.cwd();
  }
  const { subdir } = getSkillMeta(runtime);
  return path.join(base, subdir, SKILL_NAME);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function log(msg, color = reset) {
  console.log(`${color}${msg}${reset}`);
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Manifest (SHA256 change detection) ──────────────────────────────────────
function loadManifest(skillDir) {
  const p = path.join(skillDir, '.okki-go-manifest.json');
  if (!fs.existsSync(p)) return { version: null, files: {} };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { version: null, files: {} };
  }
}

function saveManifest(skillDir, manifest) {
  fs.writeFileSync(path.join(skillDir, '.okki-go-manifest.json'), JSON.stringify(manifest, null, 2));
}

function updateAccioSkillsConfig(skillDir, enabled) {
  const skillsDir = path.dirname(skillDir);
  ensureDir(skillsDir);
  const configPath = path.join(skillsDir, 'skills_config.json');
  let config = {};

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      throw new Error(`Accio skills_config.json is not valid JSON: ${configPath}`);
    }
  }

  if (enabled) {
    config[DISPLAY_NAME] = { enabled: true, installedVersion: VERSION };
  } else {
    delete config[DISPLAY_NAME];
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log(`  ${green}✓${reset} Updated Accio skills_config.json`);
}

function stripJsonComments(content) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < content.length; i++) {
    const current = content[i];
    const next = content[i + 1];

    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === '\\') {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }

    if (current === '"') {
      inString = true;
      output += current;
      continue;
    }

    if (current === '/' && next === '/') {
      while (i < content.length && content[i] !== '\n') i++;
      output += '\n';
      continue;
    }

    if (current === '/' && next === '*') {
      i += 2;
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
      i += 1;
      continue;
    }

    output += current;
  }

  return output;
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(filePath, 'utf8')));
  } catch (error) {
    throw new Error(`Invalid JSON file: ${filePath}`);
  }
}

function getAccioAccountRootFromSkillDir(skillDir) {
  return path.dirname(path.dirname(skillDir));
}

function getAccioAgentSkillDirs(accountRoot) {
  const agentsDir = path.join(accountRoot, 'agents');
  if (!fs.existsSync(agentsDir)) return [];

  return fs.readdirSync(agentsDir)
    .filter(name => !name.startsWith('.'))
    .map(name => path.join(agentsDir, name))
    .filter(agentDir => {
      try {
        return fs.statSync(agentDir).isDirectory() &&
          fs.existsSync(path.join(agentDir, 'agent-core', 'skills', 'skills.jsonc'));
      } catch {
        return false;
      }
    });
}

function updateAccioAgentSkillsIndex(agentDir, skillDir, enabled) {
  const configPath = path.join(agentDir, 'agent-core', 'skills', 'skills.jsonc');
  const config = readJsonFile(configPath, { skills: [] });
  if (!Array.isArray(config.skills)) config.skills = [];

  const skillPath = path.join(skillDir, getSkillMeta('accio').mainFile);
  const nextSkills = config.skills.filter(skill => {
    if (!skill || typeof skill !== 'object') return true;
    return skill.name !== DISPLAY_NAME && skill.id !== SKILL_NAME && skill.path !== skillPath;
  });

  if (enabled) {
    nextSkills.push({
      name: DISPLAY_NAME,
      path: skillPath,
      enabled: true,
      installedVersion: VERSION
    });
  }

  config.skills = nextSkills;
  ensureDir(path.dirname(configPath));
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function syncAccioAgentSkills(accountSkillDir, enabled) {
  const accountRoot = getAccioAccountRootFromSkillDir(accountSkillDir);
  const agentDirs = getAccioAgentSkillDirs(accountRoot);

  for (const agentDir of agentDirs) {
    const agentSkillDir = path.join(agentDir, 'skills', SKILL_NAME);
    if (enabled) {
      ensureDir(agentSkillDir);
      copySkillFiles(agentSkillDir, 'accio');
      const manifest = generateManifest(agentSkillDir, 'accio', safeInstallId());
      saveManifest(agentSkillDir, manifest);
    } else if (fs.existsSync(agentSkillDir)) {
      saveLocalPatches(agentSkillDir, loadManifest(agentSkillDir));
      fs.rmSync(agentSkillDir, { recursive: true, force: true });
    }
    updateAccioAgentSkillsIndex(agentDir, agentSkillDir, enabled);
  }

  if (agentDirs.length > 0) {
    log(`  ${green}✓${reset} Updated ${agentDirs.length} Accio agent skill selection(s)`);
  } else {
    log(`  ${yellow}!${reset} No Accio agents found to select the skill automatically`);
  }
}

function saveLocalPatches(skillDir, oldManifest) {
  if (!oldManifest || !oldManifest.files) return;
  const patchDir = path.join(skillDir, '.okki-go-patches');
  for (const [relPath, oldHash] of Object.entries(oldManifest.files)) {
    const filePath = path.join(skillDir, relPath);
    if (!fs.existsSync(filePath)) continue;
    const currentHash = sha256(fs.readFileSync(filePath, 'utf8'));
    if (currentHash !== oldHash) {
      ensureDir(patchDir);
      const patchPath = path.join(patchDir, relPath.replace(/\//g, '_'));
      fs.writeFileSync(patchPath, fs.readFileSync(filePath));
      log(`  Saved local modification: ${relPath}`, yellow);
    }
  }
}

function generateManifest(skillDir, runtime, installId) {
  const manifest = { version: VERSION, runtime, installId, installedAt: new Date().toISOString(), files: {} };
  const { mainFile } = getSkillMeta(runtime);

  // Main skill file
  const mainPath = path.join(skillDir, mainFile);
  if (fs.existsSync(mainPath)) {
    manifest.files[mainFile] = sha256(fs.readFileSync(mainPath, 'utf8'));
  }

  // references/
  const refsDir = path.join(skillDir, 'references');
  if (fs.existsSync(refsDir)) {
    for (const f of fs.readdirSync(refsDir)) {
      const fp = path.join(refsDir, f);
      if (fs.statSync(fp).isFile()) {
        manifest.files[`references/${f}`] = sha256(fs.readFileSync(fp, 'utf8'));
      }
    }
  }

  // scripts/
  const scriptsDir = path.join(skillDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    for (const f of fs.readdirSync(scriptsDir)) {
      const fp = path.join(scriptsDir, f);
      if (fs.statSync(fp).isFile()) {
        manifest.files[`scripts/${f}`] = sha256(fs.readFileSync(fp, 'utf8'));
      }
    }
  }

  return manifest;
}

// ─── File copying ─────────────────────────────────────────────────────────────
function copySkillFiles(skillDir, runtime) {
  const { mainFile } = getSkillMeta(runtime);

  // 1. Main skill file: SKILL.md → SKILL.md / instructions.md
  const srcMain = path.join(SRC_DIR, 'SKILL.md');
  const dstMain = path.join(skillDir, mainFile);
  if (!fs.existsSync(srcMain)) {
    throw new Error('SKILL.md not found in source directory');
  }
  fs.copyFileSync(srcMain, dstMain);
  log(`  ${green}✓${reset} Copied ${mainFile}`);

  // 2. references/
  const srcRefs = path.join(SRC_DIR, 'references');
  const dstRefs = path.join(skillDir, 'references');
  if (fs.existsSync(srcRefs)) {
    ensureDir(dstRefs);
    for (const f of fs.readdirSync(srcRefs)) {
      const src = path.join(srcRefs, f);
      const dst = path.join(dstRefs, f);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
    }
    log(`  ${green}✓${reset} Copied references/`);
  }

  // 3. scripts/
  const srcScripts = path.join(SRC_DIR, 'scripts');
  const dstScripts = path.join(skillDir, 'scripts');
  if (fs.existsSync(srcScripts)) {
    ensureDir(dstScripts);
    for (const f of fs.readdirSync(srcScripts)) {
      const src = path.join(srcScripts, f);
      const dst = path.join(dstScripts, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
        // Set executable permission on Unix systems (Windows doesn't support chmod)
        if (f.endsWith('.sh')) {
          try { fs.chmodSync(dst, 0o755); } catch (e) { /* Windows */ }
        }
      }
    }
    log(`  ${green}✓${reset} Copied scripts/`);
  }

  // 4. VERSION file
  fs.writeFileSync(path.join(skillDir, 'VERSION'), VERSION);
}

// ─── Verification ─────────────────────────────────────────────────────────────
function verifyInstallation(skillDir, runtime) {
  const { mainFile } = getSkillMeta(runtime);
  const checks = [
    path.join(skillDir, mainFile),
    path.join(skillDir, 'references'),
    path.join(skillDir, 'scripts'),
    path.join(skillDir, 'VERSION')
  ];
  const missing = checks.filter(p => !fs.existsSync(p));
  return missing.length === 0 ? null : missing.map(p => path.basename(p));
}

// ─── Install one runtime ──────────────────────────────────────────────────────
function installRuntime(runtime, installMode, customPath) {
  const skillDir = resolveSkillDir(runtime, installMode, customPath);
  if (!skillDir) return;
  const label = runtimeLabel(runtime);
  const installId = ensureInstallId();
  trackInstallerEvent('SkillInstallStarted', {
    install_id: installId,
    runtime,
    install_mode: installMode,
    custom_path_used: Boolean(customPath),
  });

  try {
    log(`${cyan}[${label}]${reset} ${t('rtInstalling')} ${skillDir}`);

    // Save patches if upgrading
    const oldManifest = loadManifest(skillDir);
    if (oldManifest.version) {
      log(`${cyan}[${label}]${reset} ${yellow}${t('rtUpgrading').replace('%s', oldManifest.version).replace('%s', VERSION)}${reset}`);
      saveLocalPatches(skillDir, oldManifest);
    }

    ensureDir(skillDir);
    copySkillFiles(skillDir, runtime);

    const manifest = generateManifest(skillDir, runtime, installId);
    saveManifest(skillDir, manifest);

    const missing = verifyInstallation(skillDir, runtime);
    if (missing) {
      const message = t('rtVerifyFail').replace('%s', missing.join(', '));
      log(`${cyan}[${label}]${reset} ${red}✗ ${message}${reset}`);
      throw new Error(message);
    }

    if (runtime === 'accio') {
      updateAccioSkillsConfig(skillDir, true);
      syncAccioAgentSkills(skillDir, true);
    }

    log(`${cyan}[${label}]${reset} ${green}✓ ${t('rtSuccess')}${reset}\n`);
    trackInstallerEvent('SkillInstallSucceeded', {
      install_id: installId,
      runtime,
      install_mode: installMode,
      custom_path_used: Boolean(customPath),
    });
  } catch (error) {
    trackInstallerEvent('SkillInstallFailed', {
      install_id: installId,
      runtime,
      install_mode: installMode,
      custom_path_used: Boolean(customPath),
      error_code: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
function resolveSkillDir(runtime, installMode, customPath) {
  try {
    return getSkillDir(runtime, installMode, customPath);
  } catch (error) {
    if (runtime === 'accio' && isAll) {
      log(`\n  ${yellow}Skipping Accio Work: ${error.message}${reset}`);
      return null;
    }
    throw error;
  }
}

// ─── Uninstall one runtime ────────────────────────────────────────────────────
function uninstallRuntime(runtime, installMode, customPath) {
  const skillDir = resolveSkillDir(runtime, installMode, customPath);
  if (!skillDir) return;
  if (!fs.existsSync(skillDir)) {
    log(`  ${yellow}${t('rtNotInstalled').replace('%s', skillDir)}${reset}`);
    return;
  }
  saveLocalPatches(skillDir, loadManifest(skillDir));
  fs.rmSync(skillDir, { recursive: true, force: true });
  if (runtime === 'accio') {
    updateAccioSkillsConfig(skillDir, false);
    syncAccioAgentSkills(skillDir, false);
  }
  log(`  ${green}✓ ${t('rtRemoved').replace('%s', skillDir)}${reset}`);
}

// ─── ASCII Art Logo ──────────────────────────────────────────────────────────
function printLogo() {
  console.log(`
${cyan}  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   ${yellow}█████╗ ${cyan}██╗  ██╗██╗  ██╗██╗    ${green}██████╗  ██████╗${cyan}  ║
  ║  ${yellow}██╔══██╗${cyan}██║ ██╔╝██║ ██╔╝██║   ${green}██╔════╝ ██╔═══██╗${cyan} ║
  ║  ${yellow}██║  ██║${cyan}█████╔╝ █████╔╝ ██║   ${green}██║  ███╗██║   ██║${cyan} ║
  ║  ${yellow}██║  ██║${cyan}██╔═██╗ ██╔═██╗ ██║   ${green}██║   ██║██║   ██║${cyan} ║
  ║  ${yellow}╚█████╔╝${cyan}██║  ██╗██║  ██╗██║   ${green}╚██████╔╝╚██████╔╝${cyan} ║
  ║   ${yellow}╚════╝ ${cyan}╚═╝  ╚═╝╚═╝  ╚═╝╚═╝    ${green}╚═════╝  ╚═════╝${cyan}  ║
  ║                                                   ║
  ║         ${reset}B2B Lead Prospecting & Outreach${cyan}           ║
  ║                ${yellow}Version ${VERSION}${cyan}                      ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝${reset}
  `);
}

// ─── Interactive prompt ───────────────────────────────────────────────────────
async function promptInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));

  printLogo();

  // Step 0: Language selection (default English)
  log(t('langPrompt'));
  log(`  ${t('langEn')}`);
  log(`  ${t('langZh')}`);
  const langChoice = (await ask(`\n${t('langChoose')}`)).trim();
  if (langChoice === '2') lang = 'zh';
  else lang = 'en';
  log('');

  log(`${cyan}${t('welcome')}${reset}`);
  log(`${t('welcomeDesc')}\n`);

  log(t('selectRuntime'));
  SUPPORTED_RUNTIMES.forEach((r, i) => log(`  ${i + 1}. ${runtimeLabel(r)}`));
  log(`  ${SUPPORTED_RUNTIMES.length + 1}. ${t('allRuntimes')}`);
  log(`  ${SUPPORTED_RUNTIMES.length + 2}. ${t('otherRuntime')}`);

  const choice = (await ask(`\n${t('enterNumber')}`)).trim();
  const num = parseInt(choice, 10);
  let runtimes;

  if (choice === 'all' || num === SUPPORTED_RUNTIMES.length + 1) {
    runtimes = [...SUPPORTED_RUNTIMES];
  } else if (choice === 'other' || num === SUPPORTED_RUNTIMES.length + 2) {
    const customName = (await ask(t('enterCustomName'))).trim();
    if (!customName) {
      log(`${red}${t('nameEmpty')}${reset}`);
      rl.close();
      process.exit(1);
    }
    runtimes = [customName];
    log(`${yellow}${t('customNote').replace('%s', customName).replace('%s', customName.toUpperCase())}${reset}\n`);
  } else if (num >= 1 && num <= SUPPORTED_RUNTIMES.length) {
    runtimes = [SUPPORTED_RUNTIMES[num - 1]];
  } else if (SUPPORTED_RUNTIMES.includes(choice)) {
    runtimes = [choice];
  } else {
    log(`${red}${t('invalidChoice')}${reset}`);
    rl.close();
    process.exit(1);
  }

  log('');
  log(`${cyan}${t('selectLocation')}${reset}`);
  log(`  ${green}${t('locDefault')}${reset}`);
  log(`${t('locDefaultDesc')}`);
  log(`                        ${yellow}~/.claude/skills/okki-go${reset}`);
  log(`  ${green}${t('locCurrent')}${reset}`);
  log(`${t('locCurrentDesc')}`);
  log(`                        ${yellow}./skills/okki-go${reset}`);
  log(`  ${green}${t('locCustom')}${reset}`);
  log(`${t('locCustomDesc')}\n`);

  const modeChoice = (await ask(t('chooseLocation'))).trim();
  let installMode = 'global';
  let customPath = null;

  if (modeChoice === '2') {
    installMode = 'local';
    log(`${yellow}${t('installingToCwd').replace('%s', process.cwd())}${reset}\n`);
  } else if (modeChoice === '3') {
    installMode = 'custom';
    customPath = (await ask(t('enterCustomPath'))).trim();
    if (!customPath) {
      log(`${red}${t('pathEmpty')}${reset}`);
      rl.close();
      process.exit(1);
    }
    customPath = expandTilde(customPath);
    log(`${yellow}${t('installTarget').replace('%s', path.join(customPath, 'skills', SKILL_NAME))}${reset}\n`);
  }

  rl.close();
  return { runtimes, installMode, customPath };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Windows platform notice
  if (process.platform === 'win32') {
    log(`${yellow}${t('windowsNote')}${reset}\n`);
  }

  // Interactive mode when no runtime flags given
  if (selectedRuntimes.length === 0 && !isUninstall) {
    const { runtimes, installMode, customPath } = await promptInteractive();
    printLogo();
    log(`${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    log(`${cyan}${t('installProgress')}${reset}\n`);
    for (const r of runtimes) installRuntime(r, installMode, customPath);
    log(`\n${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    log(`${green}✓ ${t('installComplete')}${reset}\n`);
    printNextSteps();
    await flushAnalytics();
    return;
  }

  let installMode = 'global';
  if (customBasePath) installMode = 'custom';
  else if (isLocal) installMode = 'local';

  if (!isGlobal && !isLocal && !customBasePath) {
    log(`${red}${t('errNoLocation')}${reset}`);
    printHelp();
    process.exit(1);
  }

  if (selectedRuntimes.length === 0) {
    log(`${red}${t('errNoRuntime')}${reset}`);
    printHelp();
    process.exit(1);
  }

  printLogo();
  log(`${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);

  if (isUninstall) {
    log(`${yellow}${t('uninstallingFrom').replace('%s', selectedRuntimes.length)}${reset}\n`);
  } else {
    log(`${cyan}${t('installingTo').replace('%s', selectedRuntimes.length)}${reset}\n`);
  }

  for (const r of selectedRuntimes) {
    if (isUninstall) uninstallRuntime(r, installMode, customBasePath);
    else             installRuntime(r, installMode, customBasePath);
  }

  log(`\n${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
  if (!isUninstall) {
    log(`${green}✓ ${t('installComplete')}${reset}\n`);
    printNextSteps();
  } else {
    log(`${green}✓ ${t('uninstallComplete')}${reset}`);
  }
  await flushAnalytics();
}

function printNextSteps() {
  log(`${cyan}${t('nextStepsTitle')}${reset}`);
  log(`${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}\n`);
  log(`${yellow}1.${reset} ${t('step1Title')}`);
  log(`   ${cyan}→${reset} ${t('step1Desc').replace('%s', `${green}https://go.okki.ai${reset}`).replace('%s', `${yellow}sk-xxx${reset}`)}\n`);
  log(`${yellow}2.${reset} ${t('step2Title')}`);
  log(`   ${cyan}→${reset} ${t('step2Desc')}`);
  log(`   ${cyan}→${reset} Platform secrets/config injection as ${green}OKKIGO_API_KEY${reset}`);
  log(`   ${cyan}→${reset} Accio Work account config: ${green}~/.accio/accounts/<accountId>/skills/skills_config.json${reset}`);
  log(`   ${cyan}→${reset} Environment variable: ${green}export OKKIGO_API_KEY="sk-xxx"${reset}`);
  log(`   ${cyan}→${reset} Local fallback: ${green}~/.config/okki-go/credentials.json${reset} with mode ${green}0600${reset}\n`);
  log(`${yellow}3.${reset} ${t('step3Title')}`);
  log(`   ${cyan}→${reset} ${t('step3Desc')}`);
  log(`      ${green}${t('step3Example')}${reset}\n`);
  log(`${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
  log(`${cyan}${t('docLabel')}${reset} https://docs.okki.ai`);
  log(`${cyan}${t('supportLabel')}${reset} support@okki.ai\n`);
}

function printHelp() {
  printLogo();
  console.log(`${cyan}Usage:${reset}
  node install.js [--global | --local | --path <dir>] [--claude] [--openclaw] [--cursor] ... [--all]
  node install.js --uninstall [--global | --local | --path <dir>] [--claude]

${cyan}Supported Runtimes:${reset}
  ${SUPPORTED_RUNTIMES.join(', ')}

${cyan}Custom Runtime:${reset}
  Use ${green}--custom=<name>${reset} to install to a custom runtime not in the list above.
  Example: ${green}node install.js --global --custom=myai${reset}

${cyan}Custom Path:${reset}
  Use ${green}--path /your/custom/base/path${reset} to install to a specific directory.
  Example: ${green}node install.js --claude --path /Users/name/my-config${reset}

  The installer will use ${yellow}<path>/skills/okki-go${reset} as the final target.
  Custom path cannot be used together with ${yellow}--global${reset} or ${yellow}--local${reset}.

${cyan}Examples:${reset}
  ${green}node install.js --global --claude${reset}
  ${green}node install.js --global --openclaw --cursor${reset}
  ${green}node install.js --global --accio${reset}
  ${green}node install.js --global --all${reset}
  ${green}node install.js --global --custom=myai${reset}
  ${green}node install.js --claude --path /Users/name/my-config${reset}
  ${green}node install.js --uninstall --global --openclaw${reset}

${cyan}Options:${reset}
  --global, -g      Install to runtime global config directory
  --local, -l       Install under current working directory
  --path <dir>      Install under a custom base directory
  --all             Install to all supported runtimes
  --custom=<name>   Install to a custom runtime
  --uninstall, -u   Uninstall from specified runtimes
  --help, -h        Show this help message
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

main().catch(async err => {
  log(`${red}Error: ${err.message}${reset}`);
  trackInstallerEvent('SkillInstallFailed', { error_code: err.message });
  await flushAnalytics();
  process.exit(1);
});
