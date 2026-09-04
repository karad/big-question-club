# Technical Research: Answer Reveal Experience and Challenge Visual Design

## 1. Tailwind CSS Integration

**Decision**: Add Tailwind CSS 4 and its official Vite plugin to the client build and load one fixed `client-dist/styles.css`, generated from `src/styles.css`, on every human-facing screen.

**Rationale**: This matches the existing Vite library-mode asset pipeline, fixes the SSR filename through `cssFileName`, and applies styling before JavaScript runs.

**Alternatives Considered**: CDN assets reduce reproducibility; a separate CLI duplicates Vite watching; Hono CSS helpers do not satisfy the Tailwind requirement.

**References**: https://tailwindcss.com/docs/installation/using-vite and https://vite.dev/guide/build#css-support

## 2. React Icons and the Hono JSX Boundary

**Decision**: Use React Icons as the sole icon source, convert an allowlisted set to static SVGs in a Node generation script, and render only generated trusted SVG through shared Hono JSX `Icon`, without React in the Worker runtime.

**Rationale**: React Icons returns React-specific element types incompatible with existing Hono JSX. Build-time React rendering preserves current SSR and Worker size.

**Safety Boundary**: The allowlist is repository-owned; user input never selects SVG. Track generated output and require clean regeneration. The component emits either `aria-hidden` or an English accessible label.

**Alternatives Considered**: Full React migration is too broad; runtime conversion ships React; hand-written or other icons violate the explicit requirement.

**References**: https://react-icons.github.io/react-icons/, https://github.com/react-icons/react-icons/blob/master/packages/react-icons/package.json, and https://hono.dev/docs/guides/jsx

## 3. Screen Composition and Progressive Enhancement

**Decision**: Preserve complete Hono JSX initial HTML. Use the existing client script only for prompt disclosure, global deadline toggling, Answer-body fetching, and duplicate-operation prevention. Centralize shared HTML in `SiteLayout`.

**Rationale**: Questions, counts, states, lists, and forms remain readable without JavaScript; client code only enhances state.

**Alternatives Considered**: An SPA broadly changes authentication and SSR boundaries; per-screen document shells fragment quality and asset references.

## 4. Home and Question-List Retrieval

**Decision**: Add repository projections for five Open and ten Revealed Home items and 20-item state pages with items, total, current page, and page count. Order Open by `closesAt ASC, id ASC` and Results by `revealsAt DESC, id DESC`.

**Rationale**: Persistence-layer limits and order avoid fetching all records and keep deterministic results without projecting Answer content or respondents.

**Alternatives Considered**: Client-side slicing leaks data responsibility; infinite scrolling is worse for demo timing, keyboard navigation, and position clarity.

## 5. Authentication-Specific Home Prompts

**Decision**: Safely read authentication and batch-fetch current-user Answer presence only for five displayed items. On authentication or status failure, hide prompts but keep public lists. User-specific Home uses `private, no-store` and `Vary: Cookie`.

**Rationale**: A prompt requires confirmed unanswered state; treating failure as unanswered creates an incorrect submission path.

**Alternatives Considered**: Showing prompts to everyone violates authorization; per-Question retrieval adds five sequential queries.

### Current-User Answer State

**Decision**: Batch-project answered Question IDs for Home/lists and reuse the minimal current-user Answer projection on Detail. Show green `Answered` only when answered; show no answer-state tag for unanswered, signed-out, or failed determination.

**Rationale**: This prevents duplicate requests while keeping simple, accurate presentation.

## 6. Comparing Revealed Answers

**Decision**: SSR returns only sequence, ID, and excerpt in initial-submission order. Fetch each selected body through the existing authenticated detail route, cache it within its item, and permit multiple independent expanded/loading/error states.

**Rationale**: This preserves SPEC 008 lazy exposure while enabling side-by-side vertical comparison.

**Alternatives Considered**: Bulk bodies regress minimal exposure; a single-open accordion fails the comparison criterion.

### Own Answer Before and After Reveal

**Decision**: In `OPEN`/`CLOSED`, show only the existing current-user Answer projection. In `REVEALED`, compare the session user and respondent server-side, pass only `isOwn`, and show green `Your answer`.

**Rationale**: Users can review their submission before Reveal and find it afterward without exposing user IDs.

## 7. Duplicate Creation and Publication Prevention

**Decision**: Disable a form after its first submit and use a unique per-form creation token as Question ID. Replay returns the existing result; receive `draft` or `publish` intent in one request and implement publication as one conditional creation.

**Rationale**: UI-only disabling cannot prevent replays or multiple tabs. Storage uniqueness guarantees at most one record and avoids unintended Drafts from two-step publication.

**Alternatives Considered**: UI-only guarding is insufficient; deduplicating by body/deadline prevents intentional reuse.

## 8. Owner Question Deletion

**Decision**: Add owner-conditional deletion to Question Repository, batching `QUESTION_DELETED` audit insertion and deletion, with existing Answer cascade. My Questions Cards show body, state, and count; the deletion area contains only irreversible-confirmation checkbox and button.

**Rationale**: Storage-level ownership does not rely on hidden UI. Audit survives because it has no Question foreign key; the string action needs no schema change.

**Alternatives Considered**: Admin Repository mixes authorization responsibilities; soft deletion expands every read and state rule.

## 9. Default Answer Deadline

**Decision**: Set `datetime-local` to the first local midnight at least one hour ahead—normally tomorrow, otherwise the following day—while preserving server validation of one hour through 30 days.

**Rationale**: This honors the user's time zone and required midnight helper while browser date handling resolves daylight saving.

**Alternatives Considered**: Now plus 24 hours is not midnight; server time cannot determine the user's local date.

## 10. Visual Quality and Accessibility

**Decision**: Centralize rules in shared layout, Cards, and controls; define warm paper, brown-black ink, orange, and amber through Tailwind theme variables. Communicate meaningful states with color, icon, and English label; provide reduced motion, visible focus, and 4.5:1 or 3:1 contrast targets.

**Rationale**: Meaning never depends on color alone and screens remain consistent without adding a visual-regression framework.

**Alternatives Considered**: Per-screen styling harms consistency; continuous animation impairs reading and reduced-motion preferences.

## 11. Anonymous Authenticated Participants

**Decision**: Explain that all Results contain one Answer per signed-in account. Show `Authenticated participant` and a symmetric anonymous icon generated from Question and Answer IDs, never user ID, without persistence.

**Rationale**: This communicates authenticated origin without exposing Google data or enabling cross-Question tracking. Answer ID is already required within the Question for body retrieval, so no new public identifier is added; existing uniqueness guarantees one Answer per account.

**Safety Boundary**: Hide the decorative icon from assistive technology and convey meaning in text. Generate palettes/patterns with a deterministic pure function and fixed candidates, never injected SVG/style/HTML. Preserve account linkage only behind administration authorization. Public nicknames require explicit consent and are excluded.

**Alternatives Considered**: Google identity enables identification; user-ID/email hashes enable tracking; one generic icon makes Answers hard to distinguish within a Question.
