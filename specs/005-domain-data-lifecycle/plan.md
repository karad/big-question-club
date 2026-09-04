# Implementation Plan: Domain Data Model and Question Lifecycle

**Branch**: `005-domain-data-lifecycle` | **Date**: 2026-09-02 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/005-domain-data-lifecycle/spec.md`

## Summary

Persist User, Session, Question, and Answer consistently in a single D1 database, and derive `DRAFT`, `OPEN`, `CLOSED`, and `REVEALED` exclusively from a Question's publication time, answer deadline, reveal time, and the service reference time. Use the Drizzle schema as the typed source of truth for data structures, while adding a differential migration that preserves the existing Wrangler migration history, a single lifecycle decision function, repository boundaries, and D1-enforced uniqueness, referential, and time constraints. Verify pure state decisions with unit tests and the actual D1 schema, migrations, and concurrent writes with integration tests using Cloudflare Workers' Vitest integration.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later or 24 or later for development, ES2022
**Primary Dependencies**: Cloudflare Workers, Hono, Vite, Better Auth 1.7, Drizzle ORM 0.45.x, Drizzle Kit 0.31.x, Wrangler, Cloudflare Workers Vitest Plugin 1.x, Vitest 4
**Storage**: Cloudflare D1. The Better Auth authentication tables and Question/Answer tables reside in the same database so their foreign keys are valid.
**Testing**: Pure-domain unit tests with Vitest; schema, migration, and repository integration tests using the Workers Vitest Plugin and isolated D1 databases; and local migration verification through the quickstart.
**Target Platform**: Cloudflare Workers, Cloudflare D1, and local Miniflare/workerd.
**Project Type**: A single web application that serves SSR, HTTP API, and WebMCP from one Worker.
**Performance Goals**: State evaluation completes synchronously, and a single D1-backed save or retrieval operation completes within two seconds in the verification environment. Only one Answer is committed even when ten submissions for the same User and Question are made concurrently.
**Constraints**: Store and compare time as UTC Unix milliseconds. Do not persist state names. At a state boundary, prefer the later state. Only Better Auth updates User/Session records; the application only references authenticated User IDs. An Answer may be created only while the Question is `OPEN`, and D1 constraints provide the final guarantee of uniqueness per User and Question. Preserve existing valid User/Session data during migration, while allowing only SPEC 004 validation-only Question/Answer data to be replaced.
**Scale/Scope**: Four primary entities, four states, one differential migration, repositories for Question/Answer, at least twenty state-boundary cases, and two migration paths—from an empty database and from the SPEC 004 schema. Question creation UI, external API contracts, publication authorization, and browsing UI are out of scope.

## Constitution Check

Because `constitution.md` is still an unfilled template, use `AGENTS.md`, the feature specification, and the existing design as gates.

- Lock down boundary conditions for pure logic such as state evaluation, time ordering, and invalid transitions with unit tests.
- Verify the schema, migrations, uniqueness constraints, referential integrity, and the repository-to-D1 connection with integration tests.
- Separate sources of truth: Better Auth owns User/Session, while repositories and D1 constraints own Question/Answer.
- Use English for UI text, comments, and identifiers, and Japanese for SpecKit artifacts.
- Do not overwrite existing changes or authentication data, and make the state before and after migration verifiable.
- Record implementation, research, and important decisions in `USE_CODEX.md`.

**Assessment before Phase 0**: Pass. The unresolved technical topics are coexistence of Drizzle and Wrangler histories, atomic writes in D1, and how to test migrations against a real database. Phase 0 resolves them.

**Assessment after Phase 1**: Pass. Reviewed differential SQL that preserves the existing migration ledger, the Drizzle schema, a single state function, separation of Better Auth and repository responsibilities, and D1 integration tests through the Workers Vitest Plugin satisfy every gate. No unresolved items remain.

## Project Structure

### Documentation for This Feature

```text
specs/005-domain-data-lifecycle/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── domain-persistence.md
└── tasks.md
```

### Source Code

```text
drizzle.config.ts
migrations/
├── 0001_better_auth.sql
└── 0004_domain_data_lifecycle.sql

src/
├── auth/
│   └── session.ts
├── db/
│   ├── client.ts
│   └── schema.ts
├── domain/
│   ├── question.ts
│   └── question-lifecycle.ts
└── repositories/
    └── question-repository.ts

tests/
├── d1/
│   ├── apply-migrations.ts
│   ├── fresh-schema.test.ts
│   ├── legacy-upgrade.test.ts
│   └── question-repository.test.ts
├── helpers/
│   └── question-repository.ts
└── unit/
    └── question-lifecycle.test.ts

vitest.config.ts
vitest.d1.config.ts
```

**Structure Decision**: Keep the existing single-Worker structure. Centralize the Drizzle schema and D1 client creation in `src/db/`, place the lifecycle contract that is independent of persistence in `src/domain/question-lifecycle.ts`, and place the D1 persistence boundary in `src/repositories/question-repository.ts`. Keep the existing Node-based unit and integration tests in `vitest.config.ts`, and isolate only the tests that require a real D1 database in workerd through `vitest.d1.config.ts`.

## Complexity Tracking

No violations. The two Vitest configurations are the minimum separation needed to verify D1-specific migrations and constraints against a production-equivalent runtime while retaining the existing fast Node tests.
