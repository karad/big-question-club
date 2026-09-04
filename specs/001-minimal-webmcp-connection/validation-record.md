# Validation Record: Minimal WebMCP Connection

## Execution Environment

| Field | Value |
| --- | --- |
| Date | 2026-09-01 |
| Node.js | 22.19.0 |
| npm | 10.9.2 |
| Chrome | Not performed |
| WebMCP testing flag | Not performed |
| Origin Trial | Not performed |
| Verification URL | Not performed |

## Automated Verification

| Check | Result | Notes |
| --- | --- | --- |
| TypeScript typecheck | PASS | `npm run typecheck` |
| Unit / Integration Test | PASS | `npm run test`: 6 files, 28 tests |
| Lint | PASS | `npm run lint` |
| Format | PASS | `npm run format` |
| Production build | PASS | `npm run build` |
| `/health` | PASS | Confirmed `{ "status": "ok" }` with `npm run preview` |
| `/api/verification-question` | PASS | Confirmed the fixed Question with `npm run preview` |
| Verification page | PASS | Confirmed the WebMCP Tool name and initial display in the HTTP response |

## Manual WebMCP E2E

| Check | Result | Record |
| --- | --- | --- |
| Discover exactly one Tool in Chrome | PASS | Manually confirmed by the user on 2026-09-01 (Chrome version not recorded) |
| Invoke the Tool ten consecutive times | PASS | Manually confirmed by the user on 2026-09-01 |
| Do not return a Question for arbitrary input | PASS | Confirmed `INVALID_ARGUMENT` with no Question fields in DevTools |
| Do not return a Question on API failure | PASS | Manually confirmed by the user on 2026-09-01 |
| Do not return a Question for invalid configuration | PASS | Manually confirmed by the user on 2026-09-01 |
| Do not return a Question after cancellation | PASS | Manually confirmed by the user on 2026-09-01 |

## T035 Manual E2E Test Procedure

### Preparation

1. Use Node.js LTS 22.13 or later, or Node.js 24 or later.
2. Run `npm install`, `npm run build`, and `npm run preview` in order.
3. Record the local URL shown by the preview. For shared verification, first run `npm run deploy` to deploy to `workers.dev`, then record that HTTPS URL.
4. For local verification, enable `chrome://flags/#enable-webmcp-testing` in Chrome and restart it. For a shared environment, configure an active WebMCP Origin Trial for the public URL's Origin.
5. Open the verification URL as a top-level tab in supported Chrome. Do not perform the test inside an iframe.

### Confirm Tool Registration

1. Open DevTools and display the WebMCP panel under Application.
2. Confirm that exactly one `get_verification_question` Tool is registered.
3. Confirm that the following values match:
   - Tool name: `get_verification_question`
   - Input Schema: empty object, `additionalProperties: false`
   - metadata: `readOnlyHint: true`, `untrustedContentHint: false`
4. Confirm that the verification page status reads `WebMCP tool registered...`.

### Confirm the Success Path

1. Invoke the Tool with no input from the DevTools WebMCP panel or a Personal Agent.
2. Confirm a `kind: "question"` result containing all of the following values:
   - `id`: `verification-question-v1`
   - `question`: `How should people prepare for a future where AI can do most of today's work?`
   - `language`: `en`
3. Invoke the same Tool a total of ten times.
4. Confirm that the values of all three fields above match exactly in all ten results.
5. If using a Personal Agent, also record that the Agent discovered the Tool and retrieved the same result.

### Confirm Failure Paths

1. Pass input with an arbitrary property to the Tool. Confirm that it returns `INVALID_ARGUMENT` and includes no Question fields.
2. Use DevTools to go offline or make `/api/verification-question` return 503, then invoke the Tool. Confirm that it returns `SERVICE_UNAVAILABLE`, has `retryable: true`, and includes no Question fields.
3. Cancel the request while the Tool is running. Confirm that it returns `REQUEST_CANCELLED` and includes no Question fields.
4. In the development environment, temporarily remove a required field from the fixed Question and invoke the Tool. Confirm that it returns `INVALID_CONFIGURATION`, has `retryable: false`, and includes no Question fields.
5. Always restore the changed fixed Question configuration after the check.

### Record Template

| Field | Recorded Value |
| --- | --- |
| Date | 2026-09-01|
| Chrome version | 152.0.7977.65|
| Verification URL | http://localhost:5173/|
| Local flag or Origin Trial | |
| Personal Agent used | |
| Number of registered Tools | |
| Ten consecutive retrievals | PASS |
| Invalid input result | PASS |
| API failure result | PASS |
| Cancellation result | PASS |
| Invalid configuration result | PASS |
| Notes / failure details | |

## Unresolved Items

- Deployment to `workers.dev` and Origin Trial configuration have not been performed because they involve changes to an external account.
