# Data Model: Sealed Answer Access Control

This specification does not change the existing D1 schema. It distinguishes persistent entities from external projections.

## Persistent Entities

### Question

- Continue using `id`, `creatorUserId`, `body`, `language`, `publishedAt`, `closesAt`, and `revealsAt` unchanged.
- Do not persist current state; derive one of four states from request-scoped service time.
- Do not use `creatorUserId` for pre-Reveal viewing privilege.

### Answer

- Return `id` only for Human-facing post-Reveal excerpt lists and details.
- Use `questionId` to ensure association with the selected Question without leaking association to another Question.
- Use `userId` for ownership decisions and never return it in other-User projections.
- Return `body`/`excerpt` only to the owner or an authorized post-Reveal Human projection.
- Return `createdAt`/`updatedAt` only with the current User's Answer.

## Authorization Input

`AccessContext` contains `authenticated`, Session-derived `userId`, route-purpose `channel`, derived `questionState`, and `resource` (`answer-count`, `own-answer`, `other-excerpts`, or `other-body`). `AccessDecision` returns only allow/deny and does not disclose denial reasons or Answer existence.

## External Projections

- **AnswerCountView**: `{ answerCount }`; only authenticated Human SSR for published Questions.
- **OwnSubmissionView**: Unsubmitted state or current User body, excerpt, submission time, and update time. Shape does not vary based on other Users.
- **RevealedExcerptView**: `{ id, excerpt }`; only authenticated Human SSR for `REVEALED`. No body, User, or time.
- **RevealedBodyView**: `{ id, body }`; exactly one selected Answer through Human detail HTTP for `REVEALED`.

## States and Projections

```text
DRAFT      -> no public projection
OPEN       -> Human SSR: count + own / personal-state HTTP and WebMCP: own only
CLOSED     -> Human SSR: count + own / personal-state HTTP and WebMCP: own only
REVEALED   -> Human SSR: count + excerpts (zero bodies) / detail HTTP: selected body / personal-state HTTP and WebMCP: own only
```

## Invariants

- Every projection in one response uses the same Question-state snapshot.
- Complete authorization for a data category before retrieving any Answer data.
- Other-User projections contain no `userId`, `createdAt`, or `updatedAt`.
- Detail denial is identical for existing, missing, and wrong-Question Answers.
- Never reuse a User-dependent response for another Session.
- Change no table, column, index, or migration.
