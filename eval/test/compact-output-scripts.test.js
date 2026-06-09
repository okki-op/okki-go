const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createMockServer } = require('../lib/api/mock-server');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'skill', 'scripts');

function makeTempDir(t, prefix = 'okki-compact-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
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
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
    }, 30000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr });
    });
  });
}

function parseStdout(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function assertBudgetFields(output, expected = {}) {
  assert.equal(typeof output.truncated, 'boolean');
  assert.equal(Object.hasOwn(output, 'available'), true);
  assert.equal(Object.hasOwn(output, 'next_offset'), true);
  assert.equal(typeof output.output_budget, 'object');
  if (Object.hasOwn(expected, 'defaultCap')) {
    assert.equal(output.output_budget.default_cap, expected.defaultCap);
  }
  if (Object.hasOwn(expected, 'hardCap')) {
    assert.equal(output.output_budget.hard_cap, expected.hardCap);
  }
}

test('search-companies compact output omits private fields while saving raw mapping', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const rawPath = path.join(tempDir, 'search-raw.json');

  try {
    const result = await runScript('search-companies.js', [
      '--json',
      JSON.stringify({ includeCountry: ['DE'], productKeywords: ['auto parts'], size: 2 }),
      '--compact',
      '--locale',
      'zh-CN',
      '--limit-output',
      '1',
      '--save-raw',
      rawPath
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 50, hardCap: 100 });
    assert.equal(output.returned, 1);
    assert.equal(output.private_mapping_saved, true);
    assert.equal(output.rows[0].row, 1);
    assert.equal(output.rows[0].company_name, 'AutoTeile Import GmbH');
    assert.equal(output.rows[0].country_code, 'DE');
    assert.equal(output.rows[0].country_name, '德国');
    assert.equal(output.rows[0].fit.includes('brake parts'), true);
    assert.equal(Object.hasOwn(output.rows[0], 'domain'), false);
    assert.equal(Object.hasOwn(output.rows[0], 'id'), false);
    assert.equal(result.stdout.includes('autoteile.example'), false);

    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    assert.equal(raw.version, '1.0');
    assert.equal(raw.rows[0].row, 1);
    assert.equal(raw.rows[0].domain, 'autoteile.example');
    assert.equal(raw.rows[0].raw.domain, 'autoteile.example');
  } finally {
    await server.stop();
  }
});

test('search-companies compact output honors explicit visible budget and hard cap metadata', async (t) => {
  const server = await createMockServer({
    companySearchResponse() {
      const list = Array.from({ length: 75 }, (_, index) => ({
        company_name: `Budget Company ${index + 1}`,
        country_code: 'DE',
        industry: ['Automotive Distribution'],
        main_products: [`budget part ${index + 1}`],
        domain: `budget-${index + 1}.example`,
        email_count: index % 4,
        employees_count: '11-50'
      }));
      return { total: list.length, list };
    }
  }).start();
  const tempDir = makeTempDir(t);
  const rawPath = path.join(tempDir, 'search-budget-raw.json');

  try {
    const result = await runScript('search-companies.js', [
      '--json',
      JSON.stringify({ includeCountry: ['DE'], productKeywords: ['auto parts'], size: 50 }),
      '--compact',
      '--limit-output',
      '70',
      '--save-raw',
      rawPath
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 50, hardCap: 100 });
    assert.equal(output.returned, 70);
    assert.equal(output.available, 75);
    assert.equal(output.truncated, true);
    assert.equal(output.next_offset, 70);
    assert.equal(output.rows.length, 70);
    assert.equal(result.stdout.includes('budget-71.example'), false);

    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    assert.equal(raw.rows.length, 75);
    assert.equal(raw.rows[70].domain, 'budget-71.example');
  } finally {
    await server.stop();
  }
});

