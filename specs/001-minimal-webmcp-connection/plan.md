# Implementation Plan: Minimal WebMCP Connection

**Branch**: `main` | **Date**: 2026-09-01 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-minimal-webmcp-connection/spec.md`

## Summary

A Hono application on Cloudflare Workers provides a read-only WebMCP Tool that returns a fixed English Question. The Tool is registered statically on the browser page, enabling verification that a supported Personal Agent can discover and invoke it. Authentication, persistence, Answer submission, and multiple Questions are not implemented.

## Technical Context

**Language/Version**: TypeScript 5.x, current Node.js LTS

**Primary Dependencies**: Cloudflare Workers, Hono, Hono JSX, Vite, Cloudflare Vite plugin, WebMCP browser API

**Storage**: None. The fixed Question is managed as an application constant.

**Testing**: Unit and Integration Tests with Vitest; manual E2E with supported Chrome and a Personal Agent

**Target Platform**: Cloudflare Workers and a top-level HTTPS page in WebMCP-compatible Chrome

**Project Type**: SSR web application

**Performance Goals**: Retrieve the Question within two minutes of connecting in a development or shared environment.

**Constraints**: Expose exactly one read-only Tool with no input. Do not use login, personal information, Personal Context, persistent storage, or fallback to an HTTP API.

**Scale/Scope**: One fixed Question, one Tool, one verification page, and one health-check route. Answer submission and the human-facing MVP UI are covered by subsequent SPECs.

## Constitution Check

*Gate: Review before Phase 0 research and again after Phase 1 design.*

`constitution.md` is an unfilled template and defines no applicable project-specific principles. Follow the repository development guide: write specification documents in Japanese, and add Unit Tests for fixed contracts and pure logic with branches. The gate passes.

The same conditions remain satisfied after design, with no additional complexity violations.

## Project Structure

### Documentation

```text
specs/001-minimal-webmcp-connection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── get-verification-question.md
└── tasks.md
```

### Source Code

```text
src/
├── app.tsx                       # Hono application and verification page
├── index.tsx                     # Worker entry point
├── domain/
│   └── verification-question.ts  # Fixed Question and contract validation
├── routes/
│   └── health.ts                 # Health-check route
├── webmcp/
│   ├── register-tool.ts           # Tool registration adapter
│   └── browser-support.ts         # WebMCP availability detection
└── types/
    └── webmcp.d.ts                # Minimal type definitions for the proposed API

tests/
├── unit/
│   ├── verification-question.test.ts
│   └── browser-support.test.ts
└── integration/
    ├── health.test.ts
    └── verification-page.test.ts
```

**Structure Decision**: Configure the Cloudflare Worker as a single web application. Isolate the pure contract for the fixed Question under `domain/`, and browser-specific WebMCP registration under `webmcp/`. This confines changes to the proposed browser API within the registration adapter.

## Complexity Tracking

There are no constitution violations, so there is nothing to record.
