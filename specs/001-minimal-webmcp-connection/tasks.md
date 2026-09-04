# Tasks: Minimal WebMCP Connection

**Input**: Design artifacts in `specs/001-minimal-webmcp-connection/`

**Prerequisite Artifacts**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/get-verification-question.md`, `quickstart.md`

**Testing Policy**: Create Unit Tests for the fixed Question contract, input validation, and browser-support decisions. Verify Worker routes and the verification page with Integration Tests, and verify actual WebMCP browser and Personal Agent integration with manual E2E testing.

**Format**: Each task follows `- [ ] [TaskID] [P?] [Story?] Description (file path)`.

## Phase 1: Setup

**Purpose**: Initialize a minimal TypeScript web application running on Cloudflare Workers.

- [x] T001 Define the target Node.js version and package-management policy in `package.json`
- [x] T002 Add Cloudflare Workers, Hono, Hono JSX, Vite, and Cloudflare Vite plugin dependencies to `package.json`
- [x] T003 [P] Add strict TypeScript compiler settings to `tsconfig.json`, and lint and format settings to `eslint.config.js` and `.prettierrc.json`
- [x] T004 [P] Configure the Cloudflare Worker entry point and compatibility date in `wrangler.jsonc`
- [x] T005 [P] Configure Vite and the Cloudflare Vite plugin in `vite.config.ts`
- [x] T006 [P] Add Vitest execution settings and test targets to `vitest.config.ts`
- [x] T007 Add npm scripts for development, build, preview, test, and deployment to `package.json`

---

## Phase 2: Shared Foundation

**Purpose**: Prepare the Worker, Hono, fixed Question contract, and error representation that support all user stories.

**⚠️ CRITICAL**: Do not begin implementing user stories until this Phase is complete.

- [x] T008 Create the entry point that exposes the Hono application from the Worker in `src/index.tsx`
- [x] T009 Create shared Hono application initialization and error handling in `src/app.tsx`
- [x] T010 [P] Define success-result, failure-result, and Tool-input types in `src/domain/verification-question.ts`
- [x] T011 [P] Implement a pure function that validates required fixed Question fields in `src/domain/verification-question.ts`
- [x] T012 [P] Add minimal type definitions for the WebMCP browser API to `src/types/webmcp.d.ts`
- [x] T013 [P] Implement a health route in `src/routes/health.ts`
- [x] T014 Update `src/app.tsx` to connect the health route and shared error handling to the Hono application

**Checkpoint**: The Worker starts, and the fixed Question contract and health check are available to subsequent implementation.

---

## Phase 3: User Story 1 — Retrieve the Verification Question (Priority: P1) 🎯 MVP

**Goal**: Allow a Personal Agent to discover the Tool exposed by the page and retrieve the fixed English Question.

**Independent Test**: Open the verification page in supported Chrome, invoke `get_verification_question`, and retrieve a contract-compliant Question ten consecutive times.

### Tests

- [x] T015 [P] [US1] Create Unit Tests for required fixed Question fields, `language: en`, and determinism in `tests/unit/verification-question.test.ts`
- [x] T016 [P] [US1] Add Unit Tests rejecting empty, invalid, and additional input to `tests/unit/verification-question.test.ts`
- [x] T017 [P] [US1] Create Unit Tests for unsupported WebMCP, supported WebMCP, and registration failure in `tests/unit/browser-support.test.ts`
- [x] T018 [P] [US1] Create Integration Tests for success, invalid configuration, and failure results from the fixed Question API in `tests/integration/verification-question-api.test.ts`
- [x] T019 [P] [US1] Create an Integration Test showing Tool registration status on the verification page in `tests/integration/verification-page.test.ts`

### Implementation

- [x] T020 [US1] Implement the fixed Question constant and success-result creation in `src/domain/verification-question.ts`
- [x] T021 [US1] Implement conversion of invalid input, invalid configuration, cancellation, and service failure into distinguishable failure results in `src/domain/verification-question.ts`
- [x] T022 [US1] Implement a same-Origin API route returning the fixed Question in `src/routes/verification-question.ts`
- [x] T023 [US1] Update `src/app.tsx` to connect the fixed Question API route to the Hono application
- [x] T024 [US1] Implement an adapter that determines WebMCP availability and registration-failure causes in `src/webmcp/browser-support.ts`
- [x] T025 [US1] Implement an adapter in `src/webmcp/register-tool.ts` that statically registers `get_verification_question` as a no-input, read-only Tool and calls the fixed Question API
- [x] T026 [US1] Implement the verification page in `src/app.tsx`, displaying WebMCP Tool registration, unsupported, and registration-failure states in English
- [x] T027 [US1] Compare the Tool name, input Schema, and success/failure results against `specs/001-minimal-webmcp-connection/contracts/get-verification-question.md`, then update `src/webmcp/register-tool.ts` to resolve contract differences
- [x] T028 [US1] Run Unit and Integration Tests, fix failures, and update `tests/unit/` and `tests/integration/` until all tests pass

**Checkpoint**: Supported Chrome discovers exactly one Tool, and Question retrieval and failure results comply with the contract.

---

## Phase 4: User Story 2 — Reproduce the Connection Procedure (Priority: P2)

**Goal**: Allow a developer to start and deploy the environment, then reproduce successful and failed WebMCP connections using the same procedure.

**Independent Test**: A developer unfamiliar with the project can use only `quickstart.md` to retrieve the Question in a local environment within 30 minutes and confirm the prerequisites for shared verification.

### Tests

- [x] T029 [P] [US2] Create an Integration Test for the health route's success result and error boundary in `tests/integration/health.test.ts`
- [x] T030 [P] [US2] Add an Integration Test to `tests/integration/verification-page.test.ts` confirming the page's unsupported WebMCP state is not shown as a successful Question

### Implementation and Procedure

- [x] T031 [US2] Update `src/app.tsx` to connect the health route to the Hono application
- [x] T032 [US2] Add local development, build, preview, and `workers.dev` deployment instructions to `README.md`
- [x] T033 [US2] Detail the verification procedure—including the Chrome flag, Origin Trial, DevTools Tool inspection, and Personal Agent connection—in `specs/001-minimal-webmcp-connection/quickstart.md`
- [x] T034 [US2] Create a template in `specs/001-minimal-webmcp-connection/validation-record.md` for recording the supported Chrome version, WebMCP flag or Origin Trial status, and verification URL
- [x] T035 [US2] Manually verify Tool discovery, ten consecutive retrievals, API failure, invalid configuration, and cancellation by E2E, then record the results in `specs/001-minimal-webmcp-connection/validation-record.md`

**Checkpoint**: The documented procedure reproduces local and shared verification without mistaking an unsupported WebMCP environment or failure for success.

---

## Phase 5: Polish and Cross-Cutting Verification

**Purpose**: Perform final checks of quality, configuration, and documentation consistency.

- [x] T036 [P] Review the fixed Question content, Tool description, and English UI text in `src/domain/verification-question.ts` and `src/app.tsx`
- [x] T037 [P] Add or update `.gitignore` to keep Secrets out of configuration files and exclude local secret information and Worker-generated artifacts
- [x] T038 Run `npm run lint`, `npm run test`, `npm run build`, and `npm run preview`, then record the results in `specs/001-minimal-webmcp-connection/validation-record.md`
- [x] T039 [P] Perform a final check of the acceptance criteria in `quickstart.md` and record unresolved reproducibility concerns in `specs/001-minimal-webmcp-connection/validation-record.md`
- [x] T040 Update SPEC 001 in `MILESTONE.md` to `[x]` only when all completion criteria and verification records are present

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies; can start immediately.
- **Phase 2**: Starts after Phase 1 and blocks all user stories.
- **US1 (P1)**: Starts after Phase 2 and provides the minimum-value MVP.
- **US2 (P2)**: Depends on the working Tool and verification page from US1.
- **Phase 5**: Starts after US1 and US2 are complete.

### User Story Dependencies

- **US1**: Does not depend on other user stories.
- **US2**: Uses the Tool and verification page provided by US1.

### Parallel Opportunities

- T003 through T006 in Phase 1 can run in parallel after T001 and T002.
- T010 through T013 in Phase 2 can run in parallel with T008 and T009.
- T015 through T019 for US1 can run in parallel before implementation.
- T029 and T030 for US2 can run in parallel.
- T036, T037, and T039 in Phase 5 can run in parallel.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Implement US1 and confirm that supported Chrome can retrieve the fixed Question.
3. Stop here and verify US1 independently.

### Incremental Delivery

1. Demonstrate WebMCP Tool discovery and fixed Question retrieval with US1.
2. Make procedures, deployment, and failure checks reproducible with US2.
3. Complete all of Phase 5 and determine whether SPEC 001 is complete.

## Notes

- Every task has a checkbox, sequential ID, parallel marker when applicable, user-story label, and target path.
- Because the actual browser verification uses a proposed API, always record the Chrome version and Origin Trial status.
