# データモデル: 回答公開体験とチャレンジ向け視覚設計

本SPECは新しい永続化表を追加せず、既存の質問・回答・監査記録から、ホーム投影、状態別ページ投影、公開回答項目、作成意図、画面内の操作状態を構成する。

## 既存の永続化エンティティ

### Question

- `id`: 質問の一意識別子。新規作成時は画面へ発行した`creationToken`と同じ値を使い、再送時の一意性を保証する。
- `creatorUserId`: 所有者。削除認可ではセッション由来利用者と一致する必要がある。
- `body`: 質問本文。常に未信頼文字列として表示する。
- `publishedAt`: `null`なら下書き、値があれば公開済み。即時公開では作成時刻と同じ値を設定する。
- `closesAt`、`revealsAt`: 回答締切と公開時刻。新規作成では既存どおり同値とする。
- `createdAt`、`updatedAt`: サービス側時刻。既存の競合検出と順序判定に使う。

### Answer

- `id`: 回答の一意識別子。
- `questionId`: 対象質問。質問削除時は既存の外部キー規則で連鎖削除する。
- `userId`: 回答者。公開比較画面へ返さない。
- `excerpt`: 要約文。`REVEALED`状態かつ認証済み人向けSSRだけが一覧取得できる。
- `body`: 回答本文。`REVEALED`状態かつ認証済み人が1件を明示選択した詳細取得だけが返す。
- `createdAt`: 公平で安定した公開順の第一キー。
- `updatedAt`: 本人回答管理には使うが、公開順には使わない。

### AuditLog

- 既存の`id`、`actorUserId`、`action`、`targetType`、`targetId`、`outcome`、`createdAt`を使う。
- 所有者削除では`action = QUESTION_DELETED`、`targetType = QUESTION`、`actorUserId = creatorUserId`を記録する。
- 質問本文、回答本文、要約文、メールアドレス、Cookie、Tokenを含めない。
- 質問との外部キーを持たないため、質問削除後も監査記録を維持する。

## 読み取り投影

### QuestionListItem

| 項目 | 規則 |
| --- | --- |
| `question` | 公開済み質問の公開可能項目。`creatorUserId`は画面へ出さない |
| `answerCount` | 対象質問の回答件数。回答内容は含めない |
| `viewerSubmission` | `not-submitted`、`submitted`、`unavailable`。ホームの回答受付中5件で認証済み利用者にだけ計算する |

不変条件:

- 回答本文、要約文、回答識別子、回答者、個別回答時刻を含めない。
- 未認証、認証確認失敗、本人回答取得失敗を未回答として扱わない。

### HomeQuestionCollection

| 項目 | 規則 |
| --- | --- |
| `openItems` | `getQuestionState(question, snapshotNow) === OPEN`、最大5件 |
| `revealedItems` | `getQuestionState(question, snapshotNow) === REVEALED`、最大10件 |
| `snapshotNow` | 両区分と残り時間が共有する要求単位の時刻 |

順序:

- `openItems`: `closesAt ASC, id ASC`
- `revealedItems`: `revealsAt DESC, id DESC`

同じ質問を両区分へ含めない。

### QuestionListPage

| 項目 | 規則 |
| --- | --- |
| `kind` | `open`または`revealed` |
| `items` | 現在ページの質問一覧項目。最大20件 |
| `page` | 1から始まる現在ページ |
| `pageSize` | 固定値20 |
| `totalItems` | 同じ`kind`と`snapshotNow`に一致する総件数 |
| `totalPages` | `max(1, ceil(totalItems / pageSize))` |
| `hasPrevious` | `page > 1` |
| `hasNext` | `page < totalPages` |
| `snapshotNow` | 状態絞り込みと表示が共有する要求単位の時刻 |

ページ指定規則:

- 未指定は1。
- ASCII数字だけからなる安全な正の整数を受理する。
- 0、負数、小数、指数表記、空文字、上限を超える整数は不正指定とする。
- 不正指定と範囲外ページは質問を返さず、1ページ目への導線を持つ安全な画面状態にする。

