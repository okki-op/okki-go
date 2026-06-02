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
  const behaviorSet = new Set(behaviorEvents);

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

  if (shouldStopAtPmfGate(scenario, behaviorSet, expected)) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered_pending_prerequisite',
      apiCalls: [],
      behaviorEvents,
      output: outputWithBehavior(
        '为了让潜客更匹配你的产品和服务能力，请先提供公司官网或 product page；也可以明确回复“跳过”做粗搜。',
        behaviorEvents
      )
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

  if (hasTargetSidePlan(behaviorSet, expected)) {
    return {
      caseId: scenario.id,
      suite: scenario.suite,
      routingDecision: 'triggered',
      apiCalls: [targetSideSearchCallFor(scenario, expected)],
      behaviorEvents,
      output: outputWithBehavior(
        'OKKI Go reference agent built a PMF brief, query plan portfolio, and target-side projected search payload.',
        behaviorEvents
      )
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

function shouldStopAtPmfGate(scenario, behaviorSet, expected) {
  if (!behaviorSet.has('pmf_gate_profile_insufficient')) return false;
  if (!behaviorSet.has('pmf_gate_website_prompted') && !behaviorSet.has('profile_extraction_confirmation_requested')) return false;
  if (behaviorSet.has('rough_search_after_explicit_skip')) return false;
  if (behaviorSet.has('profile_extraction_confirmed')) return false;
  if (behaviorSet.has('query_plan_portfolio_built')) return false;
  return expectedForbidsCompanySearch(expected) || String(scenario.id || '').includes('pmf-gate');
}

function expectedForbidsCompanySearch(expected) {
  return Boolean(expected.api && Array.isArray(expected.api.mustNotCall) && expected.api.mustNotCall.some((call) => {
    return String(call.method || '').toUpperCase() === 'POST' &&
      (call.path || call.pathPattern || call.pathPrefix) === '/api/v1/companies/search-advanced';
  }));
}

function hasTargetSidePlan(behaviorSet, expected) {
  return behaviorSet.has('query_plan_portfolio_built') ||
    behaviorSet.has('target_side_projection_built') ||
    hasBodyMatcher(expected);
}

function hasBodyMatcher(expected) {
  return Boolean(expected.api && Array.isArray(expected.api.mustCall) && expected.api.mustCall.some((call) => call.body));
}

function targetSideSearchCallFor(scenario, expected) {
  const bodyMatcher = firstCompanySearchBodyMatcher(expected);
  const id = String(scenario.id || '');
  if (id.includes('recovery')) return withBody(DEFAULT_COMPANY_SEARCH_CALL, recoveryPayload());
  if (id.includes('skip-rough')) return withBody(DEFAULT_COMPANY_SEARCH_CALL, roughSearchPayload(bodyMatcher));
  if (id.includes('profile-confirmed')) return withBody(DEFAULT_COMPANY_SEARCH_CALL, automotiveAftermarketPayload());
  if (id.includes('door-lock')) return withBody(DEFAULT_COMPANY_SEARCH_CALL, doorLockChannelPayload());
  return withBody(DEFAULT_COMPANY_SEARCH_CALL, payloadFromMatcher(bodyMatcher));
}

function firstCompanySearchBodyMatcher(expected) {
  const calls = expected.api && Array.isArray(expected.api.mustCall) ? expected.api.mustCall : [];
  const companySearch = calls.find((call) => {
    return String(call.method || '').toUpperCase() === 'POST' &&
      (call.path || call.pathPattern || call.pathPrefix) === '/api/v1/companies/search-advanced' &&
      call.body;
  });
  return companySearch ? companySearch.body : null;
}

function payloadFromMatcher(bodyMatcher) {
  return {
    ...(bodyMatcher && bodyMatcher.include ? bodyMatcher.include : {}),
    from: 0,
    size: 50
  };
}

function withBody(call, body) {
  return {
    ...call,
    body
  };
}

function roughSearchPayload(bodyMatcher) {
  return {
    ...payloadFromMatcher(bodyMatcher),
    includeCountry: ['DE'],
    industryKeywords: ['automotive aftermarket'],
    crossFieldOperator: 'and',
    from: 0,
    size: 50
  };
}

function automotiveAftermarketPayload() {
  return {
    includeCountry: ['DE'],
    productKeywords: ['auto spare parts', 'automotive aftermarket'],
    companyTypeKeywords: ['importer', 'distributor', 'wholesaler'],
    industryKeywords: ['automotive aftermarket'],
    crossFieldOperator: 'and',
    from: 0,
    size: 50
  };
}

function doorLockChannelPayload() {
  return {
    includeCountry: ['DE'],
    productKeywords: ['door hardware', 'building hardware', 'architectural hardware'],
    companyTypeKeywords: ['importer', 'distributor', 'wholesaler'],
    industryKeywords: ['construction materials'],
    crossFieldOperator: 'and',
    from: 0,
    size: 50
  };
}

function recoveryPayload() {
  return {
    includeCountry: ['DE'],
    productKeywords: ['architectural hardware', 'building hardware'],
    companyTypeKeywords: ['importer', 'distributor', 'wholesaler'],
    industryKeywords: ['construction materials'],
    crossFieldOperator: 'and',
    from: 0,
    size: 50
  };
}

function normalizeCall(call) {
  return {
    method: String(call.method || 'GET').toUpperCase(),
    path: concretePath(call),
    ...(call.body ? { body: call.body } : {})
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
