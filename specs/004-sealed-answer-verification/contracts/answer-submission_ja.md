# Answer投稿と本人の投稿状況の契約

## 共通規則

- 投稿者は同一Originの認証済みセッションで決め、利用者識別子を入力に受け取らない。
- Answer本文は空白のみを許可せず、最大5,000文字とする。AIが同時に投稿するExcerptは必須で、空白のみと改行を許可せず、最大160文字とする。
- 応答は`Cache-Control: no-store`とし、エラーは英語の`code`と`message`だけを持つ。

## `POST /api/questions/:questionId/answers`

要求:

```json
{ "answer": "Public answer text.", "excerpt": "One-line summary." }
```

成功（`201 Created`）:

```json
{ "questionId": "question_opaque_id", "status": "submitted", "submittedAt": "2026-09-02T00:00:00.000Z" }
```

| HTTP | `code` | 条件 |
| --- | --- | --- |
| 400 | `INVALID_ANSWER` | 本文、Excerpt、または形式が不正 |
| 401 | `AUTHENTICATION_REQUIRED` | 未認証 |
| 404 | `QUESTION_NOT_FOUND` | Questionなし |
| 409 | `ANSWER_ALREADY_SUBMITTED` | 本人の既存Answerまたは同時投稿の先行確定 |
| 409 | `QUESTION_CLOSED` | 締切時刻と同時または後 |
| 500 | `ANSWER_SUBMISSION_UNAVAILABLE` | 永続化障害 |

## `GET /api/questions/:questionId/my-submission`

未投稿:

```json
{ "questionId": "question_opaque_id", "status": "not_submitted" }
```

投稿済み:

```json
{ "questionId": "question_opaque_id", "status": "submitted", "answer": "The caller's own public answer.", "excerpt": "The caller's one-line summary.", "submittedAt": "2026-09-02T00:00:00.000Z" }
```

別利用者のAnswerは締切前後を問わず返さない。

## WebMCP Tool

| Tool | 入力 | 状態変更 | 出力 |
| --- | --- | --- | --- |
| `submit_answer` | `questionId`、`answer`、`excerpt`のみ | はい | 投稿結果または上記エラー |
| `get_my_submission` | `questionId`のみ | いいえ | 本人の投稿状態または上記エラー |

Toolは同一Originの相対URLだけを呼び出し、他者Answer、Cookie、トークン、Private Contextを出力しない。
