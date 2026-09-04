# Verification Guide: Challenge Core Browsing Flow

This guide verifies the [Core Browsing Screen Contract](./contracts/core-browsing.md) with automated tests. Manual testing will be conducted for the overall Core Demo after the visual and Reveal implementation in SPEC 010.

## Prerequisites

- Node.js 22.13 or later or 24 or later, npm, Wrangler, and a local D1 environment are available.
- Fixtures are available for `DRAFT`, `OPEN`, `CLOSED`, `REVEALED`, and answer counts of zero, one, and multiple.
- Use a unique secret value in another user's Answer so HTML exposure can be detected.

## Automated Verification

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
```

## Home

1. Confirm that only `OPEN` Questions appear, ordered by deadline.
2. Confirm the body, zero/one/multiple answer counts, sealed indicator, absolute deadline, nonnegative remaining time, and Detail link.
3. Distinguish the empty state with zero Open Questions from a repository failure returning 503.
4. Confirm that the Answer secret value appears zero times in the HTML.

## Question Detail

1. Open the same `OPEN` Question while signed out, as its creator, as a signed-in user without an Answer, and as a signed-in user who has answered.
2. Confirm that public information, sealed state, Sign in, Agent Prompt, and the current user's Answer are displayed mutually exclusively for the applicable states. For an unanswered Question, confirm that the one-line Agent Prompt is `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`, specifies ChatGPT's built-in browser, and replaces `{{questionUrl}}` with an absolute Question URL using the currently viewed origin and containing neither query nor fragment.
3. Confirm that `get_question` returns fixed instructions defining available user-context sources and evidence rules. When relevant user-authored statements exist, submit without an additional preview or approval and confirm success with `get_my_submission`. When evidence is insufficient, confirm that the Agent does not post generic advice and instead asks the human a question.
4. After two users post Answers, confirm that the answer count increases to two and each user can see only their own Answer.
5. For `CLOSED`, confirm that acceptance has ended, the content remains sealed, and no new Prompt appears.
6. Confirm that Draft and missing Questions both return the same 404.
7. Confirm that `REVEALED` does not regress the minimal browsing behavior from SPEC 008.
8. Confirm that state, remaining time, and Prompt availability agree immediately before, exactly at, and immediately after the deadline.

## Administration Interface

1. Set `ADMIN_EMAIL` to the email address of the Google account used for administration.
2. Open `/club-operations` and each of its four list paths while signed out, as a regular user, and as the administrator. Confirm that only the administrator can view them. The other two states must return the same response as an ordinary 404, without text or links that reveal the administration interface.
3. Confirm that the administration landing page contains only counts and dedicated list links for Users, Questions, Answers, and Audit Logs, and contains no individual records.
4. Confirm that all four dedicated lists use tables with 20 records per page, and that when there are 21 or more records, `Previous` and `Next` navigate without duplicates.
5. Confirm that the former `/admin` returns 404 without redirecting, public screens contain no link to the administration interface, and administration pages contain `noindex, nofollow`.
6. Delete a Question and confirm that its child Answers are also deleted while other Questions and audit logs remain.
7. Delete one Answer from among multiple Answers and confirm that the Question and other Answers remain and that the answer count decreases.
8. Ban a regular user and confirm that existing sessions are invalidated and a subsequent login is rejected.
9. Remove the ban and confirm that the next login succeeds.
10. Confirm that banning the administrator, administration POSTs by a regular user, and deletion of a nonexistent target are rejected safely.

## Audit Records

1. Perform login, logout, Question create/update/publish, and Answer create/update/delete operations.
2. Confirm that one record containing actor, action, target, outcome, and time is created for every successful operation.
3. Put secret values in a Question body and an Answer body, then confirm that no audit-log column contains those secrets, excerpts, cookies, tokens, or OAuth values.
4. Confirm that administrator deletion, ban, and unban records preserve the acting administrator as the actor.

## Completion Criteria

- Home's Open filtering, ordering, and answer counts match the expected values in 100% of cases.
- Viewer-specific presentation and the mutual exclusivity of the Prompt and the current user's Answer match in 100% of cases.
- There are zero exposures of another user's secret value in `OPEN` or `CLOSED`.
- All regression tests pass for existing Question management, Google authentication, the five WebMCP tools, Answer update/delete, and minimal Reveal browsing.
- All tests pass for administration authorization, lists, deletion, ban/unban, and audit records.
- Record the automated quality-gate results in `validation-record.md`.
