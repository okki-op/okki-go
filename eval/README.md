# OKKI Go Skill Evaluation

This directory contains the local evaluation harness for OKKI Go Skill.

It is not installed into Agent skill directories and is not included in the npm package published by `okki-go/package.json`.

## Phase 1 Commands

```bash
npm install
npm test
node run.js --mode local-core --suite all --report
node run.js --mode local-core --suite routing --report
node run.js --mode local-core --suite business --report
```

## Output

Reports are written under `eval/results/<run-id>/`.
