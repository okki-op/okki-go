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

// ─── Terminal colors ──────────────────────────────────────────────────────────
const reset  = '\x1b[0m';
const red    = '\x1b[31m';
const green  = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan   = '\x1b[36m';

// ─── Skill metadata ───────────────────────────────────────────────────────────
const SKILL_NAME = 'okki-go';
const VERSION    = '1.0.6';

// Source directory: bin/ is sibling to skill/, so skill content lives at ../skill/
const SRC_DIR = path.resolve(__dirname, '..', 'skill');

// ─── Argument parsing ────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const isGlobal    = args.includes('--global') || args.includes('-g');
const isLocal     = args.includes('--local')  || args.includes('-l');
const isUninstall = args.includes('--uninstall') || args.includes('-u');
const isAll       = args.includes('--all');

const SUPPORTED_RUNTIMES = ['claude', 'openclaw', 'opencode', 'gemini', 'cursor', 'windsurf', 'codex', 'copilot', 'cline'];

let selectedRuntimes = [];
if (isAll) {
  selectedRuntimes = [...SUPPORTED_RUNTIMES];
} else {
  for (const r of SUPPORTED_RUNTIMES) {
    if (args.includes(`--${r}`)) selectedRuntimes.push(r);
  }
}

// ─── Path resolution (env vars → XDG → defaults) ────────────────────────────
function expandTilde(p) {
  if (p && p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function getGlobalDir(runtime) {
  switch (runtime) {
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

// Where skills live inside the config dir, and what the main file is called
function getSkillMeta(runtime) {
  switch (runtime) {
    case 'openclaw':
    case 'opencode':
      return { subdir: 'skills',   mainFile: 'SKILL.md' };
    case 'copilot':
      return { subdir: 'skills',   mainFile: 'instructions.md' };
    default: // claude, gemini, cursor, windsurf, codex, cline - all use skills/
      return { subdir: 'skills',   mainFile: 'skill.md' };
  }
}

function getSkillDir(runtime, isGlobal) {
  const base = isGlobal ? getGlobalDir(runtime) : process.cwd();
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

function generateManifest(skillDir, runtime) {
  const manifest = { version: VERSION, runtime, installedAt: new Date().toISOString(), files: {} };
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

  // 1. Main skill file: SKILL.md → skill.md / SKILL.md / instructions.md
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
function installRuntime(runtime, isGlobal) {
  const skillDir = getSkillDir(runtime, isGlobal);
  log(`\n  ${cyan}Installing okki-go → ${skillDir}${reset}`);

  // Save patches if upgrading
  const oldManifest = loadManifest(skillDir);
  if (oldManifest.version) {
    log(`  Upgrading v${oldManifest.version} → v${VERSION}`, yellow);
    saveLocalPatches(skillDir, oldManifest);
  }

  ensureDir(skillDir);
  copySkillFiles(skillDir, runtime);

  const manifest = generateManifest(skillDir, runtime);
  saveManifest(skillDir, manifest);

  const missing = verifyInstallation(skillDir, runtime);
  if (missing) {
    log(`  ${red}✗ Verification failed — missing: ${missing.join(', ')}${reset}`);
    process.exit(1);
  }

  log(`  ${green}✓ Done${reset}`);
}

// ─── Uninstall one runtime ────────────────────────────────────────────────────
function uninstallRuntime(runtime, isGlobal) {
  const skillDir = getSkillDir(runtime, isGlobal);
  if (!fs.existsSync(skillDir)) {
    log(`  ${yellow}Not installed: ${skillDir}${reset}`);
    return;
  }
  saveLocalPatches(skillDir, loadManifest(skillDir));
  fs.rmSync(skillDir, { recursive: true, force: true });
  log(`  ${green}✓ Removed ${skillDir}${reset}`);
}

// ─── Interactive prompt ───────────────────────────────────────────────────────
async function promptInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));

  log(`\n${cyan}Okki Go Skill Installer v${VERSION}${reset}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  log('Select runtime(s):');
  SUPPORTED_RUNTIMES.forEach((r, i) => log(`  ${i + 1}. ${r}`));
  log(`  ${SUPPORTED_RUNTIMES.length + 1}. all`);

  const choice = (await ask('\nChoose (number or name): ')).trim();
  const num = parseInt(choice, 10);
  let runtimes;
  if (choice === 'all' || num === SUPPORTED_RUNTIMES.length + 1) {
    runtimes = [...SUPPORTED_RUNTIMES];
  } else if (num >= 1 && num <= SUPPORTED_RUNTIMES.length) {
    runtimes = [SUPPORTED_RUNTIMES[num - 1]];
  } else if (SUPPORTED_RUNTIMES.includes(choice)) {
    runtimes = [choice];
  } else {
    log(`${red}Invalid choice${reset}`);
    rl.close();
    process.exit(1);
  }

  const modeAns = (await ask('Install globally? [Y/n]: ')).trim().toLowerCase();
  const global = modeAns !== 'n';

  rl.close();
  return { runtimes, global };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Windows platform notice
  if (process.platform === 'win32') {
    log(`${yellow}Note: Running on Windows. Shell scripts (.sh) will be copied but require WSL/Git Bash to execute.${reset}\n`);
  }

  // Interactive mode when no runtime flags given
  if (selectedRuntimes.length === 0 && !isUninstall) {
    const { runtimes, global: g } = await promptInteractive();
    log(`\n${cyan}Okki Go Skill Installer v${VERSION}${reset}`);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const r of runtimes) installRuntime(r, g);
    log(`\n${green}Installation complete!${reset}`);
    printNextSteps();
    return;
  }

  if (!isGlobal && !isLocal) {
    log(`${red}Error: specify --global or --local${reset}`);
    printHelp();
    process.exit(1);
  }

  if (selectedRuntimes.length === 0) {
    log(`${red}Error: specify at least one runtime (e.g. --claude, --openclaw, --all)${reset}`);
    printHelp();
    process.exit(1);
  }

  log(`\n${cyan}Okki Go Skill Installer v${VERSION}${reset}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const r of selectedRuntimes) {
    if (isUninstall) uninstallRuntime(r, isGlobal);
    else             installRuntime(r, isGlobal);
  }

  if (!isUninstall) {
    log(`\n${green}Installation complete!${reset}`);
    printNextSteps();
  } else {
    log(`\n${green}Uninstall complete!${reset}`);
  }
}

function printNextSteps() {
  log('\nNext steps:');
  log('  1. Configure your API Key:');
  log('     openclaw config set skills.entries.okkigo.apiKey "sk-xxx"');
  log('     (or visit https://go.okki.ai to get your key)\n');
}

function printHelp() {
  console.log(`
Okki Go Skill Installer v${VERSION}

Usage:
  node install.js [--global | --local] [--claude] [--openclaw] [--cursor] ... [--all]
  node install.js --uninstall --global --claude

Runtimes: ${SUPPORTED_RUNTIMES.join(', ')}

Examples:
  node install.js --global --claude
  node install.js --global --openclaw --cursor
  node install.js --global --all
  node install.js --uninstall --global --openclaw
`);
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

main().catch(err => {
  log(`${red}Error: ${err.message}${reset}`);
  process.exit(1);
});
