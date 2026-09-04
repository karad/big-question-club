# Validation Record: Domain Data Model and Question Lifecycle

## User Story 1: State Evaluation

- Run date: 2026-09-02
- State evaluation: evaluated 21 cases ten times each, including DRAFT precedence, OPEN, deadline boundary, CLOSED, reveal boundary, and simultaneous deadline/reveal; every result matched and zero states overlapped
- Unit/integration regression: `npm test -- tests/unit/question-lifecycle.test.ts tests/unit/question-schedule.test.ts tests/integration/question-visibility.test.ts tests/integration/answer-submission-api.test.ts`
- Result: 46 tests across 4 files passed
- Type check: `npm run typecheck` passed
- Confirmation: Answer lists and bodies remain unpublished after closing and before reveal

## User Story 2: Pre-Application Checks

- Run date: 2026-09-02
- Local: `wrangler d1 migrations list --local` confirmed an empty database with `0001` through `0003` unapplied
- Remote: read `d1_migrations` and confirmed `0001` through `0003` were applied; `0002_add_account_issuer.sql` was applied at 2026-09-01 13:10:52
- Remote validation data: one Question, `spec-004-e2e-20260902`, and two Answers. They match the SPEC 004 validation identifier and existing validation record; no general-use data exists
- Remote writes/migration application: not performed

## User Story 2: Schema and Repository

- Expected initial failure: before the fix, confirmed that the Fresh, Schema, and Repository test files failed with `duplicate column name: issuer`
- Real D1: verified all fresh migrations, required values, CHECK constraints, foreign keys, UNIQUE constraints, deletion rules, draft creation, publication, retrieval, Answers from two Users, duplicates, and orphaned references
- Result: 8 tests across 3 files passed

## User Story 3: Write Guards

- Unit/existing integration: 27 tests across 4 files passed
- Real D1: verified conditional publication, rejection in DRAFT/at deadline/in CLOSED/in REVEALED, ten sequential submissions, ten concurrent submissions, and constraint-error classification
- Result: 7 tests in 1 file passed. Both sequential and concurrent runs produced one success and nine duplicates per User

## User Story 4: Migration Paths

- SPEC 004-equivalent database: preserved User/Session and replaced validation Question/Answer data with the production schema
- Failing migration: confirmed rollback of both the partial table and migration-ledger entry
- Schema contract: compared PRAGMA columns, foreign keys, indexes, and CHECK constraints against the Drizzle schema expectations
- Result: 5 tests across 3 files passed
- Ten repetitions: ran the 4 fresh/legacy/rollback/schema-contract files and 6 tests ten times each; 10/10 runs and 60 total tests passed
- Duration: 4.38–4.50 seconds per run, about 48 seconds total, within thirty minutes

## Final Quality Gates

- `npm test`: 118 tests across 19 files passed
- `npm run test:d1`: 21 tests across 8 files passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format`: passed
- `npm run build`: passed
- `npm run db:schema:check`: passed
- `git diff --check`: passed
- Environment note: the host used Node.js v23.6.0, outside the supported Node.js 22.13.x or 24+ range declared in package.json. Every gate passed, but continued development should use a supported Node.js version
- Remote D1 migration: intentionally not applied
