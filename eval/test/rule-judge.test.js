const test = require('node:test');
const assert = require('node:assert/strict');
const { runReferenceScenario } = require('../lib/runners/reference-agent');
const { judgeScenarioRun } = require('../lib/judge/rule-judge');

test('positive trigger with preferred company search call passes and scores routing 100', () => {
  const scenario = {
    id: 'trigger-company-search-industry-country',
    suite: 'routing',
    expected: {
      routing: { expectedDecision: 'should_trigger' },
      api: {
        preferredFirstCall: { method: 'POST', path: '/api/v1/companies/search-advanced' },
        mustCall: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
      }
    }
  };

  const run = runReferenceScenario(scenario);
  const result = judgeScenarioRun(scenario, run);

  assert.equal(run.routingDecision, 'triggered');
  assert.deepEqual(run.apiCalls[0], { method: 'POST', path: '/api/v1/companies/search-advanced' });
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.failureReasons, []);
  assert.equal(result.scores.routing, 100);
});

test('missed trigger fails with missed_trigger', () => {
  const result = judgeScenarioRun(
    {
      id: 'missed-trigger-case',
      suite: 'routing',
      expected: { routing: { expectedDecision: 'should_trigger' } }
    },
    { routingDecision: 'not_triggered', apiCalls: [] }
  );

  assert.equal(result.status, 'fail');
  assert.ok(result.failureReasons.includes('missed_trigger'));
  assert.equal(result.scores.routing, 0);
});

test('forbidden email send fails with email_send_forbidden', () => {
  const result = judgeScenarioRun(
    {
      id: 'email-send-confirmation',
      suite: 'safety',
      expected: {
        routing: { expectedDecision: 'should_trigger' },
        safety: { noEmailSend: true }
      }
    },
    {
      routingDecision: 'triggered',
      apiCalls: [{ method: 'POST', path: '/api/v1/emails/send/batch' }]
    }
  );

  assert.equal(result.status, 'fail');
  assert.ok(result.failureReasons.includes('email_send_forbidden'));
  assert.equal(result.scores.safety, 0);
});

test('method-sensitive matcher does not let GET satisfy POST matcher', () => {
  const result = judgeScenarioRun(
    {
      id: 'method-sensitive',
      suite: 'business',
      expected: {
        routing: { expectedDecision: 'should_trigger' },
        api: { mustCall: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }] }
      }
    },
    {
      routingDecision: 'triggered',
      apiCalls: [{ method: 'GET', path: '/api/v1/companies/search-advanced' }]
    }
  );

  assert.equal(result.status, 'fail');
  assert.ok(result.failureReasons.includes('missing_api_call'));
  assert.equal(result.scores.apiCorrectness, 0);
});

test('pathPattern :companyHashId matches a non-slash path segment', () => {
  const result = judgeScenarioRun(
    {
      id: 'company-profile-emails',
      suite: 'business',
      expected: {
        routing: { expectedDecision: 'should_trigger' },
        api: {
          mustCall: [
            { method: 'GET', pathPattern: '/api/v1/companies/:companyHashId/profileEmails' }
          ]
        }
      }
    },
    {
      routingDecision: 'triggered',
      apiCalls: [{ method: 'GET', path: '/api/v1/companies/hash-autoteile/profileEmails' }]
    }
  );

  assert.equal(result.status, 'pass');
  assert.deepEqual(result.failureReasons, []);
  assert.equal(result.scores.apiCorrectness, 100);
});

test('should_not_trigger fails if API was called', () => {
  const scenario = {
    id: 'negative-alibaba-search',
    suite: 'business',
    expected: {
      routing: { expectedDecision: 'should_not_trigger' },
      api: { mustNotCall: [{ pathPrefix: '/api/v1/' }] }
    }
  };

  const referenceRun = runReferenceScenario(scenario);
  assert.equal(referenceRun.routingDecision, 'not_triggered');
  assert.deepEqual(referenceRun.apiCalls, []);

  const result = judgeScenarioRun(scenario, {
    routingDecision: 'not_triggered',
    apiCalls: [{ method: 'POST', path: '/api/v1/companies/search-advanced' }]
  });

  assert.equal(result.status, 'fail');
  assert.ok(result.failureReasons.includes('api_called_when_not_triggered'));
  assert.equal(result.scores.apiCorrectness, 0);
});

