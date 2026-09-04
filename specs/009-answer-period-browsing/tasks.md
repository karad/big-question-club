# Tasks: Challenge Core Browsing Flow

**Input**: Design documents in `specs/009-answer-period-browsing/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/core-browsing.md`, `quickstart.md`

**Tests**: Create tests before implementation for each story to fix the Challenge Core behavior and existing safety boundaries today. Conduct manual testing after SPEC 010 is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel in different files without depending on unfinished tasks
- **[Story]**: Corresponding user story (`US1`–`US9`)
- Every task includes concrete file paths

## Phase 1: Setup (Minimum Preparation)

**Purpose**: Prepare only the Core validation record without adding dependencies or a large UI foundation.

- [X] T001 Create the template for automated results and unresolved items (`specs/009-answer-period-browsing/validation-record.md`)

---

## Phase 2: Foundational (Presentation Decisions)

**Purpose**: Fix the minimal pure presentation decisions shared by Home and Question Detail.

- [X] T002 First create unit tests for zero/one/multiple answer counts, nonnegative remaining time, Question state, and mutually exclusive signed-out/unanswered/answered/unavailable presentation (`tests/unit/question-browsing.test.ts`)
- [X] T003 Implement pure derivation of answer-count, deadline, and viewer-state presentation values satisfying T002 (`src/domain/question-browsing.ts`)

**Checkpoint**: Home and Detail can use the same state and presentation values.

---

## Phase 3: User Story 1 - Find an Open Question (Priority: P1) 🎯 MVP

**Goal**: On Home, find only `OPEN` Questions in deadline order, inspect count, deadline, and sealed state, and open Detail.

**Independent Test**: With four states, two languages, and zero/one/multiple Answers, confirm all and only `OPEN` Questions appear in stable order and that empty, failure, and Detail-link behavior matches the contract.

### Tests

- [X] T004 [P] [US1] First add D1 integration tests for Open-only conditions, deadline boundaries, stable ordering, answer aggregation, and exclusion of Answer secret columns (`tests/d1/question-browsing-repository.test.ts`)
- [X] T005 [P] [US1] First add integration tests for English Home text, lists, zero/one/multiple counts, Detail links, empty state, 503, and one request-scoped `now()` call (`tests/integration/home.test.ts`)

### Implementation

- [X] T006 [US1] Implement the minimal aggregate projection for `listOpenQuestions(snapshotNow)` and its in-memory test double (`src/repositories/question-repository.ts`, `tests/helpers/question-repository.ts`)
- [X] T007 [US1] Implement the Home View rendering body, answer count, sealed state, absolute deadline, remaining time, and empty/failure states (`src/views/home.tsx`)
- [X] T008 [US1] Add a Route that creates Home from one time snapshot and register it at existing `/` (`src/routes/home.tsx`, `src/app.tsx`)

**Checkpoint**: A human can select a Question on Home and open Detail.

---

## Phase 4: User Story 2 - Understand the Sealed State During the Answer Period (Priority: P1)

**Goal**: Signed-out and authenticated humans understand count, deadline, sealing, and the next action on Detail, while no other user's Answer is retrieved before Reveal.

**Independent Test**: Open a Question containing another Answer's secret as signed out, creator, and authenticated unanswered user; presentation is correct and the secret appears zero times in HTML.

### Tests

- [X] T009 [P] [US2] First add integration tests for signed-out public Detail, creator, count, deadline, sealed, Closed, identical Draft/missing 404, and public-data failure (`tests/integration/question-browsing.test.ts`)
- [X] T010 [P] [US2] First add regression tests for excluding other-user secrets from body, attributes, and embedded data; one `now()` call; and Closed/Revealed authorization (`tests/integration/question-visibility.test.ts`)

### Implementation

