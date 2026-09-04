# Data Model: Answer Reveal Experience and Challenge Visual Design

This SPEC adds no persistent tables. It composes Home projections, state-specific pages, revealed Answer items, creation intent, and in-screen operation state from existing Questions, Answers, and audit records.

## Existing Persistent Entities

### Question

- `id`: Unique ID, also used as the screen-issued `creationToken` for replay safety.
- `creatorUserId`: Owner; deletion requires a session-derived match.
- `body`: Always rendered as untrusted text.
- `publishedAt`: `null` for Draft; creation time for immediate publication.
- `closesAt`, `revealsAt`: Deadline and reveal time, kept equal for new Questions as before.
- `createdAt`, `updatedAt`: Server timestamps for conflict detection and ordering.

### Answer

- `id`: Unique ID.
- `questionId`: Target Question; cascades on Question deletion.
- `userId`: Respondent, never exposed on public comparison screens.
- `excerpt`: Listed only in authenticated human SSR for `REVEALED`.
- `body`: Returned only for one explicitly selected Answer in authenticated `REVEALED` browsing.
- `createdAt`: Primary stable reveal-order key.
- `updatedAt`: Used for current-user management, not reveal order.

### AuditLog

- Reuse `id`, `actorUserId`, `action`, `targetType`, `targetId`, `outcome`, and `createdAt`.
- Owner deletion records `QUESTION_DELETED`, `QUESTION`, and `creatorUserId`.
- Include no bodies, excerpts, email, cookies, or tokens. Records survive Question deletion.

## Read Projections

### QuestionListItem

| Field | Rule |
| --- | --- |
| `question` | Public Question fields; omit `creatorUserId` |
| `answerCount` | Aggregate count only |
| `hasAnswered` | `true`, `false`, or `null` when signed out/indeterminate; batch-evaluated for displayed items |
| `promptAvailable` | Authenticated and Open; display also requires `hasAnswered === false` |

Include no Answer body, excerpt, ID, respondent, or individual time. Never treat signed-out or retrieval failure as unanswered.

### HomeQuestionCollection

| Field | Rule |
| --- | --- |
| `openItems` | `OPEN`, at most 5 |
| `revealedItems` | `REVEALED`, at most 10 |
| `snapshotNow` | One request time shared by both sections |

Order Open by `closesAt ASC, id ASC` and Results by `revealsAt DESC, id DESC`; never include a Question in both.

### QuestionListPage

| Field | Rule |
| --- | --- |
| `kind` | `open` or `revealed` |
| `items` | At most 20 |
| `page` | One-based page |
| `pageSize` | 20 |
| `totalItems` | Count matching kind and snapshot |
| `totalPages` | `max(1, ceil(totalItems / pageSize))` |
| `hasPrevious` | `page > 1` |
| `hasNext` | `page < totalPages` |
| `snapshotNow` | Shared request time |

Omitted page means 1. Accept only safe positive ASCII integers. Invalid or out-of-range pages return no Questions and a safe page-1 link.

### RevealedAnswerItem

| Field | Rule |
| --- | --- |
| `id` | Detail-retrieval ID exposed only to authenticated humans in `REVEALED` |
| `position` | One-based sequence after `createdAt ASC, id ASC` |
| `anonymousVisual` | Per-request palette/pattern from Question and Answer IDs, never user ID |
| `participantLabel` | `Authenticated participant` |
| `isOwn` | Server-derived boolean used only for the current-user tag |
| `excerpt` | Included in initial HTML |
| `bodyState` | Client-only `collapsed`, `loading`, `expanded`, or `error` |
| `body` | Fetched body retained only in client memory |

Public screens omit respondent identity, Google data, raw hashes, and timestamps. Derive `isOwn` per request and pass only the boolean. Anonymous visuals are stable within a Question but cannot track users across Questions. Account linkage remains only for administration, audit, and moderation. Retrieval failure never reuses another body, and expanding one Answer never collapses another.

## Input and Operation Models

### QuestionCreationRequest

| Field | Rule |
| --- | --- |
| `creationToken` | Server-issued UUID used as Question ID |
| `intent` | `draft` or `publish` |
| `body` | Existing 10–1,000-grapheme rule |
| `closesAtLocal` | User-visible local time |
| `closesAt` | Unix milliseconds |
| `timeZone` | IANA time zone |
| `contentAcknowledged` | Required for both intents |

```text
valid + draft   -> DRAFT
valid + publish -> OPEN
same token replay -> existing DRAFT or OPEN; no second Question
invalid input   -> no persistence
token collision with another owner or different payload -> safe conflict
```

### DefaultDeadline

| Field | Rule |
| --- | --- |
| `localValue` | `YYYY-MM-DDTHH:mm` for `datetime-local` |
| `timestamp` | Interpreted Unix milliseconds |
| `timeZone` | Browser-resolved IANA zone |

Use next local midnight, or the following midnight if less than one hour away. If daylight saving adjusts midnight, show that date's valid start time. Do not exceed 30 days.

### QuestionDeletionRequest

| Field | Rule |
| --- | --- |
| `questionId` | Route target |
| `actorUserId` | Session actor |
| `confirmDeletion` | Fixed `on` |
| `expectedUpdatedAt` | Observed version for conflict detection |

```text
deleted
unavailable-to-owner
conflict
confirmation-required
unavailable
```

Only success commits `QUESTION_DELETED` and deletion together.

### SubmissionGuard

- Each form is `idle` or `submitting`.
- The first valid submit disables submission and shows operation-specific English status.
- Native-validation failure remains `idle`; server-returned HTML starts as a new `idle` screen.

## State and Exposure

| State | Home/List | Authenticated Excerpts | Authenticated Other Bodies | Signed Out | WebMCP |
| --- | --- | --- | --- | --- | --- |
| `DRAFT` | Hidden | Private | Private | Same as missing | Same as missing |
| `OPEN` | Open list | Private | Private | Public Question only | Selected Question and own Answer only |
| `CLOSED` | Neither | Private | Private | Public Question only | No other Answers |
| `REVEALED` | Results | Authenticated only | One selected item | Question plus Sign in | No other Answers |
