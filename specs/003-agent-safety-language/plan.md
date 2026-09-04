# Implementation Plan: Validating Personal Agent Answer Safety and Language

**Branch**: `003-agent-safety-language` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification in `specs/003-agent-safety-language/spec.md`

## Summary

Perform a P0 validation that a Personal Agent can use Private Context for internal reasoning without exposing it in public output, resist Prompt Injection in the Question body, and answer in the same language as the Question.

Extend the existing Cloudflare Workers, Hono, Vite, and WebMCP stack with a read-only Tool that returns one of 14 fixed verification Questions at a time. Explicitly mark the Question body as untrusted user-generated content in Tool output. Concisely state in the Tool description that the response must use the same language, Context is limited to internal reasoning, and instructions in the body are untrusted. Safety does not rely on the description alone: it is validated in layers through a same-origin read-only boundary, a contract that never receives or stores Private Context, fixed validation procedures, and manual E2E with a real Personal Agent.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later for development, ES2022

**Primary Dependencies**: Cloudflare Workers, Hono 4, Vite 8, Better Auth, Cloudflare D1, Vitest 4

**Storage**: No new persistence in this SPEC. Authentication state uses the existing Cloudflare D1, but verification Questions, Answers, Private Context, and evaluation results are not stored.

**Testing**: Unit and Integration Tests with Vitest; manual E2E using a WebMCP-compatible Chrome environment and a dedicated validation Personal Agent

**Target Platform**: Cloudflare Workers and a WebMCP-compatible Chrome environment using a same-canonical-Origin browser Session.

**Project Type**: Single web application including SSR

**Performance Goals**: The verification Question API and Tool return a result within two seconds under ordinary development and validation network conditions.

**Constraints**: Do not treat the Question body, Tool definition, or Tool output as a trusted basis for safety. Add `untrustedContentHint` to Question output. Do not send or store Private Context, validation Secret strings, full Answers, authentication information, or detailed evaluations in the application, APIs, logs, or Git-tracked files. Restrict Question retrieval to a same-origin relative URL and do not add Answer-submission or evaluation APIs.

**Scale/Scope**: Fourteen fixed cases: seven Japanese and seven English. The deadline-critical Go runs six cases: one normal Question in each language and one attack case for each of four classifications. Retain the other eight for subsequent regression validation. Mixed languages, Answer submission, Answer storage or publication, and Context belonging to real participants are out of scope.

## Constitution Check

*Gate: Must pass before Phase 0 research and be rechecked after Phase 1 design.*

`constitution.md` is an undecided template and defines no applicable concrete principles. Use the project's `AGENTS.md` and this specification as gates instead.

- Fix the contracts, input validation, case selection, and Tool-registration branches for fixed Questions with Unit Tests.
- Cover the Hono Question-retrieval API and SSR validation guidance with Integration Tests.
- Do not store Private Context, Secret strings, full Answers, Cookies, or tokens in source code, test fixtures, logs, Tool responses, or validation records.
- Evaluate Personal Agent internal reasoning, actual disclosure, Injection resistance, and language matching only through manual E2E with a real Agent.
- Do not proceed to P1 implementation involving Answer submission, storage, or publication until P0 receives a Go decision.

**Decision (Before Phase 0)**: Pass. The fixed Question set and read-only Tool are sufficient for validation and introduce no new route that receives Private Context or Answers.

## Project Structure

### Documentation for This Feature

```text
specs/003-agent-safety-language/
├── plan.md              # This file (speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output (not created by speckit-plan)
```

### Source Code at the Repository Root

```text
src/
├── app.tsx                                  # Hono routes and SSR validation guidance
├── client.ts                                # Tool registration and authentication-state display
├── domain/
│   └── verification-question.ts              # Fixed verification Questions and public contract
├── routes/
│   └── verification-question.ts              # no-store read API
└── webmcp/
    └── register-tool.ts                      # Question-retrieval Tool and untrusted-output marker

tests/
├── integration/
│   ├── verification-page.test.ts
│   └── verification-question-api.test.ts
└── unit/
    ├── register-tool.test.ts
    └── verification-question.test.ts
```

**Structure Decision**: Retain the existing single-Worker application. Separate verification Question selection and response contracts into `domain`, the HTTP boundary into `routes`, and WebMCP registration and same-origin invocation into `webmcp`. Add no route that receives Answers or Private Context.

## Complexity Tracking

Not applicable.

## Constitution Check After Phase 1

**Decision**: Pass. `data-model.md` defines only fixed data and manual evaluation records, excluding Private Context and Answers from the data model. `contracts/` defines a same-origin, one-item-at-a-time read contract, while `quickstart.md` and `validation-record.md` define procedures for evaluating a real Agent without retaining Secrets. Automated tests detect public-contract regressions; manual E2E validates actual Agent safety and language matching.
