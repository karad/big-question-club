# Technical Research: WebMCP MVP Tools

## Decision 1: Limit the Production Agent Surface to Five Tools

- **Decision**: Register only `get_question`, `submit_answer`, `update_answer`, `remove_answer`, and `get_my_submission` in production WebMCP. Remove the P0 validation Question tool and `who_am_i` from production registration. Give each tool its own name, English description, strict input schema, state-change annotation, and execution function.
- **Rationale**: Chrome's Imperative API uses tool name, description, and input schema as the primary Agent contract. A smaller exposed capability surface reduces mistaken tool selection and unintended token use. Omitting Question list/search tools also prevents Agents from exploring what to answer.
- **Alternatives Considered**: Keeping P0 validation tools alongside production tools was rejected because overlapping purposes make Agent selection ambiguous. One generic `manage_answer` tool was rejected because confirmation intent and schemas would be unclear for each operation.
- **Reference**: [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## Decision 2: Express Output Trust Boundaries with Annotations and Fixed Descriptions

- **Decision**: Set `readOnlyHint: true` for `get_question` and `get_my_submission`, and `false` for the three write tools. Set `untrustedContentHint: true` for read tools returning Question body or the current User's Answer, and `false` for body-free write results. Return Question body separately from fixed instructions. Descriptions include no Question discovery, no Private Context disclosure, and update/delete only on explicit Human request.
- **Rationale**: Chrome's security guide recommends `untrustedContentHint` for tools returning user-generated content and `readOnlyHint` for tools that do not change state. Safety cannot depend on descriptions alone; combine annotations with server authentication, owner-only repositories, and private DTOs.
- **Alternatives Considered**: Marking every tool untrusted was rejected because it weakens distinction by treating state-only success results the same. Omitting annotations was rejected because the Agent could not easily judge confirmation needs or untrusted data.
- **Reference**: [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

## Decision 3: Have Tools Call Dedicated Same-Origin HTTP Contracts

- **Decision**: Each tool fetches only same-origin relative URLs and never inputs or outputs Cookies or Tokens. Align `get_question` and `get_my_submission` with existing GET routes; add `PUT` and `DELETE` on the current User's Answer path for `update_answer` and `remove_answer`. Return `Cache-Control: no-store` everywhere and pass AbortSignal to `fetch`.
- **Rationale**: This naturally uses the existing authenticated browser Session and lets integration tests cover the same contract at both tool and HTTP layers. Forwarding AbortSignal follows Chrome's official pattern and avoids unnecessary continuation after cancellation.
- **Alternatives Considered**: Direct repository calls from tool functions were rejected because browser code cannot access D1 and HTTP verification would split. Tool-argument credentials were rejected because they duplicate Session authentication and expand leakage risk.
- **Reference**: [Chrome WebMCP Imperative API - cancellation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## Decision 4: Commit Answer Updates and Deletions with Conditional Single Statements

- **Decision**: Repository updates use one `UPDATE` statement conditioned on the Answer's `question_id`, Session-derived `user_id`, published Question, and `now < closes_at`. Deletion uses one `DELETE` with the same conditions. Only `meta.changes === 1` is success. Bind every dynamic value in prepared statements.
- **Rationale**: A read-then-write sequence allows deadline or deletion races between steps. A single conditional write enforces owner, acceptance period, and target existence together at commit time. D1 returns affected-row counts and officially recommends prepared-statement binding.
- **Alternatives Considered**: Read plus unconditional write was rejected because of TOCTOU races. Per-User locks were rejected as excessive for the Workers/D1 MVP.
- **Reference**: [Cloudflare D1 Prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)

## Decision 5: Use Hard Delete and Permit Resubmission Before the Deadline

- **Decision**: `remove_answer` deletes the current User's Answer row, and `get_my_submission` immediately returns `not_submitted`. While `OPEN`, the User may call `submit_answer` again; `UNIQUE(question_id, user_id)` preserves at most one Answer at a time. Reject update, deletion, and resubmission after the deadline.
- **Rationale**: A Human can withdraw a mistaken or unwanted public Answer before the deadline and intuitively participate again. Audit logs are out of scope; tombstones would add state, retention, and answer-count semantics.
- **Alternatives Considered**: Permanent resubmission bans via tombstones conflict with the correction goal. Soft delete was rejected because it requires additional Reveal-count, personal-state, and retention policy.

## Decision 6: Add Answer Update Time and Unify Grapheme Limits in the Domain Contract

- **Decision**: Add `answers.updated_at` in a differential migration and initialize existing rows from `created_at`. When rebuilding Answers, remove SQL code-point upper-limit checks while retaining whitespace-only, excerpt-newline, uniqueness, and referential constraints. Enforce display-character limits of 1–5,000 and 1–160 for both submit and update with a shared `Intl.Segmenter` domain function.
- **Rationale**: SQLite `length()` does not count grapheme clusters and disagrees with displayed characters for emoji and combining sequences. Reusing SPEC 006's `Intl.Segmenter` rule aligns UI and tool contracts. Persisted update time lets `get_my_submission` and race verification track the latest change.
- **Alternatives Considered**: Keeping only `created_at` was rejected because update time could not be retrieved. Treating SQL `length()` as display length was rejected because Unicode boundary cases would violate the specification.

## Decision 7: Server-Generate an Environment-Aware One-Line Prompt with Progressive Clipboard Support

- **Decision**: A pure function inserts only an absolute URL derived from the current request Origin and Question path into a finalized one-line English template directing ChatGPT's built-in browser—not an existing Chrome tab—to open the page, answer from relevant Personal Context, and submit via WebMCP. Exclude query, fragment, and Question body. Keep tool names, call order, evidence, and safety details in runtime tool descriptions, schemas, annotations, and returned data. Tool instructions prioritize explicit/repeated User statements over Assistant suggestions, options, or assumptions. With no explicit view, create and submit a best-effort proxy without asserting unsupported facts or known beliefs or asking solely because the view is missing. The initial prompt authorizes submission without extra preview or approval. SSR shows selectable read-only text and `Copy prompt` only for an authenticated, not-submitted User while `OPEN`. On click, call `navigator.clipboard.writeText()` and announce `Copied` or an English failure status, always preserving manual-copy text.
- **Rationale**: The URL identifies the page even when the Agent has not opened it, and a dynamic Origin works locally and in production. Keeping the Human's instruction short and moving details to runtime contracts avoids duplication. Server generation keeps display and copied text identical and prevents Question-body prompt injection. Clipboard `writeText()` returns a Promise and requires a secure context, so invoke it from User action and retain manual fallback.
- **Alternatives Considered**: Question ID alone was rejected because the Agent might not have the page/tool context. Listing tool and safety instructions in the prompt was rejected as duplicate length. Embedding Question body was rejected for duplication and injection risk. Hiding text behind copy-only UI was rejected because denial would make it unusable.
- **References**: [MDN Clipboard.writeText](https://developer.mozilla.org/docs/Web/API/Clipboard/writeText), [MDN Clipboard API security](https://developer.mozilla.org/docs/Web/API/Clipboard_API)

## Decision 8: Split Automated Tests from Real-Browser WebMCP Verification

- **Decision**: Cover domain grapheme boundaries, prompt generation, error classification, and tool schemas with unit tests; D1 migration, conditional update/delete, and concurrency with Workers D1 integration tests; and HTTP authentication, DTOs, SSR display, and non-exposure with Hono integration tests. Verify actual Personal Agent tool selection, Clipboard, and five-tool E2E through the quickstart.
- **Rationale**: Vitest alone cannot guarantee external Agent interpretation or a real browser Session. Conversely, manual-only checks cannot isolate regressions in owner conditions and deadline races.
- **Alternatives Considered**: All-manual E2E was rejected for poor reproducibility. Automated-only WebMCP acceptance was rejected because it cannot verify real Agent tool interpretation.
