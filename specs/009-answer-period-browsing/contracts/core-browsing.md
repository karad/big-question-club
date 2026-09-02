# 契約: Challenge Core閲覧画面

## Route

| Method | Path | 認証 | 目的 | 成功 |
| --- | --- | --- | --- | --- |
| `GET` | `/` | 任意 | Open Question一覧 | 200 HTML |
| `GET` | `/questions/{id}` | 任意 | Question Detail | 200 HTML |

既存 `/api/auth/*`、Question管理Route、WebMCP Tool Routeは変更しない。

## Home

- `OPEN` Questionだけを `closesAt ASC, publishedAt ASC, id ASC` で表示する。
- 各項目: Question本文、`English|Japanese`、`0 answers|1 answer|n answers`、`Answers are sealed`、UTC絶対締切、非負の残り時間、Detail link。
- 空状態: `No open questions right now.`。
- 取得障害: 503と `Questions are temporarily unavailable. Try again.`。空状態へ変換しない。
- Answer本文、Excerpt、ID、User、個別時刻をHTMLへ含めない。

## Question Detail

### 共通公開情報

- Question本文、状態、回答数、UTC絶対締切、残り時間。
- 作成者本人には本人である表示、その他には個人情報を含まない一般表示。
- Question本文は未信頼テキストとして表示する。

### `OPEN`・未ログイン

- `Answers are sealed`
- 独立回答のため締切まで非公開である説明
- `Sign in to answer with your personal agent.` と既存Google Sign inへの導線
- Agent Prompt、本人Submission、他者Answer情報は0件

### `OPEN`・認証済み未回答

- SPEC 007の `Ask your personal agent`、固定Prompt、`Copy prompt`、Clipboard status
- 本人Submissionと他者Answer情報は0件

### `OPEN`・認証済み回答済み

- `Your agent has answered.`
- `Your answer remains sealed until the deadline.`
- 本人Answer
- 新規Promptと他者Answer情報は0件

### `CLOSED`

- 回答受付終了とsealed継続
- 新規Promptと他者Answer情報は0件
- 認証済み本人AnswerはSPEC 008どおり確認可能

### `REVEALED`

- 新規Promptは0件
- SPEC 008の最小Reveal閲覧を維持する
- 完成版のAnswer比較・Visual表現はSPEC 010で定義する

### Error

| 状況 | Status | 表示 |
| --- | --- | --- |
| missingまたはDraft | 404 | 同一の `Question unavailable.` |
| Home取得障害 | 503 | `Questions are temporarily unavailable. Try again.` |
| Detail公開情報取得障害 | 503 | `Question is temporarily unavailable. Try again.` |
| 本人状態取得障害 | 200 | `Your submission status is temporarily unavailable. Try again.`、PromptとPrivate情報なし |

## Response境界

- 利用者ごとに内容が変わるDetailは `Cache-Control: private, no-store` と `Vary: Cookie` を維持する。
- 1要求の状態と残り時間は同じサービス時刻Snapshotを使う。
- `OPEN` と `CLOSED` では他者Answerの本文、Excerpt、ID、User、個別時刻を本文、属性、埋め込みデータ、Errorへ含めない。
- Application UIは英語、Question本文と本人Answerは入力されたテキストのまま表示する。
