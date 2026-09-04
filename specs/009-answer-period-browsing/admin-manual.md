# Administrator Manual

## Entering Administration

1. Sign in with the Google account configured as administrator.
2. Open `/club-operations` directly. Public screens contain no administration link.

There is exactly one administrator. Signed-out Users, non-administrator accounts, and configuration failures receive the ordinary 404, revealing no administration surface.

Before first publication, see the [D1 migration procedure](./migration-manual.md).

## Reviewing Lists

The administration home shows count summaries and links to these dedicated lists, with no individual records:

- `/club-operations/users`
- `/club-operations/questions`
- `/club-operations/answers`
- `/club-operations/audit-log`

Each list is a table with twenty records per page and `Previous`/`Next` navigation. On narrow screens only the table scrolls horizontally. Dates use `YYYY-MM-DD HH:mm`.

- User: name, email, ban state, registration time
- Question: body, creator, state, creation/update times
- Answer: body, excerpt, Question, respondent, creation/update times
- Audit log: actor, action, target, result, occurrence time

Handle Question and Answer content only when operationally necessary. Audit logs store no Question body, Answer body, or authentication data.

## Deleting a Question or Answer

In the Question or Answer list, select the target row's confirmation and then `Delete`.

- Deleting a Question also deletes all its Answers.
- Deleting an Answer preserves its Question and other Answers.
- Deleted content cannot be restored from administration.
- Editing is unavailable.

Verify target ID and content first. The operation remains in the audit log.

## Banning or Unbanning a User

In the User list, select confirmation and then `Ban`. Banning invalidates all existing Sessions and rejects new sign-in.

`Unban` permits future sign-in but does not restore old Sessions. The administrator cannot ban themselves.

## Reviewing Audit Logs

For investigations, inspect occurrence time, operation, actor ID, and target ID. Login, logout, Question/Answer input, administrator deletion, ban, and unban are recorded. Audit logs cannot be edited or deleted.
