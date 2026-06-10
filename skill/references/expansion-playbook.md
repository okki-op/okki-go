# Prospecting Expansion Playbook

Expansion is **new search branches** after a visible company batch or a guided customer-route hypothesis. It is not hidden recovery, not a default mentor mode, and not a paid action.

Expansion may generate more customer routes, but only user-confirmed routes are searched. It never unlocks companies, searches contacts, sends emails, or authorizes credit spend.

## 1. Pagination Comes First

Before treating "more", "continue", "next page", "too few", "not enough", "expand", or "change batch" as Expansion, inspect the latest compact batch state.

Use these deterministic rules:

1. If `has_next_page=true`, or `next_offset` exists and is less than `available`, stay in L0 pagination and fetch the next page.
2. Only consider Expansion when there is no next page, `next_offset` is empty, or `available <= next_offset`.
3. If batch state is missing or expired, do not guess. Restore the latest batch pointer or rerun a free lookup before deciding.
4. User feedback like "these are not buyers", "all suppliers", or "not what I want" is diagnosis, not simple Expansion; route to L2 Mentor Guided unless the user only asks for next page and pagination exists.

Useful markers for automated traces:

- `expansion_not_selected_when_next_page_exists`
- `expansion_selected_when_current_batch_exhausted`
- `post_result_too_few_skips_hidden_recovery`
- `first_visible_output_under_60s_guard`

## 2. Trigger Conditions

Expansion is appropriate when:

- A displayed batch is exhausted and the user still wants more usable prospects.
- The user asks for other customer types, other application scenarios, another cooperation mode, or another route.
- L2 Mentor Guided has searched one graph path and the user confirms trying a second route.
- The current route is low-yield after the small recovery budget.

Do not trigger Expansion when:

- The user asks "next page" and batch pagination is available.
- The user asks for "20 more similar" and `next_offset` is available.
- The user asks for search-method diagnosis; use L2 Mentor Guided.
- The user asks for latest market information; use Web Research Add-on only if explicit.

## 3. Candidate Branches

When Expansion is allowed, offer **2-3 candidate expansion branches**. Each branch should be a distinct customer-side route:

- channel/resale route
- brand/OEM route
- integration/engineering/project route
- service/maintenance/retrofit route
- direct use/operator route
- project-trigger route

Each branch must include:

- branch label
- why this route could buy, specify, resell, integrate, maintain, retrofit, or use the offer
- one recall-first payload idea
- `local_priority_rule`
- avoid or not recommended signals

Do not pack multiple branches into one OR-style payload. The user confirms one branch; search only that branch. If the user says "try all", ask which one to start with unless they explicitly accept sequential searches.

## 4. Recallability Guard

Every expansion branch must pass the OKKI Recallability Guard from `sales-mentor-playbook.md`:

- First payload prefers one primary search field plus target geography.
- Secondary buyer-route signals go to `local_priority_rule` when they may over-narrow recall.
- Do not default to `productKeywords + companyTypeKeywords + industryKeywords`.
- Do not use `crossFieldOperator: "AND"` as a mentor precision shortcut.
- If recall is weak, change broad target-side words or switch one route; do not keep narrowing.

Example branch:

```json
{
  "branch": "integration/project route",
  "why": "automation integrators may specify or integrate equipment in production-line projects",
  "search_payload": {
    "productKeywords": ["industrial automation", "production line automation"],
    "includeCountry": ["DE"],
    "from": 0,
    "size": 20
  },
  "local_priority_rule": "prioritize integrator / retrofit / production line service signals",
  "avoid": ["generic equipment manufacturer", "component supplier"]
}
```

## 5. Recovery and Timing Budget

Expansion is not a way to hide many slow searches.

- The first visible output under 60 seconds is the priority.
- Use one automatic recovery round by default in the current search action.
- The hard cap of 3 automatic recovery rounds is only an exception for clearly improved, broader payloads.
- L2 first round searches one graph path; additional graph paths require user confirmation.
- After a user confirms a new branch, start a new search action and explain the new route briefly.

## 6. Result Presentation After Expansion

Keep expanded results explainable:

- Show the company table.
- Label which branch produced the batch.
- Add priority unlock / observe / not recommended guidance when the user asked for analysis or the route is guided.
- Preserve internal row-to-domain mappings privately.
- Do not run viewed classification unless the user explicitly asked for new/non-repeated companies.

Expansion never changes paid-action rules. Before `/companies/unlock`, `/contacts/search`, or email send, ask the confirmations required in `SKILL.md`.
