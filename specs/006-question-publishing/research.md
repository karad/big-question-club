# Technical Research: Question Creation and Publication Flow

## 1. Human-Facing Creation Flow

**Decision**: Keep the existing Hono JSX SSR approach. Implement creation, editing, and publication with same-origin HTML forms and Post/Redirect/Get after success. Add neither a management JSON API nor a new client framework.

**Rationale**: The existing application uses one Hono Worker with JSX, and the MVP's six flows can be completed with SSR forms. Hono's `parseBody()` reads form values, letting the same route boundary handle authentication and errors for screens and direct operations. Redirecting after success prevents duplicate submission on reload.

**Alternatives Considered**:

- SPA and management JSON API: rejected because they expand state synchronization and exposure without adding value to this specification.
- Server-rendered HTML strings: rejected in favor of existing JSX to avoid escaping omissions and duplicate screens.
- Creation through a WebMCP tool: rejected because the specification permits only Humans to create Questions.

**References**: [Hono JSX](https://hono.dev/docs/guides/jsx), [Hono Request `parseBody()`](https://hono.dev/docs/api/request)

## 2. Display-Character Count for Question Bodies

**Decision**: After `trim()`, segment the body with `Intl.Segmenter` using `granularity: "grapheme"`, treating each grapheme cluster as one user-perceived character and enforcing 10–1,000 characters. A shared domain function returns the normalized body and count or field-specific errors.

**Rationale**: JavaScript `length` counts UTF-16 code units and does not match displayed characters for emoji, combining characters, or flags. `Intl.Segmenter` handles graphemes through a standard API, and Cloudflare Workers provides `Intl`. Server validation is authoritative; the client counter is only a display aid using the same rule.

**Alternatives Considered**:

- `string.length`: rejected because it disagrees with the character count Users see.
- `[...text].length`: rejected because code points still split combining characters and compound emoji.
- Add a Unicode-processing library: rejected because the standard API is sufficient.

**References**: [MDN `Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter), [Web standards in Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)

## 3. Deadline Input and Time Zones

**Decision**: Use `datetime-local` in the screen. A client helper converts the browser-local date/time to UTC Unix milliseconds in a hidden field and displays/submits both the IANA time-zone name from `Intl.DateTimeFormat().resolvedOptions().timeZone` and a UTC ISO representation. The server uses only absolute time for persistence and revalidates that it is from one hour through thirty days after service-side `now`.

**Rationale**: A `datetime-local` value contains no time zone, so server-side interpretation of the string would depend on the environment. Converting explicitly in the User's browser and showing local time, time zone, and UTC makes the mapping reviewable. Client min/max values and the client clock can be tampered with, so server validation remains mandatory.

**Alternatives Considered**:

- Convert the `datetime-local` string to `Date` in the Worker: rejected because it would use the Worker's time zone rather than the User's.
- Require Users to enter UTC: rejected because it is error-prone and does not satisfy local-time confirmation.
- Add a date-time library or Temporal polyfill: rejected as excessive for immediate-deadline input in this specification.

**References**: [MDN `datetime-local`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local), [MDN HTML date and time formats](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats)

## 4. CSRF Boundary for Forms

**Decision**: Apply Hono's built-in CSRF middleware to unsafe Question-management methods, using its default same-origin `Origin`/`Sec-Fetch-Site` checks. Limit it to Question-management form paths rather than expanding it to Better Auth routes or existing WebMCP/Answer JSON APIs.

**Rationale**: Human-facing POST requests using cookie Sessions must reject forms sent from third-party sites. Hono's built-in middleware validates Origin and Fetch Metadata for unsafe methods and content types that HTML forms can submit, without adding a dependency.

**Alternatives Considered**:

- Depend only on SameSite cookies: rejected because cookie configuration should not be the sole defense for Question changes.
- Custom CSRF tokens: rejected because built-in checks satisfy the same-origin-form requirement without token storage and rotation.
- Apply it uniformly to the entire app: rejected because that could unintentionally change existing Better Auth and JSON tool contracts.

**Reference**: [Hono CSRF Protection](https://hono.dev/docs/middleware/builtin/csrf)

## 5. Draft-Edit and Publication Conflicts

**Decision**: Use optimistic concurrency for draft edits with a single update conditioned on `id + creatorUserId + publishedAt IS NULL + updatedAt`. Publish with a single update conditioned on `id + creatorUserId + publishedAt IS NULL + closesAt >= now + 1 hour + revealsAt = closesAt`, setting the publication time. Only when zero rows change, retrieve the owner's latest state and classify the external outcome.

**Rationale**: An unconditional update after a read could overwrite a Question published during review with an old draft. A single conditional update relies on D1 statement atomicity to preserve post-publication immutability and exactly-once publication. Existing `updatedAt` detects edit conflicts without a migration.

**Alternatives Considered**:

- Last write wins: rejected because it could overwrite published content.
- An in-Worker mutex: rejected because it is not shared by multiple instances.
- A new revision column: rejected because `updatedAt` already serves the purpose.

**Reference**: [Cloudflare D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

## 6. Ownership Boundary and Non-Enumerating Errors

**Decision**: Management screens use `QuestionRepository.getOwnedQuestion(id, userId)` as their only retrieval entry point. It classifies both another User's Question and a nonexistent Question as `null`. Screens, editing, and publication return the same English `Question unavailable.` message and 404. Internal repository results may remain diagnostically distinct, but external responses combine them.

**Rationale**: Retrieving with generic `getQuestion(id)` and then returning an authorization error allows inference that a draft exists. Including the owner in the query condition maintains the non-enumeration contract without exposing another User's content to the route.

**Alternatives Considered**:

- Distinguish 403 from 404: rejected because it reveals existence.
- Hide links only in the UI: rejected because it does not prevent direct POST requests.
- Retrieve all Questions and filter in the application: rejected because it moves unnecessary third-party data outside the boundary.

## 7. My Questions Aggregation

**Decision**: Left-join Questions to Answers, filter by the current User's `creatorUserId`, aggregate answer counts per Question, and order stably by `createdAt DESC`, then `id DESC`. Return only the Question and `answerCount`, excluding Answer bodies, excerpts, and submitter IDs.

**Rationale**: Counting each item after listing creates N+1 queries. One aggregate query fixes the owner boundary and minimum required information together, allowing answer counts regardless of reveal state.

**Alternatives Considered**:

- Count each Question after retrieval: rejected because query count scales with list size.
- Retrieve Answers and count in the application: rejected because it unnecessarily reads private data.
- Store an answer-count column: rejected because it duplicates state already represented by Answers.

## 8. Test Boundaries

**Decision**: Test grapheme counts, deadlines, and form-value parsing with Node unit tests; SSR rendering, field errors, authentication, CSRF, and redirects with Hono integration tests; and owner-scoped retrieval, optimistic editing, atomic publication, and aggregate listing with isolated-D1 integration tests. After all automated tests pass, use the quickstart to manually verify keyboard flow and two-User behavior.

**Rationale**: This covers pure-logic boundaries quickly, verifies D1-only conditional-update and aggregation behavior without mocks, and limits manual checks to the final screen flow. It also matches the project's testing policy.

**Alternatives Considered**:

- Make everything browser E2E: rejected because failures are difficult to isolate and repetition is expensive.
- Verify conflicts only with repository mocks: rejected because that cannot guarantee D1 statement conditions or aggregation contracts.
- Use only manual verification: rejected because it cannot repeatably cover at least thirty input boundaries and twenty authorization cases.
