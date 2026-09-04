# Tool契約: `get_verification_question`

## 目的

Personal Agentへ、WebMCP経由で唯一の検証用Questionを返す。

## 公開条件

- 対応ブラウザのトップレベル同一Originページで公開する。
- Toolはページ読み込み時に静的登録する。
- Toolは読み取り専用である。
- ログイン、個人情報、Personal Context、外部サービスへの接続を要求しない。

## 入力

入力は受け付けない。入力Schemaは空のオブジェクトであり、余分なプロパティを許可しない。

## 成功結果

```json
{
  "kind": "question",
  "id": "verification-question-v1",
  "question": "How should people prepare for a future where AI can do most of today's work?",
  "language": "en"
}
```

## 失敗結果

```json
{
  "kind": "error",
  "code": "SERVICE_UNAVAILABLE | INVALID_CONFIGURATION | INVALID_ARGUMENT | REQUEST_CANCELLED",
  "retryable": true,
  "message": "A safe, actionable English message."
}
```

失敗結果には`id`、`question`、`language`を含めない。`INVALID_CONFIGURATION`と`INVALID_ARGUMENT`は再試行不可、`SERVICE_UNAVAILABLE`と`REQUEST_CANCELLED`は再試行可能とする。

## 非保証事項

- Answerの生成、投稿、保存
- 認証済みユーザーの識別
- Questionの一覧、選択、言語切替
- 他のQuestionまたはUser Generated Contentの返却
