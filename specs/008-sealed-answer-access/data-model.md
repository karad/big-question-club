# データモデル: Sealed Answersのアクセス制御

本SPECは既存D1 Schemaを変更しない。永続化Entityと外部投影を区別する。

## 永続化Entity

### Question

- `id`、`creatorUserId`、`body`、`language`、`publishedAt`、`closesAt`、`revealsAt`を既存どおり利用する。
- 現在状態は保存せず、要求単位のサービス側時刻から4状態の1つを導出する。
- `creatorUserId` はReveal前の閲覧特権に使わない。

### Answer

- `id` はReveal後のHuman向けExcerpt一覧と詳細だけに返す。
- `questionId` は指定Questionとの整合に使い、別Questionとの対応を漏らさない。
- `userId` は本人判定に使い、他者Answer投影へ返さない。
- `body`／`excerpt` は本人、またはReveal後に許可されたHuman投影だけへ返す。
- `createdAt`／`updatedAt` は本人Answerだけへ返す。

## 認可入力

`AccessContext` は `authenticated`、Session由来 `userId`、Route用途 `channel`、導出済み `questionState`、`resource`（`answer-count`、`own-answer`、`other-excerpts`、`other-body`）を持つ。`AccessDecision` は許可可否だけを返し、拒否理由やAnswer実在性を公開しない。

## 外部投影

- **AnswerCountView**: `{ answerCount }`。公開済みQuestionの認証済みHuman向けSSRだけ。
- **OwnSubmissionView**: 未投稿状態、または本人の本文、Excerpt、投稿時刻、更新時刻。他者状態で形を変えない。
- **RevealedExcerptView**: `{ id, excerpt }`。`REVEALED` の認証済みHuman向けSSRだけ。本文、User、時刻なし。
- **RevealedBodyView**: `{ id, body }`。`REVEALED` の認証済みHuman向け詳細HTTPで指定1件だけ。

## 状態と投影

```text
DRAFT      -> 公開投影なし
OPEN       -> Human SSR: count + own / 本人状態HTTP・WebMCP: own only
CLOSED     -> Human SSR: count + own / 本人状態HTTP・WebMCP: own only
REVEALED   -> Human SSR: count + excerpts（本文0件） / 詳細HTTP: selected body / 本人状態HTTP・WebMCP: own only
```

## 不変条件

- 1応答の投影は同じQuestion状態Snapshotを使う。
- Answer取得前に該当情報種別の認可を完了する。
- 他者投影に `userId`、`createdAt`、`updatedAt` を含めない。
- 詳細拒否は実在、不在、別Questionで同じにする。
- 利用者依存応答を別Sessionへ再利用しない。
- Table、Column、Index、Migrationを変更しない。
