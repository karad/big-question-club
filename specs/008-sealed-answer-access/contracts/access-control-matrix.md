# Answer Access-Control Matrix

✅ means data may be returned. ❌ means no Answer-derived data or clue to existence may be returned.

## Authenticated Human

| State | SSR Answer Count | SSR Own Answer | Personal-State HTTP | SSR All Excerpts | Detail HTTP Selected Body |
| --- | ---: | ---: | ---: | ---: | ---: |
| `DRAFT` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `OPEN` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `CLOSED` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `REVEALED` | ✅ | ❌ | ✅ | ✅ | ✅ |

Question creators follow the same table and receive no pre-Reveal privilege. Initial SSR after Reveal embeds no Answer body, including the current User's; their Answer is retrieved only through personal-state HTTP. All excerpts contain only `{ id, excerpt }` for every Answer, including the current User's.

## Personal Agent / WebMCP

| State | Answer Count | Own State/Answer | Other-User Information |
| --- | ---: | ---: | ---: |
| `DRAFT` | ❌ | ❌ | ❌ |
| `OPEN` | ❌ | ✅ | ❌ |
| `CLOSED` | ❌ | ✅ | ❌ |
| `REVEALED` | ❌ | ✅ | ❌ |

The unsubmitted response does not vary with another User's submission existence or count.

## Unauthenticated Users and Boundaries

Unauthenticated Users receive ❌ for every Answer datum on every path in every state. `now < closesAt` is `OPEN`; `closesAt <= now < revealsAt` is `CLOSED`; `revealsAt <= now` is `REVEALED`. When `closesAt === revealsAt`, the instant before is `OPEN` and the boundary onward is `REVEALED`. One request uses the state derived at its start throughout.