### RevealedAnswerItem

| 項目 | 規則 |
| --- | --- |
| `id` | 詳細取得に使う回答識別子。`REVEALED`状態の認証済み人向けだけに返す |
| `position` | `createdAt ASC, id ASC`の結果へ1から付ける表示連番 |
| `excerpt` | 初期HTMLへ含める要約文 |
| `bodyState` | クライアント内だけの`collapsed`、`loading`、`expanded`、`error` |
| `body` | `expanded`時にだけクライアントメモリーへ保持する取得済み本文 |

不変条件:

- `userId`、利用者名、メールアドレス、`createdAt`、`updatedAt`を公開画面へ出さない。
- 本文取得失敗時に別回答の本文を再利用しない。
- 1件を展開しても他の`expanded`項目を閉じない。

## 入力・操作モデル

### QuestionCreationRequest

| 項目 | 規則 |
| --- | --- |
| `creationToken` | 新規作成画面ごとにサーバーが発行するUUID。質問`id`として使う |
| `intent` | `draft`または`publish`のどちらか |
| `body` | 既存の10〜1,000書記素規則 |
| `closesAtLocal` | 利用者へ表示するローカル日時 |
| `closesAt` | サーバー検証に使うUnixミリ秒 |
| `timeZone` | ブラウザーが解決したIANAタイムゾーン |
| `contentAcknowledged` | 公開内容確認。両方の作成意図で必須 |

状態遷移:

```text
valid + draft   -> DRAFT
valid + publish -> OPEN
same token replay -> existing DRAFT or OPEN; no second Question
invalid input   -> no persistence
token collision with another owner or different payload -> safe conflict
```

### DefaultDeadline

| 項目 | 規則 |
| --- | --- |
| `localValue` | `datetime-local`へ設定する`YYYY-MM-DDTHH:mm` |
| `timestamp` | ローカル値を解釈したUnixミリ秒 |
| `timeZone` | ブラウザーが解決したIANAタイムゾーン |

- 現地日付の翌日0時を候補とする。
- 候補が現在から1時間未満なら翌々日0時へ進める。
- 夏時間で0時が補正された場合は、同じ現地日付の有効な開始時刻を表示する。
- 既存の30日上限を超えてはならない。

### QuestionDeletionRequest

| 項目 | 規則 |
| --- | --- |
| `questionId` | 経路から得る対象識別子 |
| `actorUserId` | セッションから得る実行者 |
| `confirmDeletion` | 固定値`on`の明示確認 |
| `expectedUpdatedAt` | 確認画面で見た質問版。途中変更を検出する |

結果:

```text
deleted
unavailable-to-owner
conflict
confirmation-required
unavailable
```

削除成功時だけ`QUESTION_DELETED`監査記録と質問削除を同一処理で確定する。

### SubmissionGuard

- 対象フォームごとに`idle`または`submitting`を持つ。
- 最初の有効な`submit`で`submitting`となり、送信ボタンを無効化して処理中の英語表示を設定する。
- ブラウザー標準の入力検証が失敗した場合は`idle`のままにする。
- サーバーからHTMLが返り同じ画面へ残る場合は、新しい画面の`idle`状態から再開する。

## 状態と公開範囲

| 質問状態 | ホーム／一覧 | 認証済み人の要約文 | 認証済み人の他者本文 | 未認証者 | WebMCP |
| --- | --- | --- | --- | --- | --- |
| `DRAFT` | 非表示 | 非公開 | 非公開 | 不存在と同じ | 不存在と同じ |
| `OPEN` | 回答受付中一覧 | 非公開 | 非公開 | 公開質問情報のみ | 選択質問と本人回答のみ |
| `CLOSED` | 両一覧から除外 | 非公開 | 非公開 | 公開質問情報のみ | 他者回答なし |
| `REVEALED` | 公開済み一覧 | 認証済み人だけ | 選択した1件だけ | 質問情報と認証導線 | 他者回答なし |
