#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const prompt = extractPrompt(args);

if (!prompt.includes('帮我找德国汽车零部件进口商')) {
  console.error('fake Agent CLI did not receive the scenario prompt');
  process.exit(2);
}

if (process.env.OKKI_FAKE_AGENT_MODE === 'FAIL') {
  console.error('fake Agent CLI failed after receiving prompt');
  process.exit(1);
}

const finalText = [
  'ROUTING_DECISION: triggered',
  'API_CALL: POST /api/v1/companies/search-advanced',
  'RESPONSE: OKKI Go should search for German auto parts importers.'
].join('\n');

console.log(JSON.stringify({
  payloads: [
    {
      text: finalText,
      mediaUrl: null
    }
  ],
  meta: {
    transport: process.env.OKKI_FAKE_AGENT_TRANSPORT || 'embedded'
  }
}));

function extractPrompt(values) {
  const messageIndex = values.indexOf('--message');
  if (messageIndex >= 0) return values[messageIndex + 1] || '';

  const promptIndex = values.indexOf('--prompt');
  if (promptIndex >= 0) return values[promptIndex + 1] || '';

  return values[values.length - 1] || '';
}
