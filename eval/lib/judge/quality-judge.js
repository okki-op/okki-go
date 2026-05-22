'use strict';

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function judgeQuality(scenario, run) {
  const expectedQuality = scenario.expected && scenario.expected.businessQuality;
  if (scenario.suite !== 'business' || !expectedQuality) {
    return { score: null, dimensions: {}, failureReasons: [] };
  }

  const checks = [];
  const output = String(run.output || '');
  const evidence = run.fixtureEvidence || {};

  if (Array.isArray(expectedQuality.targetRoles) && expectedQuality.targetRoles.length > 0) {
    checks.push(checkTargetRoles(expectedQuality.targetRoles, output, evidence));
  }

  if (expectedQuality.emailMustReferenceCompanyContext || expectedQuality.shouldReferenceCompanyContext) {
    checks.push(checkCompanyContext(output, evidence));
  }

  if (expectedQuality.requireClearCTA) {
    checks.push(checkClearCta(output));
  }

  if (expectedQuality.noFabricatedContacts) {
    checks.push(checkFabricatedContacts(output, evidence));
  }

  if (checks.length === 0) {
    return { score: null, dimensions: {}, failureReasons: [] };
  }

  const dimensions = {};
  const failureReasons = [];
  for (const check of checks) {
    dimensions[check.dimension] = check.passed ? 100 : 0;
    if (!check.passed) failureReasons.push(check.reason);
  }

  const passed = checks.filter((check) => check.passed).length;
  return {
    score: Math.round((passed / checks.length) * 100),
    dimensions,
    failureReasons
  };
}

function checkTargetRoles(targetRoles, output, evidence) {
  const haystack = [
    output,
    ...contacts(evidence).flatMap((contact) => [contact.title, contact.name])
  ].join(' ').toLowerCase();
  const passed = targetRoles.some((role) => haystack.includes(String(role).toLowerCase()));
  return {
    dimension: 'contactSelection',
    passed,
    reason: 'quality_missing_target_role'
  };
}

function checkCompanyContext(output, evidence) {
  const outputLower = output.toLowerCase();
  const companySignals = companies(evidence).flatMap((company) => {
    return [
      company.company_name,
      company.name,
      company.domain,
      ...(Array.isArray(company.main_products) ? company.main_products : []),
      ...(Array.isArray(company.industry) ? company.industry : [])
    ];
  }).filter(Boolean);

  const passed = companySignals.some((signal) => outputLower.includes(String(signal).toLowerCase()));
  return {
    dimension: 'emailPersonalization',
    passed,
    reason: 'quality_missing_company_context'
  };
}

function checkClearCta(output) {
  const outputLower = output.toLowerCase();
  const passed = [
    'call',
    'meeting',
    'schedule',
    'reply',
    'next week',
    '15-minute',
    '15 minute'
  ].some((signal) => outputLower.includes(signal)) || output.includes('?');

  return {
    dimension: 'nextStepQuality',
    passed,
    reason: 'quality_missing_clear_cta'
  };
}

function checkFabricatedContacts(output, evidence) {
  const allowedEmails = new Set(contacts(evidence).map((contact) => String(contact.email || '').toLowerCase()).filter(Boolean));
  const outputEmails = output.match(EMAIL_PATTERN) || [];
  const fabricated = outputEmails.some((email) => !allowedEmails.has(email.toLowerCase()));
  return {
    dimension: 'factuality',
    passed: !fabricated,
    reason: 'quality_possible_fabrication'
  };
}

function companies(evidence) {
  return Array.isArray(evidence.companies) ? evidence.companies : [];
}

function contacts(evidence) {
  return Array.isArray(evidence.contacts) ? evidence.contacts : [];
}

module.exports = { judgeQuality };
