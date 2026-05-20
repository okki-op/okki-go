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

test('profile emails only matches exact company profile emails route', async () => {
  const server = await createMockServer().start();
  try {
    const valid = await fetch(`${server.baseUrl}/api/v1/companies/hash-autoteile/profileEmails`);
    const validBody = await valid.json();
    assert.equal(valid.status, 200);
    assert.equal(validBody.total, 1);

    const invalid = await fetch(`${server.baseUrl}/api/v1/not-companies/hash-autoteile/profileEmails`);
    const invalidBody = await invalid.json();
    assert.equal(invalid.status, 404);
    assert.equal(invalidBody.type, 'not-found');
  } finally {
    await server.stop();
  }
});

test('mock server returns personalized email send task list', async () => {
  const server = await createMockServer().start();
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/emails/send/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: [{ email: 'anna.schneider@example.com', name: 'Anna Schneider' }],
        subject: 'Parts sourcing',
        template: 'Hello {{name}}'
      })
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.total, 1);
    assert.ok(Array.isArray(body.tasks));
    assert.equal(body.tasks.length, 1);
    assert.equal(body.tasks[0].status, 'pending');
  } finally {
    await server.stop();
  }
});

test('start rejects when mock server is already started and stop is idempotent', async () => {
  const server = createMockServer();
  await server.start();
  try {
    await assert.rejects(() => server.start(), /Mock server already started/);
  } finally {
    await server.stop();
    await server.stop();
  }
});

test('mock server returns 400 for invalid JSON request bodies', async () => {
  const server = await createMockServer().start();
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/contacts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":'
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.type, 'invalid-json');
  } finally {
    await server.stop();
  }
});

test('insufficient credit responses are method-sensitive and configurable by path', async () => {
  const server = await createMockServer({
    errorMode: 'insufficient-credits',
    insufficientCreditPaths: ['/api/v1/companies/unlock']
  }).start();
  try {
    const wrongMethod = await fetch(`${server.baseUrl}/api/v1/companies/unlock`);
    assert.equal(wrongMethod.status, 404);

    const unpaidPath = await fetch(`${server.baseUrl}/api/v1/contacts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'VP Sales' })
    });
    assert.equal(unpaidPath.status, 200);

    const paidPath = await fetch(`${server.baseUrl}/api/v1/companies/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'autoteile.example' })
    });
    const body = await paidPath.json();
    assert.equal(paidPath.status, 402);
    assert.equal(body.instance, '/api/v1/companies/unlock');
  } finally {
    await server.stop();
  }
});

test('recorder includes query, selected headers, response status, and response body', async () => {
  const server = await createMockServer().start();
  try {
    const response = await fetch(`${server.baseUrl}/api/v1/emails/tasks?page=2&page_size=5`, {
      headers: {
        Authorization: 'ApiKey sk-test',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Ignored': 'secret'
      }
    });
    const body = await response.json();
    assert.equal(response.status, 200);

    const entry = server.recorder.requests.at(-1);
    assert.deepEqual(entry.query, { page: '2', page_size: '5' });
    assert.deepEqual(entry.headers, {
      authorization: 'ApiKey sk-test',
      accept: 'application/json',
      'content-type': 'application/json'
    });
    assert.equal(entry.responseStatus, 200);
    assert.deepEqual(entry.responseBody, body);
  } finally {
    await server.stop();
  }
});
