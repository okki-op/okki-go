'use strict';

const http = require('node:http');

const JSON_BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const EMAIL_SEND_PATHS = new Set([
  '/api/v1/emails/send/batch',
  '/api/v1/emails/send/personalized'
]);

function createReplayServer(options = {}) {
  const fixture = options.fixture;
  if (!fixture || !fixture.name) throw new Error('createReplayServer requires a replay fixture');

  const recorder = createRecorder();
  let server;
  let baseUrl;

  async function handler(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const recorderEntry = {
      mode: 'replay',
      fixture: fixture.name,
      method: req.method,
      path: url.pathname,
      query: queryObject(url.searchParams),
      headers: selectedHeaders(req.headers)
    };

    try {
      recorderEntry.body = JSON_BODY_METHODS.has(req.method) ? await readBody(req) : null;
    } catch (error) {
      sendRecordedJson(res, recorderEntry, 400, {
        type: 'invalid-json',
        title: 'Bad Request',
        status: 400,
        detail: error.message,
        instance: url.pathname
      });
      recorder.record(recorderEntry);
      return;
    }

    if (EMAIL_SEND_PATHS.has(url.pathname)) {
      sendRecordedJson(res, recorderEntry, 403, {
        type: 'replay-email-send-disabled',
        title: 'Replay Email Send Disabled',
        status: 403,
        detail: 'Replay mode never sends email.',
        instance: url.pathname
      });
      recorder.record(recorderEntry);
      return;
    }

    const responseBody = responseFor(req.method, url.pathname, fixture.payloads);
    if (responseBody) {
      sendRecordedJson(res, recorderEntry, 200, responseBody);
      recorder.record(recorderEntry);
      return;
    }

    sendRecordedJson(res, recorderEntry, 404, {
      type: 'replay-not-found',
      title: 'Replay Fixture Response Not Found',
      status: 404,
      instance: url.pathname
    });
    recorder.record(recorderEntry);
  }

  return {
    recorder,
    get baseUrl() {
      return baseUrl;
    },
    async start() {
      if (server) throw new Error('Replay server already started');
      server = http.createServer(handler);
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      return this;
    },
    async stop() {
      if (!server) return;
      await new Promise((resolve) => server.close(resolve));
      server = null;
      baseUrl = undefined;
    }
  };
}

function responseFor(method, pathname, payloads) {
  if (method === 'GET' && pathname === '/api/v1/credit/balance') return payloads['balance-before'];
  if (method === 'POST' && pathname === '/api/v1/companies/search-advanced') return payloads['companies-search'];
  if (method === 'POST' && pathname === '/api/v1/companies/unlock') return payloads['unlock-results'];
  if (method === 'GET' && /^\/api\/v1\/companies\/[^/]+\/profileEmails$/.test(pathname)) {
    return payloads['profile-emails'];
  }
  if (method === 'POST' && pathname === '/api/v1/contacts/search') return payloads['contacts-search'];
  if (method === 'GET' && pathname === '/api/v1/emails/tasks') return payloads['email-tasks'];
  return null;
}

function createRecorder() {
  return {
    requests: [],
    record(entry) {
      this.requests.push({ timestamp: new Date().toISOString(), ...entry });
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('error', reject);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendRecordedJson(res, recorderEntry, status, data) {
  recorderEntry.responseStatus = status;
  recorderEntry.responseBody = data;
  sendJson(res, status, data);
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function selectedHeaders(headers) {
  const selected = {};
  for (const name of ['authorization', 'content-type', 'accept']) {
    if (headers[name]) selected[name] = headers[name];
  }
  return selected;
}

function queryObject(searchParams) {
  const query = {};
  for (const [key, value] of searchParams) query[key] = value;
  return query;
}

module.exports = { createReplayServer };
