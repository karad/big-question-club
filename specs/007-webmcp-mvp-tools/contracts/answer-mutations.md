# Answer HTTP契約

## 共通規則

- すべて同一Originの認証済みSessionを要求する。
- User IDはSessionから決定し、要求Bodyから受け取らない。
- JSON要求は定義された項目だけを受け付ける。
- 成功・エラーとも `Cache-Control: no-store` を返す。
- Answer本文は空白のみではない1〜5,000表示文字、Excerptは空白のみ・改行なし1〜160表示文字。

## `GET /api/questions/:questionId`

`OPEN` Questionだけを [WebMCP契約](./webmcp-tools.md) のQuestion Tool Viewで返す。

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | QuestionなしまたはDraft |
| 409 | `QUESTION_CLOSED` | `CLOSED` または `REVEALED` |
| 500 | `TOOL_UNAVAILABLE` | 一時障害 |

## `POST /api/questions/:questionId/answers`

要求:

```json
{ "answer": "Public answer text.", "excerpt": "One-line excerpt." }
```

成功は `201 Created` で `submitted` 結果を返す。

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | 形式または文字数が不正 |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | QuestionなしまたはDraft |
| 409 | `QUESTION_CLOSED` | 非 `OPEN` |
| 409 | `ANSWER_ALREADY_SUBMITTED` | 本人Answerあり |
| 500 | `TOOL_UNAVAILABLE` | 一時障害 |

## `PUT /api/questions/:questionId/my-answer`

要求:

```json
{ "answer": "Revised answer.", "excerpt": "Revised excerpt." }
```

成功は `200 OK` で `updated` 結果を返す。`createdAt`とAnswer IDは変えず、`updatedAt`をサービス側時刻へ進める。

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 400 | `INVALID_INPUT` | 形式または文字数が不正 |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | QuestionなしまたはDraft |
| 404 | `ANSWER_NOT_FOUND` | 本人Answerなし |
| 409 | `QUESTION_CLOSED` | 非 `OPEN` |
| 500 | `TOOL_UNAVAILABLE` | 一時障害 |

## `DELETE /api/questions/:questionId/my-answer`

要求Bodyは持たない。成功は `200 OK` で `removed` 結果を返す。

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | QuestionなしまたはDraft |
| 404 | `ANSWER_NOT_FOUND` | 本人Answerなし |
| 409 | `QUESTION_CLOSED` | 非 `OPEN` |
| 500 | `TOOL_UNAVAILABLE` | 一時障害 |

## `GET /api/questions/:questionId/my-submission`

成功は `200 OK` で本人の `not_submitted` または `submitted` Viewを返す。削除後は `not_submitted`、更新後は最新本文、Excerpt、`updatedAt`を返す。

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | QuestionなしまたはDraft |
| 500 | `TOOL_UNAVAILABLE` | 一時障害 |

## 非列挙・競合

- 別UserのAnswerしか存在しないupdate/removeも `ANSWER_NOT_FOUND` とする。
- update/removeは本人・Question・`OPEN` を同じ条件付き書き込みで確定する。
- remove後に競合updateが届いてもAnswerを復元しない。
- 失敗時に他者Answer、本人の旧本文、内部の変更件数を返さない。

