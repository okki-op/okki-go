const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const SCRIPTS_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function makeTempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okki-company-split-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createRecordingServer(t, options = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/api/v1/companies/search-advanced') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      requests.push(body);
      const index = requests.length;
      const companyName = options.duplicateCompany ? 'Shared Buyer Co' : `Split Search Company ${index}`;
      const domain = options.duplicateCompany ? 'shared-buyer.example' : `split-${index}.example`;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        total: 1,
        list: [{
          company_name: companyName,
          country_code: 'SG',
          company_type: ['buyer'],
          main_products: body.productKeywords || body.companyTypeKeywords || body.industryKeywords || [],
          email_count: index,
          domain
        }]
      }));
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      t.after(() => new Promise((done) => server.close(done)));
      resolve({ baseUrl: `http://127.0.0.1:${server.address().port}`, requests });
    });
  });
}

function runScript(scriptName, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SCRIPTS_DIR, scriptName), ...args], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        OKKIGO_API_KEY: 'sk-test',
        OKKI_GO_API_KEY: '',
        OKKIGO_SKILL_API_KEY: '',
        ...env
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

test('search-companies splits long keyword fields before API calls', async (t) => {
  const { baseUrl, requests } = await createRecordingServer(t);
  const tempDir = makeTempDir(t);
  const rawPath = path.join(tempDir, 'split-search.json');
  const payload = {
    productKeywords: Array.from({ length: 12 }, (_, index) => `keyword-${index + 1}`),
    includeCountry: ['SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
    size: 20
  };

  const result = await runScript('search-companies.js', [
    '--json', JSON.stringify(payload),
    '--compact',
    '--save-raw', rawPath
  ], { OKKIGO_BASE_URL: baseUrl });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(requests.length, 3);
  assert.deepEqual(requests.map((request) => request.productKeywords.length), [5, 5, 2]);
  assert.ok(requests.every((request) => request.includeCountry.length === 6));

  const output = JSON.parse(result.stdout);
  assert.equal(output.split_query_count, 3);
  assert.equal(output.rows.length, 3);
  assert.equal(fs.existsSync(rawPath), true);
});

test('discover-companies-batch splits each oversized keyword dimension and keeps countries intact', async (t) => {
  const { baseUrl, requests } = await createRecordingServer(t);
  const tempDir = makeTempDir(t);
  const batchPath = path.join(tempDir, 'discover-split.json');
  const plan = {
    request_summary: 'split batch',
    target_count: 20,
    payloads: [{
      productKeywords: Array.from({ length: 11 }, (_, index) => `product-${index + 1}`),
      companyTypeKeywords: Array.from({ length: 6 }, (_, index) => `type-${index + 1}`),
      includeCountry: ['SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
      size: 10
    }]
  };

  const result = await runScript('discover-companies-batch.js', [
    '--json', JSON.stringify(plan),
    '--save-batch', batchPath,
    '--compact',
    '--concurrency', '1'
  ], { OKKIGO_BASE_URL: baseUrl });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(requests.length, 6);
  assert.ok(requests.every((request) => request.productKeywords.length <= 5));
  assert.ok(requests.every((request) => request.companyTypeKeywords.length <= 5));
  assert.ok(requests.every((request) => request.includeCountry.length === 6));

  const output = JSON.parse(result.stdout);
  assert.equal(output.scanned_pages, 6);
  assert.equal(output.split_query_count, 6);
  assert.equal(fs.existsSync(batchPath), true);
});

test('search-companies deduplicates compact results after splitting', async (t) => {
  const { baseUrl, requests } = await createRecordingServer(t, { duplicateCompany: true });
  const payload = {
    productKeywords: Array.from({ length: 6 }, (_, index) => `keyword-${index + 1}`),
    includeCountry: ['SG'],
    size: 10
  };

  const result = await runScript('search-companies.js', [
    '--json', JSON.stringify(payload),
    '--compact'
  ], { OKKIGO_BASE_URL: baseUrl });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(requests.length, 2);

  const output = JSON.parse(result.stdout);
  assert.equal(output.split_query_count, 2);
  assert.equal(output.rows.length, 1);
  assert.equal(output.rows[0].company_name, 'Shared Buyer Co');
});

test('discover-companies-batch omits split_query_count when no split is needed', async (t) => {
  const { baseUrl, requests } = await createRecordingServer(t);
  const plan = {
    request_summary: 'normal batch',
    payloads: [{
      productKeywords: ['gift boxes', 'gift packaging'],
      includeCountry: ['SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
      size: 10
    }]
  };

  const result = await runScript('discover-companies-batch.js', [
    '--json', JSON.stringify(plan),
    '--compact',
    '--concurrency', '1'
  ], { OKKIGO_BASE_URL: baseUrl });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(requests.length, 1);

  const output = JSON.parse(result.stdout);
  assert.equal(Object.hasOwn(output, 'split_query_count'), false);
});
