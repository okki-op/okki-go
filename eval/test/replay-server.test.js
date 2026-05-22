const test = require('node:test');
const assert = require('node:assert/strict');
const { createReplayServer } = require('../lib/api/replay-server');
const { loadReplayFixture } = require('../lib/fixtures/loader');

test('replay server serves fixed fixture responses and records requests', async (t) => {
  const fixture = loadReplayFixture('vertical-auto-parts-de');
  const server = await createReplayServer({ fixture }).start();
  t.after(() => server.stop());

  const searchResponse = await fetch(`${server.baseUrl}/api/v1/companies/search-advanced`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ country_codes: 'DE', keywords: 'automotive parts' })
  });
  assert.equal(searchResponse.status, 200);
  const searchBody = await searchResponse.json();
  assert.equal(searchBody.total, 2);

  const emailsResponse = await fetch(`${server.baseUrl}/api/v1/companies/hash-autoteile/profileEmails`);
  assert.equal(emailsResponse.status, 200);
  const emailsBody = await emailsResponse.json();
  assert.equal(emailsBody.emails[0].email, 'anna.schneider@example.com');

  assert.equal(server.recorder.requests.length, 2);
  assert.equal(server.recorder.requests[0].mode, 'replay');
  assert.equal(server.recorder.requests[0].fixture, 'vertical-auto-parts-de');
  assert.deepEqual(server.recorder.requests[0].body, {
    country_codes: 'DE',
    keywords: 'automotive parts'
  });
});

test('replay server blocks email send endpoints', async (t) => {
  const fixture = loadReplayFixture('vertical-auto-parts-de');
  const server = await createReplayServer({ fixture }).start();
  t.after(() => server.stop());

  const response = await fetch(`${server.baseUrl}/api/v1/emails/send/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipients: [{ email: 'buyer@example.com' }] })
  });

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.type, 'replay-email-send-disabled');
  assert.equal(server.recorder.requests[0].responseStatus, 403);
});
