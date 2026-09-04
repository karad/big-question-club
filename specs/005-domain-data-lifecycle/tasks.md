# Tasks: Domain Data Model and Question Lifecycle

**Input**: Design documents in `specs/005-domain-data-lifecycle/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [domain-persistence.md](./contracts/domain-persistence.md), [quickstart.md](./quickstart.md)

**Tests**: The specification, AGENTS.md, and MILESTONE.md require unit tests and integration tests against real D1, so tests are created before implementation for each user story.

**Organization**: Tasks are grouped by story so each user story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel in a separate file without depending on unfinished tasks
- **[Story]**: Corresponding user story, US1 through US4
- Every task names its target file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Drizzle and real-D1 testing to the existing project.

- [X] T001 Add compatible versions of `drizzle-orm`, `drizzle-kit`, and `@cloudflare/vitest-plugin`, plus `test:d1` and schema-inspection scripts, to package.json and package-lock.json
- [X] T002 [P] Configure Drizzle Kit in drizzle.config.ts for the SQLite dialect, src/db/schema.ts, and existing Wrangler-based application
- [X] T003 [P] Add vitest.d1.config.ts so only tests/d1/*.test.ts run with workerd and isolated D1 while existing Node tests remain unchanged
- [X] T004 [P] Add D1 test-binding and Cloudflare test API types to tests/d1/env.d.ts and tsconfig.json

---

## Phase 2: Foundational (Prerequisites for All Stories)

**Purpose**: Prepare shared components for testing migrations and Drizzle repositories against real D1.

**⚠️ CRITICAL**: Do not begin any user-story implementation until this phase is complete.

- [X] T005 Add tests/d1/apply-migrations.ts, a shared helper that reads Wrangler migrations in order and applies all or a specified range to isolated D1
- [X] T006 Add fixture factories for User, Session, Question, and Answer to tests/d1/fixtures.ts
- [X] T007 Add a thin factory in src/db/client.ts that creates a typed Drizzle client from D1Database
- [X] T008 Add tests/d1/environment.test.ts, a smoke test that applies only 0001 to the test binding and verifies D1 reads and writes, validating the Phase 1–2 setup

**Checkpoint**: D1 integration tests can run separately from Node tests.

---

## Phase 3: User Story 1 - Determine the Current Question State Unambiguously (Priority: P1) 🎯 MVP

**Goal**: Determine `DRAFT`, `OPEN`, `CLOSED`, or `REVEALED` exclusively from one pure domain contract.

**Independent Test**: Run at least twenty boundary cases with fixed `now` in tests/unit/question-lifecycle.test.ts and confirm 100% expected-state matches and zero overlapping states.

### Tests for User Story 1

- [X] T009 [P] [US1] Add failing state-evaluation tests to tests/unit/question-lifecycle.test.ts covering DRAFT precedence, OPEN, deadline boundary, CLOSED, reveal boundary, simultaneous deadline/reveal, and ten repetitions, totaling at least twenty cases
- [X] T010 [P] [US1] Add failing boundary tests to tests/unit/question-schedule.test.ts for publication/deadline/reveal ordering, future publication, and allowed and rejected transitions

### Implementation for User Story 1

- [X] T011 [US1] Add creatorUserId, language, publishedAt, revealsAt, updatedAt, and QuestionState to the domain types in src/domain/question.ts
- [X] T012 [US1] Implement state evaluation, timestamp-order validation, and regression detection as pure functions in src/domain/question-lifecycle.ts and make T009/T010 pass
- [X] T013 [US1] Add the expanded Question type and four-state fixtures to tests/helpers/question-repository.ts and migrate existing test data
- [X] T014 [US1] Replace existing isOpen dependencies with the shared QuestionState evaluation and prevent publication after the deadline but before reveal in src/routes/question.ts, src/routes/submit-answer.ts, and tests/integration/question-visibility.test.ts
- [X] T015 [US1] Run the User Story 1 unit and integration tests and record case counts and results in specs/005-domain-data-lifecycle/validation-record.md

**Checkpoint**: The four-state contract can be verified independently without changing D1 persistence.

---

## Phase 4: User Story 2 - Persist User, Session, Question, and Answer Consistently (Priority: P1)

**Goal**: Preserve ownership, uniqueness, and referential integrity through the Drizzle schema, D1 constraints, and repositories.

**Independent Test**: Persist two Users, their Sessions, one Question, and two Answers in isolated D1; retrieve the relationships; and confirm that orphaned references and a second Answer by the same User are rejected.

### Tests for User Story 2

- [X] T016 [P] [US2] Add tests/d1/fresh-schema.test.ts to reproduce the duplicate issuer failure when current migrations 0001–0003 are applied to an empty database and define the post-fix success conditions
- [X] T017 [P] [US2] Add failing tests to tests/d1/domain-schema.test.ts for required Question/Answer columns, CHECK constraints, foreign keys, UNIQUE constraints, and deletion rules
- [X] T018 [P] [US2] Add failing tests to tests/d1/question-repository.test.ts for saving drafts, publication, retrieval, Answers from two Users, duplicates, and orphaned references

### Implementation for User Story 2

- [X] T019 [US2] Inspect local-empty and remote d1_migrations status and confirm in read-only mode that Question/Answer data is validation-only; record findings in specs/005-domain-data-lifecycle/validation-record.md
- [X] T020 [US2] After T019 confirms 0002 is applied, restore migrations/0001_better_auth.sql to its pre-issuer responsibility and remove overlap between 0001 and 0002
- [X] T021 [US2] Add migrations/0004_domain_data_lifecycle.sql, preserving the four authentication tables and replacing legacy answers/questions with the production schema in foreign-key order
- [X] T022 [US2] Define every column, CHECK constraint, foreign key, UNIQUE constraint, and index for User, Session, Account, Verification, Question, and Answer in src/db/schema.ts so it matches the result of migrations 0001–0004
- [X] T023 [US2] Implement getQuestion, createDraft, publish, submit, existing read operations, and stable result types with Drizzle in src/repositories/question-repository.ts
- [X] T024 [US2] Connect the Drizzle repository to existing dependency injection and update ApplicationDatabases and test fakes in src/auth/session.ts, src/index.tsx, and tests/helpers/question-repository.ts
- [X] T025 [US2] Run User Story 2 D1 integration tests and record relationship, uniqueness, and referential-integrity results in specs/005-domain-data-lifecycle/validation-record.md

**Checkpoint**: Production entity relationships and constraints can be verified in real D1 independently of User Story 1.

---

## Phase 5: User Story 3 - Reject Writes That Violate the Lifecycle (Priority: P2)

**Goal**: Enforce publication confirmation, Answer creation, and error classification with conditional writes, preventing state regression and non-OPEN submissions from committing.

**Independent Test**: In real D1, attempt valid publication, invalid timestamps, duplicate publication, state regression, DRAFT/CLOSED/REVEALED submissions, deadline-boundary submission, and ten concurrent submissions; confirm only valid changes commit.

### Tests for User Story 3

- [X] T026 [P] [US3] Add failing tests to tests/unit/question-schedule.test.ts rejecting regression from published to DRAFT and from CLOSED/REVEALED to OPEN
- [X] T027 [P] [US3] Add failing tests to tests/d1/question-write-guards.test.ts for conditional publication, OPEN-only submission, exact deadline, ten sequential submissions, ten concurrent submissions, and constraint-error classification

### Implementation for User Story 3

- [X] T028 [US3] Add logic to src/domain/question-lifecycle.ts that returns an allowed transition or English domain error code from the current state and proposed timestamps
- [X] T029 [US3] Add conditional UPDATE for publication and atomic INSERT SELECT plus uniqueness enforcement for Answer creation, classifying failure reasons in src/repositories/question-repository.ts
- [X] T030 [US3] Consolidate route-level preliminary isOpen checks into repository results and connect existing English error contracts in src/routes/submit-answer.ts and src/domain/answer-submission.ts
- [X] T031 [US3] Update src/domain/answer-visibility.ts, src/routes/question.ts, and tests/unit/answer-visibility.test.ts to use the shared rule that CLOSED remains sealed and only REVEALED is public
- [X] T032 [US3] Run User Story 3 unit, D1, and existing API regression tests and record sequential/concurrent submission and boundary results in specs/005-domain-data-lifecycle/validation-record.md

**Checkpoint**: Invalid transitions and non-OPEN writes cannot commit through any caller path.

---

## Phase 6: User Story 4 - Verify the Data Contract After Migration (Priority: P3)

**Goal**: Automatically verify empty and SPEC 004 database migration paths, preservation of authentication data, rollback on failure, and agreement with the Drizzle schema.

**Independent Test**: Apply migrations to isolated fresh and legacy D1 databases and verify User/Session preservation, replacement of old validation data, all constraints, and no partial application on failure within thirty minutes.

### Tests and Verification Implementation for User Story 4

- [X] T033 [P] [US4] Add tests/d1/legacy-upgrade.test.ts to apply 0004 to User/Session/validation Question/Answer data after 0001–0003 and retain only authentication data
- [X] T034 [P] [US4] Add tests/d1/migration-rollback.test.ts to verify an intentionally failing migration leaves neither a partial schema nor an applied-migration record
- [X] T035 [US4] Add tests/d1/schema-contract.test.ts to compare PRAGMA columns, foreign keys, indexes, and CHECK results with the expected src/db/schema.ts contract
- [X] T036 [US4] Document local/remote pre-application checks, validation-data replacement, export, and stop conditions in README.md and specs/005-domain-data-lifecycle/quickstart.md
- [X] T037 [US4] Run fresh, legacy, rollback, and schema-contract verification ten times each and record duration and results in specs/005-domain-data-lifecycle/validation-record.md

**Checkpoint**: Both migration paths are repeatably verifiable and failures are never treated as success.

---

## Phase 7: Polish and Cross-Cutting Quality

**Purpose**: Integrate all stories and verify regression safety and documentation consistency.

- [X] T038 [P] Reflect differences among the Drizzle schema, migrations, domain contract, and repository implementation in specs/005-domain-data-lifecycle/data-model.md and specs/005-domain-data-lifecycle/contracts/domain-persistence.md
- [X] T039 Run npm test, npm run test:d1, npm run typecheck, npm run lint, npm run format, and npm run build, recording results in specs/005-domain-data-lifecycle/validation-record.md
- [X] T040 Mark SPEC 005 complete in MILESTONE.md and append implementation and verification results to USE_CODEX.md only if every success criterion is satisfied

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Starts after Setup and blocks every story.
- **US1 (Phase 3)**: Starts after Foundational and does not depend on database schema implementation.
- **US2 (Phase 4)**: Starts after Foundational and can run in parallel with US1.
- **US3 (Phase 5)**: Depends on US1's state contract and US2's repository/schema.
- **US4 (Phase 6)**: Depends on US2's 0004/schema and can run in parallel with US3.
- **Polish (Phase 7)**: Starts after all stories in implementation scope are complete.

### User Story Dependency Graph

```text
Setup → Foundational ─┬→ US1 ─┐
                     └→ US2 ─┼→ US3 ─┐
                             └→ US4 ─┴→ Polish
