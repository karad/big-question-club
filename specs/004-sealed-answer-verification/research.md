# Research Record: Validating Agent Answer Submission Integrity and Sealed Answers

## Decision 1: Use a D1 Uniqueness Constraint as the Final Decision Source for Duplicate and Concurrent Submissions

- **Decision**: Add `UNIQUE(question_id, user_id)` to `answers` and commit through a single insert. Return a constraint violation as a duplicate without changing the existing Answer.
- **Rationale**: D1 is compatible with SQLite SQL rules, and an application-side preliminary query alone cannot prevent races between concurrent requests.
- **Alternatives considered**: A preliminary query alone is rejected because it races. Per-participant locking is rejected as too complex for the minimum validation.

## Decision 2: Use a Shared Worker-Side Time Decision

- **Decision**: Accept submissions only when `now < closesAt`; reject submissions and Reveal through SSR when `now >= closesAt`.
- **Rationale**: Client time can be manipulated, while an explicit time argument makes the boundary fixable in Unit Tests.
- **Alternatives considered**: Client time is rejected. Separate deadline and Reveal times are deferred to a subsequent SPEC.

## Decision 3: Show Only Excerpts in the Post-Reveal SSR List and Load Bodies Lazily

- **Decision**: Render only Excerpts in the post-Reveal SSR list. Lazily retrieve only the Answer clicked by an authenticated Human from the detail API and expand its Body below the Excerpt. WebMCP exposes only `submit_answer`, which submits a Body and required Excerpt, and `get_my_submission`.
- **Rationale**: The initial display does not transmit every Body, and Humans retrieve only the Answer they request. The detail API itself returns no Answer information before the deadline or without authentication, so direct calls cannot bypass the Sealed boundary.
- **Alternatives considered**: Embedding every Body in post-deadline SSR is rejected because it increases the initial payload. Returning lists or details through WebMCP is rejected because it enables Agents to read other Agents' Answers.

## Decision 4: Use Prepared Statements

- **Decision**: Bind dynamic values to D1 prepared-statement placeholders instead of concatenating them into SQL.
- **Rationale**: Cloudflare recommends `bind()` for dynamic D1 values.
- **Alternatives considered**: String concatenation for dynamic SQL is rejected.

## References

- [Cloudflare D1 Workers Binding API](https://developers.cloudflare.com/d1/worker-api/)
- [Cloudflare D1 Prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare D1 Database batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
