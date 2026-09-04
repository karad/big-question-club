# Internal Contract: Question Lifecycle and Persistence Boundary

## Scope

SPEC 005 exposes no new HTTP API, WebMCP Tool, or screen. This document fixes the internal Domain and Repository contract shared by subsequent screens, APIs, and WebMCP.

## Question State Contract

### Input

```text
QuestionSchedule {
  publishedAt: number | null
  closesAt: number
  revealsAt: number
}

now: number
```

All values are UTC Unix milliseconds.

### Output

```text
QuestionState = "DRAFT" | "OPEN" | "CLOSED" | "REVEALED"
```

### Decision

1. If `publishedAt === null`, return `DRAFT`.
2. If `now >= revealsAt`, return `REVEALED`.
3. If `now >= closesAt`, return `CLOSED`.
4. Otherwise, return `OPEN`.

This function neither persists data nor obtains the current time. The caller passes one `now` per operation.

## Question Schedule Validation Contract

A published Question satisfies all of the following:

- `publishedAt <= now`
- `publishedAt < closesAt`
- `closesAt <= revealsAt`

A Draft has `publishedAt === null` and accepts no Answers. Reject a change that restores a published Question's `publishedAt` to `null`, or moves its schedule to a state earlier than its previous state.

## Repository Operations

### `getQuestion(questionId)`

- Return the complete Question when it exists.
- Return `null` when it does not exist.
- Do not freeze state at retrieval; derive it from the Domain contract using `now` at the point of use.

### `createDraft(input, now)`

- Create a Draft with an authenticated `creatorUserId`, Body, deadline, and Reveal time. Store the internal compatibility value `auto` in the existing language column.
- `publishedAt` is always `null`.
- Reject a nonexistent User, blank Body or language, and invalid time ordering.
- SPEC 006 adds detailed rules for Body, language, and deadline input.

### `publish(questionId, creatorUserId, now)`

- Commit `publishedAt = now` only when the target Question exists, the specified User is its creator, its current state is `DRAFT`, and `now < closesAt <= revealsAt`.
- Even when invoked concurrently, only the first operation commits.
- Reject an already published Question, a reached deadline, and a creator mismatch with distinguishable results.

### `submit(questionId, userId, input, now)`

- Create an Answer only for a Question satisfying `publishedAt !== null && publishedAt <= now && now < closesAt`.
- Receive `userId` from the authentication boundary, never from the input Body.
- Commit exactly one Answer for the same Question and User.
- Use the same `now` for the Question-state condition, Answer persistence, and DB-constraint decision.
- Distinguish duplication, missing Question, unpublished or closed Question, missing reference, and unexpected persistence failure.

### Existing Read Operations

Preserve operations for retrieving the participant's own Answer, Answer count, Excerpt list, and Answer Body. SPEC 008 defines visibility; this Repository does not replace authorization decisions made by its caller.

## Result Codes

Internal results distinguish at least the following. Subsequent SPECs are responsible for external messages and conversion to HTTP or Tool errors.

| Code | Meaning | Retry |
| --- | --- | --- |
| `QUESTION_NOT_FOUND` | Target Question does not exist | No |
| `CREATOR_NOT_FOUND` | Draft creator User does not exist | No |
| `CREATOR_MISMATCH` | Publication requester is not the Question creator | No |
| `INVALID_QUESTION` | Invalid Body, language, or time ordering | After correction |
| `INVALID_TRANSITION` | Change not allowed from the current state | No |
| `QUESTION_NOT_OPEN` | Draft, closed, or Revealed | No |
| `ANSWER_ALREADY_SUBMITTED` | An Answer exists for the same Question and User | No |
| `REFERENCE_NOT_FOUND` | Referenced User or Question does not exist | No |
| `INVALID_ANSWER` | Answer Body or Excerpt violates a DB constraint | After correction |
| `PERSISTENCE_UNAVAILABLE` | Unexpected D1 failure | Yes |

## Consistency

- Use DB uniqueness and foreign-key constraints as the final decision source.
- Do not treat every constraint error as a duplicate; classify stable outcomes with a follow-up query when necessary.
- Include the Answer-creation state condition in the write statement itself.
- Use D1 `batch()` only when multiple writes are indispensable, and never return partial success after an intermediate failure.
- Do not define different boundary rules for Domain state decisions and Repository state conditions.
