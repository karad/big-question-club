# Human向けAnswer HTTP／SSR契約

## 共通Header

認証またはAnswer内容に依存する成功・失敗応答は次を返す。

```text
Cache-Control: private, no-store
Vary: Cookie
```

外部エラーへAnswer、Session、Cookie、User、内部例外を含めない。

## `GET /questions/:questionId`

- 有効なSessionと公開済みQuestionを必要とする。
- `OPEN`／`CLOSED`: Question、締切、状態、回答数、本人Answerを返し、他者由来データはHTML本文、属性、Script、埋め込みJSONへ含めない。
- `REVEALED`: 回答数と `{ id, excerpt }` の全件を安定順で返し、本文、投稿者、個別時刻は初期HTMLへ含めない。
- Answerは実行せず、escapeしたテキストとして描画する。

## `GET /api/questions/:questionId/my-submission`

- 有効なSessionと公開済みQuestionを必要とする。
- `OPEN`、`CLOSED`、`REVEALED` で本人の `not_submitted` または `submitted` Viewを返す。
- 他者の投稿有無、回答数、ID、内容、時刻で応答形式を変えない。

## `GET /api/questions/:questionId/answers/:answerId`

有効なSession、`REVEALED`、AnswerとQuestionの対応をすべて満たす場合だけ `200` と `{ "id": "...", "body": "..." }` の指定1件を返す。

未認証、`DRAFT`、`OPEN`、`CLOSED`、Answer不在、別QuestionのAnswerはすべて次の共通結果にする。

```http
404
{"code":"ANSWER_UNAVAILABLE","message":"The requested answer is unavailable."}
```

HEAD、未対応Method、不正パラメータでもAnswer内容を返さず、別の列挙経路を作らない。
