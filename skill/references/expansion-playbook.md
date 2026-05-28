# Prospecting Expansion Playbook

This playbook defines bounded prospecting expansion after the first free company search. It uses the session Brief from `discovery-playbook.md` and the Sales Mentor reverse-recommendation constraint from `sales-mentor-playbook.md`.

Expansion is reasoning over the current Brief and search results. It does not call paid endpoints, does not unlock companies, and does not persist expansion history outside the session Brief.

## 1. Trigger Rules

Every first-round `search-advanced` result must pass through exactly one expansion-mode decision after local-only filters have been applied. Use `filtered_results.length` when `employee_range` or another local-only filter exists; otherwise use the effective result count from the API response.

```text
first search complete
  -> effective_total < 5?
       yes -> Broadening Ladder
              if still below target_count -> Full Expansion
       no  -> effective_total < brief.target_count?
              yes -> Full Expansion
              no  -> Lite Expansion
```

### Mode 0: Broadening Ladder

Trigger: `effective_total < 5`, unless the user requested strict-only matching before the search.

Purpose: recover from overly strict parameters before generating new prospect angles.

Allowed relaxation plan:

1. Change `crossFieldOperator` from `"and"` to `"or"`.
2. If still likely under 5 and industry constraints are narrow, remove the least important `industryKeywords`.
3. If still likely under 5 and `withEmails: true` was set, remove `withEmails` temporarily.

Constraints:

- Ladder runs at most one extra `search-advanced` call for the current Brief.
- Ladder steps may be combined into that one call, but every relaxation must be disclosed to the user.
- Ladder does not count toward the Full Expansion max of 3 rounds.
- After Ladder runs, set `brief.ladder_applied = true` in session memory.
- Do not run Ladder again for the same Brief.
- If the user said "只要精确匹配" or "strict only", skip Ladder and go directly to Full Expansion if results are below target.

Ladder message pattern:

```text
首轮只找到 [X] 家，条件可能过严。我会先放宽搜索条件：
- crossFieldOperator: and -> or
- 暂时移除最窄的行业限制：[industry]

这仍是免费公司搜索；如后续解锁或找联系人，我会单独确认。
```

### Mode 1: Full Expansion

Trigger: `effective_total >= 5` and `effective_total < brief.target_count`, or Ladder finished and still remains below `target_count`.

Behavior:

- Show candidates across all five expansion dimensions.
- Generate 5-8 candidates per dimension.
- Every candidate must include a one-sentence "why this could be a prospect" reason.
- At least 20% of directions must be reverse recommendations, as defined in `sales-mentor-playbook.md`.
- Wait for user selection before running the next expanded free search.
- Maximum 3 Full Expansion rounds per Brief.

Stop conditions:

- User says "够了", "stop", "不要了", or equivalent.
- Full Expansion rounds reach 3.
- Cumulative effective total reaches or exceeds `brief.target_count`.

### Mode 2: Lite Expansion

Trigger: `effective_total >= brief.target_count`, unless the user disabled expansion suggestions.

Behavior:

- Do not interrupt the main result flow.
- After the result table, show a compact "you may not have considered" section.
- Pick exactly 2 of the five dimensions, defaulting to Value Chain + Application Scenarios.
- Generate 2-3 candidates per selected dimension.
- Each candidate must include a reason.
- User may choose a Lite candidate to start a later expanded search, but no extra search should run without user selection.

Lite dimension heuristics:

- If `geo_include` has only one or two countries, consider Value Chain + Geo Adjacency.
- If `product_anchor` is very narrow, consider Adjacent Products + Application Scenarios.
- If the result set is plentiful but homogeneous, prefer Synonyms + Application Scenarios.

User switches:

- "关闭发散建议" disables Lite Expansion for the session.
- "只要精确匹配" skips both Ladder and Lite for this Brief.

## 2. Expansion Dimensions

Each candidate belongs to one fixed dimension.

| Code | Dimension | What It Generates |
|------|-----------|-------------------|
| A | Value Chain | Upstream suppliers, downstream users, adjacent buyers in the same chain. |
| B | Adjacent Products | Substitute, complementary, upgrade/downgrade, or bundle-related products. |
| C | Application Scenarios | End-use scenarios where the product/service is consumed. |
| D | Synonyms | Alternate terms, abbreviations, translations, and industry wording variants. |
| E | Geo Adjacency | Nearby markets, language-adjacent markets, and regionally adjacent demand pools. |

Geo Adjacency must remain country-agnostic in static rules. Any runtime suggestion about a specific market must be based on the current Brief/Profile and, when speculative, follow `sales-mentor-playbook.md` source and inference limits.

## 3. Candidate Output Formats

### Broadening Ladder Template

