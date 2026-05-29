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
    checkInstallerRuntimeListPresent(okkiRoot),
    checkReleaseVersionConsistency(okkiRoot),
    checkCompanySearchPaginationGuardrail(okkiRoot)
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
    (skill.includes('three-tier credential resolution') || skill.includes('four-tier credential resolution')) &&
    skill.includes('platform config/secrets') &&
    skill.includes('OKKIGO_API_KEY') &&
    skill.includes('local credentials file') &&
    skill.includes('scripts/resolve-api-key.sh')
  ) {
    return pass('skill-credential-resolution-present');
  }

  return fail(
    'skill-credential-resolution-present',
    'skill must document credential resolution and include scripts/resolve-api-key.sh'
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

function checkReleaseVersionConsistency(okkiRoot) {
  const packageJson = readJson(path.join(okkiRoot, 'package.json'));
  const version = typeof packageJson.version === 'string' ? packageJson.version.trim() : '';
  if (!version) {
    return fail('release-version-consistency', 'package version must be set');
  }

  const references = [
    {
      file: 'skill/SKILL.md',
      ok: () => frontmatterVersion(readText(path.join(okkiRoot, 'skill', 'SKILL.md'))) === version
    },
    {
      file: 'bin/install.js',
      ok: () => hasQuotedAssignment(readText(path.join(okkiRoot, 'bin', 'install.js')), 'VERSION', version)
    },
    {
      file: 'skill/scripts/resolve-api-key.sh',
      ok: () => fileIncludes(path.join(okkiRoot, 'skill', 'scripts', 'resolve-api-key.sh'), `OKKIGO_SKILL_VERSION:-${version}`)
    },
    {
      file: 'skill/references/api-reference.md',
      ok: () => fileIncludes(path.join(okkiRoot, 'skill', 'references', 'api-reference.md'), `X-Okki-Skill-Version: ${version}`)
    },
    {
      file: 'README.md',
      ok: () => readText(path.join(okkiRoot, 'README.md')).includes(`**Current**: ${version}`)
    },
    {
      file: 'INSTALL.md',
      ok: () => readText(path.join(okkiRoot, 'INSTALL.md')).includes(`**当前版本**: ${version}`)
    }
  ];

  const mismatches = references
    .filter((reference) => !reference.ok())
    .map((reference) => reference.file);

  if (mismatches.length > 0) {
    return fail(
      'release-version-consistency',
      `release version references must match package version ${version}`,
      { files: mismatches }
    );
  }

  return pass('release-version-consistency');
}

function checkCompanySearchPaginationGuardrail(okkiRoot) {
  const discoveryPath = path.join(okkiRoot, 'skill', 'references', 'discovery-playbook.md');
  if (!fs.existsSync(discoveryPath)) {
    return fail(
      'company-search-pagination-guardrail',
      'skill must require free paginated company search for target_count above search-advanced page size'
    );
  }

  const discovery = readText(discoveryPath);

  if (
    discovery.includes('target_count > 50') &&
    discovery.includes('size: 50') &&
    discovery.includes('from: 0') &&
    discovery.includes('from: 50') &&
    discovery.includes('/contacts/search') &&
    discovery.includes('/companies/unlock') &&
    discovery.includes('company-count targets')
  ) {
    return pass('company-search-pagination-guardrail');
  }

  return fail(
    'company-search-pagination-guardrail',
    'skill must require free paginated company search for target_count above search-advanced page size'
  );
}

function fileIncludes(filePath, value) {
  return fs.existsSync(filePath) && readText(filePath).includes(value);
}

function frontmatterVersion(markdown) {
  const match = String(markdown || '').match(/^---\n[\s\S]*?^version:\s*([^\s]+)\s*$/m);
  return match ? match[1].trim() : null;
}

function hasQuotedAssignment(source, name, value) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*['"]${escapeRegex(value)}['"]`);
  return pattern.test(String(source || ''));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
