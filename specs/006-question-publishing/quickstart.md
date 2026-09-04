# Quickstart: Question Creation and Publication Flow

## Purpose

After SPEC 006 is implemented, reproducibly verify input boundaries, authentication and ownership boundaries, draft editing, irreversible publication, `My Questions`, English UI, and keyboard flow. Complete automated tests first during implementation, then perform all manual checks together after every implementable item is complete.

See [data-model.md](./data-model.md) for detailed input and state definitions and [contracts/question-management.md](./contracts/question-management.md) for HTTP and screen outcomes.

## Prerequisites

- Node.js 22.13 or later or 24 or later, and npm, are available.
- Dependencies have been installed with `npm install`.
- `.dev.vars` contains local Google OAuth verification values.
- All migrations can be applied to local D1.
- Two test Users are available for Google OAuth.
- Do not enter real personal information, confidential information, or OAuth values into Questions or screens.

## 1. Automated Quality Gates

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
```

Expected results:

- At least thirty body, deadline, and acknowledgment input cases all match their expected results.
- At least twenty unauthenticated, wrong-owner, nonexistent, and already-published operations produce zero unauthorized changes.
- Only one publication time is committed even after ten sequential and ten concurrent publication requests.
- At least fifteen `My Questions` state, empty-state, and multi-User cases return only the current User's Questions and answer counts.
- Typecheck, lint, format, and build succeed.

Do not proceed to manual verification if any quality gate fails.

## 2. Local Environment

```bash
npm run db:migrate:local
npm run dev
```

Open the local URL shown in the browser and sign in with Google OAuth as User A.

## 3. Draft Creation and Input Errors

1. Open `/questions/new`.
2. Confirm that Question, Answer deadline, and the public-content acknowledgment appear in English.
3. Submit whitespace, 9 characters, 1,001 characters, a time less than one hour away, a time more than thirty days away, and an unchecked acknowledgment in turn.
4. Confirm each submission saves nothing and shows English field errors while retaining input values.
5. At the 10- and 1,000-character boundaries, including emoji and combining characters, confirm that the display counter agrees with the server result.
6. Enter a valid Question in any language, a deadline from one hour through thirty days away, check the acknowledgment, and select `Save draft`.

Expected results:

- Exactly one valid item becomes `DRAFT`.
- Review shows the body, local date/time, IANA time zone, and UTC deadline.
- HTML-like text in a Question body is displayed as text and is neither executed nor interpreted.

## 4. Draft Editing and Publication

1. From Review, open `Edit`, change the body and deadline, and save.
2. Confirm Review reflects the changes.
3. Submit `Publish question` without selecting the publication acknowledgment and confirm it is not published.
4. Select the acknowledgment and publish.
5. Resubmit the same publication operation and confirm existing content and publication time remain unchanged.
6. Navigate directly to the edit path for the published Question and confirm it cannot be changed.

Expected results:

- Publication commits exactly once, and the immediate state is `OPEN`.
- Body, deadline, reveal time, and creator do not change after publication.
- Deadline equals reveal time.

## 5. My Questions

1. Prepare at least one Draft, Open, Closed, and Revealed Question for User A.
2. Open `/my/questions`.
3. Confirm newest-first order, beginning of body, state, deadline, answer count, and state-specific actions.
4. Confirm Drafts have `Edit` and `Review and publish`, while published Questions have only `View question`.
5. Open the page as User B, who has no Questions, and confirm the empty state and `Create a question`.

Expected results:

- Each User can see only their own Questions.
- Answer bodies, excerpts, and submitter information are absent even from the HTML.

## 6. Ownership, Authentication, and CSRF

1. Prepare a draft identifier owned by User A.
2. While signed out, access creation, listing, editing, Review, and publication.
3. As User B, directly attempt GET and POST operations against User A's draft.
4. Compare the responses with the same operations against a nonexistent identifier.
5. Use automated integration tests to verify a cross-site-equivalent form POST without same-origin headers.

Expected results:

- Unauthenticated operations do not change Questions and explain in English that sign-in is required.
- Another User's Question and a nonexistent Question return the same 404 response and copy without draft content.
- CSRF rejection returns 403, includes no Question information, and does not change stored values.

## 7. Keyboard and Error Recovery

1. Without using a mouse, operate every creation field, `Save draft`, Review, `Edit`, publication acknowledgment, `Publish question`, and `My Questions`.
2. Submit invalid input once, navigate from the error summary to the corresponding field, and fix it.
3. Complete draft creation, publication, and return to the list within ten minutes.

Expected results:

- Every input has a visible label, and focus order follows screen order.
- Errors are associated with their fields and do not rely on color alone.
- Zero required controls are inoperable.

## 8. Record

Append the verification date, environment, automated quality-gate results, two-User ownership check, publication uniqueness, keyboard duration, and unresolved items to the end of this file or an equivalent record. Do not record real User IDs, email addresses, Session values, or confidential Question content.

## 9. Results (2026-09-02)

- Environment: macOS, Node.js, Vite development server, local D1 with all migrations applied, and two Google OAuth test Users
- Automated quality gates: typecheck, lint, format, 198 Node tests, 36 D1 tests, and build all passed
- Input boundaries: verified 9/10/1,000/1,001 graphemes, less than one hour, more than thirty days, and missing public-content acknowledgment. Display counters for combining characters and emoji matched the server contract
- Draft/publication: verified creation, retained inputs, editing, reflected Review changes, rejection without publication acknowledgment, exactly-once publication, and rejection of post-publication editing
- `My Questions`: verified newest-first `DRAFT`, `OPEN`, `CLOSED`, and `REVEALED` display, state-specific actions, answer counts, and User B's empty state. Validation Answer bodies and excerpts did not appear in the HTML
- Ownership boundary: confirmed User B sees the same `Question unavailable.` response for User A's Question and a nonexistent Question. POST, 401, 403, and unchanged stored values were verified by automated integration tests
- HTML/English UI: HTML-like body content remained text and triggered no script dialog. Management UI and errors appeared in English
- Keyboard: every interactive element was a native control or link; visible labels, error-summary target anchors, and screen-order focus without positive `tabindex` were confirmed. Draft creation through publication and return to the list took under ten minutes
- Publication uniqueness: manually verified post-publication edit rejection; sequential and concurrent groups of ten were verified by D1 tests
- Unresolved items: none. Only the Node.js `punycode` deprecation warning from an existing dependency remains visible
