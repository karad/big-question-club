# Data Model: Challenge Core Browsing Flow

This specification preserves existing entities and adds Home projections, transient presentation state, and ban/audit entities for publication operations.

## Existing Entities

### Question

- Continue using `id`, `body`, `creatorUserId`, `publishedAt`, `closesAt`, and `revealsAt`.
- Keep `language` only for migration compatibility; do not use it in user input, display, or WebMCP. New Questions store internal `auto`.
- Derive current state from request-scoped service time; do not persist it.
- Use `creatorUserId` only to indicate ownership, never expose its value in public HTML.

### Answer

- Home and Detail aggregate only answer count.
- Return `body`, `excerpt`, `id`, `userId`, and individual times only in personal or Reveal projections allowed by SPEC 008.

## OpenQuestionSummary

| Field | Rule |
| --- | --- |
| `question` | `publishedAt !== null` and `publishedAt <= snapshotNow < closesAt` |
| `answerCount` | Number of Answers for the Question; no content |

Order by `closesAt ASC, publishedAt ASC, id ASC`. Select no Answer body, excerpt, User, or individual time.

## ViewerPresentation

```text
anonymous
authenticated-unsubmitted
authenticated-submitted(ownAnswer)
submission-unavailable
closed
```

- Outside `OPEN`, use `closed` and show no new prompt.
- Without Session, use `anonymous`.
- Authenticated with no own Answer: `authenticated-unsubmitted`.
- Authenticated with own Answer: `authenticated-submitted`.
- Authentication or own-Answer retrieval failure: `submission-unavailable`, never reinterpret as unanswered.
- Creator status does not change these states.

## AgentRequestPresentation

- `prompt`: finalized one line: `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`.
- `questionUrl`: absolute URL derived from current request Origin and Question path, with no query or fragment.
- Include no Question body, User, authentication, or Answer data.
- Tool names, order, input restrictions, and detailed safety rules come from WebMCP contracts, not duplicated prompt text.
- Sending the initial prompt authorizes Answer creation/submission without another preview or approval.
- Fixed WebMCP instructions provide available User Context sources; priority for User-authored statements; fact-versus-consideration distinctions; exclusion of Assistant suggestions; proxy answers when no explicit view exists; no unsupported claims; no unnecessary questions; no Private Context disclosure; and submission-result verification.

## DeadlinePresentation

- `absolute`: `closesAt` as ISO 8601 UTC.
- `remainingMs`: `max(0, closesAt - snapshotNow)`.
- `remainingLabel`: meaningful days/hours/minutes; after deadline, show acceptance closed.
- Do not recalculate Question state from remaining time; `getQuestionState` with the same `snapshotNow` is authoritative.

## AnswerCountPresentation

```text
0 -> 0 answers
1 -> 1 answer
n -> n answers
```

## BannedUser

| Field | Rule |
| --- | --- |
| `userId` | Unique banned User ID; primary key. |
| `bannedByUserId` | Administrator User ID. |
| `reason` | Fixed administrator-selected reason; initial value `Policy violation`. |
| `bannedAt` | Service-side Unix milliseconds. |

- Delete every Session for the User when banning.
- Refuse Session creation while banned.
- Unban deletes this row, not User, Question, or Answer.
- The administrator cannot be banned.

## AuditLog

| Field | Rule |
| --- | --- |
| `id` | Unique identifier. |
| `actorUserId` | Acting User ID; intentionally no foreign key so history remains. |
| `action` | `LOGIN`, `LOGOUT`, `QUESTION_CREATED`, `QUESTION_UPDATED`, `QUESTION_PUBLISHED`, `ANSWER_SUBMITTED`, `ANSWER_UPDATED`, `ANSWER_REMOVED`, `ADMIN_QUESTION_DELETED`, `ADMIN_ANSWER_DELETED`, `USER_BANNED`, `USER_UNBANNED`. |
| `targetType` | `SESSION`, `QUESTION`, `ANSWER`, `USER`. |
| `targetId` | Target identifier. |
| `outcome` | Committed entries use `SUCCESS`. |
| `createdAt` | Unix milliseconds committed by service or database. |

- Append-only; administration cannot edit or delete.
- Contains no Question body, Answer body, excerpt, email, Cookie, Token, or OAuth value.
- Display by `createdAt DESC, id DESC`.

## AdminDashboard

A non-persistent administrator-only projection.

- `users`: basic User data and ban state.
- `questions`: every Question, creator, state, and times.
- `answers`: every Answer, excerpt, body, submitter, Question, and times.
- `auditLogs`: actor, action, target, outcome, and time.

## Invariants

- One response uses one `snapshotNow`.
- Home retrieves neither non-`OPEN` Questions nor Answer content.
- Never show an unanswered prompt and own Answer together.
- Creators receive no extra pre-Reveal permission.
- In `OPEN` and `CLOSED`, do not retrieve or serialize other-User Answer data.
- Public Detail does not distinguish Draft from missing.
- Administration is available only when configured administrator email matches the Session User's database email.
- Administration is private/no-store and does not weaken public Answer non-exposure.
- `audit_logs` has no foreign key to deletion targets and remains after they are deleted.
