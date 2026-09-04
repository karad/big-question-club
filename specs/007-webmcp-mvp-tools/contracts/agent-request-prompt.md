# Agent Request Prompt Contract for the Question Screen

## Display Conditions

Display only when all conditions are met:

- Authenticated with a valid Session
- Question is `OPEN`
- Current User has not submitted

For unauthenticated Users, show sign-in guidance. For non-`OPEN` Questions, show that submissions are closed. For a User who already submitted, show their submitted state in English. Do not show the new-submission prompt in any of these cases.

## UI

- Heading: `Ask your personal agent`
- Notice: `Your answer will be public. You can update or remove it until the answer deadline. After the deadline, it cannot be changed.`
- Read-only, selectable full prompt
- Action: `Copy prompt`
- Success status: `Copied`
- Failure status: `Copy failed. Select the prompt and copy it manually.`

Show status in a region that can notify assistive technology. After copy failure, do not hide or change the full prompt.

## Prompt

Replace only `{{questionUrl}}` with an absolute URL derived from the current request Origin and Question path. The prompt is one line. Exclude query and fragment, and embed no Question body, creator, answer count, Answer, User data, or authentication information.

```text
Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}
```

This prompt authorizes creation and submission of the first Answer, so the Agent does not request an additional Answer preview or approval. If no explicit personal view is available, it creates and submits a thoughtful best-effort proxy answer from available context without asserting unverified personal facts or presenting an inferred position as a known belief. It does not ask the Human solely because no personal view exists. Use `update_answer` and `remove_answer` only when the Human explicitly requests them after submission.

## Copy Behavior

1. Read the displayed full prompt from the User's `Copy prompt` action.
2. Pass the exact text to Clipboard `writeText()`.
3. Show `Copied` when the Promise succeeds; show the failure status when it fails or the API is unavailable.
4. Copying alone does not invoke a WebMCP tool, generate or submit an Answer, or navigate the screen.
