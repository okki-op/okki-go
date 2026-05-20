const test = require('node:test');
const assert = require('node:assert/strict');
const { runCommand } = require('../lib/core/process');

test('runCommand merges custom env with process env', () => {
  const previous = process.env.OKKI_EVAL_PARENT_ENV;
  process.env.OKKI_EVAL_PARENT_ENV = 'parent';

  try {
    const result = runCommand(
      process.execPath,
      [
        '-e',
        "process.stdout.write(`${process.env.OKKI_EVAL_PARENT_ENV}:${process.env.OKKI_EVAL_CHILD_ENV}`);"
      ],
      { env: { OKKI_EVAL_CHILD_ENV: 'child' } }
    );

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'parent:child');
  } finally {
    if (previous === undefined) {
      delete process.env.OKKI_EVAL_PARENT_ENV;
    } else {
      process.env.OKKI_EVAL_PARENT_ENV = previous;
    }
  }
});
