# Implementation Plan: Challenge Core Browsing Flow

**Branch**: `009-answer-period-browsing` | **Date**: 2026-09-02 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/009-answer-period-browsing/spec.md`

## Summary

To complete the minimum Core Demo and public operation requirements for the WebMCP Challenge, retain the existing single-Worker architecture while adding and organizing the Home Open Question list, the Question Detail state during the answer period, a single-administrator operations interface, audit records, content deletion, and user bans. Reuse SPEC 007's requirement to use ChatGPT's built-in browser and exclude existing Chrome tabs; its finalized one-line agent-request prompt containing an absolute Question URL that follows the current origin; and its WebMCP instruction to prioritize the user's own statements and create and submit the best proxy answer without asserting unverified personal facts or known beliefs when no explicit personal view is available. Do not ask a clarification question solely because personal context is insufficient; the initial prompt grants submission permission, so no additional preview or approval is required. Reuse SPEC 008's Answer authorization and minimal Reveal display. Configure the administrator email through the environment, derive authorization from the session user, and make D1 the source of truth for auditing and bans, with unit, HTTP, and D1 tests fixing these contracts. Move final visual design and Reveal comparison presentation to the required SPEC 010.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later or 24 or later for development, ES2022
**Primary Dependencies**: Existing Cloudflare Workers, Hono, Hono JSX, Vite, Better Auth 1.7, Drizzle ORM 0.45 series, Wrangler, Vitest 4, and the WebMCP Imperative API. Add no new dependencies.
**Storage**: Add `banned_users`, `audit_logs`, and operation-recording triggers by migration to the existing Cloudflare D1 `user`, `session`, `questions`, and `answers` tables.
**Testing**: Unit tests for display state, deadline, answer count, and administration settings; Hono integration tests for Home, Question Detail, administrator authorization, and operations; D1 integration tests for the Open list, audit, deletion, and bans; and regression coverage for existing SPEC 007 and 008 behavior.
**Target Platform**: Cloudflare Workers, Cloudflare D1, WebMCP-capable Chrome, modern browsers, and local Miniflare/workerd.
**Project Type**: A single web application providing SSR, HTTP APIs, and WebMCP from one Worker.
**Performance Goals**: Return the initial HTML for Home and Question Detail within two seconds each during local verification, and retrieve the Home list with one aggregate query.
**Constraints**: Obtain service time only once per request. In `OPEN` and `CLOSED`, do not retrieve, display, or embed other users' Answers in public screens. Allow the administration interface and operations only to one user matching the environment-configured email, and apply private no-store after authorization. Do not link to the administration interface from public screens, and return an ordinary 404 for unauthenticated users, unauthorized users, and configuration failures. Do not duplicate body text, excerpts, or authentication secrets in audit records. Invalidate sessions when banning a user, and reject banned users in the session-creation hook. Do not regress SPEC 008 behavior for `REVEALED`. Application text, comments, and identifiers are English; SpecKit documents are Japanese.
**Scale/Scope**: Nine user stories covering Home, Question Detail, the administration interface, four administration lists, Question/Answer deletion, user ban/unban, audit records, authorization, and failure states. Visual design, a dedicated Login page, redesign of My Questions, multiple roles, and comprehensive accessibility are out of scope.

## Constitution Check

Because `constitution.md` remains an unfinalized template, use `AGENTS.md`, the feature specification, and the existing design as gates.

- Fix display state, singular/plural answer counts, and remaining time at boundaries through unit-testable pure functions.
- Use the existing `getQuestionState` for Question state, Better Auth sessions for identity, and the existing repositories and D1 as the sole source of truth for persistence.
- Verify Open-list filtering, ordering, and aggregation with D1 integration tests, and verify the flow from authentication through SSR with integration tests.
- Routes must not accept a user ID from input; determine display state only from the session-derived identity and one request-scoped service-time snapshot.
- Do not include Answer bodies, excerpts, or users in the Home projection, and treat Question bodies and the current user's Answer as untrusted text.
- Reuse the safety contracts from SPEC 007 and 008 without weakening them for short-term convenience.
- Do not trust email input or URL parameters for administrator determination. Compare the environment configuration with the session user's database record in the repository.
- Record login/logout and Question/Answer changes with database triggers so records are not lost when routes are omitted or repositories are invoked directly.
- Include administrator deletion or ban changes and their audit record in the same D1 batch to avoid partial success.
- Enforce bans both by deleting existing sessions and through the before-session-creation hook.
- Write application text, comments, and identifiers in English; create SpecKit artifacts in Japanese; and record important decisions in `USE_CODEX.md`.

**Assessment before Phase 0**: Compliant. Resolve the Open list, state snapshot, viewer states, existing authentication flow, SPEC boundaries, and test allocation in Phase 0.

**Assessment after Phase 1**: Compliant. No new dependencies, minimal additive audit and ban schemas, session-derived authorization, limited changes to existing routes and views, and unit/HTTP/D1 regression coverage satisfy all gates. No unresolved items remain.

## Project Structure

### Documentation for This Feature

```text
specs/009-answer-period-browsing/
├── spec.md
├── plan.md
├── architecture.md
├── user-manual.md
├── admin-manual.md
├── developer-manual.md
├── migration-manual.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-record.md
├── contracts/
│   └── core-browsing.md
│   └── admin-operations.md
└── tasks.md
```

### Source Code

```text
src/
├── app.tsx
├── auth/
│   └── auth.ts
├── db/
│   └── schema.ts
├── domain/
│   ├── admin.ts
│   └── question-browsing.ts
├── repositories/
│   ├── admin-repository.ts
│   └── question-repository.ts
├── routes/
│   ├── admin.tsx
│   ├── home.tsx
│   └── question.ts
└── views/
    ├── admin.tsx
    ├── home.tsx
    └── question-detail.tsx

tests/
├── d1/
│   ├── admin-repository.test.ts
│   └── question-browsing-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── admin.test.ts
│   ├── home.test.ts
│   ├── question-browsing.test.ts
│   └── question-visibility.test.ts
└── unit/
    ├── admin.test.ts
    └── question-browsing.test.ts
```

**Structural Decision**: Preserve the existing single Worker and route separation. Put presentation values independent of any screen in the domain layer, general Question operations in the existing repository, administrator projections and mutations in a dedicated Admin Repository, HTTP authorization in the Admin Route, and SSR in per-screen views. Use Better Auth session lifecycle hooks and D1 triggers as the audit and ban boundaries. Do not add large-scale shared-layout changes, client redesigns, or another authentication method.

## Complexity Tracking

No violations. No new dependencies or services are added. The complexity of adding `banned_users`, `audit_logs`, and necessary indexes and triggers in one migration is required to guarantee public-app suspension and append-only auditing with the database as source of truth. A dedicated Admin Repository, Route, and View are the minimum structure that separates the non-exposure boundary of public browsing from administrator-only full-record projections.
