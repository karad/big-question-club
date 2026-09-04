# Tasks: Answer Reveal Experience and Challenge Visual Design

**Input**: Design documents in `specs/010-reveal-visual-design/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Test Policy**: Per FR-033, FR-034, and `AGENTS.md`, add tests for pure logic, persistence boundaries, primary screen states, exposure, and primary flows before implementation. Conduct manual checks after implementable work is complete.

**Organization**: Organize by user story so each increment is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel in different files without unfinished dependencies.
- **[Story]**: Corresponding user story.

## Phase 1: Setup (Shared Foundation)

- [X] T001 Add Tailwind CSS 4, `@tailwindcss/vite`, React Icons 5, and generation-only React/React DOM; update locked dependencies and asset commands in `package.json` and `package-lock.json`
- [X] T002 Add the official Tailwind plugin and Vite library settings in `vite.client.config.ts` to import `src/styles.css` and emit fixed `client-dist/styles.css`
- [X] T003 Implement deterministic conversion of a fixed React Icons allowlist to static SVG without user input in `scripts/generate-icons.mjs`
- [X] T004 Run T003 to create a tracked fixed SVG dictionary in `src/generated/icons.ts`

## Phase 2: Foundational (Required by All Stories)

- [X] T005 [P] First test that generated icons contain only the allowlist, regenerate cleanly, and CSS assets build in `tests/integration/assets.test.ts`
- [X] T006 [P] First add presentation tests fixing accessible attributes for meaningful and decorative icons in `tests/unit/icon.test.ts`
- [X] T007 Implement shared `src/views/icon.tsx` reading only generated SVG and exclusively emitting an English label or `aria-hidden`
- [X] T008 Implement `SiteLayout` in `src/views/layout.tsx`, centralizing HTML shell, `/styles.css`, `/client.js`, metadata, and width
- [X] T009 Define shared paper/ink/action/seal/reveal colors, type, focus, viewport, and reduced-motion rules in `src/styles.css`, imported from `src/client.ts`

## Phase 3: User Story 2 - Find Answerable Questions and Results from Home (Priority: P1) 🎯 First Added-Specification Deliverable

### Tests

- [X] T010 [P] [US2] First add pure assembly tests for two Home-section limits, order, exclusivity, and current-user Answer state in `tests/unit/question-listing.test.ts`
- [X] T011 [P] [US2] First add D1 tests retrieving five Open, ten Results, counts, and answered state without secrets in `tests/d1/question-browsing-repository.test.ts`
- [X] T012 [P] [US2] First add Home integration tests for sections, empty/partial failure, auth-specific prompts, English UI, and per-user caching in `tests/integration/home.test.ts`
- [X] T013 [P] [US2] First add tests for global time toggle and per-Question prompt disclosure/copy in `tests/unit/question-list.test.ts` and `tests/unit/agent-prompt-clipboard.test.ts`

### Implementation

- [X] T014 [US2] Implement Home projection types, five/ten limits, and answered presentation in `src/domain/question-listing.ts`
- [X] T015 [US2] Implement repository/D1/memory support for two bounded sections and batched current-user state for five items in `src/repositories/question-repository.ts` and `tests/helpers/question-repository.ts`
- [X] T016 [US2] Implement Home routes in `src/routes/home.tsx` and `src/app.tsx` using one snapshot and per-user caching without converting auth failure to unanswered
- [X] T017 [US2] Implement shared Cards, two Home sections, full-list links, seal/reveal icons, and collapsed prompts in `src/views/question-card.tsx` and `src/views/home.tsx`
- [X] T018 [US2] Implement screen-wide time toggling, independent prompt disclosure, and multi-item copy in `src/ui/question-list.ts`, `src/ui/agent-prompt-clipboard.ts`, and `src/client.ts`

## Phase 4: User Story 3 - Browse Question Lists by Page (Priority: P1)

### Tests

- [X] T019 [P] [US3] First unit-test positive page parsing, page counts, empty/boundary/out-of-range cases in `tests/unit/question-listing.test.ts`
- [X] T020 [P] [US3] First D1-test 20-item state pages, totals, deterministic order, no overlap, and no secret projection in `tests/d1/question-browsing-repository.test.ts`
- [X] T021 [P] [US3] First integration-test both English lists, navigation, invalid values, empty state, and failure in `tests/integration/question-list.test.ts`

### Implementation

- [X] T022 [US3] Implement `QuestionListPage`, fixed 20-item pages, validation, and navigation decisions in `src/domain/question-listing.ts`
- [X] T023 [US3] Implement counts and page projections for `open` and `revealed` in `src/repositories/question-repository.ts` and `tests/helpers/question-repository.ts`
- [X] T024 [US3] Implement `/questions/open` and `/questions/revealed`, one time snapshot, and safe out-of-range responses in `src/routes/question-list.tsx` and `src/app.tsx`
- [X] T025 [US3] Implement 20-item shared-Card lists with `Previous`, `Next`, current page, empty, and failure states in `src/views/question-list.tsx`

## Phase 5: User Story 4 - Save Draft, Publish Immediately, and Delete a Question (Priority: P1)

### Tests

- [X] T026 [P] [US4] First unit-test tomorrow/following midnight, month/year boundaries, daylight saving adjustment, and no stored-value overwrite in `tests/unit/question-deadline.test.ts`
- [X] T027 [P] [US4] First unit-test first valid submit, intent preservation, disabling, and no lock on invalid forms in `tests/unit/form-submission-guard.test.ts`
- [X] T028 [P] [US4] First HTTP-test `draft`/`publish`, same-token replay, different-payload conflict, input errors, and owner deletion in `tests/integration/question-management.test.ts`
- [X] T029 [P] [US4] First D1-test token uniqueness, immediate publication, owner/version deletion, Answer cascade, and `QUESTION_DELETED` audit in `tests/d1/question-management-repository.test.ts`
- [X] T030 [P] [US4] First integration-test deletion visibility across owner/non-owner/signed-out and every Question state in `tests/integration/question-browsing.test.ts`

### Implementation

- [X] T031 [P] [US4] Implement pure local first-valid-midnight and `datetime-local` calculation in `src/domain/question-deadline.ts`
- [X] T032 [P] [US4] Add `QUESTION_DELETED`, creation intent/token, and deletion result types to `src/domain/admin.ts` and `src/repositories/question-repository.ts`
- [X] T033 [US4] Implement ID-conditional draft/immediate publish, replay detection, and owner/version-conditional audited deletion in `src/repositories/question-repository.ts` and `tests/helpers/question-repository.ts`
- [X] T034 [US4] Implement `POST /questions` intent/token validation and authenticated confirmed conflict-safe `POST /questions/:questionId/delete` in `src/routes/question-management.tsx` and `src/app.tsx`
- [X] T035 [US4] Add unique token, `Save as draft`, `Publish question`, and English owner-deletion confirmation/status in `src/views/question-management.tsx` and `src/views/question-detail.tsx`
- [X] T036 [US4] Implement deadline initialization and operation-specific replay guarding in `src/ui/deadline-display.ts`, `src/ui/form-submission-guard.ts`, and `src/client.ts`

## Phase 6: User Story 1 - Compare Revealed Independent Answers (Priority: P1)

### Tests

- [X] T037 [P] [US1] First D1-test initial-time/ID order, anonymous numbering, and zero/one/multiple Answers in `tests/d1/question-browsing-repository.test.ts`
- [X] T038 [P] [US1] First integration-test Reveal, empty state, excerpts, no embedded bodies, and signed-out rejection in `tests/integration/question-browsing.test.ts` and `tests/integration/question-visibility.test.ts`
- [X] T039 [P] [US1] First unit-test per-Answer loading, expand/collapse, fetched reuse, retry, and simultaneous expansion in `tests/unit/revealed-answers.test.ts`

### Implementation

- [X] T040 [US1] Add initial-order information and anonymous sequence to excerpt projection while excluding respondent data in `src/repositories/question-repository.ts` and `src/domain/question-browsing.ts`
- [X] T041 [US1] Implement sealed-to-Results presentation, excerpts from `Answer 1`, `No answers were submitted.`, and body containers in `src/views/question-detail.tsx`
- [X] T042 [US1] Implement per-Answer lazy loading, simultaneous expansion, fetched reuse, and item retry in `src/ui/revealed-answers.ts` and `src/client.ts`
- [X] T043 [US1] Integrate the screen while preserving existing authenticated/`REVEALED`/Question-membership/`private, no-store` contracts in `src/routes/question.ts`

## Phase 7: User Story 5 - Understand State Through Consistent Visual Design (Priority: P1)

### Tests

- [X] T044 [P] [US5] First test shared style assets, English landmarks, icon names, focus, and no `Signed in as` in `tests/integration/assets.test.ts` and `tests/integration/home.test.ts`
- [X] T045 [P] [US5] First test shared structure and accessible states for Detail, creation, confirmation, and owned lists in `tests/integration/question-browsing.test.ts` and `tests/integration/question-management.test.ts`

### Implementation

- [X] T046 [US5] Apply shared `SiteLayout` and generated icons to Header/navigation and remove raw IDs in `src/views/layout.tsx`, `src/views/site-header.tsx`, and `src/client.ts`
- [X] T047 [P] [US5] Implement Tailwind classes, amber seals, orange Results, brief transitions, and wrapping for Home/lists/Cards in `src/views/home.tsx`, `src/views/question-list.tsx`, and `src/views/question-card.tsx`
- [X] T048 [P] [US5] Implement reading hierarchy, icons, vertical comparison, and loading/empty/error states in `src/views/question-detail.tsx`
- [X] T049 [P] [US5] Implement responsive Tailwind forms, primary/danger operations, errors, and loading in `src/views/question-management.tsx`
- [X] T050 [US5] Finalize palette, contrast, 200% zoom, 320 px, visible focus, and reduced motion in `src/styles.css`

## Phase 8: User Story 6 - Communicate the Core Experience in a Three-Minute Demo (Priority: P1)

### Tests and Verification

- [X] T051 [US6] First add an automated Home/prompt/count-zero-one-two/seal/Reveal/two-body scenario in `tests/integration/challenge-demo.test.ts`
- [X] T052 [US6] Add regression that five existing WebMCP tools return no other-user count/excerpt/body/ID in `tests/integration/webmcp-question-api.test.ts` and `tests/unit/register-five-tools.test.ts`
- [X] T053 [US6] Manually run `quickstart.md` with two distinct real Answers and record duration, navigation, sealing, Reveal, and non-exposure in `specs/010-reveal-visual-design/validation-record.md`

## Phase 9: Polish and Cross-Cutting Verification

- [X] T054 [P] Update `README.md` and `specs/009-answer-period-browsing/user-manual.md` for Home, lists, Detail, and management behavior
- [X] T055 [P] Update `specs/010-reveal-visual-design/quickstart.md` for implemented icon/CSS/list/delete/demo procedures
- [X] T056 Run all Node/D1 tests, typecheck, Lint, Format, Build, schema check, and icon regeneration diff; record in `specs/010-reveal-visual-design/validation-record.md`
- [X] T057 Manually verify 320/768/1280 px, 200% zoom, keyboard, reduced motion, long text, copy failure, and body failure; append to `specs/010-reveal-visual-design/validation-record.md`
- [X] T058 Review acceptance and unresolved items; only on completion update SPEC 010 in `MILESTONE.md` and record model/decisions in `USE_CODEX.md`

## Phase 10: Adopted Anonymous-Participant Presentation and Specification Synchronization

- [X] T059 [P] [US1] Add failing-first tests for icon determinism, cross-Question separation, pattern bounds, authenticated explanation, and respondent-secret exclusion in `tests/unit/anonymous-participant.test.ts`, `tests/integration/question-visibility.test.ts`, and `tests/integration/challenge-demo.test.ts`
- [X] T060 [US1] Generate icons purely from Question/Answer IDs and show explanation, icon, and `Authenticated participant` in `src/domain/anonymous-participant.ts` and `src/views/question-detail.tsx`
- [X] T061 [US5] Fix Hero opacity to 30% and synchronize prior Header/Card/date/delete/admin-list/English-label changes and anonymity across SPEC artifacts
- [X] T062 Run all Node/D1 tests, typecheck, Lint, Format, Build, and schema check; record in `specs/010-reveal-visual-design/validation-record.md`
- [X] T063 Recheck acceptance, quality checklist, and unresolved items; record model/decisions in `USE_CODEX.md`
- [X] T064 [P] [US2] Add state tests that Open navigates only by `View question` while Results use the full Card in `tests/unit/question-card.test.ts`
- [X] T065 [US2] Limit full-Card links in `src/views/question-card.tsx` to Results and synchronize specification, contract, Quickstart, user docs, and validation
- [X] T066 [P] [US2] Add best-proxy/no-unverified-facts/no-unnecessary-question tests to `tests/unit/register-five-tools.test.ts`, `tests/unit/register-submit-answer-tool.test.ts`, and WebMCP API integration tests
- [X] T067 [US2] Update fixed `get_question` instructions and `get_question`/`submit_answer` descriptions and synchronize SPEC 007/009/010 artifacts
- [X] T068 Run Node tests, typecheck, Lint, Format, and Production Build; record in validation and `USE_CODEX.md`
- [X] T069 [P] [US2] Add fixed-prompt tests requiring ChatGPT's built-in browser and excluding existing Chrome tabs in `tests/unit/agent-request-prompt.test.ts` and `tests/integration/agent-request-prompt.test.ts`
- [X] T070 [US2] Update the one-line prompt in `src/domain/agent-request-prompt.ts` and synchronize README, MILESTONE, and SPEC 007/009/010
- [X] T071 Run Node tests, typecheck, Lint, Format, and Production Build; record in validation and `USE_CODEX.md`
- [X] T072 [P] [US1] [US2] Fix with unit/integration/D1 tests: answered-only `Answered`, pre-Reveal own-Answer only, Results `Your answer`, and no respondent user ID
- [X] T073 [US1] [US2] Implement answered-Question set and excerpt `isOwn` projections, green tags on Cards/Detail, and `Your answer` on own Result
- [X] T074 Synchronize SPEC, plan, data model, contract, research, and Quickstart; record all Node/D1/type/Lint/Format/Production Build/schema results in validation and `USE_CODEX.md`
- [X] T075 [US2] Place Check Icon and `Your agent has answered.` inline; update regression tests and validation
- [X] T076 [US2] Remove `Not answered`; show only answered-only `Answered`, synchronizing implementation, tests, and SPEC artifacts

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 has no dependencies; Phase 2 depends on it and blocks all stories.
- US2 begins after Phase 2 and is the first added-specification deliverable.
- US3, US4, and US1 can begin after Phase 2; integrate shared Card rules after T017. The Result comparison screen must also remain consistent with the shared Card contract established by T017.
- US5 depends on implemented US1–US4 screens; US6 depends on US1–US5; polish follows desired stories.
- Phase 10 runs T059 before T060/T061, then T062/T063. Current-user visualization uses T072, T073, then T074.

### User Story Dependency Graph

```text
Setup -> Foundational -> US2 ─┐
                      -> US3 ─┼-> US5 -> US6 -> Polish
                      -> US4 ─┤
                      -> US1 ─┘
