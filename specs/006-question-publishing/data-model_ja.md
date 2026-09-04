# データモデル: Question作成・公開フロー

## 既存永続Entity

本SPECはSPEC 005の `Question`、`Answer`、`User` Schemaを再利用し、Migrationを追加しない。新しい永続列はない。

### Question

| フィールド | 型 | 更新可否 | 本SPECの規則 |
| --- | --- | --- | --- |
| `id` | 文字列 | 不可 | Draft作成時に一意生成する。 |
| `creatorUserId` | 文字列 | 不可 | 認証済みHumanのUser ID。 |
| `body` | 文字列 | Draftのみ | trim後の書記素クラスタ10〜1,000文字。 |
| `language` | 文字列 | 内部互換用 | 既存Schemaとの互換性のため残す。新規Questionは `auto` を保存し、利用者向け入力・表示・WebMCP契約には使わない。 |
| `publishedAt` | UTC Unixミリ秒またはnull | 公開時に1回 | nullはDraft。公開時のサービス側 `now` を設定する。 |
| `closesAt` | UTC Unixミリ秒 | Draftのみ | 保存・編集・公開時の `now + 1時間` 以上 `now + 30日` 以内。 |
| `revealsAt` | UTC Unixミリ秒 | Draftのみ | 常に `closesAt` と同じ値。利用者入力にはしない。 |
| `createdAt` | UTC Unixミリ秒 | 不可 | Draft作成時のサービス側 `now`。 |
| `updatedAt` | UTC Unixミリ秒 | Draft編集・公開時 | 楽観的競合判定にも使用する。 |

### Answer

本SPECでは作成・内容取得を行わない。`My Questions` でQuestionごとの件数だけを集計し、本文、Excerpt、`userId` を返さない。

### User

Better Authが管理する認証主体。Sessionから得た `user.id` だけをQuestionの作成者・所有者判定に利用する。

## 非永続の入力・表示モデル

### QuestionDraftForm

| フィールド | 入力元 | 必須 | 規則 |
| --- | --- | --- | --- |
| `body` | textarea | 必須 | trim後10〜1,000書記素。入力値はエラー時に再表示する。 |
| `closesAtLocal` | `datetime-local` | 必須 | 利用者が確認するローカル日時。永続化しない。 |
| `closesAt` | hidden | 必須 | クライアントが生成したUTC Unixミリ秒。サーバーで範囲を再検証する。 |
| `timeZone` | hidden/display | 必須 | IANAタイムゾーン名。確認表示用で、状態判定には使わない。 |
| `contentAcknowledged` | checkbox | 必須 | 公開情報・個人情報・機密情報・危害目的に関する自己確認。永続化しない。 |
| `expectedUpdatedAt` | hidden | 編集時必須 | 読み込んだDraftの `updatedAt`。競合更新検出に使う。 |

### ValidatedQuestionDraft

入力契約を通過したApplication内部値。

| フィールド | 型 | 意味 |
| --- | --- | --- |
| `body` | 文字列 | 前後空白を除いた本文。 |
| `language` | `auto` | 既存Schemaへ保存する内部互換値。回答言語の指定には使わない。 |
| `closesAt` | number | 検証済みUTC Unixミリ秒。 |
| `revealsAt` | number | `closesAt` と同値。 |

### QuestionFormErrors

`body`、`closesAt`、`contentAcknowledged`、`form` の各keyに英語メッセージを最大1件ずつ持つ。画面は該当入力へ `aria-describedby` と `aria-invalid` で関連付け、先頭のerror summaryから各項目へ移動できる。

### OwnedQuestionSummary

| フィールド | 由来 | 外部表示 |
| --- | --- | --- |
| `question` | 本人所有Question | 本文の先頭、状態、締切、状態別導線に使用。 |
| `answerCount` | Answerの集計 | 数値だけ表示。Answer内容・投稿者は含めない。 |

## 関係と境界

```text
Authenticated User 1 ─── 0..* owned Question
Question 1 ─── 0..* Answer ── count only ──> OwnedQuestionSummary
QuestionDraftForm ── validate(now) ──> ValidatedQuestionDraft
ValidatedQuestionDraft ── create/update ──> Question(DRAFT)
Question(DRAFT) ── publish(now) ──> Question(OPEN)
```

- 管理用取得は常に `question.id + creatorUserId` を条件にする。
- 他人所有と存在しないQuestionは、外部から同じ「利用不可」として扱う。
- Answer集計はQuestion所有者の一覧にだけ結び付き、Answerの所有者情報を表示モデルへ渡さない。

## 入力状態遷移

```text
New Form
  ├── invalid ──> New Form + field errors + preserved values
  └── valid ────> DRAFT

DRAFT
  ├── valid edit + matching updatedAt ──> DRAFT(updated)
  ├── stale edit / already published ──> conflict, no overwrite
  └── review + explicit publish
        ├── valid at execution time ────> OPEN
        └── invalid/stale ──────────────> DRAFT or latest state, no publish

OPEN/CLOSED/REVEALED
  └── edit or publish ──> rejected, stored values unchanged
```

## Repository操作

| 操作 | 主条件 | 成功結果 | 安定した失敗分類 |
| --- | --- | --- | --- |
| `createDraft` | creator存在、検証済み入力 | `created` | `creator-missing`、`invalid`、`unavailable` |
| `getOwnedQuestion` | idとcreator一致 | Question | `null`（missingとother ownerを統合） |
| `updateDraft` | id、creator、Draft、expectedUpdatedAt一致 | `updated` | `unavailable-to-owner`、`conflict`、`invalid`、`unavailable` |
| `publish` | id、creator、Draft、締切範囲、close=reveal | `published` | `unavailable-to-owner`、`invalid-transition`、`unavailable` |
| `listByCreator` | creator一致 | `OwnedQuestionSummary[]` | `unavailable` |

RouteはRepositoryの内部分類を、[Question管理契約](contracts/question-management_ja.md)の外部応答へ変換する。
