'use strict';

const path = require('node:path');
const { writeJson } = require('../core/fs-utils');

const STATUSES = ['passed', 'failed', 'warned', 'skipped', 'blocked'];

function summarize(results) {
  const normalizedResults = normalizeResults(results);
  const summary = {
    total: normalizedResults.length,
    passed: 0,
    failed: 0,
    warned: 0,
    skipped: 0,
    blocked: 0,
    routing: routingSummary(normalizedResults),
    business: businessSummary(normalizedResults),
    manualReview: manualReviewSummary(normalizedResults)
  };

  for (const result of normalizedResults) {
    if (STATUSES.includes(result.status)) {
      summary[result.status] += 1;
    }
  }

  return summary;
}

function businessSummary(results) {
  const scored = results
    .map((result) => result.scores && result.scores.businessQuality)
    .filter((score) => typeof score === 'number');
  const dimensionAverages = averageDimensions(results);

  if (scored.length === 0) {
    return {
      scored: 0,
      averageQualityScore: null,
      dimensionAverages
    };
  }

  const total = scored.reduce((sum, score) => sum + score, 0);
  return {
    scored: scored.length,
    averageQualityScore: Number((total / scored.length).toFixed(2)),
    dimensionAverages
  };
}

function routingSummary(results) {
  const routingResults = results.filter((result) => result.suite === 'routing');
  const positives = routingResults.filter((result) => result.routingExpectedDecision === 'should_trigger');
  const negatives = routingResults.filter((result) => result.routingExpectedDecision === 'should_not_trigger');
  const boundaries = routingResults.filter((result) => result.routingExpectedDecision === 'boundary');

  return {
    positives: positives.length,
    positiveRecall: percentage(positives.filter(isTriggered).length, positives.length),
    negatives: negatives.length,
    negativePrecision: percentage(negatives.filter(isNotTriggered).length, negatives.length),
    boundaries: boundaries.length,
    boundaryAccuracy: percentage(boundaries.filter((result) => result.status === 'passed').length, boundaries.length),
    missedTriggers: caseIdsWithReason(routingResults, 'missed_trigger'),
    wrongTriggers: caseIdsWithReason(routingResults, 'wrongly_triggered')
  };
}

function manualReviewSummary(results) {
  const reviewRecords = results.map((result) => result.manualReview).filter(Boolean);
  return {
    required: reviewRecords.filter((record) => record.required).length,
    pending: reviewRecords.filter((record) => record.required && record.status === 'pending').length
  };
}

function averageDimensions(results) {
  const dimensions = new Map();

  for (const result of results) {
    const resultDimensions = result.quality && result.quality.dimensions;
    if (!resultDimensions || typeof resultDimensions !== 'object') continue;
    for (const [name, score] of Object.entries(resultDimensions)) {
      if (typeof score !== 'number') continue;
      if (!dimensions.has(name)) dimensions.set(name, []);
      dimensions.get(name).push(score);
    }
  }

  const averages = {};
  for (const [name, scores] of [...dimensions.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    averages[name] = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
  }
  return averages;
}

function percentage(numerator, denominator) {
  if (denominator === 0) return null;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function isTriggered(result) {
  return result.routingOutcome === 'triggered' || result.routingOutcome === 'triggered_pending_prerequisite';
}

function isNotTriggered(result) {
  return result.routingOutcome === 'not_triggered';
}

function caseIdsWithReason(results, target) {
  return results
    .filter((result) => Array.isArray(result.failureReasons))
    .filter((result) => result.failureReasons.some((reason) => reason === target || reason.startsWith(`${target}:`)))
    .map((result) => result.caseId || result.id || 'unknown');
}

function writeJsonReport(outputDir, run) {
  const results = normalizeResults(run.results);
  writeJson(path.join(outputDir, 'summary.json'), {
    ...run,
    results,
    summary: summarize(results)
  });
  writeJson(path.join(outputDir, 'cases.json'), results);
}

function normalizeResults(results) {
  return Array.isArray(results) ? results : [];
}

module.exports = { writeJsonReport, summarize };
