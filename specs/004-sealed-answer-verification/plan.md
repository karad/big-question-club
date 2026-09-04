# Implementation Plan: Validating Agent Answer Submission Integrity and Sealed Answers

**Branch**: `004-sealed-answer-verification` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

## Summary

Validate that an authenticated participant can submit exactly one Answer—with a Body and one-line Excerpt—to a Question before its deadline, that other participants' Answers remain hidden through every route until the deadline, and that all Answers become viewable only on the authenticated Human-facing screen after the deadline. Use D1 `UNIQUE(question_id, user_id)` as the final duplicate-decision source, and share a common Worker-time visibility decision across SSR, HTTP APIs, and WebMCP.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13 or later for development, ES2022
**Primary Dependencies**: Cloudflare Workers, Hono 4, Vite 8, Better Auth, Cloudflare D1, Vitest 4
**Storage**: Cloudflare D1. Add `questions` and `answers` to the existing authentication tables.
**Testing**: Unit and Integration Tests with Vitest, WebMCP Tool Unit Tests, and manual E2E with two authenticated participants.
**Target Platform**: Cloudflare Workers, D1, and a WebMCP-compatible Chrome environment.
**Project Type**: Single web application including SSR.
**Performance Goals**: Complete each operation within two seconds in the verification environment and retain exactly one committed Answer for every pair across ten concurrent-submission pairs.
**Constraints**: Determine the submitter only from the Session. Require an Excerpt with no line breaks and at most 160 characters. Evaluate the deadline only from Worker time. Before the deadline, return no other participant's Answer Body, Excerpt, extract, summary, or clue to existence through any route. After the deadline, the SSR list shows only Excerpts and expands only the selected Body from a same-Origin Answer detail API when an authenticated Human clicks. WebMCP never returns other participants' Answers, even after the deadline. Use D1 prepared statements.
**Scale/Scope**: Cover a verification Question, two participants, submission, duplication, concurrent submission, the deadline boundary, and three visibility routes. Question creation and editing, voting, summarization, and unauthenticated publication are out of scope.

## Constitution Check

Because `constitution.md` is an undecided template, use `AGENTS.md` and this specification as gates.

- Fix the D1 uniqueness constraint, time boundary, input, and visibility with Unit Tests.
- Cover API, SSR, and WebMCP flows with Integration Tests.
- Run manual E2E across two participants, both sides of the deadline, and three routes without recording Secrets.
- Write UI text, comments, and identifiers in English.

**Decision After Phase 0 / Phase 1**: Pass. The database constraint is the final decision source, and no API or Tool returning other participants' Answers is provided.

**Completion Decision (2026-09-02)**: Pass. Manual E2E with two participants and remote D1 confirmed submission, duplicate rejection, Sealed behavior, Reveal behavior, and WebMCP retrieval limited to the participant's own data. Automated quality gates also passed.

## Project Structure

```text
specs/004-sealed-answer-verification/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── answer-submission.md
│   └── question-visibility.md
└── tasks.md

migrations/0003_add_questions_and_answers.sql
src/{app.tsx,client.ts}
src/domain/{question.ts,answer-submission.ts,answer-visibility.ts}
src/repositories/question-repository.ts
src/routes/{question.ts,submit-answer.ts}
src/webmcp/{register-submit-answer-tool.ts,register-my-submission-tool.ts}
tests/{unit,integration}/
```

**Structure Decision**: Retain the single Worker. SSR, HTTP APIs, and WebMCP share common decisions from `domain/` and D1 access from `repositories/`.

## Complexity Tracking

No violations.
