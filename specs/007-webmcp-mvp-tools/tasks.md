# Tasks: WebMCP MVP Tools

**Input**: Design documents in `specs/007-webmcp-mvp-tools/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Testing Policy**: Use failing-first unit tests for the one-line prompt, environment-aware URL, grapheme boundaries, and tool schemas; integration tests for authentication, HTTP, SSR, and WebMCP flows; and Workers D1 integration tests for migration, owner-only update/delete, and concurrency. Finally verify the quickstart with a real browser and Personal Agent.

**Organization**: Split six user stories into independently verifiable phases and execute all tasks in dependency order.

## Phase 1: Setup and Baseline

**Purpose**: Prepare SPEC 007 validation records and shared test helpers without breaking SPEC 004–006.

- [X] T001 Record current branch, existing four-tool registration, Node/D1 tests, typecheck, lint, and build baseline in `specs/007-webmcp-mvp-tools/validation-record.md`
- [X] T002 [P] Add shared helpers for inspecting WebMCP registration and fetch responses to `tests/helpers/webmcp.ts`
- [X] T003 [P] Add SPEC 007 Question, Answer, two-User, and deadline-boundary fixtures to `tests/helpers/question-repository.ts`

---

## Phase 2: Shared Foundation

**Purpose**: Establish Answer update timestamps, display-character contracts, common errors, and repository boundaries for every story.

**⚠️ CRITICAL**: Do not begin user-story implementation until this phase is complete.

- [X] T004 [P] Add failing-first migration tests for `answers.updated_at`, existing Answer preservation, and transfer of display-character checks to `tests/d1/schema-contract.test.ts` and `tests/d1/legacy-upgrade.test.ts`
- [X] T005 Implement Answer-table rebuilding, `updated_at`, whitespace/newline, uniqueness, and referential constraints in `migrations/0005_answer_revisions.sql` and `src/db/schema.ts`
- [X] T006 [P] Add failing-first tests to `tests/unit/answer-submission.test.ts` for body 1/5,000/5,001 graphemes; excerpt 1/160/161; combining characters, emoji, newlines, and undefined fields
- [X] T007 Implement shared grapheme counting and common submit/update input contracts in `src/domain/question-input.ts` and `src/domain/answer-submission.ts`
- [X] T008 [P] Add the English common error contract including `INVALID_INPUT`, `ANSWER_NOT_FOUND`, and `TOOL_UNAVAILABLE` to `src/domain/answer-submission.ts`, plus migration-locking unit tests in `tests/unit/answer-submission.test.ts`
- [X] T009 Add `Answer.updatedAt`, submit/update/remove result types, and repository methods to `src/domain/question.ts`, `src/repositories/question-repository.ts`, and `tests/helpers/question-repository.ts`
- [X] T010 [P] Add failing-first shared expectations for authentication, Draft non-enumeration, non-`OPEN`, temporary failure, and `Cache-Control: no-store` to `tests/integration/webmcp-question-api.test.ts` and `tests/integration/answer-mutation-api.test.ts`

**Checkpoint**: Migration, domain input, common errors, and repository interfaces are available to all stories.

---

## Phase 3: User Story 1 — Copy an Agent Request from the Question Screen (P1) 🎯

**Goal**: Only on authenticated, unanswered, `OPEN` Question screens, show a one-line prompt specifying ChatGPT's built-in browser instead of an existing Chrome tab, with a current-Origin absolute Question URL, and report copy success/failure in English.

**Independent Test**: Even with injection in the body, only the absolute Question URL without query/fragment is variable; copied and displayed text match; manual copy remains on failure; and copying alone invokes no tool.

- [X] T011 [P] [US1] Add failing-first unit tests to `tests/unit/agent-request-prompt.test.ts` for the finalized one-line English prompt, built-in browser, exclusion of an existing Chrome tab, current-Origin absolute URL, no query/fragment/body, and HTML escaping
- [X] T012 [US1] Implement pure environment-aware absolute URL, one-line prompt, and visibility functions in `src/domain/agent-request-prompt.ts`
- [X] T013 [P] [US1] Add failing-first SSR branches for authenticated unanswered Open, unauthenticated, submitted, Draft, Closed, and Revealed to `tests/integration/agent-request-prompt.test.ts`
- [X] T014 [US1] Implement `Ask your personal agent`, notice, selectable prompt, `Copy prompt`, and status region in `src/views/question-detail.tsx`, rendered by state from `src/routes/question.ts`
- [X] T015 [P] [US1] Add failing-first unit tests for Clipboard success, absent API, denial, and no side effects to `tests/unit/agent-request-prompt-client.test.ts`
- [X] T016 [US1] Implement Clipboard `writeText()` and `Copied`/manual-copy guidance in `src/client/agent-request-prompt.ts`, initialized only on Question screens from `src/client.ts`

**Checkpoint**: A Human can explicitly select a Question and copy a safe request prompt.

---

## Phase 4: User Story 2 — Read a User-Selected Question (P1)

**Goal**: An authenticated Agent retrieves only the Human-selected `OPEN` Question as an untrusted DTO with fixed instructions.

**Independent Test**: Only the specified Open Question is returned; Draft/Closed/Revealed are rejected; creator, counts, personal state, and other Answers are absent.

- [X] T017 [P] [US2] Add failing-first unit tests to `tests/unit/register-get-question-tool.test.ts` for `get_question` input schema, fixed description, `readOnlyHint: true`, `untrustedContentHint: true`, and AbortSignal
- [X] T018 [P] [US2] Add failing-first integration tests to `tests/integration/webmcp-question-api.test.ts` for the Question DTO, fixed instructions, authentication, state, and private fields
- [X] T019 [US2] Update `GET /api/questions/:questionId` to the WebMCP Question contract and implement authentication, `OPEN`, non-enumeration, and no-store in `src/routes/question.ts` and `src/app.tsx`
- [X] T020 [US2] Implement strict input, same-origin fetch, cancellation, and common-error preservation for `get_question` in `src/webmcp/register-get-question-tool.ts`
- [X] T021 [US2] Add `get_question` to production registration in `src/client.ts` and verify in `tests/integration/agent-request-prompt.test.ts` that the page opened from US1's URL can derive the specified ID

**Checkpoint**: The Agent reads only the Human-selected Question and has no discovery capability.

---

## Phase 5: User Story 3 — Submit One Independent Answer (P1)

**Goal**: Submit exactly one current-User Answer to the selected Question while satisfying display-character, deadline, duplicate, and error contracts.

**Independent Test**: Only valid Open submission succeeds; duplicate, ten concurrent, deadline, invalid-input, and unauthenticated cases return expected codes.

- [X] T022 [P] [US3] Add failing-first tests to `tests/unit/register-submit-answer-tool.test.ts` for new `INVALID_INPUT`/`TOOL_UNAVAILABLE`, display-character schema, annotations, and cancellation
- [X] T023 [P] [US3] Add failing-first tests to `tests/integration/answer-submission-api.test.ts` for success, duplicate, ten concurrent submissions, pre-deletion uniqueness, deadline, authentication, and Draft non-enumeration
- [X] T024 [US3] Implement common domain input, `updatedAt === createdAt`, and stable English errors for the submission route/repository in `src/routes/submit-answer.ts` and `src/repositories/question-repository.ts`
- [X] T025 [US3] Synchronize `submit_answer` schema, description, same-origin fetch, AbortSignal, and common errors in `src/webmcp/register-submit-answer-tool.ts`

**Checkpoint**: Exactly one independent Answer is submitted to the Human-selected Question.

---

## Phase 6: User Story 4 — Update or Remove My Answer (P1)

**Goal**: Only on explicit Human request, update/delete the current User's Answer before the deadline, supporting safe resubmission and concurrency.

**Independent Test**: With two Users, current-User update/delete/resubmit succeeds while unauthorized, post-deadline, update-vs-delete, and delete-vs-resubmit cases produce no other-User changes or multiple Answers.

- [X] T026 [P] [US4] Add failing-first D1 tests to `tests/d1/answer-mutation-repository.test.ts` for owner-only update/remove, `updatedAt`, hard delete, resubmission, deadline, no other-User changes, and ten-case concurrency groups
- [X] T027 [US4] Implement conditional prepared `UPDATE`/`DELETE` and result classification in `src/repositories/question-repository.ts`, ensuring late update cannot restore after remove
- [X] T028 [P] [US4] Add failing-first integration tests to `tests/integration/answer-mutation-api.test.ts` for successful `PUT`/`DELETE /api/questions/:questionId/my-answer`, invalid input, authentication, missing Question, missing personal Answer, deadline, and temporary failure
- [X] T029 [US4] Implement update/delete HTTP contracts and English error classification in `src/routes/answer-mutations.ts` and register them in `src/app.tsx`
- [X] T030 [P] [US4] Add failing-first tests for `update_answer` and `remove_answer` schemas, explicit-Human-request descriptions, write annotations, cancellation, and error preservation to `tests/unit/register-update-answer-tool.test.ts` and `tests/unit/register-remove-answer-tool.test.ts`
- [X] T031 [P] [US4] Implement strict `update_answer` input and same-origin PUT in `src/webmcp/register-update-answer-tool.ts`
- [X] T032 [US4] Implement strict `remove_answer` input and same-origin DELETE in `src/webmcp/register-remove-answer-tool.ts`, then register both in `src/client.ts`

**Checkpoint**: Only the current User's Answer can be corrected or withdrawn before the deadline, with safe re-entry after deletion.

---

## Phase 7: User Story 5 — Check My Submission State (P1)

**Goal**: Verify only the current User's latest state after submission, update, deletion, and deadline.

**Independent Test**: Updated state returns latest body and two timestamps, deleted state returns `not_submitted`, and a Question answered only by another User still returns `not_submitted`.

- [X] T033 [P] [US5] Add failing-first personal DTO integration tests to `tests/integration/webmcp-question-api.test.ts` for unsubmitted, submitted, updated, deleted, Closed, Revealed, and another User submitted
- [X] T034 [US5] Return current User `submittedAt`/`updatedAt`, preserve Draft non-enumeration and independence from other-User state in `src/routes/question.ts` and `src/repositories/question-repository.ts`
- [X] T035 [US5] Synchronize untrusted annotations, strict input, cancellation, and updated/deleted responses for `get_my_submission` in `tests/unit/register-my-submission-tool.test.ts` and `src/webmcp/register-my-submission-tool.ts`

**Checkpoint**: The Agent can reliably recheck only the current User's state.

---

## Phase 8: User Story 6 — Use Consistent, Safe Tool Contracts (P2)

**Goal**: Lock down the five-tool surface, authentication, annotations, errors, and absence of other-User exposure/change across all tools.

**Independent Test**: Exactly five tools are available, and combining two Users, all Question states, and all tools exposes or changes zero other-User data.

- [X] T036 [P] [US6] Add failing-first tests to `tests/integration/verification-page.test.ts` and `tests/unit/register-tool.test.ts` confirming production registers exactly five tools and no discovery, P0 validation, or other-User Answer tools
- [X] T037 [US6] Remove P0 validation tools and `who_am_i` registration from `src/client.ts`; finalize sequential registration, failure status, English descriptions, and annotations for five tools
- [X] T038 [US6] Add cross-cutting regression tests to `tests/integration/question-visibility.test.ts` and `tests/d1/answer-mutation-repository.test.ts` for no other-User Answer exposure/change across two Users, Draft/Open/Closed/Revealed, five tools, and direct HTTP

**Checkpoint**: The production WebMCP surface has minimum capability and sealed boundaries.

---

## Phase 9: Polish and Cross-Cutting Verification

**Purpose**: Synchronize documentation, quality gates, real-browser E2E, and completion records.

- [X] T039 [P] Synchronize safe verification procedures and result sections for five tools, prompt copy, update/delete/resubmit, two Users, and injection in `README.md`, `specs/007-webmcp-mvp-tools/quickstart.md`, and `specs/007-webmcp-mvp-tools/validation-record.md`
- [X] T040 Complete `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`, `npm run test:d1`, `npm run build`, `npm run db:schema:check`, and quickstart real-device E2E; record results in `specs/007-webmcp-mvp-tools/validation-record.md`, `USE_CODEX.md`, and only on success `MILESTONE.md`

---

## Phase 10: Context-Grounded Answer Contract

- [X] T041 [P] Lock the finalized one-line prompt and fixed `get_question` context instructions with unit and integration tests
- [X] T042 Implement across tool descriptions, schemas, and returned data the rule to prioritize User-authored statements, avoid treating Assistant suggestions/options as facts, and when no explicit personal view exists create and submit a best-effort proxy without asserting unverified facts and without asking solely for that missing view. The initial prompt authorizes submission without another preview or approval; verify personal state afterward
- [X] T043 Synchronize SPEC 007/009, README, MILESTONE, and validation records with the finalized contract, and run every automated quality gate

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies.
- **Phase 2**: After Phase 1; blocks all stories.
- **US1 (Phase 3)**: After Phase 2.
- **US2 (Phase 4)**: After Phase 2; integrating US1 verifies copy-to-retrieval.
- **US3 (Phase 5)**: After Phase 2; after US2 it covers the initial prompt's primary path.
- **US4 (Phase 6)**: After Phase 2 and US3 because an existing Answer is required.
- **US5 (Phase 7)**: Can start after Phase 2; post-update/delete cases depend on US4.
- **US6 (Phase 8)**: After US2–US5; locks down the cross-tool surface.
- **Phase 9**: After all implementation stories.
- **Phase 10**: After Phase 9; applies the finalized prompt and context-grounding contract to the five tools.

### User Story Dependency Graph

```text
Foundation
├── US1 Prompt display/copy
├── US2 Selected Question retrieval ──> US3 First submission ──> US4 Update/delete
│                                         └───────────────────> US5 Personal state
└─────────────────────────────────────────────────────────────> US6 Cross-cutting safety
```

### Order Within Each Story

- Create failing-first tests and confirm expected failure before implementation.
- Implement domain/schema/repository before routes.
- Establish HTTP contracts before WebMCP registration.
- Pass the story's independent tests before the next dependent story.

## Parallel Execution Examples

### US1

```text
T011 Prompt unit test
T013 SSR display integration test
T015 Clipboard unit test
```

### US2 and US3

```text
T017 get_question tool test
T018 Question API integration test
T022 submit_answer tool test
T023 Submission API integration test
```

### US4

```text
T026 D1 update/delete and concurrency test
T028 HTTP update/delete integration test
T030 WebMCP update/delete unit test
```

### US5 and US6

```text
T033 Personal-state integration test
T036 Five-tool surface test
T038 No-other-User-exposure/change regression test
```

## Implementation Strategy

### Recommended MVP

The minimum Human-selected Agent Answer value is complete with Phases 1–2 and US1, US2, US3, and US5: prompt copy, selected Question retrieval, one submission, and personal verification.

### Incremental Delivery

1. Fix migration, domain, and repository foundations in Phases 1–2.
2. Add the explicit Human starting point in US1.
3. Complete first-Answer E2E in US2, US3, and US5.
4. Add pre-deadline correction, withdrawal, and resubmission in US4.
5. Lock down tool surface and sealed boundaries in US6.
6. Complete all gates and real-device E2E in Phase 9.
7. In Phase 10, synchronize the prompt, context grounding, proxy answers when no explicit view exists, no unverified claims, no unnecessary questions, no extra approval, and submission-result verification.

## Task Count

| Category | Tasks |
| --- | ---: |
| Setup | 3 |
| Foundational | 7 |
| US1 | 6 |
| US2 | 5 |
| US3 | 4 |
| US4 | 7 |
| US5 | 3 |
| US6 | 3 |
| Polish | 2 |
| Context contract | 3 |
| **Total** | **43** |
