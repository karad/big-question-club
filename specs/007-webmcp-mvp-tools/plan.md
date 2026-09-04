# Implementation Plan: WebMCP MVP Tools

**Branch**: `007-webmcp-mvp-tools` | **Date**: 2026-09-02 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/007-webmcp-mvp-tools/spec.md`

## Summary

On the Question screen, show a finalized one-line English prompt through which a Human explicitly initiates Agent answering. It specifies ChatGPT's built-in browser instead of an existing Chrome tab and includes an absolute Question URL following the current Origin. Expose exactly five tools to the Personal Agent: `get_question`, `submit_answer`, `update_answer`, `remove_answer`, and `get_my_submission`. Keep detailed context-grounding rules and safety boundaries out of the prompt and provide them through each tool's description, schema, annotations, and returned data. The Agent prioritizes available User-authored statements. When no explicit personal view exists, it creates and submits a best-effort proxy answer without asserting unverified personal facts or known beliefs. It does not ask solely because a view is missing, and treats the initial prompt as submission authorization without another preview or approval. Continue using Better Auth Sessions, the Question lifecycle, and D1 repositories; tools call dedicated same-origin HTTP contracts. D1 conditional single statements enforce ownership, `OPEN`, and target existence for Answer updates/deletion. Answers are immutable after the deadline, and another User's Answer is hidden and unmodifiable through every tool.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later or 24 or later for development, ES2022
**Primary Dependencies**: Cloudflare Workers, Hono, Hono JSX, Vite, Better Auth 1.7, Drizzle ORM 0.45.x, Wrangler, Cloudflare Workers Vitest Plugin 1.x, Vitest 4, WebMCP Imperative API, standard Clipboard API
**Storage**: Cloudflare D1. Reuse existing `questions`, `answers`, and `user`; add one differential migration aligning `answers.updated_at` and display-character contracts.
**Testing**: Unit tests for the one-line prompt, environment-aware URL generation, grapheme boundaries, errors, and WebMCP schemas; Hono integration tests for authentication, HTTP contracts, and SSR prompt UI; Workers Vitest Plugin tests with isolated D1 for migration, owner-only update/delete, and concurrency; manual E2E with WebMCP-capable Chrome and a Personal Agent.
**Target Platform**: Cloudflare Workers, Cloudflare D1, WebMCP-capable Chrome, modern browsers with the standard Clipboard API, and local Miniflare/workerd.
**Project Type**: A single web application serving SSR, HTTP API, and WebMCP from one Worker.
**Performance Goals**: In local verification, each tool's success or business-error response completes within two seconds, prompt display within two seconds, and copy-result notification within one second of User action.
**Constraints**: App copy, tool names, descriptions, errors, identifiers, and comments are English; SpecKit documents are Japanese. The one-line prompt specifies ChatGPT's built-in browser, excludes existing Chrome tabs, embeds an absolute Question URL for the current Origin, and excludes query and fragment. The Agent does not list, search, or recommend Questions and handles only the Human-selected Question. The Question body and current User's Answer are untrusted content. Answer body is 1–5,000 display characters; excerpt is 1–160 with no newline. The User has at most one Answer at a time. Update, deletion, and resubmission are available only while `OPEN`. Never input or output Session, Cookie, Token, Private Context, or another User's Answer through a tool.
**Scale/Scope**: Six user stories, five WebMCP tools, five HTTP contracts, one SSR prompt region, two repository mutation operations, one D1 migration, prompt/domain/tool unit tests, HTTP/SSR/D1 integration tests, and real-Agent manual E2E. Question discovery, tools for other Users' Answers, and a broad rewrite of Human-facing list/Reveal UI are out of scope.

## Constitution Check

Because `constitution.md` remains an unfilled template, use `AGENTS.md`, the feature specification, and existing design as gates.

- Guarantee pure Answer input and prompt-generation boundaries and fixed contracts with unit tests.
- Prefer Workers D1 integration tests for repositories, D1 schema, migrations, ownership/deadline/concurrency conditions.
- Verify flows spanning WebMCP, HTTP, authentication, and repositories, plus SSR display conditions, with integration tests.
- Preserve Better Auth Session as the authentication source of truth, SPEC 005 lifecycle evaluation for Question state, and D1 constraints for Answer uniqueness.
- Accept no User ID, Cookie, or Token in tool input; determine the current User only from Session.
- Mark Question body and current User Answer output as untrusted and exclude other Users' Answers at DTO, repository, and tool boundaries.
- Use English for app copy, tool descriptions, comments, and identifiers, and Japanese for SpecKit artifacts.
- Record implementation, research, and important decisions in `USE_CODEX.md`.

**Assessment before Phase 0**: Pass. Phase 0 resolves production tool surface, WebMCP annotations, update/delete races, resubmission after deletion, Unicode display characters, Clipboard failure, and test allocation.

**Assessment after Phase 1**: Pass. Five-tool exposure, same-origin HTTP contracts, conditional single statements, hard delete plus uniqueness, `Intl.Segmenter`, server-generated prompts, progressive Clipboard enhancement, and automated/manual test allocation satisfy every gate. No unresolved items remain.

## Project Structure

### Documentation for This Feature

```text
specs/007-webmcp-mvp-tools/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── agent-request-prompt.md
│   ├── answer-mutations.md
│   └── webmcp-tools.md
└── tasks.md
```

### Source Code

```text
migrations/
└── 0005_answer_revisions.sql

src/
├── app.tsx
├── client.ts
├── client/
│   └── agent-request-prompt.ts
├── db/
│   └── schema.ts
├── domain/
│   ├── agent-request-prompt.ts
│   ├── answer-submission.ts
│   └── question.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   ├── answer-mutations.ts
│   ├── question.ts
│   └── submit-answer.ts
├── views/
│   └── question-detail.tsx
└── webmcp/
    ├── register-get-question-tool.ts
    ├── register-my-submission-tool.ts
    ├── register-remove-answer-tool.ts
    ├── register-submit-answer-tool.ts
    └── register-update-answer-tool.ts

tests/
├── d1/
│   ├── answer-mutation-repository.test.ts
│   └── schema-contract.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── agent-request-prompt.test.ts
│   ├── answer-mutation-api.test.ts
│   └── webmcp-question-api.test.ts
└── unit/
    ├── agent-request-prompt.test.ts
    ├── agent-request-prompt-client.test.ts
    ├── answer-submission.test.ts
    ├── register-get-question-tool.test.ts
    ├── register-remove-answer-tool.test.ts
    └── register-update-answer-tool.test.ts
```

**Structure Decision**: Keep the existing single-Worker structure. Place pure prompt text and visibility logic in `domain/`, SSR structure in `views/`, HTTP authentication and result classification in `routes/`, conditional D1 updates/deletes in the existing repository, and each WebMCP schema and same-origin call in `webmcp/`. Remove existing P0 tool registration from `client.ts` and register the five tools sequentially. Share Answer display-character evaluation with the grapheme function used for Question input so submission and update produce the same result.

## Complexity Tracking

No violations. A differential migration is required for Answer update timestamps and Unicode contract alignment, but no new service, state-management library, or authentication method is added. Separating routes, repositories, and WebMCP registration continues the existing structure and makes the five external contracts and owner-only D1 conditions independently verifiable.
