# OKKI Go Visible Output Format Plan

Date: 2026-06-12

## Goal

Move normal OKKI Go company discovery and unlock outputs closer to final user-visible presentation, while keeping private/raw fields script-owned and reducing model-side formatting work.

## Agreed Output Contract

### Free Company Search

Default visible rows should show whether email and WhatsApp are available, not exact counts.

Visible fields:

- `row`
- `company_name`
- `country_code`
- `country_name`
- `company_type`
- `fit`
- `has_email`
- `has_whatsapp`
- `employees_count`
- `founding_time`

Rules:

- `has_email` is `true` when any search response email count field is greater than zero.
- `has_whatsapp` is `true` when any search response WhatsApp count field is greater than zero.
- Do not show `email_count` or `whatsapp_count` in normal compact search output.
- Continue hiding `domain`, IDs, website/homepage/url/link fields, raw paths, and debug metadata unless explicitly requested.

### Unlock Company Details

Do not show a separate unlock-result table. After confirmed unlock, output company details directly.

Normal compact output should include:

- charge and balance summary
- `company_details`: only the first 5 selected companies for chat display
- `total_details_count`
- `displayed_details_count`
- `details_markdown_saved`
- `details_markdown_path`
- warnings when applicable

All selected unlocked company details must be written to a Markdown file. Users should be directed to the Markdown file when more than 5 companies are unlocked.

Company detail fields:

- `row`
- `company_name`
- `country_code`
- `country_name`
- `display_website` from `profile.website || profile.domain || row.domain`
- `founded_year`
- `employees`
- `company_type`
- `main_products`
- `has_email`
- `has_whatsapp`
- `email_preview`
- `phone_preview`
- `social_links`
- `description`
- `contacts`
- `profile_available`

Rules:

- Free search still hides `domain`; unlocked details may show `display_website`.
- User-facing Markdown is the only normal exported detail artifact. Raw JSON remains internal/debug only.
- Default chat display cap is 5 company details.
- Keep raw unlock/profile/profileEmails payloads saved for recovery and debug.

## Implementation Steps

1. Add tests for free search `has_email` and `has_whatsapp`, and absence of `email_count` / `whatsapp_count`.
2. Add tests for unlock output using `company_details`, Markdown detail file creation, and first-5 chat display cap.
3. Update compact company row shaping in `skill/scripts/lib/compact-output.js`.
4. Update `skill/scripts/unlock-companies.js` to build company details and Markdown output.
5. Update script README/output contract references.
6. Run Node tests for script behavior.
