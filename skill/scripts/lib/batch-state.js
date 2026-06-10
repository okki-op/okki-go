#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_BATCH_DIR,
  nowIso
} = require('./compact-output');
const {
  readJsonFile,
  writeJsonFile
} = require('./okki-api');

const DEFAULT_TTL_HOURS = 24;

function defaultBatchStatePath() {
  return process.env.OKKIGO_BATCH_STATE_FILE ||
    path.join(DEFAULT_BATCH_DIR, 'latest-batch.json');
}

function parseNow(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid --now value: ${value}`);
  }
  return date;
}

function ttlMs(ttlHours) {
  const hours = Number(ttlHours || process.env.OKKIGO_BATCH_TTL_HOURS || DEFAULT_TTL_HOURS);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('Batch TTL must be a positive number of hours.');
  }
  return hours * 60 * 60 * 1000;
}

function writeLatestBatchPointer(options) {
  if (!options || !options.batchPath) {
    throw new Error('writeLatestBatchPointer requires batchPath.');
  }
  const statePath = options.statePath || defaultBatchStatePath();
  const now = options.now ? parseNow(options.now) : new Date();
  const pointer = {
    latest_batch: options.batchPath,
    displayed_rows: Number.isFinite(Number(options.displayedRows)) ? Number(options.displayedRows) : 0,
    request_summary: options.requestSummary || '',
    created_at: now.toISOString()
  };
  if (options.discoveryHealth && typeof options.discoveryHealth === 'object') {
    pointer.discovery_health = options.discoveryHealth;
  }
  writeJsonFile(statePath, pointer);
  return statePath;
}

function readLatestBatchPointer(options = {}) {
  const statePath = options.statePath || defaultBatchStatePath();
  if (!fs.existsSync(statePath)) return null;
  try {
    return readJsonFile(statePath);
  } catch (error) {
    if (options.ignoreErrors) return null;
    throw error;
  }
}

function resolveBatchPath(batchArg, options = {}) {
  if (batchArg !== 'latest') {
    return {
      batchPath: batchArg,
      latestBatchUsed: false,
      pointer: null,
      statePath: null
    };
  }

  const statePath = options.statePath || defaultBatchStatePath();
  if (!fs.existsSync(statePath)) {
    throw new Error(`Latest batch pointer is unavailable: ${statePath}`);
  }

  const pointer = readJsonFile(statePath);
  const batchPath = pointer.latest_batch;
  if (!batchPath || typeof batchPath !== 'string') {
    throw new Error('Latest batch pointer is invalid: missing latest_batch.');
  }
  if (!fs.existsSync(batchPath)) {
    throw new Error(`Latest batch file is unavailable: ${batchPath}`);
  }

  const now = options.now ? parseNow(options.now) : new Date();
  const createdAt = parseNow(pointer.created_at || pointer.createdAt || '');
  if (now.getTime() - createdAt.getTime() > ttlMs(options.ttlHours)) {
    throw new Error('Latest batch pointer expired; re-run a free lookup before using row selections.');
  }

  return {
    batchPath,
    latestBatchUsed: true,
    pointer,
    statePath
  };
}

module.exports = {
  DEFAULT_TTL_HOURS,
  defaultBatchStatePath,
  nowIso,
  parseNow,
  readLatestBatchPointer,
  resolveBatchPath,
  writeLatestBatchPointer
};
