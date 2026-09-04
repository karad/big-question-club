# Tasks: Question Creation and Publication Flow

**Input**: Design documents in `specs/006-question-publishing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/question-management.md, quickstart.md

**Tests**: Following project policy and measurable outcomes, create automated tests for pure input logic, repository/D1, and SSR/form/authorization before implementation.

**Organization**: Tasks are grouped by story so each user story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel in a different file without unfinished-task dependencies
- **[Story]**: User story from `spec.md`, US1 through US4
- Every task names its target file

## Phase 1: Setup

**Purpose**: Establish the current quality baseline and prepare the planned file boundaries.

- [x] T001 Record current typecheck, lint, format, Node test, D1 test, and build results in `specs/006-question-publishing/validation-record.md`
- [x] T002 [P] Create `src/domain/question-input.ts`, `src/routes/question-management.tsx`, and `src/views/question-management.tsx` with responsibilities defined in plan.md
- [x] T003 [P] Create `tests/unit/question-input.test.ts`, `tests/integration/question-management.test.ts`, and `tests/d1/question-management-repository.test.ts`, confirming existing configurations discover them

---

## Phase 2: Foundation

**Purpose**: Prepare the shared input, repository, authentication, CSRF, and view contracts for all stories.

**⚠️ CRITICAL**: Do not begin user-story implementation until this phase is complete.

- [x] T004 Add at least thirty failing-first unit tests to `tests/unit/question-input.test.ts` covering trim, 10/1,000 grapheme clusters, `en`/`ja`, one-hour/thirty-day deadlines, and acknowledgment fields
- [x] T005 Add English identifiers and types for Question body/deadline ranges and existing-schema compatibility value `auto` to `src/domain/question.ts`
- [x] T006 Implement `Intl.Segmenter` character counting, form parsing, normalization, field-specific English errors, and service-time deadline validation in `src/domain/question-input.ts`, making T004 pass
- [x] T007 Add typed repository contracts for owner retrieval, draft update, owner listing, conflicts, non-enumeration, and temporary failures to `src/repositories/question-repository.ts`
- [x] T008 Update `tests/helpers/question-repository.ts` to the expanded repository contract and implement in-memory fixtures supporting multiple Questions, owners, draft updates, and list aggregation
- [x] T009 [P] Implement shared JSX components in `src/views/question-management.tsx` for the English document layout, authentication guidance, non-enumerating 404, temporary failures, and error summary
- [x] T010 Add a Hono CSRF middleware boundary in `src/app.tsx` limited to Question-management forms, keeping Better Auth, HTTP API, and WebMCP routes out of scope

**Checkpoint**: Shared input, authentication, CSRF, repository, and view contracts are available.

---

## Phase 3: User Story 1 — Create a Question as a Draft (Priority: P1) 🎯 MVP

**Goal**: An authenticated Human can enter a valid body in any language, deadline, and public-content acknowledgment and save an owned Draft.

**Independent Test**: Submit valid input from `/questions/new`, receive one `DRAFT` and a Review redirect; invalid or unauthenticated operations save nothing and show English field errors.

### Tests

- [x] T011 [P] [US1] Add failing-first integration tests to `tests/integration/question-management.test.ts` for the creation screen, unauthenticated access, form parsing, field errors, retained input, JSX text escaping, and successful 303 redirect
- [x] T012 [P] [US1] Add failing-first D1 tests to `tests/d1/question-management-repository.test.ts` for valid drafts, creator foreign keys, rejection of invalid values, `publishedAt === null`, and `revealsAt === closesAt`

### Implementation

- [x] T013 [US1] Update `createDraft` in `src/repositories/question-repository.ts` to persist a UUID Question only from validated domain input and stably classify missing creators and D1 failures
- [x] T014 [US1] Implement the creation form in `src/views/question-management.tsx` with Question textarea, count, `datetime-local`, time-zone/UTC confirmation, moderation acknowledgment, and associated English errors
- [x] T015 [US1] Add Question-form helpers to `src/client.ts` for grapheme counting and converting local deadlines into UTC Unix milliseconds, IANA time zone, and UTC ISO display
- [x] T016 [US1] Implement authenticated creation GET and form-validation, draft-save, error-redisplay, and 303-to-Review POST handlers in `src/routes/question-management.tsx`
- [x] T017 [US1] Register `/questions/new` before parameter routes in `src/app.tsx`, wire `POST /questions` and dependencies, and make US1 integration tests pass

**Checkpoint**: User Story 1 independently verifies the draft-creation MVP.

---

## Phase 4: User Story 2 — Review and Publish a Draft (Priority: P1)

**Goal**: Edit and review only the owner's Draft and publish exactly once using execution-time revalidation and conditional updates.

**Independent Test**: Update an owned Draft, reflect it in Review, and publish to `OPEN` after explicit acknowledgment. Stale edits, invalid deadlines, duplicate/concurrent publication, and post-publication editing leave stored content unchanged.

### Tests

- [x] T018 [P] [US2] Add failing-first integration tests to `tests/integration/question-management.test.ts` for owner editing, Review, publication acknowledgment, deadline revalidation, stale responses, post-publication 409, and 303 detail redirect
- [x] T019 [P] [US2] Add failing-first D1 tests to `tests/d1/question-management-repository.test.ts` for owner retrieval, expectedUpdatedAt-matching updates, stale updates, another User's updates, and published-update rejection
- [x] T020 [US2] Add failing-first D1 tests to `tests/d1/question-management-repository.test.ts` for deadline boundaries, `revealsAt === closesAt`, and exactly-once publication under ten sequential and ten concurrent requests

### Implementation

- [x] T021 [US2] Implement owner retrieval by `id + creatorUserId` and conditional draft updates by `publishedAt IS NULL + expectedUpdatedAt`, with conflict classification, in `src/repositories/question-repository.ts`
- [x] T022 [US2] Strengthen publication in `src/repositories/question-repository.ts` to one conditional update requiring owner, Draft, `now + 1 hour <= closesAt <= now + 30 days`, and `revealsAt === closesAt`
- [x] T023 [US2] Implement a draft-edit form with expectedUpdatedAt and recoverable English stale/published states in `src/views/question-management.tsx`
- [x] T024 [US2] Implement the Review view in `src/views/question-management.tsx` with full body, local/time-zone/UTC deadline, sealed explanation, irreversibility, explicit acknowledgment, and Edit path
- [x] T025 [US2] Implement owner-draft edit GET/POST, latest-state retrieval, 400/404/409/503 classifications, and 303-to-Review in `src/routes/question-management.tsx`
- [x] T026 [US2] Implement Review GET and publication POST in `src/routes/question-management.tsx`, revalidating confirmPublication, expectedUpdatedAt, and execution-time input conditions before a 303 to detail
- [x] T027 [US2] Align editing/publication fixtures in `tests/helpers/question-repository.ts` with real-D1 ownership, conflict, deadline, and exactly-once semantics, making US2 integration tests pass

**Checkpoint**: User Stories 1 and 2 independently verify draft creation through irreversible publication.

---

## Phase 5: User Story 3 — Manage Personal Questions in My Questions (Priority: P2)

**Goal**: List only the current User's Questions newest first with state, deadline, answer count, and state-specific actions.

**Independent Test**: With two Users and Questions in four states, `/my/questions` shows only the current User's items in stable newest-first order, separates Draft and published actions correctly, and includes no Answer content.

### Tests

- [x] T028 [P] [US3] Add failing-first D1 tests to `tests/d1/question-management-repository.test.ts` for owner filtering, `createdAt DESC + id DESC`, empty results, per-Question answerCount, and no Answer retrieval
- [x] T029 [P] [US3] Add at least fifteen failing-first display tests to `tests/integration/question-management.test.ts` covering four states, empty state, owner-only results, state-specific English actions, and absence of Answer body/excerpt/submitter

### Implementation

- [x] T030 [US3] Implement `listByCreator` in `src/repositories/question-repository.ts`, aggregating Question and Answer counts in one query and returning only owner Questions in stable newest-first order
- [x] T031 [US3] Implement My Questions view in `src/views/question-management.tsx` with body prefix, current state, deadline, answer count, Draft/published actions, and English empty state
- [x] T032 [US3] Implement `GET /my/questions` in `src/routes/question-management.tsx` using Session User ID, shared `now`, owner-list query, and 503 classification
- [x] T033 [US3] Connect `/my/questions` and English navigation for authenticated Humans in `src/app.tsx`, preserving existing Question-detail paths

**Checkpoint**: User Story 3 is independently verifiable as an owner-only list.

---

## Phase 6: User Story 4 — Reject Unauthorized Viewing and Changes (Priority: P2)

**Goal**: Protect management information and changes from unauthenticated Users, non-owners, missing targets, Personal Agent paths, and cross-site forms.

**Independent Test**: Across all management GET/POST operations with two Users, other-owner and missing targets return the same 404, unauthenticated access returns 401, cross-site unsafe requests return 403, WebMCP gains no management tool, and stored values remain unchanged.

### Tests

- [x] T034 [P] [US4] Add a failing-first authorization matrix of at least twenty cases to `tests/integration/question-management.test.ts`, covering unauthenticated access to all management routes, identical missing/other-owner responses, cross-site forms, and absence of Personal Agent management operations
- [x] T035 [P] [US4] Add D1 tests to `tests/d1/question-management-repository.test.ts` verifying owner-only queries do not return another User's body and unauthorized edits/publications leave every Question column unchanged

### Implementation

- [x] T036 [US4] Standardize all handlers in `src/routes/question-management.tsx` on owner-only repository retrieval and map missing/other-owner targets to the same 404 and `Question unavailable.`
- [x] T037 [US4] Finalize Question-management CSRF paths and route ordering in `src/app.tsx`, and lock down in the authorization matrix that `src/client.ts` registers no management WebMCP tools

**Checkpoint**: All four user stories and authorization boundaries are independently verifiable.

---

## Phase 7: Polish and Cross-Cutting Quality

**Purpose**: Integrate every story and complete documentation, automated gates, and manual flows.

- [x] T038 [P] Add Question creation, My Questions, publication irreversibility, and local verification to `README.md`, and record important implementation decisions in `USE_CODEX.md`
- [x] T039 Run `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`, `npm run test:d1`, and `npm run build`; record counts, results, and unresolved items in `specs/006-question-publishing/validation-record.md`
- [x] T040 After all implementable tasks are complete, perform the two-User, input-boundary, publication, My Questions, ownership, CSRF, and keyboard checks in `specs/006-question-publishing/quickstart.md` and record results there

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundation)**: After Phase 1; blocks every user story
- **Phase 3 (US1)**: After Phase 2; draft-creation MVP
- **Phase 4 (US2)**: Can start after Phase 2, but integration reuses US1 forms/draft creation
- **Phase 5 (US3)**: Can start after Phase 2; real-data flow checks follow US1/US2
- **Phase 6 (US4)**: Can start after Phase 2; final matrix across all management routes follows US1–US3
- **Phase 7 (Polish)**: After all in-scope stories

### User Story Dependency Graph

```text
Setup → Foundation → US1 ──> US2 ──┐
                     ├────> US3 ──┼─> US4 final matrix → Polish
                     └────────────┘
