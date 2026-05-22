const test = require('node:test');
const assert = require('node:assert/strict');
const { createCapturePlan } = require('../lib/fixtures/capture');

test('createCapturePlan blocks real API capture unless explicitly allowed', () => {
  assert.throws(
    () => createCapturePlan({ scenario: 'vertical-auto-parts-de' }),
    /fixtures capture requires --allow-real-api/
  );
});

test('createCapturePlan blocks email sends by default', () => {
  const plan = createCapturePlan({
    scenario: 'vertical-auto-parts-de',
    allowRealApi: true,
    maxPaidCredits: 5
  });

  assert.equal(plan.mode, 'fixture-capture');
  assert.equal(plan.scenario, 'vertical-auto-parts-de');
  assert.equal(plan.maxPaidCredits, 5);
  assert.equal(plan.allowEmailSend, false);
  assert.equal(plan.maxEdmSends, 0);
  assert.deepEqual(plan.emailAllowlist, []);
});

test('createCapturePlan requires allowlist and positive send budget when email send is enabled', () => {
  assert.throws(
    () => createCapturePlan({
      scenario: 'email-smoke',
      allowRealApi: true,
      allowEmailSend: true,
      maxEdmSends: 1
    }),
    /--email-allowlist is required/
  );

  assert.throws(
    () => createCapturePlan({
      scenario: 'email-smoke',
      allowRealApi: true,
      allowEmailSend: true,
      emailAllowlist: ['test@example.com']
    }),
    /--max-edm-sends must be greater than 0/
  );

  const plan = createCapturePlan({
    scenario: 'email-smoke',
    allowRealApi: true,
    allowEmailSend: true,
    emailAllowlist: ['test@example.com'],
    maxEdmSends: 1
  });
  assert.equal(plan.allowEmailSend, true);
  assert.deepEqual(plan.emailAllowlist, ['test@example.com']);
});
