# データモデル: WebMCP MVP Tool群

## エンティティ

### Question

| フィールド | 型 | 規則 |
| --- | --- | --- |
| `id` | string | 不透明な一意識別子。コピペ用プロンプトへ埋め込む唯一の可変値。 |
| `body` | string | 10〜1,000表示文字。未信頼の利用者生成コンテンツ。 |
| `language` | 文字列 | 既存Schemaとの互換性だけに使い、Tool Viewへ含めない。新規Questionは `auto`。 |
| `publishedAt` | timestamp / null | nullなら `DRAFT`。 |
| `closesAt` | timestamp | `now < closesAt` の間だけAnswer作成・更新・削除が可能。 |
| `revealsAt` | timestamp | Human向け公開状態を決める。WebMCPの他者非公開規則は変えない。 |

Questionの状態はSPEC 005の共通判定で `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` の1つへ導出し、保存された状態名を追加しない。

### Answer

| フィールド | 型 | 規則 |
| --- | --- | --- |
| `id` | string | 一意識別子。Tool入出力には含めない。 |
| `questionId` | string | Questionへの必須参照。 |
| `userId` | string | Sessionから決めるUserへの必須参照。Tool入力にしない。 |
| `body` | string | 空白のみ不可、1〜5,000表示文字。公開を前提とする。 |
| `excerpt` | string | 空白のみ・改行不可、1〜160表示文字。 |
| `createdAt` | timestamp | 最初の投稿時刻。更新しても変えない。 |
| `updatedAt` | timestamp | 作成時は `createdAt` と同じ。更新時にサービス側時刻へ進める。 |

制約:

- `UNIQUE(question_id, user_id)` により同一User・QuestionのAnswerは同時点で最大1件。
- Answerの更新・削除は同じ `questionId` とSession由来 `userId` を条件にする。
- Answer削除はHard Deleteであり、Answer ID、本文、Excerpt、時刻を残さない。
- QuestionまたはUserの参照整合性は既存外部キー規則を維持する。
- DBは空白のみ、Excerpt改行、一意性、参照整合性を防御し、表示文字上限は共通Domain契約が投稿・更新の両方へ強制する。

### Agent Request Prompt

永続化しない表示モデル。

| フィールド | 型 | 規則 |
| --- | --- | --- |
| `questionUrl` | string | リクエスト元のOriginとQuestion Pathから生成した絶対URL。QueryとFragmentを除外し、HTMLとPromptで安全なテキストとして扱う。 |
| `prompt` | string | 短い英語テンプレートへ `questionUrl` だけを埋め込んだ全文。Question本文を含めない。 |
| `visible` | boolean | 認証済み、Questionが `OPEN`、本人Answerなしの全条件を満たす場合だけtrue。 |
| `statusMessage` | string | コピー成功、失敗、非表示理由を示す英語文言。 |

### Question Tool View

永続化しないAgent向けDTO。

| フィールド | 型 | 規則 |
| --- | --- | --- |
| `id` | string | Humanが指定したQuestion IDと一致。 |
| `question` | string | 未信頼本文。 |
| `closesAt` | ISO timestamp | 絶対時刻。 |
| `instructions` | object | 利用可能なUser Context参照元、根拠の優先順位、事実と検討の区別、根拠不足時の確認、Private Context非開示、投稿許可、投稿確認を示す固定契約。 |

作成者、回答数、本人状態、他者Answer、Session情報は含めない。

### My Submission View

永続化しない本人限定DTO。

- 未投稿: `questionId`、`status: not_submitted`
- 投稿済み: `questionId`、`status: submitted`、本人の `answer`、`excerpt`、`submittedAt`、`updatedAt`

他者Answerの有無によって未投稿応答を変えない。

## Answer状態遷移

```text
not_submitted
    └── submit_answer [OPEN] ──> submitted

submitted
    ├── update_answer [OPEN] ──> submitted（同じID、本文・Excerpt・updatedAt更新）
    ├── remove_answer [OPEN] ──> not_submitted
    └── deadline reached ──> locked

not_submitted after removal
    └── submit_answer [OPEN] ──> submitted（新しいID）

locked
    └── submit/update/remove ──> QUESTION_CLOSED（状態変更なし）
```

| 現在状態 | 操作 | 条件 | 結果 |
| --- | --- | --- | --- |
| 未投稿 | submit | `OPEN` | Answerを1件作成 |
| 投稿済み | submit | `OPEN` | `ANSWER_ALREADY_SUBMITTED` |
| 投稿済み | update | `OPEN` | 本人Answerの本文・Excerpt・更新時刻を置換 |
| 投稿済み | remove | `OPEN` | 本人Answerを削除 |
| 未投稿 | update / remove | `OPEN` | `ANSWER_NOT_FOUND` |
| 任意 | submit / update / remove | 非 `OPEN` | `QUESTION_CLOSED` |

## 競合規則

- 同時submitは一意制約により最大1件だけ成功する。
- updateとremoveは条件付き単一Statementの確定順に従い、remove後の遅延updateは `ANSWER_NOT_FOUND` となる。
- removeと再submitが競合しても、一意制約により最終的な本人Answerは最大1件である。
- 競合結果の再確認は `get_my_submission` を使い、Tool側で成功を推測しない。

## Migration

`0005_answer_revisions.sql` は既存Answerを保持して表を再構築する。

1. 新Answer表へ既存の `id`、`question_id`、`user_id`、`body`、`excerpt`、`created_at` をコピーする。
2. `updated_at` を既存 `created_at` で初期化する。
3. 外部キー、一意制約、Question別作成時刻Indexを再作成する。
4. SQLのコードポイント上限CHECKをDomainの書記素上限へ移し、空白のみとExcerpt改行禁止CHECKは維持する。
5. Migration後に既存Answerの件数、所有者、本文、Excerpt、作成時刻が欠落していないことを検証する。
