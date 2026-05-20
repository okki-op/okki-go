const test = require('node:test');
const assert = require('node:assert/strict');
const { fail, pass } = require('../lib/core/result');

test('pass preserves canonical id and status', () => {
  const result = pass('x', { status: 'failed', id: 'y' });

  assert.equal(result.id, 'x');
  assert.equal(result.status, 'passed');
});

test('fail preserves canonical id, status, and reason', () => {
  const result = fail('x', 'bad', { status: 'passed', reason: 'other' });

  assert.equal(result.id, 'x');
  assert.equal(result.status, 'failed');
  assert.equal(result.reason, 'bad');
});
