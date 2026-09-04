# Data Model: Validating Google OAuth and WebMCP User Identification

This SPEC stores only the authentication data required to validate the feasibility of authentication. It does not store Questions, Answers, or Personal Context.

## Entities

### User

A participant identified within Big Question Club.

| Attribute | Description | Constraint |
| --- | --- | --- |
| `id` | Stable service-internal user identifier | Unique. The only identifier that may be exposed on screen or by the `who_am_i` Tool |
| `name` | Display name obtained from the OAuth provider | Not included in this SPEC's Tool responses or validation records |
| `email` | Email address obtained from the OAuth provider | Not included in this SPEC's screens, Tool responses, or validation records |
| `emailVerified` | Email-address verification status | Stored as authentication data |
| `createdAt` / `updatedAt` | Creation and update times | Used for auditing and Session management |

### Account

The association between a Google OAuth account and a User.

| Attribute | Description | Constraint |
| --- | --- | --- |
| `id` | Account identifier | Unique |
| `userId` | Associated User | References a valid User |
| `providerId` | Authentication provider | Only Google is allowed in this SPEC |
| `accountId` | Account identifier within the provider | Must not be associated with the same participant more than once within one provider |
| Authentication-token values | Values required for OAuth processing | Not included in Tool responses, logs, or validation records |

### Session

A server-side Session representing the browser's current login state.

| Attribute | Description | Constraint |
| --- | --- | --- |
| `id` | Session identifier | Unique. Never returned externally |
| `userId` | Associated User | References a valid User |
| `token` | Opaque Session value corresponding to the Cookie | Never returned externally or written to logs |
| `expiresAt` | Expiration time | Not treated as authenticated after expiration |
| `createdAt` / `updatedAt` | Creation and update times | Used for Session management |

### Verification

Temporary verification information for the OAuth flow.

| Attribute | Description | Constraint |
| --- | --- | --- |
| `id` | Verification identifier | Unique. Never returned externally |
| `identifier` / `value` | Verification data for the OAuth flow | Treated as Secret-equivalent and never written to logs, Tool responses, or records |
| `expiresAt` | Expiration time | Invalid after expiration |

## Relationships

```text
User 1 ─── * Account
User 1 ─── * Session
Verification is created and expires independently during the OAuth flow
```

## Identity Verification State Transitions

```text
Unauthenticated ──Google OAuth succeeds──> Authenticated
Authenticated ──sign out or expiration──> Unauthenticated
Authenticated (Account A) ──sign out → Google OAuth succeeds (Account B)──> Authenticated (Account B)
```

`who_am_i` returns a User ID only when authenticated. It never returns a User ID for an unauthenticated, expired, or corrupted Cookie, or when OAuth authorization is denied.
