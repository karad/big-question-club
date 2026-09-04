# Screen Contract: Question Lists and Answer Reveal

## Shared Responses

- Human-facing HTML uses `lang="en"` and English text.
- Every screen loads `/styles.css` in `head` and `/client.js` as a module.
- Escape Question bodies, Answer excerpts, and Answer bodies as strings.
- Responses varying by authentication or current-user Answer state return `Cache-Control: private, no-store` and `Vary: Cookie`.
- Use one `now` value for state, filtering, and remaining-time decisions within a response.

## `GET /`

Returns Home.

### Success

- Status `200`.
- `Open questions`: at most five `OPEN` Questions ordered by deadline ascending.
- `Results`: at most ten `REVEALED` Questions ordered by reveal time descending.
- Both sections link to their complete lists.
- Each Open item shows body, count, remaining time or deadline, sealed icon, and `View question`. Only that button navigates; the Card surface is not a link.
- For authenticated users, only Cards the current user answered show a green `Answered` beside the sealed/revealed tag. Show no answer-state tag when unanswered, signed out, or indeterminate.
- Only authenticated, confirmed-unanswered Open items show a collapsed prompt-disclosure control.
- Each Result shows body, count, revealed state, and Detail link, with the whole Card as its link surface.

### Empty State

- Keep one section visible if the other is empty. Show `No open questions right now.` for no Open Questions and `No results yet.` for no Results.

### Failure

- A failed section shows safe retry text and does not invent unfetched content.
- If only authentication or current-user state fails, show public lists but no prompt.

## `GET /questions/open?page={page}`

- Status `200`; at most 20 per page; order `closesAt ASC, id ASC`.
- Item exposure and prompt conditions match Home.
- Show available `Previous`, `Next`, and `Page {current} of {total}`.
- Omitted `page` means 1. Invalid or out-of-range values show a safe empty state and `Back to page 1`, never `500`.

## `GET /questions/revealed?page={page}`

- Status `200`; at most 20; order `revealsAt DESC, id DESC`.
- Items show only body, count, revealed state, and Detail link, never excerpts or bodies.
- Pagination matches the Open list.

## Deadline Display Toggle

- Visible absolute dates use `YYYY-MM-DD HH:mm`; `time[datetime]` remains ISO 8601.
- Initial presentation is remaining time. `[data-deadline-toggle]` changes every item within the same `[data-question-list-scope]` to absolute deadlines and back.
- Communicate state with `aria-pressed` and English labels. Absolute deadlines remain assistive-technology-accessible without JavaScript.

## Prompt Disclosure and Copy

- Hide prompt text initially. `[data-agent-request-toggle]` names the target through `aria-expanded` and `aria-controls`.
- The expanded region contains selectable full text and `Copy prompt`; disclosure for one Question does not affect another.
- Announce `Copied` or `Copy failed. Select the prompt and copy it manually.` near the operation.

## `GET /questions/:questionId`

### `OPEN` or `CLOSED`

- Show sealing with a lock, state color, and accessible name `Answers are sealed`.
- Include no other-user excerpt, body, ID, author, or timestamp.
- For authenticated users, show green `Answered` beside the sealed tag only when the current user answered.
- An answered user sees only their own excerpt and body. In unanswered, signed-out, or indeterminate states, show no answer-state tag and preserve safe guidance.

### `REVEALED`

- Signed out: show Question information and `Sign in to view results.`, with no Answer information.
- Authenticated: show reveal icon, total count, and excerpts numbered from `Answer 1`.
- Precede the list with `All answers were submitted by signed-in participants. One answer per account.`
- Each Answer shows a per-Question anonymous icon derived from Question and Answer IDs and `Authenticated participant`.
- Only the session user's Answer shows green `Your answer`. Determine ownership server-side and pass only `isOwn`, never respondent user ID, to SSR.
- The icon is stable for the same Question/Answer but uses no user ID, Google name/image, or raw hash and adds no cross-Question tracking value.
- Administration retains account linkage; add no public nickname.
- Order by initial submission time ascending, then Answer ID ascending. Show `No answers were submitted.` for zero.
- Include no Answer body in initial HTML.

## `GET /api/questions/:questionId/answers/:answerId`

Preserves the existing authenticated Answer-detail route.

### Success

- Requires an authenticated human, published `REVEALED` Question, and Answer belonging to it.
- Status `200`; `Cache-Control: private, no-store`; `Vary: Cookie`.

```json
{
  "id": "answer-id",
  "body": "Full answer text"
}
```

### Rejection

- Signed out, unpublished, `OPEN`, `CLOSED`, wrong-Question, and missing cases all return the existing safe `404 ANSWER_UNAVAILABLE`, without distinguishing existence or membership.

## Answer-Body Expansion

- On first selection, show loading on that button and render the body within that item on success.
- Reopening a fetched body does not refetch. Multiple bodies may remain open; closing retains it only in page memory.
- Failure shows `Answer could not be loaded. Try again.` and retry only in that item without changing others.

## Icons and Visual States

- Use only generated fixed SVGs derived from React Icons through the shared component.
- Meaningful icons have English accessible names; redundant decorative icons use `aria-hidden="true"`.
- Sealed/revealed state, counts, dates, copy, navigation, and deletion never rely on icons alone.
- Disable decorative transitions under reduced motion.

## Non-Exposure Regression

- Other-user secrets occur zero times in human HTML for `OPEN`/`CLOSED`, every signed-out response, and every WebMCP response.
- Answer-body secrets occur zero times in initial `REVEALED` HTML.
- Google names/images, user IDs, raw hashes, and cross-Question respondent identifiers occur zero times in initial `REVEALED` HTML.
- Do not change WebMCP tool count or non-exposure behavior or add other-user counts, excerpts, bodies, or IDs. The `get_question` and `submit_answer` contracts direct the Agent, even without an explicit personal view, to create and submit the best proxy answer without asserting unverified facts and without asking solely due to that absence.
