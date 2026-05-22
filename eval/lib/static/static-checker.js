'use strict';

const fs = require('fs');
const path = require('path');
const { fromOkkiRoot } = require('../core/paths');
const { readJson, readText } = require('../core/fs-utils');
const { fail, pass, warn } = require('../core/result');

function runStaticChecks(options = {}) {
  const okkiRoot = options.okkiRoot || fromOkkiRoot();

  return [
    checkPackageFilesExcludeEval(okkiRoot),
    checkSkillRoutingAndEnvPresent(okkiRoot),
    checkSkillCredentialResolutionPresent(okkiRoot),
    checkDocsLegacyRuntimeFlag(okkiRoot),
    checkInstallerRuntimeListPresent(okkiRoot)
  ];
}

function checkPackageFilesExcludeEval(okkiRoot) {
  const packageJson = readJson(path.join(okkiRoot, 'package.json'));
  if (!Array.isArray(packageJson.files)) {
    return fail('package-files-exclude-eval', 'package files must explicitly exclude eval/');
  }

  const hasUnsafeEntry = packageJson.files.some((entry) => canIncludeEval(entry));

  if (hasUnsafeEntry) {
    return fail('package-files-exclude-eval', 'package files must not include eval/');
  }

  return pass('package-files-exclude-eval');
}

function canIncludeEval(entry) {
  if (typeof entry !== 'string') return false;
  const normalized = entry.replace(/\\/g, '/').replace(/\/+$/, '').replace(/^\.\//, '');
  return normalized === 'eval' ||
    normalized.startsWith('eval/') ||
    normalized === '.' ||
    normalized === '*' ||
    normalized === '**';
}

function checkSkillRoutingAndEnvPresent(okkiRoot) {
  const skill = readText(path.join(okkiRoot, 'skill', 'SKILL.md'));

  if (skill.includes('OKKIGO_API_KEY') && skill.includes('Do NOT use this skill')) {
    return pass('skill-routing-and-env-present');
  }

  return fail(
    'skill-routing-and-env-present',
    'skill must include OKKIGO_API_KEY and routing boundary text'
  );
}

function checkSkillCredentialResolutionPresent(okkiRoot) {
  const skill = readText(path.join(okkiRoot, 'skill', 'SKILL.md'));
  const resolverPath = path.join(okkiRoot, 'skill', 'scripts', 'resolve-api-key.sh');

  if (
    fs.existsSync(resolverPath) &&
    skill.includes('three-tier credential resolution') &&
    skill.includes('platform config/secrets') &&
    skill.includes('OKKIGO_API_KEY') &&
    skill.includes('local credentials file') &&
    skill.includes('scripts/resolve-api-key.sh')
  ) {
    return pass('skill-credential-resolution-present');
  }

  return fail(
    'skill-credential-resolution-present',
    'skill must document three-tier credential resolution and include scripts/resolve-api-key.sh'
  );
}

function checkDocsLegacyRuntimeFlag(okkiRoot) {
  const docs = getDocumentationFiles(okkiRoot);
  const files = docs
    .filter((filePath) => readText(filePath).includes('--runtime='))
    .map((filePath) => toRelativePath(okkiRoot, filePath));

  if (files.length > 0) {
    return warn('docs-legacy-runtime-flag', 'documentation references legacy --runtime= flag', {
      files
    });
  }

  return pass('docs-legacy-runtime-flag');
}

function checkInstallerRuntimeListPresent(okkiRoot) {
  const installScript = readText(path.join(okkiRoot, 'bin', 'install.js'));

  if (
    installScript.includes('SUPPORTED_RUNTIMES') &&
    installScript.includes('codex') &&
    installScript.includes('accio')
  ) {
    return pass('installer-runtime-list-present');
  }

  return fail(
    'installer-runtime-list-present',
    'installer must include SUPPORTED_RUNTIMES, codex, and accio'
  );
}

function getDocumentationFiles(okkiRoot) {
  const files = [
    path.join(okkiRoot, 'README.md'),
    path.join(okkiRoot, 'INSTALL.md')
  ];
  const docsDir = path.join(okkiRoot, 'docs');

  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => path.join(docsDir, entry));
    files.push(...docFiles);
  }

  return files;
}

function toRelativePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

module.exports = { runStaticChecks };
