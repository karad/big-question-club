# Verification Guide: Answer Reveal Experience and Challenge Visual Design

This guide verifies the [Question Lists and Answer Reveal Contract](./contracts/browsing-and-reveal.md) and [Question Creation and Owner Deletion Contract](./contracts/question-management.md) after implementation using automated tests and a real browser.

## Prerequisites

- Node.js 22.13+ or 24+, npm dependencies installed with `npm ci`, and migrated local D1.
- Three Google-authenticated accounts: creator, respondent A, and respondent B.
- Questions in `DRAFT`, `OPEN`, `CLOSED`, and `REVEALED`, with zero, one, and at least two Answers.
- Unique secret markers in other users' bodies and excerpts for exposure detection.

## Asset Generation and Automated Quality Gates

```bash
npm run generate:icons
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
git diff --exit-code -- src/generated/icons.ts
```

All commands must exit 0; `client-dist/client.js` and `client-dist/styles.css` must exist; icon regeneration must be clean; production Worker assets must contain no React runtime. The Agent prompt must specify ChatGPT's built-in browser rather than an existing Chrome tab, preserve five WebMCP tools and non-exposure, and direct `get_question`/`submit_answer` to submit the best proxy answer without asserting unknown facts or asking solely because no explicit personal view exists.

## Local Startup

```bash
npm run dev
```

Open the displayed local URL in Chrome.

## 1. Home

1. Prepare at least six `OPEN` and eleven `REVEALED` Questions.
2. Confirm at most five deadline-ordered `Open questions` and ten newest-first `Results`, with complete-list links.
3. Confirm each Open Card's one-line count/time icons and global remaining-time/deadline toggle.
4. Across signed-out, unanswered, and answered states, only unanswered users get prompt disclosure; only answered users get green `Answered` beside the state tag.
5. Confirm independent prompt disclosure, selectable absolute-URL text, and nearby copy success/failure.
6. One empty or failed section must not hide the other or reveal secrets.
7. Open Cards navigate only through `View question`; Agent/copy controls still work. Result Cards navigate through the entire Card.

## 2. Question Lists and Pagination

1. Confirm at most 20 items per state list, and with 21+ records verify `Previous`, `Next`, current page, no overlap, and stable reload order.
2. For zero, negative, decimal, text, huge, or out-of-range pages, confirm a safe empty state and page-1 action.
3. Confirm Open-list deadline toggling and prompt disclosure match Home.
4. Only answered authenticated Cards show `Answered`; no Answer body, excerpt, ID, respondent, or secret appears in initial list HTML.

## 3. Reveal and Comparison

1. An authenticated zero-Answer Result shows `No answers were submitted.`.
2. Confirm the explanation `All answers were submitted by signed-in participants. One answer per account.`.
3. Prepare two different Answers and confirm `Answer 1` ordering by initial time then ID.
4. Confirm distinct stable per-Question icons and `Authenticated participant`, with no Google name/image, user ID, raw hash, or cross-Question identifier.
5. Only the current user's Answer shows green `Your answer`.
6. Initial HTML contains excerpts but no bodies or respondent user IDs.
7. Open Answer 1 and 2, confirm loading and correct bodies, simultaneous comparison, cached reopening, and item-local retry errors.
8. Confirm the same secrets remain private to signed-out users, `OPEN`/`CLOSED`, wrong-Question IDs, and WebMCP.

## 3a. Current User's Answer Before Reveal

1. As an answered authenticated user, open `OPEN` or `CLOSED` Detail.
2. Confirm green `Answered` and only the current user's excerpt/body.
3. Confirm no other Answer excerpt, body, ID, respondent, or timestamp in HTML.
4. Unanswered and indeterminate states show no answer-state tag.

## 4. Creation and Duplicate Prevention

1. Confirm next local midnight by default, or the following midnight when less than one hour away.
2. Draft creates exactly one `DRAFT` and opens confirmation; immediate publish creates exactly one `OPEN` without confirmation.
3. Both disable controls and show English progress immediately.
4. Double-click, token replay, and delayed-response interaction create at most one Question.
5. Replaying a token with changed content or intent yields a safe conflict without exposure.
6. Input error preserves values/token, and corrected resubmission creates one record.

## 5. Owner Deletion

1. Confirm deletion for the owner across all states on My Questions and public Detail.
2. Card shows excerpt/state/count; deletion area shows only irreversible checkbox and delete button.
3. Missing confirmation, stale version, non-owner, signed-out, and cross-origin requests change nothing.
4. Deleting a Question with at least two Answers makes it and its Answers unreachable while preserving other Questions.
5. Exactly one body-free `QUESTION_DELETED` audit record has the correct actor, target, outcome, and time.
6. Existing administrator deletion and operations do not regress.

## 6. Visual Quality and Accessibility

1. Check Home, lists, Detail, create, confirmation, and My Questions at 320/768/1280 px and 200% zoom.
2. Confirm no unintended horizontal scroll, overlap, clipped action, insufficient 4.5:1 text or 3:1 large/component contrast.
3. Complete prompt, copy, toggle, pagination, expansion, draft, publish, and delete by keyboard with visible focus.
4. Confirm meaningful icon names, decorative hiding, reduced-motion behavior, safe wrapping/escaping, and no `Signed in as` or raw user ID.
5. On My Questions, confirm no duplicate Header link and trash icons for deletion.
6. Confirm administration links to four 20-row table lists and the Home Hero uses a right-centered, nonrepeating, 30%-opacity background.

## 7. Three-Minute Demo

1. Start at an Open Question on Home; disclose/copy the prompt; have respondent A's Agent post.
2. Reload to show count zero-to-one and sealing; repeat with respondent B to show two.
3. After Reveal, show the visual transition and compare two expanded bodies.
4. Record that the flow completes within three minutes.

## Completion Criteria

- All automated gates pass; all expected Home/list/Reveal/create/replay/delete results match.
- Other-user secret exposure to signed-out users and WebMCP is zero.
- Primary flows work at target widths, 200% zoom, keyboard-only, and reduced motion.
- The demo is reproducible with at least two distinct Answers.
- Record results and unresolved items in `validation-record.md`.

## Implemented Verification Assets

- `tests/unit/question-deadline.test.ts`: local midnight boundaries.
- `tests/unit/question-listing.test.ts`: page parsing and counts.
- `tests/unit/form-submission-guard.test.ts`: intent preservation and duplicate prevention.
- `tests/unit/revealed-answers.test.ts`: item-local lazy retrieval/cache.
- `tests/unit/anonymous-participant.test.ts`: deterministic per-Question icons.
- `tests/unit/question-card.test.ts`: Open button-only versus Result Card-wide navigation.
- `tests/integration/question-list.test.ts`: 20-item pages and out-of-range behavior.
- `tests/integration/challenge-demo.test.ts`: Home-to-two-Answer Reveal non-exposure flow.
- `tests/d1/question-management-repository.test.ts`: token idempotency, owner/version deletion, cascades, and audit.

Automated and manual results are recorded in [validation-record.md](./validation-record.md).
