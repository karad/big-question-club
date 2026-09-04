# Implementation Plan: Question Creation and Publication Flow

**Branch**: `006-question-publishing` | **Date**: 2026-09-02 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/006-question-publishing/spec.md`

## Summary

Add SSR screens where an authenticated Human can enter a Question body in any language and an answer deadline, save and edit a draft, review it, and publish it irreversibly. The Personal Agent determines the answer language from the Question body. Continue using the existing Hono JSX, Better Auth Session, Question Repository, and D1 schema. Implement input rules as pure domain functions, owner- and state-sensitive changes as conditional repository writes, and Human operations as same-origin HTML forms with CSRF protection. `My Questions` returns only the current User's Questions in newest-first order with answer counts, without handling Answer content or other Users' information.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later or 24 or later for development, ES2022
**Primary Dependencies**: Cloudflare Workers, Hono, Hono JSX, Hono CSRF Middleware, Vite, Better Auth 1.7, Drizzle ORM 0.45.x, Wrangler, Cloudflare Workers Vitest Plugin 1.x, Vitest 4
**Storage**: Existing Cloudflare D1. Use the SPEC 005 `questions`, `answers`, and `user` tables unchanged; this specification adds no migration.
**Testing**: Unit tests for input validation, character counts, and time boundaries; Hono integration tests for SSR, forms, authentication, and CSRF; integration tests using the Workers Vitest Plugin and isolated D1 for ownership, conflict, and list queries; and manual verification of the full flow through the quickstart.
**Target Platform**: Cloudflare Workers, Cloudflare D1, modern browsers, and local Miniflare/workerd.
**Project Type**: A single web application serving SSR, HTTP API, and WebMCP from one Worker.
**Performance Goals**: Creation, editing, publication, and `My Questions` each complete within two seconds in the local verification environment. Publication is committed exactly once even after ten sequential or ten concurrent publication requests.
**Constraints**: UI copy is English and SpecKit documents are Japanese. A body in any language contains 10–1,000 grapheme clusters after trimming. At every change and publication, the deadline is between one hour and thirty days from service time, with `revealsAt === closesAt`. Primary fields are immutable after publication. Deadline validation rechecks the submitted absolute time against service time rather than trusting the client clock. The existence of another User's draft is not disclosed.
**Scale/Scope**: Four user stories, six Human-facing screens/operations, one input domain contract, extensions to the existing repository for creation/retrieval/editing/publication/listing, at least thirty input cases, at least twenty authorization cases, and at least fifteen list-display cases. WebMCP tools, public lists, Answer-viewing changes, and migrations are out of scope.

## Constitution Check

Because `constitution.md` remains an unfilled template, use `AGENTS.md`, the feature specification, and the existing design as gates.

- Lock down boundary conditions for pure body-length, deadline, and acknowledgment validation with unit tests.
- Verify owner conditions, publication uniqueness, conflicting updates, and aggregate listings in the Question Repository with D1 integration tests.
- Verify Human-screen state branches, field errors, authentication, CSRF, and non-enumerating responses with Hono integration tests.
- Preserve the existing D1 schema and repository as the Question source of truth, the Better Auth Session as the authentication source of truth, and the SPEC 005 lifecycle evaluation as the state source of truth.
- Use English for UI copy, comments, and identifiers, and Japanese for SpecKit artifacts.
- Render Question bodies as Hono JSX text and do not interpret untrusted content as HTML or instructions.
- Record implementation, research, and important decisions in `USE_CODEX.md`.

**Assessment before Phase 0**: Pass. Phase 0 resolves the remaining design topics: counting Unicode display characters, converting local deadlines to absolute time, HTML-form CSRF, publication/edit conflicts, and non-enumerating errors.

**Assessment after Phase 1**: Pass. Every gate is satisfied by a shared input contract using `Intl.Segmenter`, browser-generated absolute time with IANA time-zone confirmation, Hono same-origin CSRF middleware, D1 conditional updates, an owner-only repository boundary, and JSX text rendering. No unresolved items remain.

## Project Structure

### Documentation for This Feature

```text
specs/006-question-publishing/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── question-management.md
└── tasks.md
```

### Source Code

```text
src/
├── app.tsx
├── client.ts
├── domain/
│   ├── question.ts
│   ├── question-input.ts
│   └── question-lifecycle.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   └── question-management.tsx
└── views/
    └── question-management.tsx

tests/
├── d1/
│   └── question-management-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   └── question-management.test.ts
└── unit/
    └── question-input.test.ts
```

**Structure Decision**: Retain the existing single-Worker structure. Centralize input normalization, grapheme counting, and deadline ranges in `src/domain/question-input.ts` so every save and publication path uses the same result. Extend the existing `QuestionRepository` with D1 owner conditions, draft-only updates, conditional publication, and owner listings. Routes handle authentication, form parsing, and result classification; views handle the English Hono JSX UI and accessibility attributes; and `src/client.ts` adds only a minimal helper to convert local dates to absolute time and show confirmation.

## Complexity Tracking

No violations. Add no validation or date-time library; use standard Web APIs and the existing Hono/Drizzle boundaries. Separating routes from views is the minimum structure needed to keep the state and error branches across six flows testable.
