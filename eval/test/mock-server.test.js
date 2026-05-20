const test = require('node:test');
const assert = require('node:assert/strict');
const { createMockServer } = require('../lib/api/mock-server');

test('mock server returns company search results and records request', async () => {
  const server = await createMockServer().start();
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/companies/search-advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'ApiKey sk-test' },
      body: JSON.stringify({ includeCountry: ['DE'], productKeywords: ['auto parts'] })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 2);
    assert.equal(server.recorder.requests.length, 1);
    assert.equal(server.recorder.requests[0].path, '/api/v1/companies/search-advanced');
  } finally {
    await server.stop();
  }
});

test('mock server returns insufficient credits when requested', async () => {
  const server = await createMockServer({ errorMode: 'insufficient-credits' }).start();
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/contacts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'ApiKey sk-test' },
      body: JSON.stringify({ title: 'VP Sales' })
    });
    const body = await response.json();
    assert.equal(response.status, 402);
    assert.equal(body.type, 'https://go.okki.ai/errors/insufficient-credits');
  } finally {
    await server.stop();
  }
});
