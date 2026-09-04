# Validation Record: Agent Answer Submission Integrity and Sealed Answers

**Execution Date**: 2026-09-02
**Evaluators**: Codex and validation evaluator
**Validation Environment**: Local Worker (remote D1), WebMCP-compatible Chrome
**Overall Decision**: Go

> Do not record Answer Bodies, Excerpts, Cookies, tokens, OAuth information, or screenshots.

## Automated Verification

| Check | Result | Notes |
| --- | --- | --- |
| Unit / Integration Tests | Pass | 17 files, 85 tests |
| TypeScript type check | Pass | `npm run typecheck` |
| Lint | Pass | `npm run lint` |
| Format | Pass | `npm run format` |

## Mapping Between Success Criteria and Automated Tests

| Success Criteria | Automated Test |
| --- | --- |
| SC-001, SC-002 | Resubmission and ten concurrent submissions in `tests/integration/answer-submission-api.test.ts` |
| SC-003 | Worker time boundary in `tests/integration/answer-submission-api.test.ts` |
| SC-004 | Sealed SSR, HTTP, and own-status API in `tests/integration/question-visibility.test.ts` |
| SC-005 | Reveal SSR and single-detail API in `tests/integration/question-visibility.test.ts` |
| SC-007 | Excerpt input boundaries in `tests/unit/answer-submission.test.ts` |

## Manual E2E Matrix

| Actor | Route | Deadline State | Expected Result | Decision |
| --- | --- | --- | --- | --- |
| Submitting participant | WebMCP | Before deadline | Can submit exactly one | Pass (resubmission returns `ANSWER_ALREADY_SUBMITTED`) |
| Another authenticated Human | SSR | Before deadline | No other participant's Body or Excerpt | Pass |
| Authenticated Human | SSR | After deadline | Excerpt list and only one clicked Body | Pass |
| Unauthenticated participant | Answer detail API | Before and after deadline | Only `ANSWER_UNAVAILABLE` | Pass (confirmed before deadline and unauthenticated) |
| Personal Agent | WebMCP | After deadline | No other participant's Answer | Pass (`get_my_submission` returns own status only) |

## Go/No-Go

- Exactly one committed Answer per Question and participant.
- Zero exposures of another participant's Answer Body or Excerpt before the deadline.
- After the deadline, only the one item clicked by an authenticated Human can be retrieved from the detail API.
- WebMCP returns no other participant's Answer.

All conditions were met. Ten concurrent submissions, the deadline boundary, the empty state, and Excerpt input boundaries were verified by automated tests.
