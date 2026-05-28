# Merchant Profile Playbook

This playbook defines the long-term Merchant Profile contract used by OKKI Go discovery and outreach workflows. It is a rule contract for `~/.config/okki-go/profile.json` v1.1; implementation details for reading and writing the file belong to `skill/scripts/okki-state.js`.

## 1. Profile Schema

`profile.json` is stored at `${XDG_CONFIG_HOME:-$HOME/.config}/okki-go/profile.json` with file mode `0600`. The schema version is `"1.1"`.

### Field Classes

Fields are split by inference risk.

**A class fields** do not carry `source` metadata. They are values the user must provide directly or confirm explicitly, so they are treated as `user_confirmed`:

- `company.name`
- `company.website`
- `company.country`
- `company.employee_range`
- `company.founded_year`
- `outreach_identity.sender_name`
- `outreach_identity.sender_email`
- `outreach_identity.sender_title`
- `outreach_identity.signature_block`
- `outreach_identity.preferred_language`
- `offerings.primary_products`
- `offerings.landing_page`

**B class fields** must be stored as objects with `value`, `source`, and `updated_at`:

- `offerings.usps`
- `offerings.applications`
- `offerings.certifications`
- `target_baseline.regions_primary`
- `target_baseline.decision_roles`
- `exclusions.industries_blacklist`

### Source States

| Source | Meaning | May Feed Discovery Defaults | Write Rule |
|--------|---------|-----------------------------|------------|
| `user_confirmed` | User explicitly confirmed the value for future reuse. | Yes | Write after the user confirms saving or onboarding answer. |
| `user_provided` | User said the value in-session but did not confirm long-term profile reuse. | Only if no confirmed/imported value exists for that field. | Write only when the user gave the value clearly. |
| `agent_inferred` | Agent inferred the value and it is waiting for user confirmation. | No | Must be labeled and followed by a confirmation prompt. |
| `imported` | User imported the value from an external system or file. | Yes | Treat as confirmed unless the import UI marks it otherwise. |

`agent_inferred` values must never silently become facts. They can be stored to support later confirmation, but they are excluded from Discovery defaults until the user confirms them.

### Completeness

`completeness` is a number from `0` to `1`. It is computed from the five profile field families and only counts user-confirmed data:

- company identity
- offerings
- target baseline
- outreach identity
- sales context

Completeness drives Progressive Enrichment and the three-tier confirmation flow in `discovery-playbook.md`.

### Dynamic Trade Anchor

`profile.company.country` is the L0 anchor for dynamic `trade_mode` inference. `trade_mode` itself is not stored in the Profile. It is derived per session after a Brief exists:

```text
trade_mode = derive(profile.company.country, brief.geo_include)
```

When `company.country` is missing, `trade_mode = unknown`; direct free company search may continue under `discovery-playbook.md`, but trade-mode-dependent mentor advice must degrade or be deferred.

### Preferred Language Lazy Loading

`outreach_identity.preferred_language` starts as `null` and is not mandatory during Lite Onboarding. The first outreach workflow that needs it may infer a default, present it to the user, and write the confirmed value back as user-confirmed profile data.

Default inference rules:

- `trade_mode = domestic` and `profile.company.country` has a known local language: propose that local language.
- `trade_mode = domestic` and the country is commonly English-speaking: propose `en`.
- `trade_mode = cross_border` and target markets are mainly English-speaking: propose `en`.
- `trade_mode = cross_border` and target markets are mainly non-English-speaking: propose `en` as a common cross-border default and ask whether localization is needed.
- `trade_mode = mixed`: ask the user instead of guessing.
- Unknown or ambiguous cases: ask the user.

### Sales Context

`sales_context` stores Business Context Lite answers from `sales-mentor-playbook.md`: `goal`, `time_horizon`, `channel`, `source`, and `updated_at`. Discovery reads it before repeating BC1/BC2 and asks whether to keep or adjust the previous sales objective. BC3 is only reused when current `trade_mode` is known and compatible with the current Brief.

### Example v1.1 Profile

```json
{
  "version": "1.1",
  "updated_at": "2026-05-28T10:00:00Z",
  "completeness": 0.7,
  "company": {
    "name": "Example Manufacturing Co.",
    "country": "CN",
    "type": ["manufacturer"],
    "employee_range": "50-200",
    "founded_year": "2010",
    "website": "https://example.com"
  },
  "offerings": {
    "primary_products": ["DTF printer"],
    "product_keywords_zh": ["数码热转印机", "DTF打印机"],
    "product_keywords_en": ["DTF printer", "direct-to-film printer"],
    "applications": [
      { "value": "custom apparel", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "promotional gifts", "source": "agent_inferred", "updated_at": "2026-05-28" }
    ],
    "usps": [
      { "value": "Tier-1 components", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "in-house R&D", "source": "user_provided", "updated_at": "2026-05-26" }
    ],
    "certifications": [
      { "value": "quality management certification", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ],
    "landing_page": "https://example.com/products"
  },
  "target_baseline": {
    "company_types": ["manufacturer", "trading"],
    "regions_primary": [
      { "value": "US", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "DE", "source": "user_confirmed", "updated_at": "2026-05-26" },
      { "value": "AU", "source": "agent_inferred", "updated_at": "2026-05-28" }
    ],
    "regions_excluded": ["RU"],
    "decision_roles": [
      { "value": "Procurement Manager", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ],
    "employee_range": "50-1000"
  },
  "outreach_identity": {
    "sender_name": "Sender Name",
    "sender_title": "Sales Manager",
    "sender_email": "sender@example.com",
    "signature_block": "Sender Name | Example Manufacturing Co.",
    "preferred_language": null
  },
  "sales_context": {
    "goal": "expand_new_market",
    "time_horizon": "this_quarter",
    "channel": "edm",
    "source": "user_confirmed",
    "updated_at": "2026-05-28"
  },
  "exclusions": {
    "competitor_domains": ["competitor.example"],
    "industries_blacklist": [
      { "value": "restricted industry", "source": "user_confirmed", "updated_at": "2026-05-26" }
    ]
  },
  "history": {
    "last_used_axes": {
      "geo": ["DE", "US"],
      "industry": ["textile printing"],
      "decision_role": ["Procurement Manager"]
    },
    "search_count": 12
  }
}
```