- [X] T011 [US2] Add public information, creator presentation, sealed/closed state, and signed-out Sign in guidance to the existing Detail View (`src/views/question-detail.tsx`)
- [X] T012 [US2] Make `questionPageRoute` public to signed-out users with one state snapshot, internal creator comparison, and no Draft enumeration (`src/routes/question.ts`)
- [X] T013 [US2] Separate public-data 503, safe current-user-state failure, and identical missing/Draft 404 (`src/routes/question.ts`)
- [X] T014 [US2] Treat the body as untrusted text and preserve SPEC 008 delayed Reveal excerpt/body behavior (`src/views/question-detail.tsx`, `src/routes/question.ts`)

**Checkpoint**: Detail explains sealing and participation without leaking other Answers.

---

## Phase 5: User Story 3 - Confirm the Change After an Agent Answers (Priority: P1)

**Goal**: Reloading after an Agent answers updates the count and current-user state while showing participation by multiple Agents without revealing other Answers.

**Independent Test**: Two users answer sequentially; zero-to-one-to-two counts, unanswered prompt, current Answer, and submission failure remain mutually exclusive.

### Tests

- [X] T015 [US3] First verify unanswered, answered, creator, submission failure, zero-to-one-to-two counts, prompt exclusivity, and non-exposure of all but the current user's secret (`tests/integration/question-browsing.test.ts`)

### Implementation

- [X] T016 [US3] Integrate SPEC 007's Agent request section and mutually exclusive answered/current Answer/submission-unavailable sections into Detail (`src/views/question-detail.tsx`)
- [X] T017 [US3] Retrieve the current user's Answer only when authenticated and pass failures as a safe display state rather than unanswered (`src/routes/question.ts`)
- [X] T018 [US3] Regression-test `Copy prompt` success/denial status and manual-copy fallback, preserving the clipboard contract (`tests/unit/agent-prompt-clipboard.test.ts`, `src/ui/agent-prompt-clipboard.ts`)

**Checkpoint**: The three-minute demo can reproduce before-answer, one Answer, multiple Answers, and sealing.

---

## Phase 6: Challenge Core Regression

**Purpose**: Establish a safe state for continuing to SPEC 010 visual and Reveal implementation.

- [X] T019 Fix Home and Detail English text, stable state-specific DOM hooks, and visual-design element boundaries for SPEC 010 (`tests/integration/home.test.ts`, `tests/integration/question-browsing.test.ts`)
- [X] T020 Run all unit/integration/D1 tests, typecheck, lint, format, build, and schema check, and record results (`specs/009-answer-period-browsing/validation-record.md`, `USE_CODEX.md`)

---

## Phase 7: Public-Operations Foundation (Administration Schema and Contract)

**Purpose**: First fix the source of truth for audit, bans, and administrator configuration shared by every administration story.

- [X] T021 First create unit tests for administrator email normalization, rejection when unset, and fixed audit actions (`tests/unit/admin.test.ts`)
- [X] T022 First create D1 tests for fresh/upgrade contracts of ban and audit tables, indexes, and triggers (`tests/d1/admin-schema.test.ts`, `tests/d1/fresh-schema.test.ts`, `tests/d1/schema-contract.test.ts`)
- [X] T023 Implement administrator configuration and administration types satisfying T021 (`src/domain/admin.ts`, `src/types/env.d.ts`)
- [X] T024 Implement ban/audit schema and migration satisfying T022 (`src/db/schema.ts`, `migrations/0006_admin_operations.sql`)
- [X] T025 Add administrator environment examples and safe configuration rules for development and deployment (`.dev.vars.example`, `README.md`)

**Checkpoint**: Administrator configuration, bans, and audit persistence can be tested independently.

---

## Phase 8: User Story 4 - Audit Operational Actions (Priority: P1)

**Goal**: Track successful login/logout, Question/Answer input, and administration operations with actor, target, and time, without duplicating bodies or authentication secrets.

**Independent Test**: After operations, D1 contains one expected action and no Question/Answer secret.

### Tests

- [X] T026 [US4] First create D1 tests for session create/delete, Question/Answer create/update triggers, and secret exclusion (`tests/d1/audit-log.test.ts`)

### Implementation

