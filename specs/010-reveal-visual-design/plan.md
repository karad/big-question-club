# Implementation Plan: Answer Reveal Experience and Challenge Visual Design

**Branch**: `010-reveal-visual-design` | **Date**: 2026-09-03 | **Specification**: [spec.md](./spec.md)

**Input**: Feature specification at `specs/010-reveal-visual-design/spec.md`

## Summary

Preserve the existing Cloudflare Workers, Hono JSX, D1, and Vite architecture and the non-exposure boundaries from SPEC 008 and 009 while completing a comparison-friendly post-Reveal screen with an excerpt list and lazy Answer-body retrieval. For authenticated users, show a green `Answered` tag on list Cards and Detail only when the current user answered, and before Reveal allow review of only that Answer. Explain that Results contain one Answer per authenticated account, add per-Question anonymous icons generated from Question and Answer IDs rather than user data, and mark only the current user's Answer as `Your answer`. Add five Open and ten Result items to Home, plus 20-item pagination to state-specific lists. Separate draft save and immediate publication, using unique creation tokens and submitting-state controls to prevent duplicates. Commit owner deletion and its audit record together. Unify presentation with Tailwind CSS 4, generated static SVGs derived from React Icons, shared layout, English UI, responsive behavior, keyboard operation, and reduced motion.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13+ or 24+ for development and asset generation, ES2022

**Primary Dependencies**: Existing Cloudflare Workers, Hono/Hono JSX, Vite, Better Auth 1.7, Drizzle ORM 0.45, Wrangler, Vitest 4, and WebMCP Imperative API; add Tailwind CSS 4, its official Vite plugin, React Icons 5, and React/React DOM only for icon generation.

**Storage**: Reuse D1 `questions`, `answers`, and `audit_logs`; add no table, column, or index. Owner deletion adds audit action `QUESTION_DELETED`.

**Testing**: Unit tests for deadline defaults, pages, current-user tags, creation intent, duplicate submission, anonymous icons, and WebMCP proxy-answer descriptions; Hono integration tests for Home, lists, Detail, pre-Reveal own-Answer display, post-Reveal own tag, create/publish/delete, and WebMCP instructions; D1 tests for projections, ownership, deletion, audit, and cascades; regression tests for generated assets, CSS, and WebMCP non-exposure.

**Target Platform**: Cloudflare Workers/D1, WebMCP-capable Chrome, modern browsers, and local Miniflare/workerd.

**Project Type**: One Worker serving SSR, HTTP APIs, and WebMCP.

**Performance Goals**: Return initial HTML for Home, lists, and Detail within two seconds locally; use bounded aggregate Home queries without per-Question calls; include no revealed body in initial HTML.

**Constraints**: One server-time snapshot per request. Never retrieve or embed other Answers in `OPEN`/`CLOSED`; in `REVEALED`, expose them only to authenticated human routes, never WebMCP. User-specific responses are `private, no-store`. Anonymous icons use no user ID, Google name/image, or raw hash and add no cross-Question identifier. All screen styling uses Tailwind CSS and state/action icons derive only from React Icons. Never treat user input as SVG or raw HTML. Application text, comments, and identifiers are English; SpecKit artifacts are Japanese.

**Scale/Scope**: Six stories; two Home sections; two state lists with 20-item pages; Answer comparison; two creation intents; owner deletion; shared visuals and client interactions; unit/HTTP/D1 regression; and three-minute demo verification.

## Constitution Check

Because `constitution.md` is unfinished, use `AGENTS.md`, this specification, and existing design as gates.

- Unit-test reusable pure deadline, page, presentation, and intent decisions.
- Keep D1 as source of truth for lists, current-user Answer state, owner deletion, and audit.
- Integration-test authentication-to-SSR, pagination, lazy bodies, creation, publication, and deletion.
- Use unique creation tokens and storage constraints, not only disabled buttons, for replay safety.
- Compare session identity with stored owner; trust no input user ID.
- Treat bodies and excerpts as untrusted strings; trust only generated fixed SVG assets.
- Preserve SPEC 008/009 non-exposure, time consistency, and Draft/missing indistinguishability.
- Add the audit action to append-only auditing without bodies, excerpts, or authentication data.
- Use English UI/comments/identifiers, Japanese SpecKit artifacts, and record important decisions in `USE_CODEX.md`.

**Before Phase 0**: Compliant. Research resolves Tailwind generation, React Icons/Hono JSX boundaries, projections, lazy bodies, duplicate prevention, owner deletion, and local-midnight defaults.

**After Phase 1**: Compliant. No persistent structure is added; bounded asset generation, existing repository projections and conditional mutations, shared SSR components, progressive enhancement, and unit/HTTP/D1 tests satisfy all gates. No unresolved item remains.

## Project Structure

### Feature Documentation

```text
specs/010-reveal-visual-design/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── browsing-and-reveal.md
│   └── question-management.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
scripts/generate-icons.mjs
src/
├── app.tsx
├── client.ts
├── styles.css
├── domain/{admin,question-browsing,question-deadline,question-listing}.ts
├── generated/icons.ts
├── repositories/question-repository.ts
├── routes/{home,question,question-list,question-management}.tsx
├── ui/{agent-prompt-clipboard,deadline-display,form-submission-guard,question-list,revealed-answers}.ts
└── views/{icon,layout,home,question-card,question-detail,question-list,question-management,site-header}.tsx
tests/
├── d1/{question-browsing-repository,question-management-repository}.test.ts
├── helpers/question-repository.ts
├── integration/{assets,challenge-demo,home,question-browsing,question-list,question-management,question-visibility}.test.ts
└── unit/{form-submission-guard,icon,question-deadline,question-list,question-listing,revealed-answers}.test.ts
```

**Structural Decision**: Preserve one Worker, Hono JSX SSR, and existing route/view/repository separation. Put shared structure and assets in `layout.tsx`, Question items in `question-card.tsx`, state lists in dedicated routes/views, and browser behavior in responsibility-specific `src/ui/` modules. Generate fixed SVGs from React Icons into `src/generated/icons.ts`, and consume them only through `icon.tsx`.

## Complexity Tracking

| Added Complexity | Why Required | Rejected Simpler Option |
| --- | --- | --- |
| Generate static SVGs from React Icons | Safely use React-only components in Hono JSX SSR without shipping React runtime to the Worker | Direct types are incompatible; migrating all SSR to React is too broad |
| Creation-token replay control | Keep one Question through double clicks, form replay, and network retries | Disabling buttons alone cannot stop direct replay |
