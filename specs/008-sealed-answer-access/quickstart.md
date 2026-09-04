# Verification Guide: Sealed Answer Access Control

This guide verifies the [access-control matrix](./contracts/access-control-matrix.md), [Human HTTP contract](./contracts/answer-http.md), and [WebMCP contract](./contracts/webmcp-visibility.md) across every channel.

## Prerequisites

- Node.js 22.13 or later or 24 or later, npm, Wrangler, and local D1.
- WebMCP-capable Chrome and two non-sensitive Google test accounts.
- Clearly distinguishable validation bodies/excerpts submitted by both accounts to the same Question.

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

Expected: every access-table combination matches; zero other-User secrets before Reveal on all paths; zero bodies in post-Reveal SSR; one selected body from detail HTTP; zero other-User data in WebMCP; identical denials for existing, missing, and wrong-Question Answers; safe headers on User-dependent responses.

## Start Locally

```bash
npm run dev
```

Open the same displayed Origin in separate Chrome profiles.

## Implementation Targets and Automated Tests

- Human SSR: `GET /questions/:questionId`
- Personal state: `GET /api/questions/:questionId/my-submission`
- Post-Reveal body: `GET /api/questions/:questionId/answers/:answerId`
- WebMCP Question: `GET /api/questions/:questionId`
- User-dependent success/denial: `Cache-Control: private, no-store` and `Vary: Cookie`
- Unit table: `tests/unit/answer-visibility.test.ts`
- HTTP/SSR/Session: `tests/integration/question-visibility.test.ts`
- WebMCP boundary: `tests/integration/webmcp-question-api.test.ts` and `tests/unit/register-production-tools.test.ts`
- D1 minimal projection: `tests/d1/answer-visibility-repository.test.ts`

## Before Reveal

1. Submit different Answers from A and B to the same `OPEN` Question.
2. Confirm A's screen includes the count and A's Answer but none of B's body, excerpt, ID, User, or time even in HTML source. Repeat symmetrically as B and the Question creator.
3. Call detail HTTP with an existing, missing, and wrong-Question Answer ID; confirm identical `404 ANSWER_UNAVAILABLE` headers and bodies.
4. Confirm a `CLOSED` fixture remains identically sealed until Reveal.

## After Reveal

1. Confirm every excerpt appears for a `REVEALED` Question and zero bodies appear in HTML source.
2. Select one and confirm exactly the corresponding body is retrieved and displayed.
3. Confirm a wrong-Question Answer ID and unauthenticated profile return no Answer data.
4. With zero Answers, confirm only the empty state appears and no fabricated ID exists.

## WebMCP and Sessions

1. Confirm A and B's `get_my_submission` each returns only their own Answer, with zero counts or other-User secrets in all five tools.
2. Check personal state in `OPEN`, `CLOSED`, and `REVEALED`; other-User data must not increase after Reveal.
3. Confirm no Answer list, detail, search, summary, or comparison tool is registered.
4. After retrieving as A, sign out and confirm the same URL does not return A's Answer; switch A/B and confirm no mixing.
5. Confirm successful and denied responses have `Cache-Control: private, no-store` and `Vary: Cookie`.

If the browser blocks top-level navigation to a JSON API, verify post-Reveal lazy body retrieval through the screen and use direct HTTP cases in `tests/integration/question-visibility.test.ts` for existing/missing/wrong-Question IDs, unauthenticated access, and matching headers/bodies before Reveal.

## Completion Criteria

- At least 180 base combinations plus boundary/direct-access cases match 100%.
- Zero other-User Answer exposures occur before Reveal, while unauthenticated, or through WebMCP.
- Only authenticated Humans after Reveal can retrieve all excerpts and one selected body.
- Record quality gates and manual results in [validation-record.md](./validation-record.md), with no unverified items.