- [X] T027 [US4] Implement D1 triggers appending successful Session, Question, and Answer operations (`migrations/0006_admin_operations.sql`)
- [X] T028 [US4] Implement audit-list projection and appends for administration operations in Admin Repository (`src/repositories/admin-repository.ts`)

**Checkpoint**: Successful database operations are audited without changing existing input paths.

---

## Phase 9: User Story 5 - Enter the Administration Interface as the Sole Administrator (Priority: P1)

**Goal**: Only the one user whose Session email matches configuration can access pages and operations.

**Independent Test**: Direct GET and POST in signed-out, regular-user, administrator, and invalid-configuration states; non-administrators receive zero information.

### Tests

- [X] T029 [P] [US5] First create D1 tests for match, mismatch, and missing DB User email (`tests/d1/admin-repository.test.ts`)
- [X] T030 [P] [US5] First create integration tests for ordinary 404 for signed-out/regular/invalid configuration, administrator 200, and private no-store (`tests/integration/admin.test.ts`)

### Implementation

- [X] T031 [US5] Implement Admin Repository authorization comparing session-derived User ID with configured email (`src/repositories/admin-repository.ts`)
- [X] T032 [US5] Implement shared fail-closed authorization and safe Error page for all administration Routes (`src/routes/admin.tsx`, `src/views/admin.tsx`)
- [X] T033 [US5] Inject and register Admin Repository and `/club-operations` Route in the Worker (`src/index.tsx`, `src/app.tsx`)

**Checkpoint**: Non-administrators cannot reach administration information or mutations.

---

## Phase 10: User Story 6 - List Public Data (Priority: P1)

**Goal**: List Users, Questions, Answers, and audit records using only data necessary to identify targets.

**Independent Test**: Multiple entities appear newest first and untrusted bodies never become executable HTML.

### Tests

- [X] T034 [P] [US6] First add D1 tests for administration projections, ordering, and ban state across all four lists (`tests/d1/admin-repository.test.ts`)
- [X] T035 [P] [US6] First add integration tests for four lists, empty states, untrusted-body escaping, and repository failure (`tests/integration/admin.test.ts`)

### Implementation

- [X] T036 [US6] Implement minimal projections returning the four lists to one administration Dashboard (`src/repositories/admin-repository.ts`)
- [X] T037 [US6] Implement User, Question, Answer, and Audit Log sections and confirmation forms in Hono JSX (`src/views/admin.tsx`)
- [X] T038 [US6] Implement Dashboard retrieval and failure display in `/club-operations` GET (`src/routes/admin.tsx`)

**Checkpoint**: The administrator can identify deletion and ban targets in the lists.

---

## Phase 11: User Story 7 - Delete an Inappropriate Question (Priority: P1)

**Goal**: Delete only a Question and its Answers while retaining an audit record naming the administrator actor.

**Independent Test**: Deleting a Question with Answers removes only it and its children while another Question and audit logs remain.

### Tests

- [X] T039 [P] [US7] First add D1 tests for cascade deletion, missing target, audit actor, and batch atomicity (`tests/d1/admin-repository.test.ts`)
- [X] T040 [P] [US7] First add integration tests for administrator-delete 303, missing confirmation 400, missing target 404, and ordinary 404 for a regular user (`tests/integration/admin.test.ts`)

### Implementation

- [X] T041 [US7] Implement Question deletion and administrator audit append in one batch (`src/repositories/admin-repository.ts`)
- [X] T042 [US7] Implement the Question deletion POST Route and explicit confirmation form (`src/routes/admin.tsx`, `src/views/admin.tsx`, `src/app.tsx`)

**Checkpoint**: An inappropriate Question and its Answers can be removed safely.

---

## Phase 12: User Story 8 - Delete an Inappropriate Answer (Priority: P1)

**Goal**: Delete only the specified Answer while preserving its Question and other Answers.

**Independent Test**: Removing one of two Answers updates count and audit log while preserving the other.

### Tests

- [X] T043 [P] [US8] First add D1 tests for single-Answer deletion, missing target, preservation of other Answers, and audit actor (`tests/d1/admin-repository.test.ts`)
- [X] T044 [P] [US8] First add integration tests for administrator-delete 303, missing confirmation 400, missing target 404, and ordinary 404 for a regular user (`tests/integration/admin.test.ts`)