```

### Order Within Each Story

- Create tests first and confirm they fail as expected before implementing the target.
- Implement domain types and pure functions before repositories.
- Complete schema and migrations before connecting repositories to real D1.
- Connect repositories to routes before updating existing integration tests.
- Complete a story's independent tests before moving to the next dependent story.

## Parallel Opportunities

- T002, T003, and T004 modify separate files and can run in parallel.
- T009/T010, T016–T018, T026/T027, and T033/T034 can run in parallel as failing tests within their stories.
- After Foundational, US1 and US2 can run in parallel because they have different primary targets.
- After US2, US3 and US4 can run in parallel because they primarily affect separate files, but updates to validation-record.md must be serialized.
- T038 can proceed independently before T039's quality gates.

## Parallel Execution Examples

### User Story 1

```text
Task T009: Add state-boundary tests to tests/unit/question-lifecycle.test.ts
Task T010: Add timestamp and transition tests to tests/unit/question-schedule.test.ts
```

### User Story 2

```text
Task T016: Add fresh-path tests to tests/d1/fresh-schema.test.ts
Task T017: Add constraint tests to tests/d1/domain-schema.test.ts
Task T018: Add relationship tests to tests/d1/question-repository.test.ts
```

### User Story 3

```text
Task T026: Add state-regression tests to tests/unit/question-schedule.test.ts
Task T027: Add atomic-write tests to tests/d1/question-write-guards.test.ts
```

### User Story 4

```text
Task T033: Add legacy-path tests to tests/d1/legacy-upgrade.test.ts
Task T034: Add failure-rollback tests to tests/d1/migration-rollback.test.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Independently verify all four states and boundaries, then stop.

This establishes the sole state contract used by later persistence and publication paths.

### Incremental Delivery

1. Setup + Foundational → D1 test infrastructure complete.
2. US1 → Four-state domain contract complete.
3. US2 → Persistence consistent with the production schema complete.
4. US3 → Rejection of lifecycle-violating writes complete.
5. US4 → Fresh/legacy migration guarantees complete.
6. Polish → All quality gates and MILESTONE completion decision.

## Notes

- Apply `[P]` only to work in separate files that has no dependency on unfinished tasks.
- Keep responsibility for User/Session writes in Better Auth; do not migrate authentication to the Drizzle adapter.
- Do not apply remote migrations automatically. Decide separately only after satisfying T019 and the quickstart stop conditions.
- Modify 0001 only after T019 verifies the migration ledger; do not move or rename existing migrations.
- Confirm each story's tests fail before implementation and record results in validation-record.md when the story is complete.
