# データモデル: Challenge Core閲覧フロー

本SPECは既存D1 Schemaを変更せず、Home用投影と一時的な表示状態だけを追加する。

## 既存Entity

### Question

- `id`、`body`、`creatorUserId`、`publishedAt`、`closesAt`、`revealsAt`を既存どおり利用する。
- 既存Schemaの `language` 列はMigration互換性のため残すが、利用者向け入力・表示・WebMCP契約には使わない。新規Questionには内部値 `auto` を保存する。
- 現在状態は保存せず、要求単位のサービス時刻から導出する。
- `creatorUserId` は作成者本人の表示判定だけに使い、公開HTMLへ値を出さない。

### Answer

- HomeとDetailでは回答数だけを集計する。
- `body`、`excerpt`、`id`、`userId`、個別時刻は、SPEC 008が許可する本人またはReveal投影以外へ返さない。

## OpenQuestionSummary

| Field | 規則 |
| --- | --- |
| `question` | `publishedAt !== null` かつ `publishedAt <= snapshotNow < closesAt` |
| `answerCount` | 対象QuestionのAnswer件数。内容は含めない |

順序は `closesAt ASC, publishedAt ASC, id ASC`。Answer本文、Excerpt、User、個別時刻を選択しない。

## ViewerPresentation

```text
anonymous
authenticated-unsubmitted
authenticated-submitted(ownAnswer)
submission-unavailable
closed
```

- `OPEN` 以外では `closed` とし、新規Promptを表示しない。
- Sessionなしは `anonymous`。
- 認証済みで本人Answerなしは `authenticated-unsubmitted`。
- 認証済みで本人Answerありは `authenticated-submitted`。
- 認証または本人Answer取得障害は `submission-unavailable` とし、未回答へ変換しない。
- Question作成者であることは上記状態を変更しない。

## DeadlinePresentation

- `absolute`: `closesAt` のISO 8601 UTC。
- `remainingMs`: `max(0, closesAt - snapshotNow)`。
- `remainingLabel`: 日・時間・分の意味のある単位。締切以後は受付終了表示。
- Question状態は残り時間から再計算せず、同じ `snapshotNow` による `getQuestionState` を正とする。

## AnswerCountPresentation

```text
0 -> 0 answers
1 -> 1 answer
n -> n answers
```

## 不変条件

- 1応答は同じ `snapshotNow` を使う。
- Homeは `OPEN` 以外とAnswer内容を取得しない。
- 未回答Promptと本人Answerを同時表示しない。
- 作成者へReveal前の追加権限を与えない。
- `OPEN` と `CLOSED` で他者Answer情報を取得・直列化しない。
- Draftとmissingを公開Detailから区別できない。
- Table、Column、Index、Migrationを変更しない。