```markdown
首轮搜索只找到 [X] 家公司。看起来条件比较严格，我先尝试放宽：

**放宽 1:** `crossFieldOperator` 从 `and` 改为 `or`
**放宽 2:** 暂时移除行业限制 `[industry]`

我会再做一次免费公司搜索。若仍不足目标数，再进入发散候选。
```

### Full Expansion Template

```markdown
首轮结果不足（找到 [effective_total] 家，目标 [target_count] 家）。我从 5 个维度生成候选，请勾选要尝试的方向：

### A. Value Chain
- [ ] A1. [candidate] — [why this could be a prospect]
- [ ] A2. [candidate] — [why this could be a prospect]

### B. Adjacent Products
- [ ] B1. [candidate] — [why this could be a prospect]

### Reverse Recommendations
- [ ] R1. 不推荐：[candidate] — [source-backed reason]

请回复编号（如 "A1, A2, B1"），或回复 "够了" 停止发散。
```

### Lite Expansion Template

```markdown
您可能没考虑过的角度：

### A. Value Chain
- [ ] A1. [candidate] — [why this could be a prospect]
- [ ] A2. [candidate] — [why this could be a prospect]

### C. Application Scenarios
- [ ] C1. [candidate] — [why this could be a prospect]

想看其中某个方向的公司，回复编号即可；不需要可以直接进入下一步。
```

### Reverse Recommendation Requirement

In Full Expansion, at least 20% of recommendation directions must be reverse recommendations. For every 5 directions, include at least 1 "do not recommend" direction with a source-backed reason.

Allowed reverse-recommendation sources:

- A mismatch with a Profile field.
- A mismatch with `profile.sales_context`.
- A conflict with `profile.exclusions`.
- A clearly marked inference that obeys the max-2 personal inference limit in `sales-mentor-playbook.md`.

Forbidden reverse recommendations:

- Unsupported claims about a country, industry, season, or buyer behavior.
- Stereotypes about regional customers.
- Live market or company claims without user-provided source data.

## 4. User Selection Format

Accept these input forms:

- Number list: `A1, A2, B1`
- Dimension-wide selection: `A 全选`, `all of B`
- Natural language: `下游全要，相邻产品里的 DTG`
- Stop signal: `够了`, `stop`, `不要了`, `skip expansion`

Selection parsing must preserve the candidate IDs selected by the user and record them in `brief.expansion_rounds[]`.

If a selection is ambiguous, ask one clarifying question before another search.

## 5. Candidate to Brief Field Mapping

Apply candidate selections to a copied expanded Brief. Do not destructively overwrite the original Brief.

| Candidate Dimension | Expanded Brief Field |
|---------------------|----------------------|
| Value Chain | Append `company_type` and/or `industry` terms. |
| Adjacent Products | Append `product_anchor` terms. |
| Application Scenarios | Append `industry` terms. |
| Synonyms | Append to `product_anchor`. |
| Geo Adjacency | Append to `geo_include` after ISO normalization. |

Injection rules:

- Append only; never delete original Brief fields.
- Use `crossFieldOperator: "or"` for expansion rounds.
- A single expansion round may include candidates from multiple dimensions, but it produces only one free `search-advanced` call.
- Add a record to `brief.expansion_rounds[]` with selected candidate IDs, mapped fields, generated API parameters, effective count, and timestamp.

## 6. Multi-Round Limits

After each expansion search:

1. Recompute cumulative effective total after local-only filters.
2. If cumulative total meets or exceeds `target_count`, stop Full Expansion and continue result grouping.
3. If still below target and fewer than 3 Full Expansion rounds have run, ask whether the user wants another round.
4. If the user stops or the 3-round limit is reached, continue with available results and explain that expansion stopped.

Ladder does not count as a Full Expansion round. Lite Expansion does not count as a Full Expansion round unless the user selects a Lite candidate and starts an expanded search; that later search becomes Full Expansion round 1 for the current Brief.

Expansion never implies paid unlock or contact retrieval. Paid-action and email-send confirmations remain governed by `discovery-playbook.md` Hard Guardrails and the main `SKILL.md`.

## 7. Result Grouping After Expansion

Expansion returns candidate directions and, after user selection, may produce another free company search. It does not own viewed-state persistence.

After an expansion search finishes:

- Reapply any local-only filters from `discovery-playbook.md`.
- Recompute the effective total for stopping decisions.
- Merge or present results according to the current session flow.
- Re-run viewed classification from `discovery-playbook.md` Section 6 before final display.

Final result labels must remain the same across non-expanded and expanded searches:

- `unlocked`: previously paid-unlocked within the active window.
- `seen`: previously displayed within the active window.
- `new`: not seen in the active window.

Do not create separate persistent states for "expanded", "saved", or "dismissed" in v1.2.0. If a result came from an expansion candidate, annotate it in the display as expansion-origin context only; do not mutate `viewed.json` beyond shown/unlocked lifecycle writes.
