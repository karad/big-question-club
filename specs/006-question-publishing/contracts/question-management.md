# 契約: Human向けQuestion管理

## 共通規則

- すべての画面・操作はBetter Authの有効なHuman向けSessionを要求する。
- UI文言、label、button、errorは英語とする。
- unsafe methodは同一OriginのHTML Formだけを受け付け、CSRF検証を通過しなければならない。
- Question本文はtext nodeとして描画し、HTML、script、markdown、Agentへの命令として解釈しない。
- 他人所有のQuestionと存在しないQuestionは、どの管理経路でも同じ404と `Question unavailable.` を返す。
- 成功した変更はredirectし、同じFormの再送信を避ける。

## Route一覧

| Method | Path | 目的 | 成功 |
| --- | --- | --- | --- |
| `GET` | `/questions/new` | 作成Form | 200 HTML |
| `POST` | `/questions` | Draft作成 | 303 `/questions/{id}/review` |
| `GET` | `/questions/{id}/edit` | 本人Draft編集Form | 200 HTML |
| `POST` | `/questions/{id}/edit` | 本人Draft更新 | 303 `/questions/{id}/review` |
| `GET` | `/questions/{id}/review` | 公開前確認 | 200 HTML |
| `POST` | `/questions/{id}/publish` | 公開確定 | 303 `/questions/{id}` |
| `GET` | `/my/questions` | 本人Question一覧 | 200 HTML |

具体的なpath `/questions/new` は既存の `/questions/{questionId}` より先に登録し、識別子として解釈させない。

## Form field

### Draft作成・編集

`application/x-www-form-urlencoded` または `multipart/form-data`:

| Name | 型 | 必須 | 契約 |
| --- | --- | --- | --- |
| `body` | string | yes | trim後10〜1,000書記素。 |
| `language` | string | yes | `en` または `ja`。 |
| `closesAtLocal` | string | yes | `datetime-local`表示値。エラー再表示用。 |
| `closesAt` | integer string | yes | UTC Unixミリ秒。サービス時刻から1時間以上30日以内。 |
| `timeZone` | string | yes | 表示・確認用IANAタイムゾーン。状態判定には不使用。 |
| `contentAcknowledged` | `on` | yes | 未選択は拒否。 |
| `expectedUpdatedAt` | integer string | edit only | 読み込んだDraftの更新時刻。 |

### 公開

| Name | 型 | 必須 | 契約 |
| --- | --- | --- | --- |
| `confirmPublication` | `on` | yes | 不可逆性とsealed期間を確認した明示操作。 |
| `expectedUpdatedAt` | integer string | yes | ReviewしたDraftの更新時刻。 |

公開実行時は保存済み本文、言語、締切、`revealsAt === closesAt`、締切範囲、Draft状態、所有者を再検証する。

## 画面契約

### Create/Edit

- `Question` textareaと現在文字数
- `Primary language`: `English` / `Japanese`
- `Answer deadline` のローカル日時
- `Time zone` と `UTC deadline` のread-only確認
- `I understand this question will be public and must not include personal, confidential, or harmful content.` checkbox
- `Save draft` button
- 項目別errorと先頭のerror summary

### Review

- 完全なQuestion本文、主言語、ローカル締切、タイムゾーン、UTC締切
- `Answers remain sealed until the deadline.`
- `You cannot edit this question after publishing.`
- `I have reviewed this question and want to publish it.` checkbox
- `Edit` linkと `Publish question` button

### My Questions

- 本人所有Questionだけを `createdAt DESC, id DESC` で表示する。
- 各項目は本文の先頭、`DRAFT`／`OPEN`／`CLOSED`／`REVEALED`、締切、`Answers: {count}` を表示する。
- `DRAFT`: `Edit`、`Review and publish`。
- 公開済み: `View question`。
- 空状態: `You haven't created any questions yet.` と `Create a question`。

## 応答とエラー

| 状況 | Status | 外部表示／動作 |
| --- | --- | --- |
| 未認証GET | 401 | `Sign in to manage questions.` とsign-in導線 |
| 未認証POST | 401 | 変更なし。同じ認証案内 |
| CSRF拒否 | 403 | 変更なし。Question情報を含めない |
| Form不正 | 400 | 同じForm、項目別error、有効な入力値を保持 |
| missing／other owner | 404 | `Question unavailable.` |
| stale edit | 409 | `This draft changed. Review the latest version and try again.` |
| already published edit/publish | 409 | `This question has already been published.` |
| deadline too soon/late at publish | 400 | `Choose a deadline between 1 hour and 30 days from now.` |
| 一時障害 | 503 | `Question management is temporarily unavailable. Try again.` |

項目別error:

- body不足: `Enter at least 10 characters.`
- body超過: `Enter no more than 1,000 characters.`
- language: `Choose English or Japanese.`
- deadline形式: `Choose a valid answer deadline.`
- deadline範囲: `Choose a deadline between 1 hour and 30 days from now.`
- content確認: `Confirm that this question is suitable for public posting.`
- publication確認: `Confirm that you want to publish this question.`

## 非公開情報の除外

Question管理のResponseは次を含めない。

- 他人のDraftまたはその存在を示す差分
- Answer本文、Excerpt、投稿者User ID
- Session token、email、OAuth情報
- 内部DB error、Query、stack trace
