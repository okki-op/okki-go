# OKKI Go Project Agent Discipline

Before proposing plans or executing changes in this repository, apply this project-level discipline:

**Optimization must not replace determinism with convenience.**

For every iteration that makes OKKI Go smarter, more automatic, smoother, faster, or lower-friction, first preserve the critical certainties in the existing workflow:

- Is the target object deterministic?
- Is the state deterministic?
- Is the user confirmation deterministic?
- Is the action result predictable before the action runs?

Optimization may reduce mechanical steps and operational complexity, but it must not reduce confirmation, validation, safety boundaries, or the original workflow's business semantics. Every semantic split out of the workflow must have an explicit owner and a testable contract.

Every iteration or optimization plan must follow the `skill-creator` evaluation standard: start from concrete usage examples, validate scripts by running them, preserve concise/progressive-disclosure skill design, and forward-test realistic skill behavior when the change is substantial or failure-prone.

When a change introduces implicit state, automatic reuse, default selection, cache, batch behavior, mutable aliases such as `latest`, or any similar convenience mechanism, define the invariant before implementation:

> What must never become wrong because of this optimization?

For paid actions, email sending, remote writes, status changes, destructive actions, overwrites, or any workflow that can affect user data or user quota:

- Validate identity and scope before the action, not after it.
- Do not rely on mutable aliases as the final authority.
- Prefer deterministic script-level preflight checks over prompt-only instructions.
- Make failures happen before the paid/send/write/delete call.
- Add negative tests for state overwrite, stale state, polluted cache, switched context, expired mapping, or reused defaults.
- If an optimization removes a step, review whether it removed friction or removed a safety check.
