# Human-Facing Answer HTTP/SSR Contract

## Common Headers

Success and failure responses depending on authentication or Answer content return:

```text
Cache-Control: private, no-store
Vary: Cookie
```

External errors contain no Answer, Session, Cookie, User, or internal exception.

## `GET /questions/:questionId`

- Requires a valid Session and a published Question.
- `OPEN`/`CLOSED`: return Question, deadline, state, answer count, and own Answer. Include no other-User data in HTML body, attributes, scripts, or embedded JSON.
- `REVEALED`: return answer count and stable-order `{ id, excerpt }` entries for every Answer. Include no body, submitter, or individual timestamp in initial HTML.
- Render Answers as escaped text; never execute them.

## `GET /api/questions/:questionId/my-submission`

- Requires a valid Session and published Question.
- In `OPEN`, `CLOSED`, and `REVEALED`, return the current User's `not_submitted` or `submitted` view.
- Do not change the response shape based on another User's submission existence, answer count, ID, content, or time.

## `GET /api/questions/:questionId/answers/:answerId`

Return `200` and exactly one selected `{ "id": "...", "body": "..." }` only when all of these hold: valid Session, `REVEALED`, and the Answer belongs to the Question.

Unauthenticated, `DRAFT`, `OPEN`, `CLOSED`, missing Answer, and an Answer belonging to another Question all return the same result:

```http
404
{"code":"ANSWER_UNAVAILABLE","message":"The requested answer is unavailable."}
```

HEAD, unsupported methods, and invalid parameters also return no Answer content and create no alternate enumeration path.
