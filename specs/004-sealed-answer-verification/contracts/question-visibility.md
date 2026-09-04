# Contract for Question Detail and Sealed Answers Visibility

## `GET /questions/:questionId` (Human-Facing SSR)

| Condition | Information Shown | Prohibited From Display |
| --- | --- | --- |
| Before deadline, no submission | Question, Answer count, deadline, `Answers are sealed`, and not-submitted status | Every Answer Body, Excerpt, extract, and summary |
| Before deadline, participant submitted | Above plus the participant's own Answer Body and Excerpt | Other participants' Answer Bodies, Excerpts, extracts, and summaries |
| After deadline, authenticated Human | Question, Answer count, deadline, and every Answer Excerpt. Expand only a clicked Answer's Body below its Excerpt | Authentication information and Bodies of unclicked Answers |
| After deadline, zero Answers | Question, Answer count 0, and empty state | Fabricated Answers |

SSR loads `/client.js` and calls the same-Origin Answer detail API only when a post-Reveal Excerpt button is clicked. The initial HTML does not embed Answer Bodies.

## `GET /api/questions/:questionId`

Return only the Question Body, Answer count, deadline, and the participant's submission status. Even after the deadline, do not return another participant's Answer Body, Excerpt, extract, summary, or Answer identifier.

```json
{ "id": "question_opaque_id", "question": "Question text.", "answerCount": 2, "closesAt": "2026-09-02T00:00:00.000Z", "mySubmissionStatus": "submitted" }
```

Except for the post-Reveal Answer detail API below, do not add an HTTP API or WebMCP Tool that returns another participant's Answer individually, as a list, as an Excerpt, as an extract or summary, or through search.

## `GET /api/questions/:questionId/answers/:answerId`

Retrieve only the Body of an Answer clicked by an authenticated Human after Reveal. The same-Origin SSR screen invokes this endpoint, but direct HTTP calls must apply the same authorization and time checks.

Success (`200 OK`):

```json
{ "id": "answer_opaque_id", "body": "The selected public answer body." }
```

Before the deadline or when unauthenticated, return only `404 ANSWER_UNAVAILABLE`. Do not return an Answer Body, Excerpt, extract, summary, or clue to existence. After the deadline, return only the single requested item to an authenticated Human; do not allow lists, search, or retrieval of multiple Answers. WebMCP must not invoke this route.

## Validation Matrix

| Actor | Pre-Deadline SSR | Pre-Deadline HTTP | Pre-Deadline WebMCP | Post-Deadline SSR | Post-Deadline HTTP | Post-Deadline WebMCP |
| --- | --- | --- | --- | --- | --- | --- |
| Unauthenticated participant | No Body | No Body | Unavailable | No Body | No Body | Unavailable |
| Submitting participant | Own only | Own status only | Own status only | All Answers | Own status only | Own status only |
| Another authenticated Human | No Body | No Body | Own status only | All Answers | No Body | Own status only |
| Personal Agent | N/A | N/A | Own status only | N/A | N/A | Own status only |
