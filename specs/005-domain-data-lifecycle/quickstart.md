# Quickstart: Verifying the Domain Data Model and Question Lifecycle

## Purpose

Automatically verify migrations from both an empty database and the SPEC 004 schema, the four states, time boundaries, uniqueness, referential integrity, and acceptance of Answers only while `OPEN`. See [plan.md](./plan.md) for the implementation approach, [data-model.md](./data-model.md) for entities and constraints, and [domain-persistence.md](./contracts/domain-persistence.md) for internal results.

## Prerequisites

- Node.js 22.13 or later, or 24 or later
- npm 10.x
- Run commands from the repository root
- Dependencies installed with `npm install`
- Use an isolated local D1 database for each test; do not use remote D1

## 1. Verify the Pure Lifecycle Logic

```bash
npm test -- tests/unit/question-lifecycle.test.ts
```

Expected results:

- At least twenty cases covering `DRAFT`, `OPEN`, `CLOSED`, `REVEALED`, and every boundary pass.
- Only `REVEALED` is returned at the `closesAt === revealsAt` boundary.
- Invalid time ordering, future publication, and rollback to an earlier state are rejected.
- No real-time waits or external services are required.

## 2. Apply All Migrations to an Empty Database

```bash
npm run test:d1 -- tests/d1/fresh-schema.test.ts
```

Expected results:

- `0001` through `0004` are applied in order to an empty isolated D1 database.
- Required columns, foreign keys, CHECK constraints, and unique indexes exist for User, Session, Account, Verification, Question, and Answer.
- Data that references a nonexistent User or Question, and Questions with invalid times, are rejected.

## 3. Apply the Differential Migration from the SPEC 004 Schema

```bash
npm run test:d1 -- tests/d1/legacy-upgrade.test.ts
```

Expected results:

- `0004` can be applied after preparing a User, Session, validation Question, and validation Answer following migrations `0001` through `0003`.
- User and Session retain the same IDs and authentication values.
- The old validation Question/Answer tables are replaced with the production structure.
- Partial application and foreign-key violations are not treated as success.

## 4. Verify Repositories and Concurrent Writes

```bash
npm run test:d1 -- tests/d1/question-repository.test.ts
```

Expected results:

- Draft creation, publication, and retrieval of all four states follow the internal contract.
- Answers are accepted only while the Question is `OPEN`.
- Only one Answer is committed after ten sequential or ten concurrent submissions for the same User and Question.
- Duplicate submissions, missing Questions, unpublished or closed Questions, missing references, and unexpected failures remain distinguishable.

## 5. Run All Quality Gates

```bash
npm test
npm run test:d1
npm run typecheck
npm run lint
npm run format
npm run build
```

Expected result: every command exits with status 0, with no regressions in existing authentication, SSR, HTTP API, or WebMCP tests.

## 6. Manually Verify the Local Migration

After all automated tests pass, apply the migrations to the existing local D1 database only if needed.

```bash
npm run db:migrate:local
```

Expected results:

- Only migrations that have not yet been applied are applied.
- Running the same command again does not reapply `0004`.

## Stop Conditions Before Remote Application

Before deciding whether to apply the migration, always perform read-only checks and create a recovery export.

```bash
npx wrangler d1 migrations list big-question-club-auth --remote
npx wrangler d1 execute big-question-club-auth --remote --command "SELECT id FROM questions ORDER BY id; SELECT COUNT(*) AS answer_count FROM answers;"
npx wrangler d1 export big-question-club-auth --remote --output ./big-question-club-auth-backup.sql
```

Because the export contains authentication information, do not add it to Git. Confirm its secure storage location and the person responsible for recovery.

- The remote `questions` or `answers` table contains even one record that was not created for SPEC 004 validation.
- The application status of `0001` or `0002` cannot be confirmed in the remote migration ledger.
- Any User/Session preservation test, foreign-key check, or quality gate fails.
- The pre-migration export or recovery procedure has not been confirmed.

This quickstart does not apply remote migrations. Apply them separately only after review and data verification.
