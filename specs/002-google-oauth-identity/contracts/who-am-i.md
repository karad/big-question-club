# `who_am_i` Identity Verification Contract

## Purpose

Verify that the logged-in browser and WebMCP Tool identify the same Big Question Club user. The only personal information exposed is the service-internal user ID.

## Browser Identity Verification API

### `GET /api/who-am-i`

Check the browser's current login state using its Cookie. The response uses `Cache-Control: no-store`.

#### Authenticated Response — `200 OK`

```json
{
  "userId": "usr_opaque_identifier"
}
```

#### Unauthenticated Response — `401 Unauthorized`

```json
{
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Sign in to identify your account."
}
```

#### Server Error Response — `500 Internal Server Error`

```json
{
  "code": "IDENTITY_UNAVAILABLE",
  "message": "Identity verification is temporarily unavailable."
}
```

No response includes User attributes other than `userId`, Cookies, OAuth tokens, or Secrets.

## WebMCP Tool

### Tool Definition

| Field | Contract |
| --- | --- |
| Name | `who_am_i` |
| Input | Empty object. Additional properties are not allowed |
| Read-only | Yes |
| Execution target | Same-origin relative path `/api/who-am-i` |
| Authentication information | Limited to ordinary same-origin browser Cookies. Tokens are not passed through input or Tool results |

#### Authenticated Result

```json
{
  "userId": "usr_opaque_identifier"
}
```

#### Unauthenticated Result

```json
{
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Sign in to identify your account."
}
```

#### Unavailable Result

```json
{
  "code": "IDENTITY_UNAVAILABLE",
  "message": "Identity verification is temporarily unavailable."
}
```

## Security and Verification Rules

- The page that registers and executes `who_am_i` and the identity verification API must share the same canonical Origin, including scheme, host, and port.
- The API validates only the active Session included in the current request. It must not return past Sessions or an anonymous substitute identifier.
- The WebMCP Tool implementation must not read or log Cookie values, or forward them to another Origin.
- Error responses must not contain information that could reveal whether a particular User exists, an email address, or OAuth-provider account information.
