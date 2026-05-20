'use strict';

const http = require('http');

const JSON_BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const DEFAULT_BODY_LIMIT_BYTES = 1024 * 1024;
const INSUFFICIENT_CREDIT_METHODS = {
  '/api/v1/contacts/search': 'POST',
  '/api/v1/companies/unlock': 'POST'
};

function readBody(req, limitBytes = DEFAULT_BODY_LIMIT_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodyBytes = 0;
    req.on('data', (chunk) => {
      bodyBytes += chunk.length;
      if (bodyBytes > limitBytes) {
        reject(Object.assign(new Error('Request body too large'), { status: 413, type: 'body-too-large' }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('error', (error) => {
      reject(Object.assign(error, { status: 400, type: 'request-error' }));
    });
    req.on('aborted', () => {
      reject(Object.assign(new Error('Request aborted'), { status: 400, type: 'request-aborted' }));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400, type: 'invalid-json' }));
      }
    });
  });
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
  for (const [key, value] of searchParams) {
    query[key] = value;
  }
  return query;
}

function sendRecordedJson(res, recorderEntry, status, data) {
  recorderEntry.responseStatus = status;
  recorderEntry.responseBody = data;
  sendJson(res, status, data);
}

function createRecorder() {
  return {
    requests: [],
    record(entry) {
      this.requests.push({ timestamp: new Date().toISOString(), ...entry });
    }
  };
}

function insufficientCredits(path) {
  return {
    type: 'https://go.okki.ai/errors/insufficient-credits',
    title: 'Payment Required',
    status: 402,
    detail: 'Insufficient points balance. Required: 1, Available: 0',
    instance: path
  };
}

function createMockServer(options = {}) {
  const recorder = createRecorder();
  const bodyLimitBytes = options.bodyLimitBytes || DEFAULT_BODY_LIMIT_BYTES;
  let server;
  let baseUrl;

  async function handler(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const recorderEntry = {
      method: req.method,
      path: url.pathname,
      query: queryObject(url.searchParams),
      headers: selectedHeaders(req.headers)
    };
    let body = null;

    try {
      body = JSON_BODY_METHODS.has(req.method) ? await readBody(req, bodyLimitBytes) : null;
      recorderEntry.body = body;
    } catch (error) {
      const status = error.status || 400;
      const responseBody = {
        type: error.type || 'bad-request',
        title: status === 413 ? 'Payload Too Large' : 'Bad Request',
        status,
        detail: error.message,
        instance: url.pathname
      };
      sendRecordedJson(res, recorderEntry, status, responseBody);
      recorder.record(recorderEntry);
      return;
    }

    const insufficientCreditPaths = options.insufficientCreditPaths || ['/api/v1/contacts/search'];
    if (
      options.errorMode === 'insufficient-credits' &&
      insufficientCreditPaths.includes(url.pathname) &&
      INSUFFICIENT_CREDIT_METHODS[url.pathname] === req.method
    ) {
      sendRecordedJson(res, recorderEntry, 402, insufficientCredits(url.pathname));
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/credit/balance') {
      sendRecordedJson(res, recorderEntry, 200, {
        userId: 'eval-user',
        monthlyPoints: 80,
        monthlyEdm: 200,
        monthlyExpiresAt: '2026-06-30T23:59:59.000Z',
        addonPoints: 400,
        addonEdm: 2000
      });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/companies/search-advanced') {
      sendRecordedJson(res, recorderEntry, 200, {
        total: 2,
        list: [
          {
            company_name: 'AutoTeile Import GmbH',
            country_code: 'DE',
            industry: ['Automotive Parts Importer'],
            main_products: ['brake parts', 'engine components'],
            domain: 'autoteile.example',
            email_count: 3,
            employees_count: '51-200'
          },
          {
            company_name: 'Berlin Components Trading',
            country_code: 'DE',
            industry: ['Automotive Distribution'],
            main_products: ['aftermarket parts'],
            domain: 'berlin-components.example',
            email_count: 2,
            employees_count: '11-50'
          }
        ]
      });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/companies/unlock') {
      sendRecordedJson(res, recorderEntry, 200, {
        companyHashId: 'hash-autoteile',
        companyName: body && body.domain ? body.domain : 'autoteile.example',
        charged: true,
        alreadyViewed: false
      });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'GET' && /^\/api\/v1\/companies\/[^/]+\/profileEmails$/.test(url.pathname)) {
      sendRecordedJson(res, recorderEntry, 200, {
        emails: [
          {
            name: 'Anna Schneider',
            title: 'Procurement Manager',
            email: 'anna.schneider@example.com',
            linkedin: 'https://linkedin.com/in/anna-schneider'
          }
        ],
        total: 1,
        page: 1
      });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/contacts/search') {
      sendRecordedJson(res, recorderEntry, 200, {
        list: [
          {
            id: 'contact-001',
            name: 'Mia Carter',
            email: 'mia.carter@example.com',
            title: 'VP Sales',
            company: 'Acme SaaS',
            country: 'US'
          }
        ],
        total: 1,
        page: 1,
        size: 20
      });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/emails/send/batch') {
      sendRecordedJson(res, recorderEntry, 201, { task_id: 1001, total: 2, status: 'pending' });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/emails/send/personalized') {
      const recipients = Array.isArray(body && body.recipients) ? body.recipients : [{}];
      const tasks = recipients.map((recipient, index) => ({
        task_id: 2001 + index,
        recipient: recipient.email || null,
        status: 'pending'
      }));
      sendRecordedJson(res, recorderEntry, 201, { total: tasks.length, tasks });
      recorder.record(recorderEntry);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/emails/tasks') {
      sendRecordedJson(res, recorderEntry, 200, { data: [], total: 0, page: 1, page_size: 20 });
      recorder.record(recorderEntry);
      return;
    }

    sendRecordedJson(res, recorderEntry, 404, { type: 'not-found', title: 'Not Found', status: 404, instance: url.pathname });
    recorder.record(recorderEntry);
  }

  return {
    recorder,
    get baseUrl() {
      return baseUrl;
    },
    async start() {
      if (server) throw new Error('Mock server already started');
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

module.exports = { createMockServer };
