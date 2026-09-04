# Screen and Operation Contract: Question Creation and Owner Deletion

## `GET /questions/new`

Returns the new-Question form to an authenticated user.

- The server issues a unique UUID as `creationToken` in a hidden input.
- Show the body, answer deadline, and public-content acknowledgment.
- After browser initialization, set the deadline to the first local midnight at least one hour in the future.
- Show `Save as draft` and `Publish question` as primary actions in one form.
- Signed-out users receive the existing authentication-required screen.

## `POST /questions`

Saves a draft or publishes immediately.

### Input

```text
creationToken: UUID
intent: draft | publish
body: string
closesAtLocal: string
closesAt: Unix milliseconds string
timeZone: IANA time-zone string
contentAcknowledged: on
```

### Shared Validation

- `creationToken` is a UUID; `intent` is only `draft` or `publish`.
- Body, deadline, time zone, and acknowledgment satisfy existing input rules.
- Obtain the authenticated user from the session, never input.

### `intent = draft`

- Create one `DRAFT` and redirect with `303` to the existing confirmation screen.
- An identical replay by the same user and token creates no second record and redirects to the existing confirmation.

### `intent = publish`

- Create one record with `publishedAt` equal to creation time and redirect with `303` to public Detail.
- Do not insert draft confirmation or another publication confirmation.
- An identical replay by the same user and token creates no second record and redirects to existing public Detail.

### Conflicts and Invalid Input

- Reuse of a token by another owner, payload, or intent returns a safe `409` without exposing the existing Question or owner.
- Invalid input returns the same form with `400`, preserved values, English field errors, and the original token.
- Storage failure returns `503` without claiming success.

## Duplicate-Submission Prevention

- Every mutating form with `data-submission-guard` disables submission immediately after the first browser-valid submit.
- Persist the clicked button's intent to a hidden input before disabling it.
- Show operation-specific text such as `Saving draft…`, `Publishing…`, or `Deleting…`.
- Server uniqueness, ownership, and state conditions apply independently of UI controls.

## Owner-Deletion Presentation

- Show deletion on every My Questions state and authenticated-owner public Detail.
- The My Questions Card shows body, current state, and answer count.
- The deletion area shows only the `I understand this cannot be undone.` checkbox, `Delete permanently` button, and necessary status; do not repeat Card content or developer notes.
- Send `expectedUpdatedAt` and `confirmDeletion=on`; show nothing to non-owners.

## `POST /questions/:questionId/delete`

Deletes an authenticated owner's Question.

### Input

```text
expectedUpdatedAt: safe integer string
confirmDeletion: on
```

### Success

- In the same mutation, confirm the session user matches stored `creatorUserId` and `expectedUpdatedAt` matches.
- Append `QUESTION_DELETED` and delete the Question in one D1 batch; cascade child Answers.
- Redirect with `303` to `/my/questions` and show `Question deleted.`.

### Rejection

- No confirmation: `400`; version conflict: `409`; missing/non-owner: indistinguishable `404 Question unavailable.`; storage failure: `503`; CSRF failure: existing shared rejection. No rejected case deletes data.

## Audit Contract

```json
{
  "actorUserId": "session-user-id",
  "action": "QUESTION_DELETED",
  "targetType": "QUESTION",
  "targetId": "question-id",
  "outcome": "SUCCESS",
  "createdAt": 0
}
```

- Use actual server time for `createdAt`.
- Record no Question/Answer body, excerpt, respondent, cookie, token, or OAuth value.
- Do not change administrator action `ADMIN_QUESTION_DELETED`.

## Default Answer-Deadline Contract

- Run only when the new form has no stored deadline.
- Use next local midnight when at least one hour away; otherwise use midnight the following day.
- Update `closesAtLocal`, `closesAt`, `timeZone`, and displayed UTC time from one value.
- Display local and UTC time as `YYYY-MM-DD HH:mm`; retain machine-readable submission and `datetime` formats.
- Never overwrite stored values on edit, redisplay after input error, or existing drafts.
