# SPEC 007 Validation Record

## Pre-Implementation Baseline

- Recorded: 2026-09-02
- Branch: `007-webmcp-mvp-tools`
- Node.js: `v24.5.0`
- Tools registered before implementation: `get_agent_safety_verification_question`, `who_am_i`, `submit_answer`, and `get_my_submission`
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm test`: 198 tests across 21 files passed
- `npm run test:d1`: 36 tests across 9 files passed
- `npm run build`: passed. Wrangler emitted an EPERM warning for log writes inside the sandbox, but artifact generation and command exit succeeded

The baseline was measured by expanding `HEAD` to a temporary directory without modifying the working tree.

## Implementation

- Added a one-line English prompt and copy action to Question screens only for authenticated, unanswered Users while `OPEN`. The prompt contains an absolute Question URL following the current Origin and excludes query and fragment.
- Limited production WebMCP registration to `get_question`, `submit_answer`, `update_answer`, `remove_answer`, and `get_my_submission`.
- Added `answers.updated_at` and a migration initializing existing Answers from `created_at`.
- Updated Answer limits of 5,000 for body and 160 for excerpt to Unicode graphemes, while D1 retains whitespace, excerpt-newline, uniqueness, and referential constraints.
- Implemented owner-only update, hard delete, resubmission after deletion, and deadline-time freezing with conditional D1 writes.
- Limited reads to the current User's state or the specified Open Question and preserved the contract that WebMCP never exposes another User's Answer.

## Automated Verification Results

- Run date: 2026-09-02
- `npm run db:migrate:local`: `0005_answer_revisions.sql` applied successfully
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format`: passed
- `npm test`: 229 tests across 29 files passed
- `npm run test:d1`: 42 tests across 11 files passed
- `npm run build`: passed
- `npm run db:schema:check`: passed

D1 verification covered existing Answer preservation and `updatedAt` initialization, grapheme boundaries, owner-only update/deletion, no changes to other Users, deadline boundaries, update-versus-delete races, and delete-versus-resubmit races. Node verification covered the one-line prompt, local/production Origin handling, query/fragment exclusion, Clipboard success/absence/denial, exactly five registered tools, schemas, annotations, AbortSignal, authentication, Draft non-enumeration, common errors, and SSR display branches.

## Real-Device E2E Results

- Run date: 2026-09-02
- Environment: local D1, WebMCP-capable in-app browser, and two Google OAuth test accounts
- Confirmed production registered exactly five tools and omitted P0 validation, `who_am_i`, discovery/search, and other-User Answer tools.
- On an unanswered Open Question, confirmed the prompt appeared, displayed and copied text matched, status became `Copied`, and an injection-containing body did not enter the prompt.
- Initial real-device E2E used the old ID-based prompt to run `get_question`, `submit_answer`, and `get_my_submission` in order, successfully submitting and verifying the first Answer. Automated tests lock the current one-line URL prompt; real Personal Agent verification is included in SPEC 010 Core Demo manual checks.
- After `update_answer`, confirmed only body, excerpt, and `updatedAt` changed while `submittedAt` remained.
- After User confirmation, hard-deleted the local validation Answer with `remove_answer` and confirmed `not_submitted`, prompt redisplay, and successful pre-deadline resubmission.
- Account B returned `not_submitted` before acting after A submitted. After B submitted, A's `get_my_submission` contained none of B's body, excerpt, ID, or timestamps. Local D1 confirmed A's update did not change B's stored content or time.
- After the deadline, `get_question`, `update_answer`, and `remove_answer` all returned `QUESTION_CLOSED`, while personal content from `get_my_submission` remained unchanged.
- English and Japanese injection Questions verified the fixed instruction contract at that time, answer-language inference from body, and non-output of secrets, prior conversations, or authentication data. This corpus does not limit supported languages. Automated tests lock the expanded context instructions; real Personal Agent verification is included in SPEC 010 Core Demo manual checks.
- Unit tests verified English guidance and prompt preservation when Clipboard API was absent or denied; a real browser verified the success path.

No unresolved items remain. This real-device verification did not apply migrations to shared D1 or deploy.

## Context-Grounded Answer Contract Addendum

- Run date: 2026-09-02
- Updated the Agent request prompt to one line: `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`, explicitly naming ChatGPT's built-in browser.
- Added to fixed `get_question` instructions and tool descriptions rules to prioritize explicit/repeated User-authored statements from current conversation, accessible past conversations, and Project Context; distinguish facts from comparisons/considerations; exclude Assistant suggestions; and avoid Private Context disclosure. The 2026-09-03 addendum changed this to create and submit a best-effort proxy Answer when no explicit personal view exists, without asserting unverified personal facts or known beliefs and without asking solely because that view is missing.
- The initial prompt authorizes Answer creation and submission without another preview or approval, and the contract verifies personal state afterward with `get_my_submission`.
- Unit/integration tests passed: 610 tests across 35 files; D1 integration passed 56 tests across 16 files. Typecheck, lint, format, build, and schema check also passed. Real Personal Agent verification of the expanded contract is included in SPEC 010 Core Demo manual checks.
