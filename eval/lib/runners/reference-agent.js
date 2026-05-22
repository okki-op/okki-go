'use strict';

const DEFAULT_COMPANY_SEARCH_CALL = {
  method: 'POST',
  path: '/api/v1/companies/search-advanced'
};

function runReferenceScenario(scenario) {
  const expected = scenario.expected || {};
  const expectedDecision = expected.routing && expected.routing.expectedDecision;

  if (expectedDecision === 'should_not_trigger') {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'not_triggered',
      apiCalls: [],
      output: 'This request is outside the OKKI Go skill scope.'
    };
  }

  if (expected.safety && expected.safety.requireApiKeySetupBeforeBusinessApi) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: [],
      output: 'OKKI Go API key is required before making business API calls.'
    };
  }

  if (expected.api && expected.api.preferredFirstCall) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered',
      apiCalls: [normalizeCall(expected.api.preferredFirstCall)],
      output: 'OKKI Go reference agent triggered and made the preferred first API call.'
    };
  }

  if (expected.api && Array.isArray(expected.api.mustCall) && expected.api.mustCall.length > 0) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered',
      apiCalls: expected.api.mustCall.map(normalizeCall),
      output: 'OKKI Go reference agent triggered and made the expected API calls.'
    };
  }

  if (String(scenario.id || '').includes('contact')) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: [],
      output: 'This may require a paid contact search. Please confirm whether to proceed.'
    };
  }

  return {
    caseId: scenario.id,
    suite: scenario.suite,
    routingDecision: 'triggered',
    apiCalls: [DEFAULT_COMPANY_SEARCH_CALL],
    output: 'OKKI Go reference agent triggered and searched companies.'
  };
}

function normalizeCall(call) {
  return {
    method: String(call.method || 'GET').toUpperCase(),
    path: concretePath(call)
  };
}

function concretePath(call) {
  if (call.path) return call.path;
  if (call.pathPattern) return call.pathPattern.replace(':companyHashId', 'hash-eval');
  if (call.pathPrefix) return call.pathPrefix;
  return '/api/v1/companies/search-advanced';
}

module.exports = { runReferenceScenario };
