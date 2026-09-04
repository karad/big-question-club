# Contract: Administration and Publication Operations

## Configuration and Authorization

- Configure one administrator email in `ADMIN_EMAIL`. Accept only a valid email after trimming and lowercasing.
- Resolve the database User by Session User ID; authorize only an exact match between normalized email and configuration.
- Signed-out Users, ordinary Users, invalid configuration, and authorization repository failures return the ordinary 404 body, revealing no administration surface.
- Authorized responses return `Cache-Control: private, no-store` and `Vary: Cookie`.
- Administration uses `noindex, nofollow` and has no public link. Legacy `/admin` returns 404 without redirect.

## Routes

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/club-operations` | Four-list count summary and links | 200 HTML |
| `GET` | `/club-operations/users?page={page}` | User list | 200 HTML |
| `GET` | `/club-operations/questions?page={page}` | Question list | 200 HTML |
| `GET` | `/club-operations/answers?page={page}` | Answer list | 200 HTML |
| `GET` | `/club-operations/audit-log?page={page}` | Audit-log list | 200 HTML |
| `POST` | `/club-operations/questions/{id}/delete` | Delete Question and its Answers | 303 `/club-operations/questions` |
| `POST` | `/club-operations/answers/{id}/delete` | Delete one Answer | 303 `/club-operations/answers` |
| `POST` | `/club-operations/users/{id}/ban` | Ban User and invalidate all Sessions | 303 `/club-operations/users` |
| `POST` | `/club-operations/users/{id}/unban` | Unban User | 303 `/club-operations/users` |

- POST requires same-origin CSRF validation and explicit `confirm=on`.
- Missing target returns 404, self-ban 409, and missing confirmation 400.
- Successful deletion/ban/unban and its audit entry commit in one D1 batch.

## List Display

- Administration home shows only counts and links, no records.
- Dedicated lists use tables ordered primarily by creation time descending, twenty records per page. Invalid positive-integer `page` falls back to page 1.
- User: ID, name, email, ban state, creation time, ban/unban action.
- Question: ID, body, creator User ID, state, creation/update times, delete action.
- Answer: ID, Question ID, User ID, excerpt, body, creation/update times, delete action.
- Audit log: actor User ID, action, target type/ID, outcome, occurrence time.
- Treat Question/Answer bodies as Hono JSX text nodes, never HTML or script.

## Ban

- On ban, insert the User into `banned_users` and delete every Session for that User.
- A Better Auth pre-Session-creation hook checks `banned_users` and refuses Sessions for banned Users.
- Unban does not restore old Sessions; the User signs in anew.
- The administrator cannot ban themselves.

## Audit Log

- Database triggers record successful Session, Question, and Answer creation/update. Owner Answer deletion is recorded in the same D1 batch as its ownership/deadline-conditional deletion.
- Administrator operations use dedicated actions and name the administrator as actor.
- Logs store no content body, excerpt, email, Cookie, Token, or OAuth value.
- Provide no audit-log update/delete route.
