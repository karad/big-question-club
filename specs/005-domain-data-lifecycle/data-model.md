# Data Model: Domain Data Model and Question Lifecycle

## Time and Naming

- Store all Domain times as integer UTC Unix milliseconds.
- Use camelCase for TypeScript properties and snake_case for Question/Answer DB columns. Preserve current Better Auth DB column names for compatibility.
- Do not persist `now`; obtain it once from the service for each operation and pass it to the Domain and Repository.
- Do not persist Question state names.

## Entities

### User

The authentication principal created and updated by Better Auth. It is the Source of Truth identifying Question creators and Answer submitters.

| Field | DB Representation | Required | Constraint / Meaning |
| --- | --- | --- | --- |
| `id` | `TEXT` | Required | Primary key. Stable in-application identifier that may be exposed externally. |
| `name` | `TEXT` | Required | Display name retained by Better Auth. |
| `email` | `TEXT` | Required | Unique. Never included in public contracts or Answers. |
| `emailVerified` | `INTEGER` | Required | Boolean. |
| `image` | `TEXT` | Optional | Profile-image reference. |
| `createdAt` | `INTEGER` | Required | UTC Unix milliseconds. |
| `updatedAt` | `INTEGER` | Required | UTC Unix milliseconds. |

### Session

Expiring authentication state created and updated by Better Auth. The application Domain does not handle Session values directly; it receives only a User ID from the existing `Authentication` boundary.

| Field | DB Representation | Required | Constraint / Meaning |
| --- | --- | --- | --- |
| `id` | `TEXT` | Required | Primary key. |
| `userId` | `TEXT` | Required | Foreign key to `user.id`. Delete Sessions when the User is deleted. |
| `token` | `TEXT` | Required | Unique. Never expose in screens, Tool responses, or logs. |
| `expiresAt` | `INTEGER` | Required | UTC Unix milliseconds. |
| `createdAt` | `INTEGER` | Required | UTC Unix milliseconds. |
| `updatedAt` | `INTEGER` | Required | UTC Unix milliseconds. |
| `ipAddress` | `TEXT` | Optional | Better Auth compatibility field. |
| `userAgent` | `TEXT` | Optional | Better Auth compatibility field. |

### Question

A prompt created by a Human and answered by Personal Agents. Its state is derived from time.

| Field | DB Representation | Required | Constraint / Meaning |
| --- | --- | --- | --- |
| `id` | `TEXT` | Required | Primary key. |
| `creatorUserId` | `TEXT` | Required | Foreign key to `user.id`. Reject User deletion while Questions exist. |
| `body` | `TEXT` | Required | Must not be blank. SPEC 006 defines detailed length limits. |
| `language` | `TEXT` | Required | Retained for compatibility with the existing Schema. New Questions use `auto`; this does not prescribe the Answer language. |
| `publishedAt` | `INTEGER` | Optional | `null` means `DRAFT`. No later than service time when publication commits. |
| `closesAt` | `INTEGER` | Required | Answer deadline. Later than `publishedAt` when present. |
| `revealsAt` | `INTEGER` | Required | Start of Human-facing Reveal. At or after `closesAt`. |
| `createdAt` | `INTEGER` | Required | UTC Unix milliseconds. |
| `updatedAt` | `INTEGER` | Required | UTC Unix milliseconds. |

CHECK constraints enforced by the DB:

- `length(trim(body)) > 0`
- `length(trim(language)) > 0`
- `published_at IS NULL OR published_at < closes_at`
- `closes_at <= reveals_at`

The Domain/Repository boundary enforces that publication time is no later than service time and prevents rollback to a previous state, because those decisions require existing values and `now`.

### Answer

An immutable response submitted to a Question by a Personal Agent as an authenticated User.

| Field | DB Representation | Required | Constraint / Meaning |
| --- | --- | --- | --- |
| `id` | `TEXT` | Required | Primary key. |
| `questionId` | `TEXT` | Required | Foreign key to `questions.id`. Delete Answers when the Question is deleted. |
| `userId` | `TEXT` | Required | Foreign key to `user.id`. Reject User deletion while Answers exist. |
| `body` | `TEXT` | Required | Must not be blank; at most 5,000 characters. |
| `excerpt` | `TEXT` | Required | Must not be blank or contain line breaks; at most 160 characters. |
| `createdAt` | `INTEGER` | Required | UTC Unix milliseconds. |

