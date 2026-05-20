'use strict';

const http = require('http');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch {
        resolve(body);
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
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
  let server;
  let baseUrl;

  async function handler(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1');
    const body = await readBody(req);
    recorder.record({ method: req.method, path: url.pathname, body });

    if (options.errorMode === 'insufficient-credits' && url.pathname === '/api/v1/contacts/search') {
      sendJson(res, 402, insufficientCredits(url.pathname));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/credit/balance') {
      sendJson(res, 200, {
        userId: 'eval-user',
        monthlyPoints: 80,
        monthlyEdm: 200,
        monthlyExpiresAt: '2026-06-30T23:59:59.000Z',
        addonPoints: 400,
        addonEdm: 2000
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/companies/search-advanced') {
      sendJson(res, 200, {
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
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/companies/unlock') {
      sendJson(res, 200, {
        companyHashId: 'hash-autoteile',
        companyName: body && body.domain ? body.domain : 'autoteile.example',
        charged: true,
        alreadyViewed: false
      });
      return;
    }

    if (req.method === 'GET' && url.pathname.endsWith('/profileEmails')) {
      sendJson(res, 200, {
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
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/contacts/search') {
      sendJson(res, 200, {
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
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/emails/send/batch') {
      sendJson(res, 201, { task_id: 1001, total: 2, status: 'pending' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/emails/tasks') {
      sendJson(res, 200, { data: [], total: 0, page: 1, page_size: 20 });
      return;
    }

    sendJson(res, 404, { type: 'not-found', title: 'Not Found', status: 404, instance: url.pathname });
  }

  return {
    recorder,
    get baseUrl() {
      return baseUrl;
    },
    async start() {
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
    }
  };
}

module.exports = { createMockServer };
