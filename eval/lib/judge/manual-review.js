'use strict';

const HIGH_RISK_REASONS = [
  'quality_possible_fabrication',
  'email_send_forbidden',
  'email_send_before_confirmation',
  'email_send_without_confirmation',
  'api_called_before_confirmation'
];

function manualReviewRequiredFor(result, context = {}) {
  if (context.mode === 'live') return true;

  const reasons = Array.isArray(result.failureReasons) ? result.failureReasons : [];
  if (reasons.some((reason) => HIGH_RISK_REASONS.some((target) => reason === target || reason.startsWith(`${target}:`)))) {
    return true;
  }

  const businessQuality = result.scores && result.scores.businessQuality;
  return typeof businessQuality === 'number' && businessQuality < 60;
}

function createManualReviewRecord(result, context = {}) {
  const required = manualReviewRequiredFor(result, context);
  const reasons = Array.isArray(result.failureReasons) ? result.failureReasons : [];
  return {
    caseId: result.caseId || result.id,
    suite: result.suite,
    mode: context.mode || result.dataMode || null,
    fixture: fixtureName(context.fixture),
    required,
    status: required ? 'pending' : 'not_required',
    reason: required ? reasons[0] || 'high_risk_case' : null,
    reviewer: null,
    reviewedAt: null,
    notes: ''
  };
}

function fixtureName(fixture) {
  if (!fixture) return null;
  if (typeof fixture === 'string') return fixture;
  return fixture.name || null;
}

module.exports = { manualReviewRequiredFor, createManualReviewRecord };
