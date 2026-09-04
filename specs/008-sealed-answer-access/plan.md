# Implementation Plan: Sealed Answer Access Control

**Branch**: `008-sealed-answer-access` | **Date**: 2026-09-02 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/008-sealed-answer-access/spec.md`

## Summary

Use the existing Question lifecycle decision as the sole state source for Answer disclosure and centralize authentication, channel, and information category in a pure access-control policy. Authenticated Human SSR handles answer counts and the current User's Answer for published Questions and shows all excerpts only in `REVEALED`. Human detail HTTP returns exactly one selected body only in `REVEALED`; WebMCP never returns an Answer other than the current User's. Prevent reuse of User-dependent responses and lock down direct access, guessed identifiers, boundary times, and expired Sessions with regression tests.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later or 24 or later for development, ES2022
**Primary Dependencies**: Cloudflare Workers, Hono, Hono JSX, Vite, Better Auth 1.7, Drizzle ORM 0.45.x, Wrangler, Cloudflare Workers Vitest Plugin 1.x, Vitest 4, WebMCP Imperative API
**Storage**: Existing Cloudflare D1 `questions`, `answers`, and `user`; no schema or migration changes.
**Testing**: Unit tests for the authorization decision table; Hono integration tests for SSR, HTTP, and WebMCP-compatible paths; D1 integration tests for projection, ownership, and cross-Question isolation; two-User manual E2E.
**Target Platform**: Cloudflare Workers, Cloudflare D1, WebMCP-capable Chrome, modern browsers, and local Miniflare/workerd.
**Project Type**: One Worker serving SSR, HTTP API, and WebMCP.
**Performance Goals**: Question-screen, personal-state, and Answer-detail allow/deny responses complete within two seconds locally; initial post-Reveal SSR embeds zero Answer bodies.
**Constraints**: Derive Question state once from service time per request. Seal other Users' Answers on every path in `DRAFT`, `OPEN`, and `CLOSED`; allow them in `REVEALED` only through authenticated Human SSR and detail HTTP. WebMCP never returns answer counts or other Users' Answers. Mark User-dependent responses `private, no-store` and Cookie-dependent, and make denied detail requests non-enumerating. UI copy, comments, and identifiers are English; SpecKit documents are Japanese.
**Scale/Scope**: Four user stories, five subjects, four states, three publication channels, and three information types yielding at least 180 base combinations; limited changes to existing domain, routes, and repository; unit, HTTP, and D1 integration tests; real-browser checks. New migrations, finished UI, summaries, search, and ranking are out of scope.

## Constitution Check

Because `constitution.md` remains an unfilled template, use `AGENTS.md`, the feature specification, and existing design as gates.

- Lock the branch-heavy pure policy from state, authentication, channel, and information category across all combinations with unit tests.
- Preserve existing repository/D1 as Question and Answer sources of truth, `getQuestionState` for state, and Better Auth Session for identity.
- Verify repository projections with D1 integration tests and authentication-to-SSR/HTTP/WebMCP flows with integration tests.
- Routes accept no User ID input and use only Session identity and server time for authorization.
- Do not embed other Users' bodies in initial SSR or Answer-derived data in common errors; render all content as untrusted text.
- Use English for app copy, comments, and identifiers, Japanese for SpecKit artifacts, and record important decisions in `USE_CODEX.md`.

**Assessment before Phase 0**: Pass. Phase 0 resolves authorization axes, channel identity, state-evaluation time, safe projections, detail non-enumeration, per-User caching, and test allocation.

**Assessment after Phase 1**: Pass. A pure route-purpose decision table, request-state snapshot, existing Sessions, minimal post-authorization projections, common 404, `private, no-store` plus `Vary: Cookie`, and unit/HTTP/D1/manual E2E allocation satisfy every gate. No unresolved items remain.

## Project Structure

### Documentation for This Feature

```text
specs/008-sealed-answer-access/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-record.md
├── contracts/
│   ├── access-control-matrix.md
│   ├── answer-http.md
│   └── webmcp-visibility.md
└── tasks.md
```

### Source Code

```text
src/
├── app.tsx
├── domain/
│   ├── answer-visibility.ts
│   └── question-lifecycle.ts
├── repositories/question-repository.ts
├── routes/question.ts
├── views/question-detail.tsx
└── webmcp/
    ├── register-get-question-tool.ts
    └── register-my-submission-tool.ts

tests/
├── d1/answer-visibility-repository.test.ts
├── helpers/
│   ├── question-repository.ts
│   └── visibility-matrix.ts
├── integration/
│   ├── question-visibility.test.ts
│   └── webmcp-question-api.test.ts
└── unit/answer-visibility.test.ts
```

**Structure Decision**: Retain the single-Worker structure. Put the access table in `domain/answer-visibility.ts`, state derivation in existing `question-lifecycle.ts`, authentication and request-state snapshots in `routes/question.ts`, safe column projections in the existing repository, and English SSR in the existing view. WebMCP continues using the owner-only HTTP contract and gains no other-User Answer capability.

## Complexity Tracking

No violations. Add no service, dependency, schema, or migration. The authorization table and channel-specific minimal projections are the smallest change that avoids duplicated route branches and detects future channel additions through exhaustive combination tests.
