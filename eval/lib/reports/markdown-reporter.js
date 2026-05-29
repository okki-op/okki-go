'use strict';

const path = require('node:path');
const { writeText } = require('../core/fs-utils');
const { summarize } = require('./json-reporter');

const STATUSES = ['passed', 'failed', 'warned', 'skipped', 'blocked'];
const STATUS_LABELS = {
  total: '总计',
  passed: '通过',
  failed: '失败',
  warned: '警告',
  skipped: '跳过',
  blocked: '阻塞'
};

function writeMarkdownReport(outputDir, run) {
  const results = Array.isArray(run.results) ? run.results : [];
  const summary = summarize(results);
  const lines = [
    '# OKKI Go 评估报告',
    '',
    `运行 ID：${formatCell(run.runId)}`,
    `模式：${formatCell(run.mode)}`,
    `套件：${formatCell(run.suite)}`
  ];

  if (run.fixture) {
    lines.push(`回放夹具：${formatCell(fixtureName(run.fixture))}`);
  }

  lines.push(
    '',
    '## 汇总',
    '',
    '| 状态 | 数量 |',
    '| --- | ---: |',
    `| ${STATUS_LABELS.total} | ${summary.total} |`
  );

  for (const status of STATUSES) {
    lines.push(`| ${statusLabel(status)} | ${summary[status]} |`);
  }

  appendRoutingSection(lines, summary.routing);
  appendBusinessSection(lines, summary.business);
  appendManualReviewSection(lines, summary.manualReview);

  lines.push(
    '',
    '## 用例结果',
    '',
    '| 用例 | 状态 | 原因 |',
    '| --- | --- | --- |'
  );

  for (const result of results) {
    lines.push(`| ${formatCell(result.caseId || result.id)} | ${formatCell(statusLabel(result.status))} | ${formatCell(reasonFor(result))} |`);
  }

  writeText(path.join(outputDir, 'report.md'), `${lines.join('\n')}\n`);
}

function reasonFor(result) {
  if (Array.isArray(result.failureReasons)) {
    return result.failureReasons.join('; ');
  }
  return result.reason || '';
}

function formatCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function appendRoutingSection(lines, routing) {
  lines.push(
    '',
    '## 路由评估',
    '',
    '| 指标 | 值 |',
    '| --- | ---: |',
    `| 正例召回率 | ${formatMetric(routing.positiveRecall)} |`,
    `| 负例精确率 | ${formatMetric(routing.negativePrecision)} |`,
    `| 边界用例准确率 | ${formatMetric(routing.boundaryAccuracy)} |`,
    `| 漏触发 | ${routing.missedTriggers.length} |`,
    `| 误触发 | ${routing.wrongTriggers.length} |`
  );
}

function appendBusinessSection(lines, business) {
  lines.push(
    '',
    '## 业务评估',
    '',
    '| 指标 | 值 |',
    '| --- | ---: |',
    `| 已评分用例 | ${business.scored} |`,
    `| 平均质量分 | ${formatMetric(business.averageQualityScore)} |`
  );
}

function appendManualReviewSection(lines, manualReview) {
  lines.push(
    '',
    '## 人工复核',
    '',
    '| 指标 | 数量 |',
    '| --- | ---: |',
    `| 需要复核 | ${manualReview.required} |`,
    `| 待处理 | ${manualReview.pending} |`
  );
}

function formatMetric(value) {
  return value === null || value === undefined ? '-' : String(value);
}

function fixtureName(fixture) {
  if (typeof fixture === 'string') return fixture;
  return fixture.name || '';
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || '';
}

module.exports = { writeMarkdownReport };