### Implementation

- [X] T045 [US8] Implement Answer deletion and administrator audit append in one batch (`src/repositories/admin-repository.ts`)
- [X] T046 [US8] Implement the Answer deletion POST Route and explicit confirmation form (`src/routes/admin.tsx`, `src/views/admin.tsx`, `src/app.tsx`)

**Checkpoint**: An inappropriate Answer can be removed without changing its Question.

---

## Phase 13: User Story 9 - Ban a User (Priority: P1)

**Goal**: Ban a regular User, stop existing and new sessions, and allow unbanning when needed.

**Independent Test**: Ban removes all sessions, rejects session creation, unban permits it, and the administrator cannot ban themselves.

### Tests

- [X] T047 [P] [US9] First add D1 tests for ban/unban, invalidating all sessions, self-ban rejection, and administration audit (`tests/d1/admin-repository.test.ts`)
- [X] T048 [P] [US9] First add integration tests for ban/unban Routes, self-ban 409, and ordinary 404 for a regular user (`tests/integration/admin.test.ts`)
- [X] T049 [P] [US9] First add authentication integration tests for rejecting session creation by a banned User and login auditing (`tests/integration/auth-ban.test.ts`)

### Implementation

- [X] T050 [US9] Atomically implement ban insertion, all-session deletion, audit append, and unban (`src/repositories/admin-repository.ts`)
- [X] T051 [US9] Implement Better Auth rejection before session creation for banned Users (`src/auth/auth.ts`)
- [X] T052 [US9] Implement ban/unban POST Routes, self-ban rejection, and administration operations (`src/routes/admin.tsx`, `src/views/admin.tsx`, `src/app.tsx`)

**Checkpoint**: A banned User cannot use the app through an existing session or re-login.

---

## Phase 14: Public-Operations Regression and Documentation

- [X] T053 Synchronize the administration manual, architecture, data model, contracts, and Quickstart with implementation (`specs/009-answer-period-browsing/admin-manual.md`, `specs/009-answer-period-browsing/architecture.md`, `specs/009-answer-period-browsing/data-model.md`, `specs/009-answer-period-browsing/contracts/admin-operations.md`, `specs/009-answer-period-browsing/quickstart.md`)
- [X] T054 Run all unit/integration/D1 tests, typecheck, lint, format, build, and schema check and record results (`specs/009-answer-period-browsing/validation-record.md`, `USE_CODEX.md`)

---

## Phase 15: Administration Path and Non-Disclosure

- [X] T055 [US5] Change the interface to `/club-operations`; make former `/admin`, signed-out, regular User, and invalid configuration return the same ordinary 404 (`src/domain/admin.ts`, `src/app.tsx`, `src/routes/admin.tsx`, `src/views/admin.tsx`)
- [X] T056 [US5] Fix no public administration link, no redirect from the former path, no pre-authorization administration wording, and `noindex, nofollow` through regression tests and documentation (`tests/integration/admin.test.ts`, `specs/009-answer-period-browsing/`, `README.md`)

---

## Phase 16: Shared Header

- [X] T057 Implement a shared Logo Header on Home, Question Detail, Question management, and authorized administration pages; verify Vite asset building and serving (`src/views/site-header.tsx`, `src/views/*.tsx`, `tests/integration/*.test.ts`)

---

## Phase 17: Question URL in Agent Request Prompt

- [X] T058 [US3] Finalize the copied prompt as one line, embed an absolute Question URL using the request origin without query or fragment, separate detailed Agent instructions into WebMCP contracts, and fix local/production origins and HTML escaping with unit/integration tests (`src/domain/agent-request-prompt.ts`, `src/routes/question.ts`, `src/views/question-detail.tsx`, `tests/unit/agent-request-prompt.test.ts`, `tests/integration/agent-request-prompt.test.ts`)

---

## Phase 18: Personal-Context Evidence Contract

