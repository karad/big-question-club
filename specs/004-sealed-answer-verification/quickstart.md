# Validation Guide: Agent Answer Submission Integrity and Sealed Answers

## Prerequisites

- SPEC 002 and 003 have Go decisions.
- Node.js 22.13 or later, npm, Wrangler authenticated with Cloudflare, and WebMCP-compatible Chrome are available.
- Prepare two distinguishable validation participants, and include no Private Context or authentication information in Questions or Answers.

## Automated Checks

With the current `remote: true` D1 binding, apply migrations to remote D1, start `npm run dev`, and run:

```sh
npm test
npm run typecheck
npm run lint
npm run format
```

| Command | Execution Date | Result |
| --- | --- | --- |
| `npm test` | 2026-09-02 | Pass (85 tests) |
| `npm run typecheck` | 2026-09-02 | Pass |
| `npm run lint` | 2026-09-02 | Pass |
| `npm run format` | 2026-09-02 | Pass |

## Manual E2E

1. After Participant A submits, attempt nine additional submissions and confirm one committed Answer and nine duplicates.
2. Send ten pairs of concurrent submissions to an unanswered Question and confirm exactly one success and one duplicate in each pair.
3. Attempt submission immediately before, exactly at, and after the deadline; confirm that only the attempt immediately before succeeds.
4. Have A and B submit Answers containing Bodies and Excerpts to the same Question. Before the deadline, confirm that SSR, HTTP APIs, and WebMCP expose no other participant's Answer Body, Excerpt, extract, summary, or identifier.
5. Across ten valid submissions, confirm that an Excerpt is required, contains no line breaks, and is no more than 160 characters.
6. After the deadline, confirm that the authenticated Human SSR list shows only every Answer's Excerpt and that only the selected Body expands below its Excerpt when clicked.
7. Call the Answer detail API directly before the deadline or without authentication. Confirm that it returns only `ANSWER_UNAVAILABLE`, with no Body, Excerpt, or clue to existence.
8. Confirm that WebMCP exposes no other participant's Answer after the deadline.
9. Confirm that a post-deadline Question with zero Answers shows only the empty state.

### Execution Result Matrix

| Case | Actor | Route | Deadline State | Expected Result | Observed Result | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Resubmission | Submitting participant | WebMCP | Before deadline | One success, then 409 | `ANSWER_ALREADY_SUBMITTED` | Pass |
| Concurrent submission | Submitting participant | HTTP | Before deadline | Exactly one success per pair | Automated test | Pass |
| Sealed | Another authenticated Human | SSR | Before deadline | No other participant's Body or Excerpt | No other-participant information | Pass |
| Direct Sealed retrieval | Unauthenticated participant | HTTP | Before deadline | Only `ANSWER_UNAVAILABLE` | `ANSWER_UNAVAILABLE` | Pass |
| Reveal list | Authenticated Human | SSR | After deadline | List only Excerpts | No Body in initial display | Pass |
| Reveal detail | Authenticated Human | HTTP | After deadline | Only the requested Body | Retrieved only the clicked Answer | Pass |
| Reveal WebMCP | Personal Agent | WebMCP | After deadline | No other participant's Answer | Only the participant's own `submitted` status | Pass |
| Empty state | Authenticated Human | SSR | After deadline | No fabricated Answer | Automated test | Pass |

Record only the case ID, actor, route, deadline state, expected result, and pass/fail. Do not retain Answer Bodies, Cookies, tokens, OAuth information, or screenshots.
