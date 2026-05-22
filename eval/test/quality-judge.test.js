const test = require('node:test');
const assert = require('node:assert/strict');
const { judgeQuality } = require('../lib/judge/quality-judge');
const { createManualReviewRecord, manualReviewRequiredFor } = require('../lib/judge/manual-review');
const { createLlmJudge } = require('../lib/judge/llm-judge');

test('judgeQuality awards business quality points from replay evidence', () => {
  const result = judgeQuality(
    {
      id: 'e2e-procurement-outreach',
      suite: 'business',
      expected: {
        businessQuality: {
          targetRoles: ['procurement', 'buyer'],
          emailMustReferenceCompanyContext: true,
          requireClearCTA: true,
          noFabricatedContacts: true
        }
      }
    },
    {
      output: [
        'Anna Schneider, Procurement Manager, anna.schneider@example.com',
        'AutoTeile Import GmbH imports brake parts and engine components.',
        'Could we schedule a 15-minute call next week?'
      ].join('\n'),
      fixtureEvidence: {
        companies: [{ company_name: 'AutoTeile Import GmbH', main_products: ['brake parts'] }],
        contacts: [{ name: 'Anna Schneider', title: 'Procurement Manager', email: 'anna.schneider@example.com' }]
      }
    }
  );

  assert.equal(result.score, 100);
  assert.deepEqual(result.failureReasons, []);
  assert.equal(result.dimensions.contactSelection, 100);
  assert.equal(result.dimensions.emailPersonalization, 100);
});

test('judgeQuality reports missing business evidence without failing non-business cases', () => {
  const routingQuality = judgeQuality(
    { id: 'routing-case', suite: 'routing', expected: {} },
    { output: '' }
  );
  assert.equal(routingQuality.score, null);
  assert.deepEqual(routingQuality.failureReasons, []);

  const businessQuality = judgeQuality(
    {
      id: 'weak-business-case',
      suite: 'business',
      expected: {
        businessQuality: {
          targetRoles: ['procurement'],
          emailMustReferenceCompanyContext: true
        }
      }
    },
    {
      output: 'Generic outreach draft.',
      fixtureEvidence: {
        companies: [{ company_name: 'AutoTeile Import GmbH' }],
        contacts: [{ name: 'Anna Schneider', title: 'Procurement Manager' }]
      }
    }
  );

  assert.equal(businessQuality.score, 50);
  assert.ok(businessQuality.failureReasons.includes('quality_missing_company_context'));
});

test('manual review is required for high-risk quality and safety results', () => {
  const qualityFailure = {
    caseId: 'quality-case',
    suite: 'business',
    status: 'failed',
    failureReasons: ['quality_possible_fabrication'],
    scores: { businessQuality: 40 }
  };
  assert.equal(manualReviewRequiredFor(qualityFailure, { mode: 'replay' }), true);

  const record = createManualReviewRecord(qualityFailure, { mode: 'replay', fixture: 'vertical-auto-parts-de' });
  assert.equal(record.caseId, 'quality-case');
  assert.equal(record.required, true);
  assert.equal(record.status, 'pending');
  assert.equal(record.reason, 'quality_possible_fabrication');

  assert.equal(
    manualReviewRequiredFor({ suite: 'routing', status: 'passed', failureReasons: [] }, { mode: 'replay' }),
    false
  );
});

test('createLlmJudge exposes a disabled default and pluggable evaluator', async () => {
  const disabled = createLlmJudge();
  assert.deepEqual(await disabled.evaluate({ output: 'draft' }), {
    status: 'skipped',
    reason: 'llm_judge_not_configured'
  });

  const judge = createLlmJudge({
    evaluate: async (input) => ({ status: 'passed', score: input.output.length })
  });
  assert.deepEqual(await judge.evaluate({ output: 'abc' }), {
    status: 'passed',
    score: 3
  });
});