test('search-companies compact output never exceeds hard cap while preserving raw rows', async (t) => {
  const server = await createMockServer({
    companySearchResponse() {
      const list = Array.from({ length: 125 }, (_, index) => ({
        company_name: `Hard Cap Company ${index + 1}`,
        country_code: 'DE',
        industry: ['Automotive Distribution'],
        main_products: [`hard cap part ${index + 1}`],
        domain: `hard-cap-${index + 1}.example`
      }));
      return { total: list.length, list };
    }
  }).start();
  const tempDir = makeTempDir(t);
  const rawPath = path.join(tempDir, 'search-hard-cap-raw.json');

  try {
    const result = await runScript('search-companies.js', [
      '--json',
      JSON.stringify({ includeCountry: ['DE'], productKeywords: ['auto parts'], size: 50 }),
      '--compact',
      '--limit-output',
      '150',
      '--save-raw',
      rawPath
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 50, hardCap: 100 });
    assert.equal(output.returned, 100);
    assert.equal(output.available, 125);
    assert.equal(output.truncated, true);
    assert.equal(output.next_offset, 100);
    assert.equal(output.rows.length, 100);
    assert.equal(result.stdout.includes('hard-cap-101.example'), false);

    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    assert.equal(raw.rows.length, 125);
    assert.equal(raw.rows[100].domain, 'hard-cap-101.example');
  } finally {
    await server.stop();
  }
});

test('discover-companies-batch emits compact deduped rows and preserves raw records', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const planPath = path.join(tempDir, 'plan.json');
  const batchPath = path.join(tempDir, 'batch.json');
  const latestPath = path.join(tempDir, 'latest-batch.json');
  fs.writeFileSync(planPath, JSON.stringify({
    request_summary: 'German auto parts buyers',
    target_count: 2,
    include: ['auto', 'parts', 'aftermarket'],
    exclude: ['software'],
    payloads: [
      { includeCountry: ['DE'], productKeywords: ['auto parts'], size: 2, pages: 2 }
    ]
  }));

  try {
    const result = await runScript('discover-companies-batch.js', [
      '--plan',
      planPath,
      '--target-count',
      '2',
      '--save-batch',
      batchPath,
      '--compact',
      '--locale',
      'zh-CN'
    ], {
      OKKIGO_BASE_URL: server.baseUrl,
      OKKIGO_BATCH_STATE_FILE: latestPath
    });

    const output = parseStdout(result);
    assertBudgetFields(output, { hardCap: 100 });
    assert.equal(output.returned, 2);
    assert.equal(output.scanned_pages, 2);
    assert.equal(output.raw_count, 4);
    assert.equal(output.deduped_count, 2);
    assert.equal(output.private_mapping_saved, true);
    assert.equal(output.rows[0].country_code, 'DE');
    assert.equal(output.rows[0].country_name, '德国');
    assert.equal(result.stdout.includes('autoteile.example'), false);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/search-advanced').length, 2);

    const saved = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    assert.equal(saved.request_summary, 'German auto parts buyers');
    assert.equal(saved.rows.length, 2);
    assert.equal(saved.rows[0].domain, 'autoteile.example');
    assert.equal(saved.rows[0].raw.domain, 'autoteile.example');

    const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    assert.equal(latest.latest_batch, batchPath);
    assert.equal(latest.displayed_rows, 2);
    assert.equal(latest.request_summary, 'German auto parts buyers');
  } finally {
    await server.stop();
  }
});

