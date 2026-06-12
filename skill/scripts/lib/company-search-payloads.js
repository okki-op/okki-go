'use strict';

const KEYWORD_FIELDS = ['companyTypeKeywords', 'productKeywords', 'industryKeywords'];
const MAX_KEYWORDS_PER_FIELD = 5;

function splitCompanySearchPayload(payload, options = {}) {
  const maxKeywords = positiveIntegerOrDefault(options.maxKeywordsPerField, MAX_KEYWORDS_PER_FIELD);
  const chunksByField = KEYWORD_FIELDS.map((field) => {
    const values = Array.isArray(payload[field]) ? payload[field] : [];
    return {
      field,
      chunks: values.length > maxKeywords ? chunk(values, maxKeywords) : [values]
    };
  });

  const splitPayloads = [];
  for (const companyTypeKeywords of chunksByField[0].chunks) {
    for (const productKeywords of chunksByField[1].chunks) {
      for (const industryKeywords of chunksByField[2].chunks) {
        const next = { ...payload };
        applyKeywordChunk(next, 'companyTypeKeywords', companyTypeKeywords);
        applyKeywordChunk(next, 'productKeywords', productKeywords);
        applyKeywordChunk(next, 'industryKeywords', industryKeywords);
        splitPayloads.push(next);
      }
    }
  }

  return {
    payloads: splitPayloads,
    splitQueryCount: splitPayloads.length
  };
}

function applyKeywordChunk(payload, field, values) {
  if (!Array.isArray(values) || values.length === 0) {
    delete payload[field];
    return;
  }
  payload[field] = values;
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function positiveIntegerOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

module.exports = {
  KEYWORD_FIELDS,
  MAX_KEYWORDS_PER_FIELD,
  splitCompanySearchPayload
};
