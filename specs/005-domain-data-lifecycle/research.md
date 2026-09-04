# Technical Research: Domain Data Model and Question Lifecycle

## 1. Responsibilities of Drizzle and Better Auth

**Decision**: Introduce `drizzle-orm` for application D1 access and as the typed schema for every table. Keep Better Auth's current direct D1 binding, with Better Auth remaining solely responsible for writes to User, Session, Account, and Verification.

**Rationale**: Drizzle officially supports Cloudflare D1 and Workers. The existing Better Auth connection was validated on the actual platform in SPEC 002, and replacing its authentication adapter is outside SPEC 005. Including the authentication tables in the Drizzle schema makes it possible to inspect Question/Answer foreign keys and database-wide types in one place without risking regressions in authentication behavior.

**Alternatives Considered**:

- Switch Better Auth to the Drizzle adapter: rejected because it adds an unnecessary authentication-path change and expands the regression surface.
- Include only Question/Answer in the Drizzle schema: rejected because the database-wide relationships could not be represented as a source of truth.
- Keep raw-SQL repositories: rejected because schema and query types could drift apart.

**References**: [Drizzle Cloudflare D1 guide](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1), [Better Auth database guide](https://better-auth.com/docs/concepts/database), [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)

## 2. Drizzle Versions and Time Representation

**Decision**: Use stable `drizzle-orm` 0.45.x and `drizzle-kit` 0.31.x releases within Better Auth 1.7's peer-compatible range, with the SQLite dialect. Store time columns as UTC Unix milliseconds represented by `number` values in SQLite `INTEGER` columns.

**Rationale**: The existing domain and D1 migrations use numeric Unix milliseconds, so this preserves the contract without adding implicit `Date` conversions. Drizzle's `timestamp_ms` mode exposes application values as `Date`, whereas `number` mode preserves the existing types. Stable releases avoid introducing prerelease dependencies.

**Alternatives Considered**:

- `timestamp_ms` mode: rejected because it would require broad type changes throughout the domain.
- ISO 8601 strings: rejected because they reduce compatibility with existing migrations.
- Drizzle v1 RC: rejected because this feature does not require any RC-only capability.

**References**: [Drizzle SQLite column types](https://orm.drizzle.team/docs/sqlite/column-types), [Drizzle timestamp guide](https://orm.drizzle.team/docs/guides/timestamp-default-value), [Drizzle indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)

## 3. Migration History and Drizzle Kit

**Decision**: Preserve the relative paths of `migrations/0001` through `0003`, which have already been applied to D1, and the Wrangler `d1_migrations` ledger. Add reviewed differential SQL that matches the final Drizzle schema as `migrations/0004_domain_data_lifecycle.sql`. Use Wrangler exclusively to apply migrations. Use Drizzle Kit for schema configuration and future diff generation, without moving or renaming existing history.

**Rationale**: Wrangler records migration names as applied identifiers. Using both the Drizzle and Wrangler migration ledgers would split application state. Cloudflare supports Drizzle's nested format, but continuing with one Wrangler ledger is safer while the project already has top-level migration history. The first differential migration to the production schema includes rebuilding legacy tables and therefore receives manual review.

**Alternatives Considered**:

- Move existing migrations into Drizzle's nested format: rejected because applied identifiers would change.
- Also use `drizzle-kit migrate`: rejected because it would create two migration ledgers.
- Move all data to a new D1 database: rejected because migrating authentication data exceeds this specification.

**References**: [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Drizzle Kit generate](https://orm.drizzle.team/docs/drizzle-kit-generate)

## 4. Existing Migration Inconsistency

**Decision**: At implementation start, inspect the migration ledgers for a local empty database and the remote database in read-only mode. Because the current `0001_better_auth.sql` and `0002_add_account_issuer.sql` both add the `issuer` column, first confirm that `0002` has been applied in every target environment. Then restore `0001` to the schema from before the issuer was added, so an empty database applies the change exactly once through `0001 → 0002`.

**Rationale**: Applying the current files in order to an empty database fails because the column is duplicated, violating FR-016. Changing an applied migration based on assumptions is also unsafe, so checking the D1 ledger comes first. Restoring `0001` to the content it had when originally applied does not rerun it against existing databases; it only restores reproducibility for new databases.

**Alternatives Considered**:

- Delete or empty `0002`: rejected because it would destroy the meaning of the remote ledger and repository history.
- Absorb the duplication in `0004`: rejected because an empty database would fail before reaching `0004`.
- Use a special initial schema only for local environments: rejected because production and verification would follow different migration paths.

## 5. Migrating Existing Questions and Answers

**Decision**: Migration `0004` leaves authentication tables unchanged and replaces the SPEC 004 validation-only `answers` and `questions` tables, in foreign-key order, with their production structures. Before applying it to a shared environment, confirm that all existing rows are validation data and preserve them with D1 export or backup.

**Rationale**: Existing Questions have neither creators nor compatible language values, so no generally meaningful backfill is possible. The specification permits replacing validation data while requiring User/Session preservation.

**Alternatives Considered**:

- Use the first User as creator: rejected because it would fabricate ownership.
- Make new columns nullable: rejected because it weakens the production schema contract.
- Recreate the authentication tables as well: rejected because it violates the User/Session preservation requirement.

**References**: [Cloudflare D1 import and export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [Cloudflare D1 migration foreign keys](https://developers.cloudflare.com/d1/reference/migrations/)

## 6. Source of Truth for Question State

**Decision**: Do not store state names in the database. Derive state with a pure function from `publishedAt`, `closesAt`, `revealsAt`, and a caller-supplied `now`. Evaluate in this order: `publishedAt === null`, `now >= revealsAt`, `now >= closesAt`, then all other cases.

**Rationale**: Persisting a state that can already be derived from stored timestamps creates duplicate sources of truth that can diverge. Evaluating later boundaries first guarantees that only `REVEALED` is returned when closing and reveal occur simultaneously. A fixed `now` makes boundary cases repeatable without real-time waits.

**Alternatives Considered**:

- A `status` column with scheduled updates: rejected because it introduces duplicate state and update delays.
- Omit `CLOSED`: rejected because delayed reveals could not be represented.
- Use client time: rejected because it permits tampering and inconsistent results across access paths.

## 7. Atomic Answer Creation in D1

**Decision**: Create an Answer with a single `INSERT ... SELECT ... WHERE ...` that checks whether the Question is published and before its deadline using the same supplied `now`, with `UNIQUE(question_id, user_id)`, foreign-key, and CHECK constraints determining the outcome. Use D1 `batch()` only for operations that require multiple statements; do not assume interactive transactions.

**Rationale**: D1 uses auto-commit, while `batch()` rolls back the entire batch when a statement fails. Including state conditions in the write statement handles the deadline boundary atomically, unlike an unconditional INSERT after a preliminary SELECT. The uniqueness constraint is the final authority for concurrent submissions.

**Alternatives Considered**:

- Unconditional INSERT after a read: rejected because state can change between the read and write.
- A mutex inside the Worker: rejected because it is not shared across Worker instances.
- Interactive transactions: rejected because they do not match D1's execution model.

**References**: [D1 Database batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

## 8. D1 Schema and Migration Tests

**Decision**: Add `vitest.d1.config.ts` separately from the existing Node test configuration. Apply migrations to isolated D1 databases using `readD1Migrations()` and `applyD1Migrations()` from `@cloudflare/vitest-plugin` 1.x. Automatically verify full application to an empty database, application of `0004` to a legacy database containing authentication data after migrations `0001` through `0003`, constraints, and repositories.

**Rationale**: Cloudflare recommends Workers Vitest integration for unit and integration testing of Workers projects. It can test D1 bindings directly with workerd and isolated storage. Keeping pure functions in fast Node tests and isolating only D1-specific tests avoids unnecessary changes to the existing test environment.

**Alternatives Considered**:

- Fully mock D1: rejected because it cannot verify foreign keys, CHECK constraints, migrations, or concurrent writes.
- Rely only on manual remote D1 verification: rejected because it lacks repeatability and isolation.
- Move every test to workerd: rejected because it would have a large impact on existing tests.

**References**: [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), [Workers Vitest configuration](https://developers.cloudflare.com/workers/testing/vitest-integration/configuration/), [Workers Vitest D1 test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/)
