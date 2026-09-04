# WebMCP Answer公開契約

## Capability境界

本番WebMCPは既存5 Toolだけを維持し、Answer一覧、他者詳細、検索、要約、比較、回答数のToolを追加しない。

## 読み取りTool

- `get_question` はHuman指定の `OPEN` Questionだけを返し、回答数、本人状態、Answer ID・内容・投稿者・時刻を返さない。
- `get_my_submission` は公開済みQuestionの全状態で本人状態を返す。投稿済みなら本人本文、Excerpt、投稿時刻、更新時刻だけを返す。
- 未投稿応答は他者の投稿有無・件数で変化しない。

## 書き込みToolとReveal後

`submit_answer`、`update_answer`、`remove_answer` はSPEC 007契約を維持し、失敗へ他者Answerを含めない。Questionが `REVEALED` でもWebMCPへ他者Answer、回答数、他者の投稿有無を返さず、Human向け詳細HTTPをToolから呼び出さない。
