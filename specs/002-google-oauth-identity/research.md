# Technical Research: Validating Google OAuth and WebMCP User Identification

## Decision 1: Integrate Better Auth into Hono Routes on the Same Worker

- **Decision**: Handle Better Auth authentication under `/api/auth/*` and run it in the same Cloudflare Worker as the existing Hono application. Add the Node.js compatibility required by Better Auth to the Workers compatibility settings.
- **Rationale**: Hono integration shares standard Request and Response objects and lets the identity verification API validate the authenticated Session directly. Keeping it in one service avoids introducing Cookie sharing and CORS as additional verification concerns.
- **Alternatives considered**: A separate-Origin authentication backend or a custom OAuth implementation. The former introduces third-party Cookie, CORS, and CSRF concerns; the latter requires implementing OAuth protections such as state validation. Neither is adopted.
- **Sources**: [Better Auth Hono integration](https://better-auth.com/docs/integrations/hono), [Better Auth installation](https://better-auth.com/docs/installation)

## Decision 2: Explicitly Register Canonical-Origin Callback URIs for Google OAuth

- **Decision**: Use a Web application OAuth client in Google Cloud Console and register the exact `/api/auth/callback/google` URI for both local and deployed environments as authorized redirect URIs. Set `BETTER_AUTH_URL` to the canonical Origin without a path.
- **Rationale**: Google requires the scheme, host, port, and path of redirect URIs to match. Explicitly defining the canonical Origin prevents `redirect_uri_mismatch` during deployment validation.
- **Alternatives considered**: Register only localhost, or allow arbitrary redirect destinations. The former prevents shared verification, while the latter violates OAuth security requirements. Neither is adopted.
- **Sources**: [Better Auth Google OAuth](https://better-auth.com/docs/authentication/google), [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## Decision 3: Use Persistent D1 Sessions and Disable Cookie Caching

- **Decision**: Store the User, Account, Session, and Verification entities managed by Better Auth in D1. Do not enable Session Cookie caching.
- **Rationale**: This P0 must verify that a previous user identifier is not returned after sign-out, authentication expiration, or switching accounts. Validating persistent Sessions on the server makes those checks possible.
- **Alternatives considered**: Identification using stateless tokens alone, or Cookie caching. Both make immediate expiration and account switching difficult to verify and do not suit this Go/No-Go objective.
- **Sources**: [Better Auth session management](https://better-auth.com/docs/concepts/session-management), [Better Auth cookies](https://better-auth.com/docs/concepts/cookies)

## Decision 4: Have the `who_am_i` Tool Call the Same-Origin Identity API Using a Relative URL

- **Decision**: The WebMCP Tool calls the relative URL `/api/who-am-i` from its registered page using an ordinary `fetch`, without explicitly reading or forwarding Cookie values.
- **Rationale**: Fetch defaults its credentials mode to `same-origin`, so the browser includes its Cookies in a same-origin request. This also sends `HttpOnly` Cookies without exposing secret Session values to JavaScript.
- **Alternatives considered**: Use `credentials: include` across Origins, or pass a token as Tool input. The former adds CORS, third-party Cookie restrictions, and CSRF risk; the latter exposes authentication information to the Tool. Neither is adopted.
- **Sources**: [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [MDN Fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), [MDN Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## Decision 5: Determine the P0 Go/No-Go Decision with Four Real-Browser Cases

- **Decision**: Verify repeated checks for one account, isolation between two accounts, sign-out/authorization denial/authentication expiration, and account switching on a real device. Record only the page Origin, request destination, HTTP result, and whether service-internal user IDs match.
- **Rationale**: Unit Tests cannot prove actual browser Cookie transmission or Google sign-in behavior. The four cases directly verify SC-001 through SC-005.
- **Alternatives considered**: Decide based only on automated tests. This cannot verify real-browser integration between Google OAuth and WebMCP, so it is not adopted.
- **Sources**: [Chrome WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools), [MDN Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)

## Environment Configuration Recording Policy

| Setting | Purpose | Management Policy |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Sign and encrypt Sessions | Configure a high-entropy value as a Secret and do not store it in the repository |
| `BETTER_AUTH_URL` | Identify the canonical Origin | Configure a pathless Origin for the local or deployed environment |
| `GOOGLE_CLIENT_ID` | Identify the Google OAuth client | Inject it as development and deployment environment configuration |
| `GOOGLE_CLIENT_SECRET` | Authenticate the Google OAuth client | Configure it as a Secret and do not store it in the repository |
