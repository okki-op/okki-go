'use strict';

const { runCommand } = require('../core/process');

const ROUTING_DECISIONS = new Set([
  'triggered',
  'triggered_pending_prerequisite',
  'not_triggered'
]);

function buildScenarioPrompt(scenario) {
  const turns = (scenario.userTurns || [])
    .map((turn) => `${String(turn.role || 'user').toUpperCase()}: ${turn.content}`)
    .join('\n');

  return [
    'You are running one OKKI Go Skill evaluation case.',
    'Use the installed OKKI Go Skill as you normally would, but do not call live paid APIs, do not send email, and do not modify files.',
    'Decide whether the user request should trigger OKKI Go.',
    'Routing decisions:',
    '- triggered: OKKI Go should be used for this request.',
    '- triggered_pending_prerequisite: OKKI Go applies, but credentials, budget, confirmation, or other prerequisites are missing.',
    '- not_triggered: OKKI Go should not be used for this request.',
    'If OKKI Go should call an API, include one API_CALL line for each endpoint you would call or prepare next.',
    'Use this exact machine-readable marker format in your final answer:',
    '- routing marker: write ROUTING_DECISION followed by a colon and one of triggered, triggered_pending_prerequisite, or not_triggered.',
    '- API marker: write API_CALL followed by a colon, then the HTTP method and API path.',
    'RESPONSE: brief natural-language answer to the user',
    '',
    'User turns:',
    turns
  ].join('\n');
}

function runAgentCli({
  executable,
  args = [],
  cwd,
  env,
  prompt,
  timeoutMs
}) {
  const startedAt = Date.now();
  const result = runCommand(executable, [...args, prompt], {
    cwd,
    env,
    timeoutMs
  });
  const durationMs = Date.now() - startedAt;
  const transcript = joinTranscript(result.stdout, result.stderr);
  const parsed = parseAgentTranscript(preferredParseText(result.stdout, result.stderr));

  return {
    command: result.command,
    args: result.args,
    cwd: result.cwd,
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
    durationMs,
    transcript,
    ...parsed
  };
}

function parseAgentTranscript(transcript) {
  const routingDecision = parseRoutingDecision(transcript);
  return {
    routingDecision,
    apiCalls: parseApiCalls(transcript),
    confirmedEmailSend: parseBooleanMarker(transcript, 'CONFIRMED_EMAIL_SEND')
  };
}

function parseRoutingDecision(transcript) {
  const match = String(transcript || '').match(/^ROUTING_DECISION:\s*([a-z_]+)/im);
  if (!match) return null;
  const decision = match[1].toLowerCase();
  return ROUTING_DECISIONS.has(decision) ? decision : null;
}

function parseApiCalls(transcript) {
  const calls = [];
  const pattern = /^API_CALL:\s*([A-Z]+)\s+(\S+)/gim;
  let match;
  while ((match = pattern.exec(String(transcript || ''))) !== null) {
    calls.push({
      method: match[1].toUpperCase(),
      path: match[2]
    });
  }
  return calls;
}

function parseBooleanMarker(transcript, marker) {
  const pattern = new RegExp(`^${escapeRegex(marker)}:\\s*(true|false)\\b`, 'im');
  const match = String(transcript || '').match(pattern);
  return match ? match[1].toLowerCase() === 'true' : undefined;
}

function joinTranscript(stdout, stderr) {
  return [stdout, stderr].filter(Boolean).join('\n');
}

function preferredParseText(stdout, stderr) {
  const parsedStdout = parseAgentTranscript(stdout);
  if (parsedStdout.routingDecision || parsedStdout.apiCalls.length > 0) return stdout;
  return joinTranscript(stdout, stderr);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  buildScenarioPrompt,
  parseAgentTranscript,
  runAgentCli
};