```

- **US1 (P1)**: Starts after Foundation; independent draft-creation MVP
- **US2 (P1)**: Repository work can start after Foundation; screen integration reuses US1 forms
- **US3 (P2)**: Can start after Foundation and is independently verifiable with fixtures without US1/US2 completion
- **US4 (P2)**: Route-level work can run in parallel; the full-path matrix follows route implementation for US1–US3

### Order Within Each Story

- Create failing-first tests and confirm the requirement is not yet met
- Implement domain/repository contracts first
- Implement views
- Implement routes and app wiring
- Pass the story's independent tests before the next checkpoint

## Parallel Execution Examples

### User Story 1

```text
T011: SSR/form tests in tests/integration/question-management.test.ts
T012: Draft persistence tests in tests/d1/question-management-repository.test.ts
```

### User Story 2

```text
T018: Edit/Review/publication tests in tests/integration/question-management.test.ts
T019: Draft-conflict update tests in tests/d1/question-management-repository.test.ts
```

### User Story 3

```text
T028: Aggregate-query tests in tests/d1/question-management-repository.test.ts
T029: List-display tests in tests/integration/question-management.test.ts
```

### User Story 4

```text
T034: Authorization matrix in tests/integration/question-management.test.ts
T035: Ownership-invariant tests in tests/d1/question-management-repository.test.ts
```

## Implementation Strategy

### MVP First

1. Complete Phase 1.
2. Complete Phase 2.
3. Complete US1 in Phase 3.
4. Independently verify draft creation.
5. Continue to US2 publication.

### Incremental Delivery

1. Setup + Foundation: input, authentication, and repository foundation
2. US1: draft creation
3. US2: draft editing, Review, and publication
4. US3: My Questions
5. US4: authorization hardening across every management path
6. Polish: all quality gates and manual verification

## Notes

- Apply `[P]` only to work in separate files without unfinished-task dependencies.
- Confirm each story's tests fail before implementation.
- No migration is planned. If the existing schema proves insufficient, stop implementation and revisit the design.
- Perform manual testing together only after automated quality gates and all implementable tasks are complete.
- Do not record another User's Question body, Answer content, or Session/OAuth information in test logs or validation records.
