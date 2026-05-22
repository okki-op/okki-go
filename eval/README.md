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

## Phase 2 Commands

Replay mode evaluates routing and business scenarios against fixed, redacted fixture data:

```bash
node run.js --mode replay --suite routing --fixture vertical-auto-parts-de --report
node run.js --mode replay --suite business --fixture vertical-auto-parts-de --scenarios e2e-procurement-outreach --report
node run.js --mode replay --suite business --fixture vertical-auto-parts-de --repeat 3 --report
```

Fixture capture is guarded by live API safety flags. The current implementation builds a capture plan and enforces the safety gates before any live capture implementation is added:

```bash
node run.js fixtures capture --scenario vertical-auto-parts-de --allow-real-api --max-paid-credits 5 --no-email-send
```

## Output

Reports are written under `eval/results/<run-id>/`.

Phase 2 reports include routing metrics, business quality aggregates, and `manual-review.json` records for high-risk or low-quality cases.

## Phase 3 Local Agent Smoke

`local-agent` mode now has the first real-agent evaluation boundary:

- detects selected local Agent CLIs
- marks missing or unsupported Agents as `skipped`
- prepares isolated profiles for Codex, Accio, OpenClaw, and Claude Code
- installs OKKI Go Skill into that profile
- executes Codex through `codex exec`, captures stdout/stderr as transcript evidence, parses routing/API markers, and runs the rule judge
- keeps Accio, OpenClaw, and Claude Code at profile smoke coverage for now, with scenario execution marked `blocked`

```bash
node run.js --mode local-agent --suite routing --agents codex --scenarios trigger-company-search-industry-country --use-real-agent-config --report
node run.js --mode local-agent --suite routing --agents accio --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents openclaw --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents claudecode --scenarios trigger-company-search-industry-country --report
```

For unsupported or unavailable Agents:

```bash
node run.js --mode local-agent --suite routing --agents openclaw --report
```

Skipped means the local environment did not cover that Agent. Blocked means the Agent/profile boundary exists, but the next execution capability has not been implemented yet.

For Codex transcript scoring, the evaluator asks the CLI to include machine-readable markers:

```text
ROUTING_DECISION: triggered|triggered_pending_prerequisite|not_triggered
API_CALL: METHOD /api/path
```

The raw stdout/stderr transcript is still stored in case results when those markers are missing or the run fails. For Codex, `--use-real-agent-config` copies only startup/auth files such as `auth.json` and `config.toml` into the isolated temporary profile so the real CLI can authenticate without writing to the user's real `~/.codex` directory.

## Packaging Guard

The eval tool must stay outside the published npm package.

Before publishing `@okki/go-skill`, verify:

```bash
cd ..
npm --cache /private/tmp/okki-npm-cache pack --dry-run --json
```

The pack list must include `bin/`, `skill/`, `INSTALL.md`, `README.md`, and `package.json`.

The pack list must not include `eval/`.