test('unlock-companies uses saved row mapping, emits compact output, saves full raw payloads, and batch-marks state', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const configHome = path.join(tempDir, 'config');
  const batchPath = path.join(tempDir, 'batch.json');
  const rawPath = path.join(tempDir, 'unlock-raw.json');
  fs.writeFileSync(batchPath, JSON.stringify({
    version: '1.0',
    request_summary: 'German auto parts buyers',
    rows: [
      {
        row: 1,
        domain: 'autoteile.example',
        country_code: 'DE',
        company_name: 'AutoTeile Import GmbH',
        raw: { domain: 'autoteile.example', company_name: 'AutoTeile Import GmbH' }
      },
      {
        row: 2,
        domain: 'berlin-components.example',
        country_code: 'DE',
        company_name: 'Berlin Components Trading',
        raw: { domain: 'berlin-components.example', company_name: 'Berlin Components Trading' }
      }
    ]
  }));

  try {
    const result = await runScript('unlock-companies.js', [
      '--batch',
      batchPath,
      '--rows',
      '1-2',
      '--mark-unlocked',
      '--compact',
      '--locale',
      'zh-CN',
      '--raw-file',
      rawPath
    ], {
      OKKIGO_BASE_URL: server.baseUrl,
      XDG_CONFIG_HOME: configHome
    });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 50, hardCap: 50 });
    assert.equal(output.charged_count, 2);
    assert.equal(output.results.length, 2);
    assert.equal(output.results[0].row, 1);
    assert.equal(output.results[0].status, 'unlocked');
    assert.equal(output.results[0].country_code, 'DE');
    assert.equal(output.results[0].country_name, '德国');
    assert.equal(output.results[0].profile_available, true);
    assert.equal(output.results[0].emails_total, 1);
    assert.equal(output.results[0].description_preview.length > 0, true);
    assert.equal(output.raw_saved, true);
    assert.equal(output.raw_path, rawPath);
    assert.equal(Object.hasOwn(output.results[0], 'domain'), false);
    assert.equal(Object.hasOwn(output.results[0], 'companyHashId'), false);
    assert.equal(result.stdout.includes('autoteile.example'), false);
    assert.equal(result.stdout.includes('hash-autoteile'), false);

    const requests = server.recorder.requests;
    assert.equal(requests.filter((entry) => entry.path === '/api/v1/companies/search-advanced').length, 0);
    assert.equal(requests.filter((entry) => entry.path === '/api/v1/companies/unlock').length, 2);
    assert.equal(requests.some((entry) => entry.path === '/api/v1/credit/balance'), true);

    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    assert.equal(raw.rows[0].domain, 'autoteile.example');
    assert.equal(raw.rows[0].unlock.companyHashId, 'hash-autoteile');
    assert.equal(raw.rows[0].profile.description.includes('Leading supplier'), true);

    const viewed = JSON.parse(fs.readFileSync(path.join(configHome, 'okki-go', 'viewed.json'), 'utf8'));
    assert.equal(viewed.items.length, 2);
    assert.equal(viewed.items.every((item) => item.status === 'unlocked'), true);
  } finally {
    await server.stop();
  }
});

test('unlock-companies resolves latest batch pointer within TTL without re-searching', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const configHome = path.join(tempDir, 'config');
  const latestPath = path.join(tempDir, 'latest-batch.json');
  const batchPath = path.join(tempDir, 'displayed-batch.json');
  const rawPath = path.join(tempDir, 'unlock-latest-raw.json');
  fs.writeFileSync(batchPath, JSON.stringify({
    version: '1.0',
    created_at: '2026-06-04T00:00:00.000Z',
    request_summary: 'Displayed batch for generic selector',
    rows: [
      {
        row: 1,
        domain: 'autoteile.example',
        country_code: 'DE',
        company_name: 'AutoTeile Import GmbH',
        raw: { domain: 'autoteile.example' }
      },
      {
        row: 2,
        domain: 'berlin-components.example',
        country_code: 'DE',
        company_name: 'Berlin Components Trading',
        raw: { domain: 'berlin-components.example' }
      },
      {
        row: 3,
        domain: 'munich-supply.example',
        country_code: 'DE',
        company_name: 'Munich Supply',
        raw: { domain: 'munich-supply.example' }
      }
    ]
  }));
  fs.writeFileSync(latestPath, JSON.stringify({
    latest_batch: batchPath,
    displayed_rows: 3,
    request_summary: 'Displayed batch for generic selector',
    created_at: '2026-06-04T01:00:00.000Z'
  }));

  try {
    const result = await runScript('unlock-companies.js', [
      '--batch',
      'latest',
      '--rows',
      '1,3',
      '--compact',
      '--raw-file',
      rawPath,
      '--now',
      '2026-06-04T12:00:00.000Z'
    ], {
      OKKIGO_BASE_URL: server.baseUrl,
      OKKIGO_BATCH_STATE_FILE: latestPath,
      XDG_CONFIG_HOME: configHome
    });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 50, hardCap: 50 });
    assert.equal(output.batch_id, 'displayed-batch');
    assert.equal(output.latest_batch_used, true);
    assert.deepEqual(output.results.map((row) => row.row), [1, 3]);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/search-advanced').length, 0);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/unlock').length, 2);
  } finally {
    await server.stop();
  }
});

