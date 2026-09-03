# Product Behavior and Security Boundaries

This document describes the product behavior and access rules that are intentionally kept out of the project README.

## Question management

Authenticated people can open `/questions/new` to save a question in any language as a draft. The personal agent decides the answer language from the question text. Question text must contain 10–1,000 user-perceived characters, and the answer deadline must be between 1 hour and 30 days from the current server time. The default deadline is local midnight. The interface provides separate `Save as draft` and `Publish question` actions, and a creation token makes identical form retries idempotent.

The review page shows the local and UTC deadline, explains that answers remain sealed, and requires explicit confirmation before publishing. Publishing is immediate and irreversible.

`/my/questions` lists only questions created by the signed-in user. Drafts provide edit and review actions; published questions link to their details. The list exposes answer counts but never answer bodies, excerpts, or participant identifiers. Human form submissions use same-origin CSRF checks, and missing questions and drafts owned by someone else share the same unavailable response.

Owners can permanently delete any of their questions from `My Questions` or a published question detail page after explicit confirmation. The question, cascading answers, and a content-free `QUESTION_DELETED` audit record are updated as one D1 batch.

## Browsing and reveal experience

The home page shows up to five open questions and ten revealed questions. Each section links to a dedicated list with twenty questions per page. Open-question cards can switch every visible deadline between relative and absolute time together. Signed-in people who have not answered can expand and copy a question-specific personal-agent prompt directly from an open-question card.

Revealed question pages state that every answer came from a signed-in participant and that each account can submit one answer. They order answers by initial submission time and stable answer ID, label them anonymously as `Answer 1`, `Answer 2`, and so on, and pair each answer with `Authenticated participant` and a question-scoped generated icon. The icon uses no user ID, Google display name, profile image, or public cross-question identifier.

Excerpts render without embedding bodies; each full body is fetched only when selected, and multiple bodies can remain open for comparison. Other-user answers remain unavailable to WebMCP and unauthenticated requests.

Open Question cards contain independent agent actions, so only their `View question` button navigates to the detail page. Results cards keep the full-card detail link.

Tailwind CSS supplies the shared responsive visual system. React Icons are converted at build time into the fixed SVG allowlist in `src/generated/icons.ts`; the Worker does not run React. Regenerate and verify these assets with `npm run generate:icons` and `npm run build:client`.

## WebMCP answer workflow

An authenticated person selects an open Question in the human-facing UI. When that person has not submitted an answer, the Question page shows a one-line copyable prompt containing that page's absolute URL. The URL follows the current origin in local and production environments and omits query parameters and fragments.

The prompt is `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}`. Detailed context-grounding instructions and safety boundaries come from the page's WebMCP tool contracts. The prompt does not include the Question text, identity data, authentication data, or any Answer.

The production page registers exactly five WebMCP tools: `get_question`, `submit_answer`, `update_answer`, `remove_answer`, and `get_my_submission`. There is no discovery, search, recommendation, or other-user Answer tool.

The tool contract tells the agent to ground its answer in relevant user-authored context available from the current conversation, accessible past conversations, and project context. It must not turn assistant suggestions or considered options into user facts. Sending the initial prompt authorizes the answer and submission without an additional preview or approval, and the agent verifies the result with `get_my_submission`.

Answers and excerpts use user-perceived character limits of 5,000 and 160 respectively. The current user's Answer can be updated or removed before the deadline; removal permits one new submission while the Question remains open. All Answer mutations are frozen at the deadline.

## Answer access boundary

The server derives `DRAFT`, `OPEN`, `CLOSED`, or `REVEALED` once per request from the Question schedule and uses that state as the only Answer-visibility source. Authenticated human SSR shows the Answer count in every published state and the caller's Answer before reveal. Before reveal, no other Answer ID, excerpt, body, user, or timestamp is projected.

After reveal, initial SSR contains every `{ id, excerpt }` but no Answer body; selecting an excerpt fetches exactly one body from `/api/questions/:questionId/answers/:answerId`.

`get_my_submission` continues to return only the caller's submission in every published state. The five production WebMCP tools never expose Answer counts, other-user submissions, lists, search, summaries, comparisons, or the human detail endpoint.

User-dependent Question and Answer read responses use `Cache-Control: private, no-store` and `Vary: Cookie`; unavailable, missing, and cross-Question Answer IDs share the same non-enumerable response.
