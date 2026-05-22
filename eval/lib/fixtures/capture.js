'use strict';

function createCapturePlan(options = {}) {
  if (!options.allowRealApi) {
    throw new Error('fixtures capture requires --allow-real-api');
  }
  if (!options.scenario) {
    throw new Error('fixtures capture requires --scenario');
  }

  const allowEmailSend = options.allowEmailSend === true;
  const maxEdmSends = options.maxEdmSends || 0;
  const emailAllowlist = Array.isArray(options.emailAllowlist) ? options.emailAllowlist : [];

  if (allowEmailSend && emailAllowlist.length === 0) {
    throw new Error('--email-allowlist is required when --allow-email-send is set');
  }
  if (allowEmailSend && maxEdmSends <= 0) {
    throw new Error('--max-edm-sends must be greater than 0 when --allow-email-send is set');
  }

  return {
    mode: 'fixture-capture',
    scenario: options.scenario,
    allowRealApi: true,
    maxPaidCredits: options.maxPaidCredits || 0,
    allowEmailSend,
    maxEdmSends: allowEmailSend ? maxEdmSends : 0,
    emailAllowlist: allowEmailSend ? emailAllowlist : []
  };
}

module.exports = { createCapturePlan };
