# 内部契約: Questionライフサイクルと永続化境界

## 範囲

SPEC 005は新しいHTTP API、WebMCP Tool、画面を公開しない。この文書は、後続の画面・API・WebMCPが共通利用するDomainとRepositoryの内部契約を固定する。

## Question状態契約

### 入力

```text
QuestionSchedule {
  publishedAt: number | null
  closesAt: number
  revealsAt: number
}

now: number
```

すべてUTC Unixミリ秒とする。

### 出力

```text
QuestionState = "DRAFT" | "OPEN" | "CLOSED" | "REVEALED"
```

### 判定

1. `publishedAt === null`なら `DRAFT`。
2. `now >= revealsAt`なら `REVEALED`。
3. `now >= closesAt`なら `CLOSED`。
4. それ以外は `OPEN`。

この関数は保存や現在時刻の取得を行わない。呼び出し側は1操作につき1つの `now` を渡す。

## Question時刻検証契約

公開済みQuestionは次をすべて満たす。

- `publishedAt <= now`
- `publishedAt < closesAt`
- `closesAt <= revealsAt`

Draftは `publishedAt === null` とし、Answerを受け付けない。公開済みQuestionの `publishedAt` を `null`へ戻す変更と、変更前の状態より前へ戻る時刻変更を拒否する。

## Repository操作

### `getQuestion(questionId)`

- 存在すれば完全なQuestionを返す。
- 存在しなければ `null` を返す。
- 状態は返却時に固定せず、利用時の `now` でDomain契約から求める。

### `createDraft(input, now)`

- 認証済み `creatorUserId`、本文、主言語、締切、Reveal時刻を持つDraftを作る。
- `publishedAt`は必ず `null`。
- 存在しないUser、空の本文・言語、不正な時刻順序を拒否する。
- 詳細な本文・言語・締切入力規則はSPEC 006で追加する。

### `publish(questionId, creatorUserId, now)`

- 対象Questionが存在し、指定Userが作成者で、現在 `DRAFT`、かつ `now < closesAt <= revealsAt` の場合だけ `publishedAt = now` を確定する。
- 同時に複数回実行しても最初の1回だけが確定する。
- 公開済み、締切到達済み、作成者不一致を区別可能な結果で拒否する。

### `submit(questionId, userId, input, now)`

- `publishedAt !== null && publishedAt <= now && now < closesAt`を満たすQuestionにだけAnswerを作成する。
- `userId`は認証境界から受け取り、入力本文から取得しない。
- 同じQuestionとUserのAnswerは1件だけ確定する。
- Question状態条件、Answer保存、DB制約判定に同じ `now` を使う。
- 重複、Question不存在、Question非公開・締切済み、参照先不存在、想定外保存障害を区別する。

### 既存読み取り操作

本人Answer、回答数、Excerpt一覧、Answer本文の取得操作は維持する。公開可否はSPEC 008で定義し、このRepositoryは呼び出し元の認可判断を代替しない。

## 結果コード

内部結果は少なくとも次を区別する。外部向け文言とHTTP／Tool errorへの変換は後続SPECの責務とする。

| コード | 意味 | Retry |
| --- | --- | --- |
| `QUESTION_NOT_FOUND` | 対象Questionが存在しない | 不可 |
| `CREATOR_NOT_FOUND` | Draftの作成者Userが存在しない | 不可 |
| `CREATOR_MISMATCH` | 公開要求者がQuestion作成者でない | 不可 |
| `INVALID_QUESTION` | 本文、言語、時刻順序が不正 | 修正後可 |
| `INVALID_TRANSITION` | 現在状態から許可されない変更 | 不可 |
| `QUESTION_NOT_OPEN` | Draft、締切済み、Reveal済み | 不可 |
| `ANSWER_ALREADY_SUBMITTED` | 同一Question・UserのAnswerが存在 | 不可 |
| `REFERENCE_NOT_FOUND` | UserまたはQuestion参照が存在しない | 不可 |
| `INVALID_ANSWER` | Answer本文またはExcerptがDB制約を満たさない | 修正後可 |
| `PERSISTENCE_UNAVAILABLE` | 想定外のD1障害 | 可 |

## 一貫性

- DBの一意制約と外部キー制約を最終判定源とする。
- 制約エラーをすべて重複扱いせず、必要な再照会で安定した結果へ分類する。
- Answer作成の状態条件は書き込み文自体に含める。
- 複数書き込みが不可欠な場合だけD1 `batch()`を使い、途中失敗時は一部成功を返さない。
- Domain契約の状態判定とRepository内の状態条件を別の境界規則にしてはならない。
