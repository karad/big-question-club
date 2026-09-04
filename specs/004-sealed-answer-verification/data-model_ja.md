# データモデル: Agent回答投稿の完全性・Sealed Answersの検証

## エンティティ

| エンティティ | フィールド | 制約 |
| --- | --- | --- |
| Question | `id`, `body`, `closes_at`, `created_at` | `closes_at`はUTC Unixミリ秒。作成は本SPECの対象外。 |
| Answer | `id`, `question_id`, `user_id`, `body`, `excerpt`, `created_at` | `question_id`と`user_id`は一意。`user_id`はセッションから決定。本文は空白のみ・5,000文字超を拒否し、Excerptは空白のみ・改行・160文字超を拒否。 |

## 状態と関係

```text
認証済み利用者 1 ─── 0..* Answer ─── 1 Question
Answer ─── UNIQUE(question_id, user_id)
```

| 状態 | 条件 | 結果 |
| --- | --- | --- |
| `not_submitted` | 本人Answerなし | 締切前なら投稿可 |
| `submitted` | 本人Answerが1件 | 本人は確認可 |
| `duplicate_rejected` | 同じQuestion・利用者で再投稿 | 新規作成・更新なし |
| `closed_rejected` | `now >= closes_at` | 新規作成なし |

## 公開規則

| 時刻 | Human向けSSR | HTTP API | WebMCP |
| --- | --- | --- | --- |
| `now < closes_at` | 本人の本文・Excerptだけ、回答数、締切 | 非本文情報と本人の投稿状況だけ | 投稿と本人の投稿状況だけ |
| `now >= closes_at` | 一覧は全AnswerのExcerptだけ。クリック時に認証済みHumanへ該当Bodyを返す | 認証済みHumanのAnswer詳細要求だけに該当Bodyを返す | 他者Answerを返さない |

未認証者には、本文、Excerpt、抜粋、要約、存在の手掛かりを返さない。認証済みHumanへの他者Answer本文は、公開後の単一Answer詳細要求だけで返す。
