# Verification Guide: Minimal WebMCP Connection

## Prerequisites

- Ability to deploy a Worker to a Cloudflare account.
- Access to the Node.js version recommended by the project.
- Access to WebMCP-compatible Chrome and a WebMCP-compatible Personal Agent.
- For local verification, enable `chrome://flags/#enable-webmcp-testing` in Chrome.
- For shared verification, configure a valid WebMCP Origin Trial for the target Origin.

## Local Verification

1. Select Node.js LTS 22.13 or later, or Node.js 24 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown by Vite in a top-level Chrome tab.
5. Enable `chrome://flags/#enable-webmcp-testing` in Chrome and restart Chrome.
6. Confirm that exactly one `get_verification_question` entry is registered in the DevTools WebMCP panel.
7. Set that page as the connection target for the Personal Agent and invoke the Tool.
8. Confirm that the fixed Question matches the [Tool contract](contracts/get-verification-question.md).
9. Repeat the same invocation ten times and confirm that `id`, `question`, and `language` match every time.

## Shared Verification

1. Run `npm run build` and `npm run preview`, then repeat the local verification steps against the production-like preview.
2. Run `npm run deploy` to deploy the Worker to `workers.dev`.
3. Add the public Cloudflare URL to the Origins covered by the WebMCP Origin Trial.
4. Open the public HTTPS URL in Chrome and confirm Tool registration in the DevTools WebMCP panel.
5. Discover the Tool from the Personal Agent and retrieve the Question ten consecutive times.

## Failure Verification

1. Open the page in Chrome with WebMCP disabled, or in an unsupported browser.
2. Confirm that the page displays `WebMCP is unavailable` and reports an explicit verification failure rather than a successful ordinary HTTP API result.
3. Use DevTools or network blocking to make `/api/verification-question` fail.
4. Confirm that the Tool does not return a Question and instead returns `SERVICE_UNAVAILABLE` or `REQUEST_CANCELLED`.
5. In the development environment, remove a required field from the fixed Question and confirm that `INVALID_CONFIGURATION` is returned.

## Acceptance Criteria

- The fixed Question can be retrieved within two minutes of configuring the connection.
- All returned values match across ten consecutive retrievals.
- A developer unfamiliar with the project can reproduce the connection verification within 30 minutes by following this guide.
- A successful Question is never returned when the connection is unavailable or the configuration is invalid.