test('unlock-companies refuses expired latest batch pointer before paid calls', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const latestPath = path.join(tempDir, 'latest-batch.json');
  const batchPath = path.join(tempDir, 'expired-batch.json');
  fs.writeFileSync(batchPath, JSON.stringify({
    version: '1.0',
    created_at: '2026-06-02T00:00:00.000Z',
    rows: [
      { row: 1, domain: 'expired.example', country_code: 'DE', company_name: 'Expired Co' }
    ]
  }));
  fs.writeFileSync(latestPath, JSON.stringify({
    latest_batch: batchPath,
    displayed_rows: 1,
    request_summary: 'Expired batch',
    created_at: '2026-06-02T00:00:00.000Z'
  }));

  try {
    const result = await runScript('unlock-companies.js', [
      '--batch',
      'latest',
      '--rows',
      '1',
      '--compact',
      '--now',
      '2026-06-04T12:01:00.000Z'
    ], {
      OKKIGO_BASE_URL: server.baseUrl,
      OKKIGO_BATCH_STATE_FILE: latestPath
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /latest batch.*expired/i);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/unlock').length, 0);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/search-advanced').length, 0);
  } finally {
    await server.stop();
  }
});

test('unlock-companies refuses latest pointer whose summary does not match the batch', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const latestPath = path.join(tempDir, 'latest-batch.json');
  const batchPath = path.join(tempDir, 'mismatched-batch.json');
  fs.writeFileSync(batchPath, JSON.stringify({
    version: '1.0',
    created_at: '2026-06-04T00:00:00.000Z',
    request_summary: 'German auto parts buyers',
    rows: [
      { row: 1, domain: 'autoteile.example', country_code: 'DE', company_name: 'AutoTeile Import GmbH' }
    ]
  }));
  fs.writeFileSync(latestPath, JSON.stringify({
    latest_batch: batchPath,
    displayed_rows: 1,
    request_summary: 'Italian packaging buyers',
    created_at: '2026-06-04T01:00:00.000Z'
  }));

  try {
    const result = await runScript('unlock-companies.js', [
      '--batch',
      'latest',
      '--rows',
      '1',
      '--compact',
      '--now',
      '2026-06-04T12:00:00.000Z'
    ], {
      OKKIGO_BASE_URL: server.baseUrl,
      OKKIGO_BATCH_STATE_FILE: latestPath
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /request summary/i);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/unlock').length, 0);
    assert.equal(server.recorder.requests.filter((entry) => entry.path === '/api/v1/companies/search-advanced').length, 0);
  } finally {
    await server.stop();
  }
});

