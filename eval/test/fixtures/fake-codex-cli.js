#!/usr/bin/env node
'use strict';

const prompt = process.argv.slice(2).join(' ');

if (process.argv.includes('--ask-for-approval')) {
  console.error('fake Codex CLI received unsupported --ask-for-approval');
  process.exit(2);
}

if (process.env.OKKI_FAKE_CODEX_MODE === 'NO_MARKERS') {
  console.log('我可以帮你分析这个请求，但这里没有结构化 marker。');
  process.exit(0);
}

if (process.env.OKKI_FAKE_CODEX_MODE === 'ECHO_PROMPT_AND_FAIL') {
  console.error(prompt);
  console.error('ERROR: stream disconnected before completion');
  process.exit(1);
}

if (process.env.OKKI_FAKE_CODEX_MODE === 'STDOUT_AND_STDERR_ECHO') {
  const finalAnswer = [
    'ROUTING_DECISION: triggered',
    'API_CALL: POST /api/v1/companies/search-advanced',
    'RESPONSE: OKKI Go should handle this request.'
  ].join('\n');
  console.log(finalAnswer);
  console.error(`codex\n${finalAnswer}`);
  process.exit(0);
}

if (process.env.OKKI_FAKE_CODEX_MODE === 'BEHAVIOR_MARKERS') {
  console.log('ROUTING_DECISION: triggered');
  console.log('API_CALL: POST /api/v1/companies/search-advanced');
  console.log('BEHAVIOR: bc1_goal_before_brief');
  console.log('BEHAVIOR: brief_built');
  console.log('BEHAVIOR: trade_mode_derived');
  console.log('RESPONSE: OKKI Go should handle this request with ordered harness behavior.');
  process.exit(0);
}

if (!prompt.includes('帮我找德国汽车零部件进口商')) {
  console.error('fake Codex CLI did not receive the scenario prompt');
  process.exit(2);
}

console.log('ROUTING_DECISION: triggered');
console.log('API_CALL: POST /api/v1/companies/search-advanced');
console.log('我会使用 OKKI Go 搜索德国汽车零部件进口商，并先收集公司线索。');