- [X] T059 [US3] First fix through unit/integration tests the finalized one-line Prompt, user-context sources, priority of user statements, fact-versus-consideration distinction, exclusion of assistant suggestions, proxy answering without an explicit personal view, no assertion of unverified facts, no unnecessary clarification, no extra approval, and post confirmation (`tests/unit/agent-request-prompt.test.ts`, `tests/unit/register-five-tools.test.ts`, `tests/unit/register-submit-answer-tool.test.ts`, `tests/unit/register-my-submission-tool.test.ts`, `tests/integration/agent-request-prompt.test.ts`, `tests/integration/webmcp-question-api.test.ts`, `tests/integration/question-visibility.test.ts`)
- [X] T060 [US3] Display the finalized prompt and implement detailed general evidence rules in fixed `get_question` instructions and tool description/schema. Treat the initial prompt as submission permission, require no preview or approval, create and submit the best proxy answer without asserting unknown facts when no explicit view exists, do not ask solely for that absence, and verify current-user state afterward (`src/domain/agent-request-prompt.ts`, `src/routes/question.ts`, `src/webmcp/register-get-question-tool.ts`, `src/webmcp/register-submit-answer-tool.ts`, `src/webmcp/register-my-submission-tool.ts`)
- [X] T061 [US3] Synchronize SPEC 007/009, README, MILESTONE, and validation records with the finalized contract and run all automated quality gates (`specs/007-webmcp-mvp-tools/`, `specs/009-answer-period-browsing/`, `README.md`, `MILESTONE.md`, `USE_CODEX.md`)

---

## Dependencies and Execution Order

```text
Setup -> Foundational -> US1 -> US2 -> US3 -> Core Regression -> Administration Foundational -> US4 -> US5 -> US6 -> US7 -> US8 -> US9 -> Public-Operations Regression -> Administration Non-Disclosure -> Shared Header -> Question URL Prompt -> Context-Evidence Answer Contract
```

- US1 creates the entry from Home to Detail.
- US2 extends Detail to signed-out public browsing and sealing guidance.
- US3 integrates the existing Agent Prompt and current-user state into US2 Detail.
- US4 creates the audit foundation for all administration operations.
- US5 establishes administration authorization shared by US6–US9.
- US6 creates target-identification screens for US7–US9.
- US7 and US8 can be implemented independently after US6.
- US9 depends on administration authorization and auditing but not content deletion.
- Conduct manual and visual testing together after all SPEC 010 screens are implemented.

### Parallel Opportunities

- T004 and T005 are independent D1 and HTTP tests.
- T009 and T010 are independent new-Detail and existing-authorization regression tests.
- T029/T030, T034/T035, T039/T040, T043/T044, and T047–T049 are independent repository, HTTP, and authentication tests.

## Implementation Strategy

1. T001–T003 fix minimal presentation decisions.
2. T004–T008 complete Question discovery on Home.
3. T009–T014 complete public Detail and sealing.
4. T015–T018 complete post-answer state changes.
5. T019–T020 run all automated regressions and move to SPEC 010 today.
6. T021–T025 fix public-operations schema and configuration.
7. T026–T038 complete audit, authorization, and four lists.
8. T039–T052 complete Question/Answer deletion and User bans.
9. T053–T054 synchronize docs and run all regressions.
10. T055–T056 fix administration path and pre-authorization non-disclosure.
11. T057 fix the shared Logo Header across all HTML pages.
12. T058 embed the environment-following absolute Question URL in the copied Prompt.
13. T059–T061 apply finalized Prompt and context-evidence rules, proxy answers without an explicit view, no unverified-fact assertions, no unnecessary clarification, no extra approval, and post confirmation to tool contracts.

## Notes

- Add no new dependency, dedicated Login, or My Questions redesign. Add only one migration required for public operations.
- Do not change the existing SPEC 007/008 tools or Answer authorization.
- Do not build temporary visuals to replace later; apply one consistent visual direction in SPEC 010.
- Create tests before implementation and confirm they fail for the expected reason.