test('search-contacts compact output saves raw contacts and hides internal ids by default', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const batchPath = path.join(tempDir, 'contacts.json');

  try {
    const result = await runScript('search-contacts.js', [
      '--json',
      JSON.stringify({ title: 'Procurement Manager', country_codes: 'DE', has_email: 1, size: 100 }),
      '--save-batch',
      batchPath,
      '--compact'
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 20, hardCap: 100 });
    assert.equal(output.charged, true);
    assert.equal(output.returned, 1);
    assert.equal(output.contacts[0].email, 'mia.carter@example.com');
    assert.equal(output.contacts[0].linkedin, 'available');
    assert.equal(Object.hasOwn(output.contacts[0], 'id'), false);
    assert.equal(Object.hasOwn(output.contacts[0], 'phone'), false);
    assert.equal(server.recorder.requests.at(-1).body.size, 20);
    assert.equal(output.next_offset, null);

    const raw = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    assert.equal(raw.raw.list[0].id, 'contact-001');
  } finally {
    await server.stop();
  }
});

test('email-status compact task detail omits body content and saves raw detail', async (t) => {
  const server = await createMockServer({ emailTaskDetail: true }).start();
  const tempDir = makeTempDir(t);
  const rawPath = path.join(tempDir, 'task-1001.json');

  try {
    const result = await runScript('email-status.js', [
      'task',
      '--task-id',
      '1001',
      '--compact',
      '--save-raw',
      rawPath
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 20, hardCap: 100 });
    assert.equal(output.task_id, 1001);
    assert.equal(output.status, 'partial');
    assert.equal(output.failed, 1);
    assert.equal(output.content_omitted, true);
    assert.equal(output.failed_mails.length, 1);
    assert.equal(result.stdout.includes('Dear company_name'), false);

    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    assert.equal(raw.content.includes('Dear company_name'), true);
    assert.equal(raw.mails.length, 2);
  } finally {
    await server.stop();
  }
});

test('email-status compact list outputs budget metadata and next offset', async (t) => {
  const server = await createMockServer({
    emailTasksResponse() {
      return {
        data: Array.from({ length: 25 }, (_, index) => ({
          taskId: 1000 + index,
          status: 'sent',
          totalCount: 10,
          sentCount: 10,
          failedCount: 0,
          createdAt: '2026-03-20T08:00:00.000Z'
        })),
        total: 25,
        page: 1,
        page_size: 20
      };
    }
  }).start();

  try {
    const result = await runScript('email-status.js', [
      'tasks',
      '--json',
      JSON.stringify({ page: 1, page_size: 20 }),
      '--compact'
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assertBudgetFields(output, { defaultCap: 20, hardCap: 100 });
    assert.equal(output.tasks.length, 20);
    assert.equal(output.returned, 20);
    assert.equal(output.available, 25);
    assert.equal(output.truncated, true);
    assert.equal(output.next_offset, 20);
  } finally {
    await server.stop();
  }
});

test('send-email compact output saves mapping and does not echo full content or recipient variables', async (t) => {
  const server = await createMockServer().start();
  const tempDir = makeTempDir(t);
  const mappingPath = path.join(tempDir, 'send-mapping.json');
  const longContent = 'Hello '.repeat(120);

  try {
    const result = await runScript('send-email.js', [
      'batch',
      '--json',
      JSON.stringify({
        content: longContent,
        recipients: [
          {
            email: 'alice@acme.com',
            subject: 'Partnership',
            variables: { company_name: 'Acme Corp', private_note: 'do not echo' }
          },
          {
            email: 'bob@globex.com',
            subject: 'Partnership',
            variables: { company_name: 'Globex', private_note: 'do not echo' }
          }
        ]
      }),
      '--mapping-file',
      mappingPath,
      '--compact'
    ], { OKKIGO_BASE_URL: server.baseUrl });

    const output = parseStdout(result);
    assert.equal(output.submitted, true);
    assert.equal(output.mode, 'batch');
    assert.equal(output.total, 2);
    assert.deepEqual(output.task_ids, [1001]);
    assert.equal(output.mapping_saved, mappingPath);
    assert.equal(result.stdout.includes(longContent.slice(0, 80)), false);
    assert.equal(result.stdout.includes('private_note'), false);

    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    assert.equal(mapping.request.content, longContent);
    assert.equal(mapping.response.task_id, 1001);
  } finally {
    await server.stop();
  }
});
