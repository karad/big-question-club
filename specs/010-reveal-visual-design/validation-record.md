# Validation Record: Answer Reveal Experience and Challenge Visual Design

**Date**: 2026-09-03

## Automated Quality Gates

| Check | Result |
| --- | --- |
| SHA-1 comparison after two `npm run generate:icons` runs | PASS; both `bf63d933409f594662fb680f99a5978386de2810` |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run format` | PASS |
| `npm test` | PASS; 44 files, 635 tests |
| `npm run test:d1` | PASS; 16 files, 59 tests |
| `npm run build` | PASS with elevated permissions; generated `client-dist/client.js` and `client-dist/styles.css` |
| `npm run db:schema:check` | PASS |
| Search Worker assets for React runtime | No matches |
| Search source/tests for `Signed in as` | No matches |

## Real-Browser Verification

Using the local server, Google OAuth, Chrome, and shared Remote D1, confirmed Home sections and links, shared Header, English states, Result Cards and pagination; signed-out Result Detail exposes count but no excerpt/body and shows `Sign in to view results.`. Checked Home, both lists, Detail, create, and My Questions at 320/768/1280 px and actual 200% Chrome zoom with no unintended horizontal scroll, overlap, or missing primary action. Long English/Japanese Questions, excerpts, and bodies wrapped safely. Keyboard navigation reached `Read full answer` with visible focus and Enter expansion. Reduced-motion CSS removes transitions without removing meaning. Deleting a listed Answer caused only its item to show `Answer could not be loaded. Select this answer to try again.`. Blocking Clipboard still succeeded through selection/copy fallback; simultaneous API/fallback failure is unit-tested. Exactly five existing WebMCP tools remain.

## Three-Minute Demo

With Google OAuth and one Remote D1 Question, used two different Answers belonging to existing users:

1. Confirmed `OPEN`, zero Answers, and the prompt.
2. Saved the first Answer; reload showed one while other content stayed sealed.
3. Saved the second; reload showed two.
4. Advanced past reveal; amber sealing changed to orange `Results available`.
5. Opened `Answer 1` and `Answer 2` together and compared their bodies.

The sequence from zero Answers through two displayed bodies took about 40 seconds. Initial HTML and WebMCP exposed no other body, respondent, or individual time; bodies loaded only after authenticated human selection. Test Question/Answers and temporary failure/clipboard data were deleted through owner UI. Remote D1 then contained zero target Questions, zero target Answers, and one successful `QUESTION_DELETED` audit record.

## Completion Decision

- All 58 then-defined tasks had no unresolved items; all automated gates passed.
- Verified demo, target widths, 200% zoom, keyboard, long text, body failure, and normal/denied Clipboard environments.
- Deterministic tests supplement duplicate actions, double clipboard failure, reduced-motion media query, and state/permission/exposure matrices.
- SPEC 010 acceptance is satisfied: Go.

## 2026-09-03 Warm-Color Design Adjustment

- Unified background, text, actions, and states around warm paper, brown-black, orange, and amber based on the provided design.
- Aligned content width, headings, line length, section spacing, Card geometry/borders/shadows, round buttons, and Header navigation.
- Adopted at least 4.5:1 text contrast and 3:1 primary-control/focus contrast.
- Browser-checked Home, Detail, creation, and administration layout. After changes, 44 files/647 unit-integration tests, Typecheck, Lint, Format, Build, and Schema check passed.

## 2026-09-03 Date and Time Formatting

- Unified visible deadline/create/update/ban/audit times as `YYYY-MM-DD HH:mm`, preserving ISO 8601 APIs and `datetime` attributes.
- Browser-checked Detail and Audit Log for no visible `T`/`Z`. Added UTC/local boundary tests; 45 files/649 tests, Typecheck, Lint, Format, and Build passed.

## 2026-09-03 Hero Background Image

- Added the specified planet image at 30% opacity, right-center, nonrepeating; browser verification confirmed one non-obstructive image. Four Home integration tests, Typecheck, Lint, Format, and Build passed.

## 2026-09-03 Hero Copy

- Rewrote eyebrow, heading, and description in English to welcome big Questions, invite the user's biggest Question, and promise distinctive respondent-Agent Answers. Four Home integration tests and all static/build gates passed; browser-checked wrapping and background overlap.

## 2026-09-03 WebMCP Guidance

- Changed the Home-bottom heading to `WebMCP is required to answer`.

## 2026-09-03 Results Terminology

- Preserved internal `REVEALED` and URLs, but changed public `Revealed questions` to `Results`, `Answers revealed` to `Results available`, and actions to `View results`; aligned signed-out and empty text.
- 46 files/652 tests and all static/build gates passed; browser-checked terminology across Home Cards/actions and Detail navigation/state.

## 2026-09-03 Question Card Interaction Area

- Initially expanded the primary Card surface as the Detail link while preserving foreground Agent controls; removed Card shadow/movement and used only a slightly darker warm hover background.
- Browser verification and 46 files/652 tests plus static/build gates passed.

## 2026-09-03 My Questions Presentation Cleanup

- Changed My Questions `REVEALED` to `Results available` and removed duplicate body/state/count/explanation from deletion disclosure, leaving checkbox and button.
- 59 management/browsing integration tests and static/build gates passed; browser-checked Result state and disclosure.

## 2026-09-03 Question Card Navigation Buttons

- Styled list `View question`/`View results` and My Questions `View question` as shared white Secondary Buttons while retaining then-current Card link areas.
- Browser-checked Home/My Questions; 54 related integration tests and static/build gates passed.

## 2026-09-03 Header Authentication Controls

- Moved Google Sign in to the shared Header; after authentication show only `Sign out`, without raw ID or redundant status.
- Removed duplicate Home-bottom and Detail Sign in buttons and replaced them with Header guidance.
- Added three-state unit tests; 46 files/652 tests and static/build gates passed; browser confirmed authenticated Header and no duplicate Home operation.

## 2026-09-03 Administration Delete Labels

- Unified Question/Answer delete-button labels as `Delete`, retaining `Confirm delete question` and `Confirm delete answer` checkboxes.
- Twenty administration integration tests and static/build gates passed; browser-checked both lists.

## 2026-09-03 Question Cascade Deletion and Ban Label

- Confirmed owner and administrator Question deletion cascades all Answers through `ON DELETE CASCADE`; added explicit owner D1 coverage.
- Shortened the user-ban button to `Ban`, retaining `Confirm ban user`.
- Twenty administration integration tests, 22 related D1 tests, and static/build gates passed.

## 2026-09-03 Anonymous Authenticated Participants and Specification Synchronization

- Added the one-per-signed-in-account explanation, `Authenticated participant`, and deterministic symmetric icons derived only from Question/Answer IDs—never user ID, Google data, raw hash, or new persistence.
- Unit tests fix same-Question stability and cross-Question separation; administration linkage is unchanged.
- Reconciled Header, My Questions link omission, Results wording, Card interaction/buttons, date format, deletion icons/cascades, administration lists, and short labels across SPEC artifacts.
- Detected 20% implementation against 30% specification and fixed Hero `opacity: 0.3`.
- 47 files/656 Node tests, 16 files/60 D1 tests, Typecheck, Lint, Format, Production Build, Schema Check, icon generation, and diff-format checks passed. D1/Build used elevated permissions for local listening/Wrangler logs. All 16 checklist items and 63 tasks passed.

## 2026-09-03 Open Question Card Navigation Area

- Removed full-Card linking from Open Questions; only `View question` navigates. Agent/copy/disclosure remain independent; Result Card linking remains.
- Unit tests fixed state behavior; 48 files/658 tests and static/build gates passed. All 65 tasks were complete.

## 2026-09-03 Proxy Answer When No Personal View Exists

- Updated fixed `get_question` instructions and `get_question`/`submit_answer` descriptions to prioritize user statements and still submit the best proxy Answer without asserting unknown facts, presenting inference as known belief, or asking solely because no personal view exists.
- Removed the old stop-and-ask instruction and fixed four new contract points in unit/integration HTTP/tool tests.
- 48 files/658 tests and static/build gates passed; Build used elevated permissions for Wrangler logs. Synchronized SPEC 007/009/010 artifacts; all 68 tasks were complete.

## 2026-09-03 Built-In Browser Requirement in Agent Prompt

- Updated the one-line English prompt to require ChatGPT's built-in browser and reject existing Chrome tabs, preserving current-origin absolute URL, no query/fragment, submission permission, context rules, and WebMCP contracts.
- Fixed text and escaping with unit/integration tests. 48 files/658 tests and static/build gates passed; Build used elevated permissions. Synchronized README, MILESTONE, and SPEC 007/009/010; all 71 tasks were complete.

## 2026-09-03 Current-User Answer-State Visualization

- Confirmed only answered authenticated users see green `Answered` on Home, Open lists, Results lists, and Detail; signed-out or status-failure states show no tag and are not mistaken for unanswered.
- `OPEN` Detail shows only the current user's excerpt/body, with no other Answer data in initial HTML.
- Results show green `Your answer` only on the current user's item. Repository-to-view projection passes only `isOwn`, not respondent ID.
- Four target files/36 tests, all 48 files/663 Node tests, 16 files/60 D1 tests, Typecheck, Lint, Format, Production Build, Schema Check, icon diff, and format checks passed. D1/Build used elevated permissions. Synchronized artifacts; all 74 tasks were complete.

## 2026-09-03 Answered-Message Icon Placement

- Changed Question Card `Your agent has answered.` to an inline status with Check Icon on the left.
- Four Card unit tests, all 48 files/664 Node tests, and static/build gates passed; all 75 tasks were complete. Build used elevated permissions for Wrangler logs.

## 2026-09-03 Answer-State Tag Simplification

- Removed `Not answered` from Cards and Detail; only answered users show green `Answered`.
- Unit/integration tests confirm no tag for unanswered, signed-out, or failed status. All 48 files/664 Node tests and static/build gates passed; all 76 tasks were complete. Build used elevated permissions.