```

### Within Each User Story

- Add target tests and confirm expected failure before implementation.
- Implement pure logic/types before persistence/routes, persistence before routes, and routes/SSR before client behavior.
- Run the story's tests at its checkpoint before continuing.

## Parallel Examples

### US2

```text
T010: listing unit tests
T011: D1 Home projection tests
T012: Home integration tests
T013: date and prompt client tests
```

### US3

```text
T019: page calculation unit tests
T020: D1 page projection tests
T021: list route integration tests
```

### US4

```text
T026: deadline-default tests
T027: duplicate-submit tests
T028: management HTTP tests
T029: create/delete D1 tests
T030: deletion-presentation tests
```

### US1

```text
T037: revealed order D1 tests
T038: exposure HTTP tests
T039: Answer expansion client tests
```

### US5

```text
T047: Home/list/Card visuals
T048: Detail/comparison visuals
T049: management visuals
```

## Implementation Strategy

### Complete Added Requirements First

1. Establish Tailwind, generated React Icons, and shared layout.
2. Complete two-section Home, disclosure, and global time toggle.
3. Complete 20-item lists.
4. Complete midnight default, draft/immediate publish, replay prevention, and owner deletion.
5. Verify each story independently before Reveal comparison.

### Complete Challenge Value

1. Complete Reveal and comparison of two or more Answers.
2. Align responsive visual quality and accessibility across screens.
3. Fix the zero/one/two, sealed, Results, comparison, and WebMCP boundaries as a three-minute demo.
4. Run all quality gates and manual checks together.

## Notes

- `[P]` applies only to separate-file work without unfinished dependencies; every story task has `[USn]`.
- React Icons are a generation source; never create raw HTML from user input.
- Defer manual testing until T053/T057 after implementable functionality and automated tests.
- Preserve others' changes and inspect diffs/regressions at every checkpoint.
