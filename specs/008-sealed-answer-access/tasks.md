# Tasks: Sealed Answer Access Control

**Input**: Design documents in `specs/008-sealed-answer-access/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Testing Policy**: Use failing-first unit tests for the branch-heavy authorization table, integration tests for authentication/SSR/HTTP/WebMCP, and D1 integration tests for repository projections and cross-Question isolation. Finally verify the quickstart with two Users and a real browser.

**Organization**: Four user stories are split into independently verifiable phases; all 40 tasks run in dependency order.

## Phase 1: Setup and Baseline

**Purpose**: Prepare SPEC 008 records and fixtures without breaking existing SPEC 004–007 Sealed Answer contracts.

- [X] T001 Record current branch and Node/D1 test, typecheck, lint, format, build, and schema-check baseline in `specs/008-sealed-answer-access/validation-record.md`
- [X] T002 [P] Add a five-subject, four-state, three-channel, three-information-category fixture to `tests/helpers/visibility-matrix.ts`
- [X] T003 [P] Add two-User, creator, Draft/Open/Closed/Revealed, zero/multiple-Answer, and wrong-Question fixtures to `tests/helpers/question-repository.ts`

---

## Phase 2: Shared Authorization Foundation

**Purpose**: Establish authorization inputs, state snapshots, safe projections, and User-dependent response headers for every story.

**⚠️ CRITICAL**: Do not begin user-story implementation until this phase is complete.

- [X] T004 [P] Add failing-first types and expected decisions for authentication, route purpose, Question state, and information category to `tests/unit/answer-visibility.test.ts`
- [X] T005 Implement the pure `answer-count`, `own-answer`, `other-excerpts`, and `other-body` access table in `src/domain/answer-visibility.ts`
- [X] T006 [P] Add failing-first expectations requiring `private, no-store` and `Vary: Cookie` for User-dependent success/failure in `tests/integration/question-visibility.test.ts`
- [X] T007 Implement shared User-dependent response headers in `src/routes/question.ts` and apply them to every Question-screen, personal-state, and Answer-detail branch
- [X] T008 [P] Define projection types and repository contracts for only count, own Answer, post-Reveal excerpts, and selected body in `src/repositories/question-repository.ts`
- [X] T009 Update the in-memory repository in `tests/helpers/question-repository.ts` for new projections and cross-Question isolation

**Checkpoint**: Every public channel can use the same decision table, state snapshot, projection, and header contract.

---

## Phase 3: User Story 1 — Seal Other Users' Answers on Every Path Before Reveal (P1) 🎯

**Goal**: In `DRAFT`, `OPEN`, and `CLOSED`, seal other Users' Answers from every subject and public channel, including the creator.

**Independent Test**: With distinguishable secrets in two Answers, confirm zero non-owner body, excerpt, ID, User, or time across pre-Reveal SSR, direct HTTP, and WebMCP-compatible paths.

- [X] T010 [P] [US1] Add failing-first `DRAFT`/`OPEN`/`CLOSED` denials for unauthenticated, creator, owner, other Human, and WebMCP to `tests/unit/answer-visibility.test.ts`
- [X] T011 [P] [US1] Add failing-first tests to `tests/integration/question-visibility.test.ts` proving pre-Reveal SSR has only count and own Answer, with no other secret in HTML body, attributes, or scripts
- [X] T012 [P] [US1] Add failing-first tests proving existing, missing, and wrong-Question Answer details all return `404 ANSWER_UNAVAILABLE` before Reveal
- [X] T013 [US1] Implement SSR/detail authorization in `src/routes/question.ts` from one Question-state snapshot using exactly one `now()` per request
- [X] T014 [US1] Render only own Answer as safe text before Reveal and invoke no other projection in `src/routes/question.ts` and `src/views/question-detail.tsx`
- [X] T015 [US1] Retrieve Answer details only after authorization and collapse existing/missing/wrong-Question to common denial in `src/routes/question.ts`
- [X] T016 [US1] Add regressions to `tests/integration/question-management.test.ts` and `tests/integration/question-visibility.test.ts` for no creator privilege and Draft non-enumeration

**Checkpoint**: Zero pre-Reveal other-User Answer exposure across all channels.

---

## Phase 4: User Story 2 — View Only Necessary Counts and Own Answer (P1)

**Goal**: Humans safely see count and own Answer for published Questions; WebMCP sees only personal state in every public state.

**Independent Test**: Personal non-submission is constant when only others answered; Human SSR has correct count, WebMCP no count, and submitters retrieve current Answers in three states.

- [X] T017 [P] [US2] Add failing-first tests for counts/own projection in `OPEN`/`CLOSED`/`REVEALED` and other-independent non-submission to `tests/unit/answer-visibility.test.ts`
- [X] T018 [P] [US2] Add failing-first zero/multiple-count and own/other User projection tests to `tests/d1/answer-visibility-repository.test.ts`
- [X] T019 [US2] Implement minimal count and Session-owner projections in `src/repositories/question-repository.ts`
- [X] T020 [P] [US2] Add failing-first Human SSR tests for correct count and own Answer in all three states to `tests/integration/question-visibility.test.ts`
- [X] T021 [P] [US2] Add failing-first `get_my_submission` tests proving owner-only three-state output independent of other counts to `tests/integration/webmcp-question-api.test.ts`
- [X] T022 [US2] Migrate Question-screen and personal-state routes in `src/routes/question.ts` to minimal projections, excluding counts and other data from WebMCP-compatible responses

**Checkpoint**: Human participation checks and owner-only WebMCP work without other-User data.

---

## Phase 5: User Story 3 — Let Only Authenticated Humans Read All Answers After Reveal (P1)

**Goal**: In `REVEALED`, only authenticated Humans retrieve all excerpts and one selected body; unauthenticated Users and WebMCP do not.

**Independent Test**: Verify all post-Reveal excerpts, zero initial bodies, one selected body, empty state, unauthenticated denial, and zero other-User WebMCP data.

- [X] T023 [P] [US3] Add failing-first decisions permitting only `REVEALED` Human SSR/detail and denying unauthenticated/WebMCP to `tests/unit/answer-visibility.test.ts`
- [X] T024 [P] [US3] Add failing-first D1 projections returning stable `{ id, excerpt }` and only `{ id, body }` within the selected Question to `tests/d1/answer-visibility-repository.test.ts`
- [X] T025 [US3] Implement minimal post-Reveal excerpt and Question-scoped selected-body projections in `src/repositories/question-repository.ts`
- [X] T026 [P] [US3] Add failing-first tests for all excerpts, zero bodies, empty state, and dangerous-character escaping in post-Reveal SSR
- [X] T027 [P] [US3] Add failing-first tests for one selected body, wrong-Question denial, and unauthenticated common denial after Reveal
- [X] T028 [US3] Implement post-Reveal excerpts, lazy body retrieval, empty state, and untrusted text rendering in `src/routes/question.ts` and `src/views/question-detail.tsx`
- [X] T029 [US3] Add tests to `tests/unit/register-production-tools.test.ts` and `tests/integration/webmcp-question-api.test.ts` confirming five WebMCP tools still expose no count or other-Answer capability after Reveal

**Checkpoint**: Human-only Reveal and owner-only WebMCP coexist.

---

## Phase 6: User Story 4 — Regression-Test Direct Access and Time Boundaries (P2)

**Goal**: Repeatedly verify the full matrix, boundaries, abnormal methods, expired authentication, and Session switching.

**Independent Test**: At least 180 base combinations and attack cases match 100%, with zero secret leakage or cross-User mixing.

- [X] T030 [P] [US4] Execute every five-subject/four-state/three-channel/three-category combination from `tests/helpers/visibility-matrix.ts` in `tests/unit/answer-visibility.test.ts`
- [X] T031 [P] [US4] Add deadline/Reveal before-at-after and one-time-per-request clock tests to `tests/integration/question-visibility.test.ts`
- [X] T032 [P] [US4] Add HEAD, unsupported method, invalid ID, and excessive-query non-exposure tests
- [X] T033 [P] [US4] Compare existing/missing/wrong-Question denial ten times each
- [X] T034 [P] [US4] Verify zero own-Answer mixing across authentication expiry and A/B Session switches
- [X] T035 [US4] Standardize unsupported route, exception, and expired-auth responses on common non-exposure headers/body in `src/app.tsx` and `src/routes/question.ts`
- [X] T036 [US4] Add cross-cutting D1 cases for all states, own/other Users, and wrong-Question projections to `tests/d1/answer-visibility-repository.test.ts`

**Checkpoint**: The matrix catches leakage from future routes, boundary changes, and direct access.

---

## Phase 7: Polish and Cross-Cutting Verification

**Purpose**: Synchronize documents, gates, real-browser E2E, and completion records.

- [X] T037 [P] Add Human/WebMCP disclosure boundaries using Question state as sole source and the SPEC 008 verification path to `README.md`
- [X] T038 [P] Synchronize `quickstart.md` and `validation-record.md` with implemented routes, headers, tests, and manual matrix
- [X] T039 Complete typecheck, lint, format, Node/D1 tests, build, and schema check; record results in `validation-record.md`
- [X] T040 Complete quickstart two-User, pre/post-Reveal, direct HTTP, WebMCP, and Session-switch checks; record results in `validation-record.md`, `USE_CODEX.md`, and only on success `MILESTONE.md`

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1**: None.
- **Phase 2**: After Phase 1; blocks all stories.
- **US1**: After Phase 2; establishes basic pre-Reveal boundaries.
- **US2**: Can start after Phase 2; coordinate SSR with US1 route changes.
- **US3**: Can start after Phase 2; final integration uses US1 denial and US2 projections.
- **US4**: After US1–US3; locks cross-cutting regression.
- **Phase 7**: After all stories.

### User Story Dependency Graph

```text
Foundation
├── US1 Pre-Reveal sealing ─┐
├── US2 count + own ───────┼──> US4 cross-cutting regression
└── US3 Human reveal ──────┘
```

### Order Within Each Story

- Create failing-first tests and confirm failure before implementation.
- Implement domain decisions and repository projections before routes/views.
- Pass independent tests before cross-cutting regression.

## Parallel Execution Examples

### US1

```text
T010 Domain denial table
T011 SSR non-exposure
T012 Detail non-enumeration
```

### US2

```text
T018 D1 owner projection
T020 Human SSR
T021 WebMCP personal state
```

### US3

```text
T024 D1 Reveal projection
T026 SSR excerpts
T027 Detail body
```

### US4

```text
T031 Boundary times
T032 Abnormal methods
T033 Non-enumeration repetition
T034 Session switching
```

## Implementation Strategy

### Recommended MVP

Complete Phases 1–2 and US1 first, independently verifying zero pre-Reveal exposure across every path. This is the minimum Sealed Answer safety value.

### Incremental Delivery

1. Fix decision table, projections, and headers in Setup/Foundation.
2. Complete pre-Reveal sealing in US1.
3. Safely provide counts and personal checks in US2.
4. Complete Human-only post-Reveal access in US3.
5. Lock all paths, boundaries, and direct access in US4.
6. Complete gates and real-device E2E in Phase 7.

## Task Count

| Category | Tasks |
| --- | ---: |
| Setup | 3 |
| Foundational | 6 |
| US1 | 7 |
| US2 | 6 |
| US3 | 7 |
| US4 | 7 |
| Polish | 4 |
| **Total** | **40** |
