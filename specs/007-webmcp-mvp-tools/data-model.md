# Data Model: WebMCP MVP Tools

## Entities

### Question

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Opaque unique identifier; the only variable embedded in the copyable prompt. |
| `body` | string | 10–1,000 display characters; untrusted user-generated content. |
| `language` | string | Used only for existing-schema compatibility and omitted from Tool Views. New Questions use `auto`. |
| `publishedAt` | timestamp / null | Null means `DRAFT`. |
| `closesAt` | timestamp | Answer creation, update, and deletion are allowed only while `now < closesAt`. |
| `revealsAt` | timestamp | Determines Human-facing publication state; does not change WebMCP's rule hiding other Users' Answers. |

Derive exactly one Question state—`DRAFT`, `OPEN`, `CLOSED`, or `REVEALED`—using the shared SPEC 005 evaluation. Add no stored state name.

### Answer

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Unique identifier, excluded from tool input and output. |
| `questionId` | string | Required reference to Question. |
| `userId` | string | Required reference to the User determined from Session; never tool input. |
| `body` | string | Non-whitespace, 1–5,000 display characters; intended to be public. |
| `excerpt` | string | Non-whitespace, no newlines, 1–160 display characters. |
| `createdAt` | timestamp | First submission time; unchanged on update. |
| `updatedAt` | timestamp | Equal to `createdAt` on creation; advanced to service time on update. |

Constraints:

- `UNIQUE(question_id, user_id)` allows at most one Answer per User/Question at a time.
- Answer updates and deletion filter by the same `questionId` and Session-derived `userId`.
- Answer deletion is a hard delete that retains no Answer ID, body, excerpt, or timestamps.
- Existing foreign-key rules preserve Question and User referential integrity.
- The database defends against whitespace-only content, excerpt newlines, duplicates, and invalid references. The shared domain contract enforces display-character limits for both submission and update.

### Agent Request Prompt

A non-persistent display model.

| Field | Type | Rule |
| --- | --- | --- |
| `questionUrl` | string | Absolute URL built from request Origin and Question path. Excludes query and fragment and is treated as safe text in HTML and the prompt. |
| `prompt` | string | Full text made by inserting only `questionUrl` into the short English template; contains no Question body. |
| `visible` | boolean | True only when authenticated, the Question is `OPEN`, and the current User has no Answer. |
| `statusMessage` | string | English copy-success, failure, or hidden-reason message. |

### Question Tool View

A non-persistent Agent-facing DTO.

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Matches the Human-selected Question ID. |
| `question` | string | Untrusted body. |
| `closesAt` | ISO timestamp | Absolute time. |
| `instructions` | object | Fixed contract describing available User Context sources, evidence priority, fact-versus-consideration distinctions, proxy answers when no explicit view exists, no unsupported claims, no unnecessary clarification, non-disclosure of Private Context, submission authorization, and submission verification. |

Exclude creator, answer count, current-User state, other Users' Answers, and Session information.

### My Submission View

A non-persistent DTO visible only to the current User.

- Not submitted: `questionId`, `status: not_submitted`
- Submitted: `questionId`, `status: submitted`, the current User's `answer`, `excerpt`, `submittedAt`, and `updatedAt`

Do not vary the not-submitted response based on whether another User has answered.

## Answer State Transitions

```text
not_submitted
    └── submit_answer [OPEN] ──> submitted

submitted
    ├── update_answer [OPEN] ──> submitted (same ID; body, excerpt, updatedAt changed)
    ├── remove_answer [OPEN] ──> not_submitted
    └── deadline reached ──> locked

not_submitted after removal
    └── submit_answer [OPEN] ──> submitted (new ID)

locked
    └── submit/update/remove ──> QUESTION_CLOSED (no state change)
```

| Current State | Operation | Condition | Result |
| --- | --- | --- | --- |
| Not submitted | submit | `OPEN` | Create one Answer |
| Submitted | submit | `OPEN` | `ANSWER_ALREADY_SUBMITTED` |
| Submitted | update | `OPEN` | Replace current User's Answer body, excerpt, and update time |
| Submitted | remove | `OPEN` | Delete current User's Answer |
| Not submitted | update / remove | `OPEN` | `ANSWER_NOT_FOUND` |
| Any | submit / update / remove | Not `OPEN` | `QUESTION_CLOSED` |

## Concurrency Rules

- The uniqueness constraint permits at most one concurrent submit to succeed.
- Update and remove follow the commit order of their conditional single statements; a delayed update after removal returns `ANSWER_NOT_FOUND`.
- Even when remove and resubmit conflict, the current User has at most one final Answer because of the uniqueness constraint.
- Recheck conflict results with `get_my_submission`; the tool never infers success.

## Migration

`0005_answer_revisions.sql` rebuilds the table while preserving existing Answers.

1. Copy existing `id`, `question_id`, `user_id`, `body`, `excerpt`, and `created_at` into the new Answer table.
2. Initialize `updated_at` from existing `created_at`.
3. Recreate foreign keys, uniqueness constraints, and the per-Question creation-time index.
4. Move SQL code-point upper-limit checks to domain grapheme limits, retaining whitespace-only and excerpt-newline checks.
5. After migration, verify no existing Answer count, owner, body, excerpt, or creation time is missing.
