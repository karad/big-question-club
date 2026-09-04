# Implementation Tasks: Validating Agent Answer Submission Integrity and Sealed Answers

**Input**: Design artifacts in `specs/004-sealed-answer-verification/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`
**Testing Policy**: Cover pure submission and visibility logic, the D1 uniqueness constraint, and HTTP/SSR/WebMCP routes with automated tests.

## Format

- **[P]**: A parallelizable task in an independent file
- **[US#]**: The corresponding user story

## Phase 1: Setup

**Purpose**: Add entry points for implementing and validating SPEC 004 to the existing authentication and D1 foundation.

- [X] T001 Add the Question and Answer D1 binding to `wrangler.jsonc` and `src/types/env.d.ts`, aligning its usage policy with the existing authentication binding
- [X] T002 [P] Add local D1 migration instructions to `package.json` and `README.md`
- [X] T003 [P] Add `tests/helpers/d1.ts` with the minimum Fake needed to reproduce D1 results and failures in Unit and Integration Tests

---

## Phase 2: Foundation

**Purpose**: Prepare shared persistence, authentication, time, and visibility decisions for every story.

**⚠️ Important**: Do not begin implementing user stories until this Phase is complete.

- [X] T004 Add `questions`, `answers`, an Excerpt column, foreign keys, `UNIQUE(question_id, user_id)`, and required lookup indexes to `migrations/0003_add_questions_and_answers.sql`
- [X] T005 [P] Implement Question and time types, ISO-string conversion, and validation constants in `src/domain/question.ts`
- [X] T006 [P] Implement Body and Excerpt input validation—including a required, single-line, at-most-160-character Excerpt—submission results, and duplicate/deadline/authentication error contracts in `src/domain/answer-submission.ts`
- [X] T007 [P] Implement a pure visibility decision in `src/domain/answer-visibility.ts` that determines the SSR Excerpt list and single Body retrieval on click from the deadline, actor, and route
- [X] T008 Implement Question retrieval, Answer insertion, own-Answer retrieval, Excerpt-list retrieval, and post-Reveal single-Answer Body retrieval using only prepared statements in `src/repositories/question-repository.ts`
- [X] T009 Update `src/auth/session.ts` and `src/types/env.d.ts` to establish a safe dependency boundary that passes the authenticated participant and D1 repository to Routes
- [X] T010 Update `src/app.tsx` and `src/index.tsx` so the application can receive D1 and current time through dependency injection
- [X] T011 Add boundary tests to `tests/unit/answer-visibility.test.ts` and `tests/unit/answer-submission.test.ts` for immediately before, exactly at, and after the deadline; blank, multiline, and over-limit Body/Excerpt values; and authentication and duplicate errors

**Checkpoint**: The D1 uniqueness constraint, submission eligibility, and visibility decisions are available as a shared, testable foundation.

---

## Phase 3: User Story 1 - An Agent Submits One Answer to a Question (Priority: P1) 🎯 MVP

**Goal**: Allow an authenticated Personal Agent to submit exactly one Answer to a pre-deadline Question and safely reject retries and concurrent submissions.

**Independent Test**: Run ten consecutive submissions and concurrent submissions by the same participant, confirming that exactly one Answer is always committed.

- [X] T012 [P] [US1] Add contract tests for `submit_answer` input, success, unauthenticated, missing Question, deadline, and duplicate outcomes to `tests/unit/answer-submission.test.ts`
- [X] T013 [P] [US1] Add Integration Tests for authenticated submission, resubmission, ten pairs of concurrent submissions, and preservation of an existing Answer to `tests/integration/answer-submission-api.test.ts`
- [X] T014 [US1] Complete submission in `src/repositories/question-repository.ts`, converting a uniqueness-constraint violation to `ANSWER_ALREADY_SUBMITTED` without changing the existing Answer
- [X] T015 [US1] Implement authentication, input, Worker-side time, and HTTP error conversion for `POST /api/questions/:questionId/answers` in `src/routes/submit-answer.ts`
- [X] T016 [US1] Register the Answer-submission Route in `src/app.tsx` and set `Cache-Control: no-store` on every submission response
- [X] T017 [US1] Implement strict `questionId`, `answer`, and `excerpt` input Schema and write-Tool registration in `src/webmcp/register-submit-answer-tool.ts`
- [X] T018 [US1] Add WebMCP Tool registration for `submit_answer` to `src/client.ts`
- [X] T019 [P] [US1] Add Tool tests for the Excerpt-inclusive input Schema, success, 409 errors, cancellation, and network failure to `tests/unit/register-submit-answer-tool.test.ts`
- [X] T020 [US1] Add tests for submission acceptance/rejection immediately before, exactly at, and after the deadline to `tests/integration/answer-submission-api.test.ts`
- [X] T021 [US1] Update the submission-integrity procedure in `specs/004-sealed-answer-verification/quickstart.md` with implemented error codes and result fields

**Checkpoint**: Exactly one Answer is committed for a participant and Question, and submissions at or after the deadline are rejected.

---

## Phase 4: User Story 2 - Other Participants' Answers Remain Hidden While Responses Are Open (Priority: P1)

**Goal**: Before the deadline, expose no other participant's Answer Body, Excerpt, extract, summary, identifier, or clue to existence through any of three routes.

**Independent Test**: After two participants submit, attempt to retrieve the other's Answer through SSR, direct HTTP APIs, and WebMCP before the deadline and confirm there is no disclosure.

- [X] T022 [P] [US2] Add visibility-decision tests for the participant, another participant, and unauthenticated actor before the deadline across SSR, HTTP, and WebMCP to `tests/unit/answer-visibility.test.ts`
- [X] T023 [P] [US2] Add non-exposure Integration Tests for pre-deadline SSR, HTTP APIs, and the Answer detail API from two participants and an unauthenticated actor to `tests/integration/question-visibility.test.ts`
- [X] T024 [US2] Implement `GET /api/questions/:questionId` and `GET /api/questions/:questionId/my-submission` in `src/routes/question.ts`, returning no Answer information other than the participant's own status
- [X] T025 [US2] Register the Question API and own-submission-status Route in `src/app.tsx`, returning contract-compliant errors when unauthenticated or missing
- [X] T026 [US2] Implement the read-only `get_my_submission` Tool in `src/webmcp/register-my-submission-tool.ts`
- [X] T027 [US2] Add WebMCP Tool registration for `get_my_submission` to `src/client.ts`
- [X] T028 [P] [US2] Add Tool tests to `tests/unit/register-my-submission-tool.test.ts` that parse only the participant's own status and reject other participants' Answers
- [X] T029 [US2] Add tests to `tests/integration/question-visibility.test.ts` confirming that undefined routes resembling direct Answer retrieval, Answer lists, Excerpts, extracts, or summaries return no other-participant information

**Checkpoint**: Before the deadline, no other participant's Answer Body, extract, summary, or identifier is exposed through any route.

---

## Phase 5: User Story 3 - Humans Compare Answers After the Deadline (Priority: P2)

**Goal**: After the deadline, an authenticated Human reads the SSR Excerpt list and expands one Body through the detail API on click. WebMCP returns no other participant's Answer.

**Independent Test**: Move a fixed time across the deadline and confirm that only SSR shows all Answers after the deadline.

- [X] T030 [P] [US3] Add decision tests for post-deadline SSR visibility, HTTP/WebMCP non-disclosure, and the zero-Answer empty state to `tests/unit/answer-visibility.test.ts`
- [X] T031 [P] [US3] Add authorization Integration Tests for the authenticated post-deadline SSR Excerpt list, a single Body on click, and the Answer detail API to `tests/integration/question-visibility.test.ts`
- [X] T032 [US3] Implement authenticated-Human SSR for `GET /questions/:questionId` and `GET /api/questions/:questionId/answers/:answerId` in `src/routes/question.ts`, showing `Answers are sealed` before the deadline, the Excerpt list after it, and only the selected Body on click
- [X] T033 [US3] Register the Question-detail SSR Route in `src/app.tsx` and connect the existing authentication-state display to Question detail
- [X] T034 [US3] Add regression tests to `tests/integration/question-visibility.test.ts` confirming that WebMCP still returns no other participant's Answer after the deadline and the Answer detail API returns only the requested item
- [X] T035 [US3] Update `specs/004-sealed-answer-verification/contracts/question-visibility.md` against the implemented SSR display, empty state, and route-specific responses
- [X] T036 [US3] Add result fields to the manual post-deadline SSR/HTTP/WebMCP validation matrix in `specs/004-sealed-answer-verification/quickstart.md`

**Checkpoint**: After the deadline, authenticated-Human SSR shows an Excerpt list and only an authenticated Human can retrieve one requested Body from the detail API. Agents cannot retrieve other participants' Answers.

---

## Phase 6: Polish and Cross-Cutting Checks

**Purpose**: Complete quality, documentation, and reproduction procedures across all stories.

- [X] T037 [P] Map the two-participant, pre/post-deadline, three-route matrices in `tests/integration/answer-submission-api.test.ts` and `tests/integration/question-visibility.test.ts` to success criteria SC-001 through SC-005
- [X] T038 [P] Synchronize safe manual validation procedures for local D1, two participants, and WebMCP between `README.md` and `specs/004-sealed-answer-verification/quickstart.md`
- [X] T039 Add `specs/004-sealed-answer-verification/validation-record.md` with a Secret-free template for Go/No-Go, acceptance conditions, test results, and unresolved items
- [X] T040 Compare `MILESTONE.md`, `USE_CODEX.md`, and `specs/004-sealed-answer-verification/{spec.md,plan.md,data-model.md,contracts/,quickstart.md}` against implementation and validation results, then run and record `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format`

---

## Dependencies and Execution Order

- Phase 1 → Phase 2 is prerequisite for every story.
- US1 and US2 can start after Phase 2, but US2 manual validation requires the US1 submission capability.
- US3 follows US2 because it adds SSR visibility while preserving the US2 visibility boundary.
- Polish follows completion of US1 through US3.

```text
Setup → Foundation → US1 → US2 → US3 → Polish
```

## Parallel Execution Examples

### Foundation

```text
T005: src/domain/question.ts
T006: src/domain/answer-submission.ts
T007: src/domain/answer-visibility.ts
```

### US1

```text
T012: tests/unit/answer-submission.test.ts
T013: tests/integration/answer-submission-api.test.ts
T019: tests/unit/register-submit-answer-tool.test.ts
```

### US2

```text
T022: tests/unit/answer-visibility.test.ts
T023: tests/integration/question-visibility.test.ts
T028: tests/unit/register-my-submission-tool.test.ts
```

## Implementation Strategy

1. Establish D1 constraints and shared decisions in Phases 1 and 2.
2. Implement US1 and verify one Answer per participant and the deadline boundary with automated tests.
3. Extend and verify pre-deadline non-exposure across three routes with US2.
4. Add SSR Reveal with US3 and regression-check API/WebMCP non-exposure.
5. Complete SPEC 004 only after all automated tests and the manual matrix pass.
