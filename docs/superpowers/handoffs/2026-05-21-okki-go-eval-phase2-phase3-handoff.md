# OKKI Go Evaluation Platform Handoff - Phase 2/3 Progress

Date: 2026-05-21

## Current State

The OKKI Go evaluation tool is implemented as a CLI-first harness under `okki-go/eval`.

It currently supports:

- `local-core` mode for phase 1 checks.
- `mock` mode as a scenario data mode alias using the local reference runner.
- `replay` mode with fixed redacted fixture data.
- `fixtures capture` safety-plan command.
- `local-agent` mode with adapter-level detection/profile preparation for selected Agents.
- Real CLI execution for Codex and OpenClaw.
- Configurable explicit CLI execution for Accio when a headless Accio command is available.

The tool still does not drive every Agent conversation. Codex and OpenClaw can execute scenarios through their CLIs. Accio can execute through a caller-supplied CLI command, but the desktop app on the current machine did not expose a stable headless `accio` executable in PATH. Claude Code still prepares an isolated profile and returns `blocked` with reason `agent_cli_execution_not_implemented`.

## Implemented Files

New or materially changed areas:

- `okki-go/eval/run.js`
- `okki-go/eval/lib/cli/args.js`
- `okki-go/eval/lib/runners/local-core-runner.js`
- `okki-go/eval/lib/runners/replay-runner.js`
- `okki-go/eval/lib/runners/local-agent-runner.js`
- `okki-go/eval/lib/runners/reference-agent.js`
- `okki-go/eval/lib/api/replay-server.js`
- `okki-go/eval/lib/fixtures/loader.js`
- `okki-go/eval/lib/fixtures/capture.js`
- `okki-go/eval/lib/judge/quality-judge.js`
- `okki-go/eval/lib/judge/llm-judge.js`
- `okki-go/eval/lib/judge/manual-review.js`
- `okki-go/eval/lib/judge/rule-judge.js`
- `okki-go/eval/lib/reports/json-reporter.js`
- `okki-go/eval/lib/reports/markdown-reporter.js`
- `okki-go/eval/lib/adapters/*`
- `okki-go/eval/fixtures/live-captures/vertical-auto-parts-de/*`
- New tests under `okki-go/eval/test/*`.

## Supported Commands

Run from:

```bash
cd /Users/carrie/Carrie的vibe工作间/skills/okki-go/eval
```

Core:

```bash
npm test
node run.js --mode local-core --suite all --report
node run.js --mode local-core --suite routing --report
node run.js --mode mock --suite routing --report
```

Replay:

```bash
node run.js --mode replay --suite business --fixture vertical-auto-parts-de --report
node run.js --mode replay --suite business --fixture vertical-auto-parts-de --scenarios e2e-procurement-outreach --report
node run.js --mode replay --suite business --fixture vertical-auto-parts-de --repeat 3 --report
```

Fixture capture safety plan:

```bash
node run.js fixtures capture --scenario vertical-auto-parts-de --allow-real-api --max-paid-credits 5 --no-email-send
```

Local Agent adapter smoke:

```bash
node run.js --mode local-agent --suite routing --agents codex --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents accio --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents accio --scenarios trigger-company-search-industry-country --agent-cli /path/to/accio-cli --agent-cli-args 'agent,--message,{prompt},--json' --report
node run.js --mode local-agent --suite routing --agents openclaw --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents claudecode --scenarios trigger-company-search-industry-country --report
node run.js --mode local-agent --suite routing --agents codex,accio,openclaw,claudecode --scenarios trigger-company-search-industry-country --report
```

## Current Adapter Coverage

Supported adapter names:

- `codex`
- `accio`
- `openclaw`
- `claude`
- `claudecode`
- `claude-code`

Current adapter behavior:

1. Detects local installation or account availability.
2. Creates a temp isolated profile.
3. Installs OKKI Go Skill to the temp profile.
4. Executes scenario for implemented real CLI drivers.
5. Returns `blocked` for scenario execution where real CLI driving is not implemented.

Local environment observed on 2026-05-21:

- `codex`: installed, executes through `codex exec`.
- `accio`: account detected at `/Users/carrie/.accio/accounts/1763281345`, returns `blocked`.
- `openclaw`: not found in shell PATH, returns `skipped` with `agent_not_installed`.
- `claudecode`: detected through `claude`, returns `blocked`.

## Latest Verified Results

Full test suite:

```text
npm test
tests 111
pass 111
fail 0
```

Agent matrix smoke:

```bash
node run.js --mode local-agent --suite routing --agents codex,accio,openclaw,claudecode --scenarios trigger-company-search-industry-country --report --output-dir /private/tmp/okki-eval-agent-matrix-check
```

Observed summary:

- total: 4
- failed: 0
- skipped: 1
- blocked: 3
- codex: installed, blocked
- accio: installed, blocked
- openclaw: skipped, `agent_not_installed`
- claudecode: installed, blocked

## Result Status Semantics

- `passed`: case passed.
- `failed`: behavior failed.
- `warned`: non-blocking issue.
- `skipped`: environment not covered, such as agent not installed.
- `blocked`: environment/profile boundary exists, but evaluator cannot execute the next step yet.

## Important Known Limitations

The tool is useful now for static/local/replay checks and adapter profile smoke, but it is not yet a full real-Agent evaluator.

Not implemented yet:

- Real CLI driving for Claude Code.
- Automatic Accio desktop/headless CLI discovery.
- API call interception from real Agent runs.
- Real replay/mock API injection into Agent runs.
- Live API fixture capture execution.
- Dashboard.
- Distributed export/import.
- CI gate.

## Recommended Next Step

Implement real CLI driving for one Agent first, preferably Claude Code or Codex.

Suggested order:

1. Add a generic `agent-execution` interface:
   - input: `profile`, `scenario`, `apiBaseUrl`, safety options
   - output: stdout, stderr, exit code, transcript text, duration, status
2. Implement for one CLI only.
3. Write tests using a fake executable fixture before calling real Agent CLI.
4. Connect real output to `judgeScenarioRun`.
5. Run one routing case end-to-end.

Do not start Dashboard or distributed mode before at least one real Agent can execute a scenario.

## Notes For New Session

Start by reading:

```bash
sed -n '1,260p' okki-go/docs/OKKI_GO_SKILL_EVALUATION_PLATFORM_DESIGN.md
sed -n '1,260p' okki-go/docs/superpowers/handoffs/2026-05-21-okki-go-eval-phase2-phase3-handoff.md
sed -n '1,260p' okki-go/eval/README.md
```

Then verify baseline:

```bash
cd okki-go/eval
npm test
node run.js --mode local-agent --suite routing --agents codex,accio,openclaw,claudecode --scenarios trigger-company-search-industry-country --report
```

Expect tests to pass and the agent matrix to show installed/skipped/blocked according to local environment.

## Worktree / Git Notes

The worktree contains existing unrelated `.DS_Store` files and a number of untracked scenario files from earlier work. They were not cleaned up or reverted.

Do not assume all untracked files are disposable. Review before staging or deleting.
