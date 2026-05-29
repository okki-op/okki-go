'use strict';

const DEFAULT_COMPANY_SEARCH_CALL = {
  method: 'POST',
  path: '/api/v1/companies/search-advanced'
};

function runReferenceScenario(scenario) {
  const expected = scenario.expected || {};
  const expectedDecision = expected.routing && expected.routing.expectedDecision;
  const behaviorEvents = expected.behavior && Array.isArray(expected.behavior.mustEmit)
    ? expected.behavior.mustEmit.slice()
    : [];

  if (expectedDecision === 'should_not_trigger') {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'not_triggered',
      apiCalls: [],
      behaviorEvents,
      output: 'This request is outside the OKKI Go skill scope.'
    };
  }

  if (expected.safety && expected.safety.requireApiKeySetupBeforeBusinessApi) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: [],
      behaviorEvents,
      output: 'OKKI Go API key is required before making business API calls.'
    };
  }

  if (expected.api && Array.isArray(expected.api.mustNotCallBeforeConfirmation) && expected.api.mustNotCallBeforeConfirmation.length > 0) {
    const preConfirmationCalls = expected.api.mustCall ? expected.api.mustCall.map(normalizeCall) : [];
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: preConfirmationCalls,
      preConfirmationApiCalls: preConfirmationCalls,
      behaviorEvents,
      output: outputWithBehavior('OKKI Go reference agent stopped before paid or send actions that need confirmation.', behaviorEvents)
    };
  }

  if (expected.api && expected.api.preferredFirstCall) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered',
      apiCalls: [normalizeCall(expected.api.preferredFirstCall)],
      behaviorEvents,
      output: outputWithBehavior('OKKI Go reference agent triggered and made the preferred first API call.', behaviorEvents)
    };
  }

  if (expected.api && Array.isArray(expected.api.mustCall) && expected.api.mustCall.length > 0) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered',
      apiCalls: expected.api.mustCall.map(normalizeCall),
      behaviorEvents,
      output: outputWithBehavior('OKKI Go reference agent triggered and made the expected API calls.', behaviorEvents)
    };
  }

  if (String(scenario.id || '').includes('contact')) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: [],
      behaviorEvents,
      output: outputWithBehavior('This may require a paid contact search. Please confirm whether to proceed.', behaviorEvents)
    };
  }

  return {
    caseId: scenario.id,
    suite: scenario.suite,
    routingDecision: 'triggered',
    apiCalls: [DEFAULT_COMPANY_SEARCH_CALL],
    behaviorEvents,
    output: outputWithBehavior('OKKI Go reference agent triggered and searched companies.', behaviorEvents)
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

function outputWithBehavior(message, behaviorEvents) {
  if (!Array.isArray(behaviorEvents) || behaviorEvents.length === 0) return message;
  return [
    message,
    ...behaviorEvents.map((event) => `BEHAVIOR: ${event}`)
  ].join('\n');
}

module.exports = { runReferenceScenario };
