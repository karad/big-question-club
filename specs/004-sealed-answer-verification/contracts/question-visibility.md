# Question詳細とSealed Answers公開の契約

## `GET /questions/:questionId`（Human向けSSR）

| 条件 | 表示する情報 | 表示禁止 |
| --- | --- | --- |
| 締切前・未回答 | Question、回答数、締切、`Answers are sealed`、未投稿 | 全Answer本文・Excerpt・抜粋・要約 |
| 締切前・本人投稿済み | 上記と本人Answerの本文・Excerpt | 他者Answer本文・Excerpt・抜粋・要約 |
| 締切後・認証済みHuman | Question、回答数、締切、全AnswerのExcerpt。クリックしたAnswerだけの本文をExcerpt下に展開 | 認証情報、未クリックAnswerの本文 |
| 締切後・0件 | Question、回答数0、空状態 | 架空のAnswer |

SSRは`/client.js`を読み込み、公開後のExcerptボタンのクリック時にだけ同一OriginのAnswer詳細APIを呼び出す。初期HTMLにはAnswer本文を埋め込まない。

## `GET /api/questions/:questionId`

Question本文、回答数、締切、本人の投稿状態だけを返す。締切後も他者Answer本文、Excerpt、抜粋、要約、Answer識別子を返さない。

```json
{ "id": "question_opaque_id", "question": "Question text.", "answerCount": 2, "closesAt": "2026-09-02T00:00:00.000Z", "mySubmissionStatus": "submitted" }
```

下記の公開後Answer詳細APIを除き、他者Answerを単件・一覧・Excerpt・抜粋・要約・検索で返すHTTP APIまたはWebMCP Toolを追加してはならない。

## `GET /api/questions/:questionId/answers/:answerId`

認証済みHumanが公開後にクリックしたAnswerのBodyだけを取得する。同一OriginのSSR画面が呼び出すが、直接のHTTP呼び出しでも同じ認可・時刻判定を必ず適用する。

成功（`200 OK`）:

```json
{ "id": "answer_opaque_id", "body": "The selected public answer body." }
```

締切前または未認証の呼び出しは、`404 ANSWER_UNAVAILABLE`だけを返す。AnswerのBody、Excerpt、抜粋、要約、存在の手掛かりを返してはならない。締切後は、認証済みHumanに対して要求された1件だけを返し、一覧・検索・複数Answerの取得を許可しない。WebMCPからこの経路を呼び出してはならない。

## 検証マトリクス

| 主体 | 締切前SSR | 締切前HTTP | 締切前WebMCP | 締切後SSR | 締切後HTTP | 締切後WebMCP |
| --- | --- | --- | --- | --- | --- | --- |
| 未認証者 | 本文なし | 本文なし | 利用不可 | 本文なし | 本文なし | 利用不可 |
| 投稿者本人 | 本人だけ | 本人状態だけ | 本人状態だけ | 全Answer | 本人状態だけ | 本人状態だけ |
| 別の認証済みHuman | 本文なし | 本文なし | 本人状態だけ | 全Answer | 本文なし | 本人状態だけ |
| Personal Agent | N/A | N/A | 本人状態だけ | N/A | N/A | 本人状態だけ |