Constraints enforced by the DB:

- `UNIQUE(question_id, user_id)`
- Reject a blank or over-5,000-character Body
- Reject a blank, multiline, or over-160-character Excerpt

Because the `OPEN` decision at Answer creation requires the current time, enforce it with a conditional Repository write.

### Account and Verification

Existing supporting entities required by Better Auth. They are not primary entities in SPEC 005, but the Drizzle Schema includes them and preserves existing table names, columns, uniqueness constraints, and foreign keys to User. Business Repositories do not operate on them.

Account retains both the initial `UNIQUE(providerId, accountId)` and the post-issuer unique index `UNIQUE(issuer, accountId)`. Migration `0001` creates only the pre-issuer Schema, while `0002` adds the issuer column and issuer-scoped unique index exactly once.

## Relationships

```text
User 1 ─── 0..* Session
User 1 ─── 0..* Account
User 1 ─── 0..* Question
User 1 ─── 0..* Answer
Question 1 ─── 0..* Answer
Answer ─── UNIQUE(questionId, userId)
```

| Parent | Child | Deletion Rule | Rationale |
| --- | --- | --- | --- |
| User | Session / Account | CASCADE | Do not retain authentication state without its principal. Preserve the existing Better Auth contract. |
| User | Question / Answer | RESTRICT | Do not implicitly delete published content through account deletion, which the MVP has not defined. A subsequent SPEC defines deletion policy. |
| Question | Answer | CASCADE | Do not leave orphaned Answers when a future operation explicitly deletes a Question. |

## Question State

### Decision Table

Return the first matching state from top to bottom.

| Priority | Condition | State | Answer Creation |
| --- | --- | --- | --- |
| 1 | `publishedAt === null` | `DRAFT` | Not allowed |
| 2 | `now >= revealsAt` | `REVEALED` | Not allowed |
| 3 | `now >= closesAt` | `CLOSED` | Not allowed |
| 4 | Otherwise | `OPEN` | Allowed |

This ordering makes the `closesAt === revealsAt` boundary `REVEALED` and prevents overlapping states.

### Transitions

```text
DRAFT --publish(now)--> OPEN --time reaches closesAt--> CLOSED
                                └--closesAt == revealsAt--> REVEALED
CLOSED --time reaches revealsAt--> REVEALED
```

Allowed:

- Commit publication of a `DRAFT` with `publishedAt = now`, satisfying `publishedAt < closesAt <= revealsAt`.
- `OPEN → CLOSED → REVEALED` as time passes.
- `OPEN → REVEALED` when `closesAt === revealsAt`.

Rejected:

- Rollback from `OPEN`, `CLOSED`, or `REVEALED` to `DRAFT`.
- Schedule changes returning `CLOSED` or `REVEALED` to `OPEN`.
- Changes returning `REVEALED` to an earlier state.
- Scheduled publication through a future `publishedAt`.
- Answer creation in `DRAFT`, `CLOSED`, or `REVEALED`.

## Repository Responsibilities

### Authentication Boundary

- Only Better Auth creates and updates User, Session, Account, and Verification.
- The application obtains a User ID through the existing `Authentication.getSession()`.
- Domain Repositories do not receive Session tokens, email addresses, or OAuth tokens.

### QuestionRepository

- Retrieves Questions and stores and publishes Drafts.
- Validates Question schedule ordering and state transitions through the Domain contract before persistence.
- Performs existing operations required for conditional Answer creation, own-Answer retrieval, Answer counts, and post-Reveal retrieval.
- Classifies D1 uniqueness, foreign-key, and CHECK violations into stable Domain results without confusing them with unexpected failures.
- Uses one `now` from the caller for both state decisions and write conditions.

## Migration

### Empty Database Path

Apply `0001` through `0004` in order to create every table, foreign key, CHECK, and unique index, including supporting authentication entities. First remove duplicated issuer responsibilities from `0001` and `0002`, leaving each Migration responsible for each change exactly once.

### SPEC 004 Path

1. Assume a database with `0001` through `0003` applied.
2. Preserve valid User, Session, Account, and Verification data.
3. Delete validation-only Answers, then old Questions.
4. Create production Questions and Answers in foreign-key order.
5. Validate foreign keys, required columns, unique indexes, and CHECK constraints.

Before applying to a shared environment, confirm that Questions and Answers contain only validation data. If participant data exists, stop the Migration and define a separate data-migration policy.
