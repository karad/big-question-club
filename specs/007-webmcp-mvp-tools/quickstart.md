# Verification Guide: WebMCP MVP Tools

This guide verifies the flow from the copyable Question-screen prompt through the five WebMCP tools and submission, update, deletion, resubmission, and verification of the current User's Answer. See the [WebMCP contract](./contracts/webmcp-tools.md) for input/output, the [Answer HTTP contract](./contracts/answer-mutations.md) for HTTP and concurrency, and the [prompt contract](./contracts/agent-request-prompt.md) for display copy.

## Prerequisites

- Node.js 22.13 or later or 24 or later, npm, and Wrangler are available.
- Local D1 migrations can be applied.
- WebMCP-capable Chrome can sign in to Big Question Club with Google.
- Two non-sensitive test accounts and a Personal Agent are available.
- Prepare Japanese, English, and prompt-injection test Questions.

## Automated Verification

```bash
npm install
npm run db:migrate:local
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
```

Expected results:

- Existing Answer count, owners, bodies, excerpts, and creation times remain after migration, with `updatedAt === createdAt`.
- Grapheme boundaries, one-line prompt, Question URLs following local/production Origins, schemas and annotations for five tools, HTTP statuses, and English errors all pass.
- Owner-only update/remove, deadline boundaries, resubmission after deletion, and update/delete conflicts produce zero changes to another User's Answer.
- The SSR prompt appears only for authenticated, not-submitted Users while `OPEN` and contains no Question body.

## Start Locally

```bash
npm run dev
```

Open the displayed same-origin URL in WebMCP-capable Chrome. Enable Chrome's WebMCP testing setting for local verification if needed.

## Human-Initiated First Answer

1. Sign in as account A.
2. Open an unanswered `OPEN` Question.
3. Confirm `Ask your personal agent`, the update/removal-until-deadline notice, selectable English prompt, and `Copy prompt` appear.
4. Confirm the prompt is exactly the following one line, with `{{questionUrl}}` replaced by the current page's absolute URL. It contains no query, fragment, Question body, User data, or Answer data.
   `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`
5. Select `Copy prompt` and confirm `Copied` is announced and displayed text matches the clipboard result.
6. Paste the prompt into the Personal Agent.
7. Confirm the Agent opens the specified URL, interprets the tool contracts exposed by that page, and retrieves only the target Question. It prioritizes explicit User-authored statements from the current conversation, accessible past conversations, and Project Context; answers and submits without another preview or approval; and verifies success with `get_my_submission`. When no explicit personal view exists, confirm it creates and submits the best proxy answer the User would likely give, without asserting unverified personal facts or known beliefs and without asking the Human solely because that view is missing.
8. Reload the Question screen and confirm the new-submission prompt disappears and the current User's submitted state appears.

If Clipboard is disabled or denied, confirm an English failure status appears and the on-screen prompt remains manually selectable and copyable. Also confirm copying alone invokes no WebMCP tool.

## Answer Update, Deletion, and Resubmission

1. Explicitly ask account A's Personal Agent to update the Answer body and excerpt for the same Question.
2. Confirm the Agent calls `update_answer` exactly once and returns `updated`.
3. Confirm `get_my_submission` returns the new body, excerpt, and `updatedAt`, with unchanged `submittedAt`.
4. Explicitly ask the Agent to remove the current User's Answer.
5. Confirm it calls `remove_answer` exactly once and returns `removed`.
6. Confirm `get_my_submission` becomes `not_submitted` and the first-answer prompt reappears on the Question screen.
7. Before the deadline, paste the prompt again and confirm exactly one new Answer can be submitted.

## Two Users and the Sealed Boundary

1. Submit a different Answer to the same Question as account B.
2. Confirm account A receives none of B's body, excerpt, Answer ID, submission time, or User data through any of the five tools.
3. Confirm A's `update_answer` and `remove_answer` do not change B's body, excerpt, or count.
4. With A's Answer removed, confirm B's existence does not alter A's `get_my_submission`, which remains `not_submitted`.
5. After Reveal, confirm none of the five tools returns another User's Answer and that `update_answer` and `remove_answer` return `QUESTION_CLOSED`.

## Boundary and Concurrency Matrix

| Case | Subject | Time | Operation | Expected Result |
| --- | --- | --- | --- | --- |
| First submission | Current User | Before deadline | submit | One success |
| Duplicate submission | Current User | Before deadline | submit | `ANSWER_ALREADY_SUBMITTED` |
| Update | Current User | Before deadline | update | Same Answer updated |
| Delete | Current User | Before deadline | remove | Only current User's Answer deleted |
| Resubmit after deletion | Current User | Before deadline | submit | One new Answer succeeds |
| No update target | Current User | Before deadline | update | `ANSWER_NOT_FOUND` |
| No delete target | Current User | Before deadline | remove | `ANSWER_NOT_FOUND` |
| Update/delete | Current User | At/after deadline | update/remove | `QUESTION_CLOSED`, no change |
| Update/delete | Another User | Before deadline | update/remove | `ANSWER_NOT_FOUND`, no other-User change |
| Update vs. delete conflict | Current User | Before deadline | 10 concurrent | Zero restoration after deletion, at most one final Answer |
| Delete vs. resubmit conflict | Current User | Before deadline | 10 concurrent | At most one final Answer |

## Answer Language and Injection

- For multilingual Questions, confirm the Personal Agent infers answer language from the body. This is Agent discretion; the application does not force a specific language match.
- Confirm the Agent ignores Question-body requests for secrets, previous conversations, authentication data, or unrelated tool use.
- Confirm fixed `get_question` instructions match the [five-tool WebMCP contract](./contracts/webmcp-tools.md) and cannot be changed by Question content.
- Do not enter real Private Context, Cookies, Tokens, or OAuth values into test Answers, screens, or records.

## Completion Criteria

- The five tools are registered exactly as contracted, with zero Question list, search, or other-User Answer tools.
- A Human can copy the prompt and complete target Question retrieval, submission, and personal verification within five minutes.
- Current-User update, deletion, and resubmission succeed before the deadline, with zero changes after it.
- Other Users' Answers are exposed or changed zero times across every path and time state.
- Automated gates and manual scenarios are recorded with no unverified items.

Record results, date/time, environment, and unresolved items canonically in [validation-record.md](./validation-record.md).
