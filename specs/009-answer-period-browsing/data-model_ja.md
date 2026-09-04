# データモデル: Challenge Core閲覧フロー

本SPECは既存Entityを維持し、Home用投影、一時的な表示状態、公開運用向けのBANと監査Entityを追加する。

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

## AgentRequestPresentation

- `prompt`: `Use ChatGPT's built-in browser, not an existing Chrome tab, to open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}` の確定済み1行文面。
- `questionUrl`: 閲覧中リクエストのOriginとQuestion Pathから生成した絶対URL。QueryとFragmentを含めない。
- Question本文、User情報、認証情報、Answer情報をPromptへ含めない。
- Tool名、呼出順、入力制約、安全上の詳細はPromptへ重複させず、WebMCP Tool契約からAgentへ提供する。
- 初回Promptの送信を回答作成・投稿の許可とし、追加Previewや承認は要求しない。
- WebMCP Tool契約は、利用可能なUser Context参照元、User自身の記述の優先、事実と比較・検討の区別、Assistant提案の除外、明示的な個人見解がない場合の代理回答、未確認事実の非断定、不要な確認質問の禁止、Private Context非開示、投稿結果確認を固定instructionとして返す。

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

## BannedUser

| Field | 規則 |
| --- | --- |
| `userId` | BAN対象Userの一意識別子。主キー。 |
| `bannedByUserId` | 操作した管理者User ID。 |
| `reason` | 管理者が選ぶ固定理由。初期値は `Policy violation`。 |
| `bannedAt` | サービス側Unixミリ秒。 |

- BAN時に対象Userの全Sessionを削除する。
- BAN中はSession作成前に拒否する。
- BAN解除は行を削除する。User、Question、Answerは削除しない。
- 管理者自身はBAN対象にできない。

## AuditLog

| Field | 規則 |
| --- | --- |
| `id` | 一意識別子。 |
| `actorUserId` | 操作を実施したUser ID。外部キーにせず履歴を維持する。 |
| `action` | `LOGIN`、`LOGOUT`、`QUESTION_CREATED`、`QUESTION_UPDATED`、`QUESTION_PUBLISHED`、`ANSWER_SUBMITTED`、`ANSWER_UPDATED`、`ANSWER_REMOVED`、`ADMIN_QUESTION_DELETED`、`ADMIN_ANSWER_DELETED`、`USER_BANNED`、`USER_UNBANNED`。 |
| `targetType` | `SESSION`、`QUESTION`、`ANSWER`、`USER`。 |
| `targetId` | 操作対象の識別子。 |
| `outcome` | 確定済み記録は `SUCCESS`。 |
| `createdAt` | サービスまたはDBが確定したUnixミリ秒。 |

- 追記専用で、管理画面から編集・削除しない。
- Question本文、Answer本文、Excerpt、Email、Cookie、Token、OAuth値を含めない。
- `createdAt DESC, id DESC` で表示する。

## AdminDashboard

永続化しない管理者限定投影。

- `users`: User基本情報とBAN状態。
- `questions`: 全Question、作成者、状態、時刻。
- `answers`: 全Answer、Excerpt、本文、投稿者、Question、時刻。
- `auditLogs`: Actor、Action、Target、Outcome、時刻。

## 不変条件

- 1応答は同じ `snapshotNow` を使う。
- Homeは `OPEN` 以外とAnswer内容を取得しない。
- 未回答Promptと本人Answerを同時表示しない。
- 作成者へReveal前の追加権限を与えない。
- `OPEN` と `CLOSED` で他者Answer情報を取得・直列化しない。
- Draftとmissingを公開Detailから区別できない。
- 管理画面と管理操作は、設定済み管理者EmailとSession UserのDB Emailが一致する場合だけ利用できる。
- 管理画面はprivate no-storeとし、一般画面のAnswer非露出規則を変更しない。
- `audit_logs` は削除対象との外部キーを持たず、対象削除後も維持する。
