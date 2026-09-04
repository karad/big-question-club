# Research Findings: Minimal WebMCP Connection

## How to Expose the WebMCP Tool

### Decision

At page load, statically register the no-input, read-only `get_verification_question` Tool using the imperative API. At runtime, it calls the fixed Question API on the same Origin.

### Rationale

WebMCP exposes JavaScript functionality from a page as Tools. A feature that only returns a fixed Question does not need form submission and can keep one responsibility per Tool. Going through a same-Origin API verifies Worker availability as well as page-level Tool registration.

### Alternatives considered

- Declarative API: Intended for form submission and would introduce unnecessary UI and input for retrieving fixed data.
- Embed the Question in the JS bundle: Simplest, but cannot verify Worker/API connection failures.
- Connect directly to an MCP server: Outside this SPEC's scope of verifying WebMCP through a browser page.

## Question Contract and Safety Boundary

### Decision

Accept no input and return only fixed JSON containing `id`, `question`, and `language`. Define the input Schema as an empty object that disallows additional properties, and validate the input again in the execution function.

### Rationale

Having no input prevents receipt of personal information, Personal Context, or a Question selection value. Fixing the result makes determinism across ten consecutive retrievals automatically testable. Fixed, managed data is not User Generated Content and is therefore not treated as untrusted content.

### Alternatives considered

- Accept a Question ID or language as input: Useful for multiple Questions in the future, but adds unnecessary branches and invalid-input cases to this SPEC.
- Return multiple Questions: That is the responsibility of a subsequent SPEC covering Question publishing and management.

## Success and Failure Contract

### Decision

On success, return only the Question. Represent invalid configuration, service failure, invalid input, and cancellation as distinguishable error results that do not contain a Question.

### Rationale

Returning an empty string or `null` as a Question could make a failure look like success. Fixed error codes and retryability for anticipated failures let Agents and developers distinguish causes. Never return a success result after execution is cancelled.

### Alternatives considered

- Only throw exceptions: Makes it difficult to give the Agent stable grounds for retrying.
- Return the HTTP API response unchanged: Makes the page Tool contract unnecessarily dependent on HTTP details.

## Supported Browser and Exposure Model

### Decision

Use supported Chrome with the WebMCP testing flag for local verification. For shared verification, use a top-level, same-Origin HTTPS page with an active Origin Trial. Explicitly report unsupported environments as WebMCP verification failures.

### Rationale

WebMCP is a proposed browser feature. Chrome's official guidance specifies the testing flag for local use and the Origin Trial for shared environments. Automatically falling back to an ordinary HTTP API would not verify connectivity through WebMCP. Avoiding a cross-Origin iframe eliminates unnecessary variables such as permission delegation.

### Alternatives considered

- Silent fallback to an HTTP API: Rejected because it would misrepresent a connection failure as success.
- Exposure in a cross-Origin iframe: Adds required permission configuration and attack surface that the initial connection verification does not need.

## Runtime and Verification Strategy

### Decision

Build a single web application with Cloudflare Workers, Hono, Hono JSX, Vite, and the Cloudflare Vite plugin, using `workers.dev` as the first shared destination. Automatically test the fixed Question contract; manually verify Tool discovery and ten consecutive invocations using Chrome DevTools and a supported Personal Agent.

### Rationale

This matches the project's technical specification and supports testing in both local and production-like Worker runtimes. The fixed output contract, error cases, and registration conditions suit automated tests, while discovery and invocation by a real Agent require browser-integration verification.

### Alternatives considered

- Introduce a custom domain initially: Adds DNS configuration and falls outside the purpose of SPEC 001.
- Introduce a database first: Unnecessary when only verifying connectivity for a fixed Question.
- Determine automated pass/fail solely through natural-language Agent interaction: Mixes the probabilistic nature of Tool selection into connection verification.

## References

- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [WebMCP DevTools debugging](https://developer.chrome.com/docs/devtools/application/webmcp)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Cloudflare Workers with Hono](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
