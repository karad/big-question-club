# 画面・操作契約: 質問作成と所有者削除

## `GET /questions/new`

認証済み利用者へ新規質問フォームを返す。

- サーバーが一意なUUIDを`creationToken`として発行し、隠し入力へ設定する。
- 質問本文、回答締切、公開内容確認を表示する。
- 回答締切はブラウザー初期化後、利用者のローカル日付で現在から1時間以上先となる最初の午前0時を設定する。
- 主要操作として`Save as draft`と`Publish question`を同じフォームに表示する。
- 未認証者は既存の認証要求画面とする。

## `POST /questions`

質問を下書き保存または即時公開する。

### 入力

```text
creationToken: UUID
intent: draft | publish
body: string
closesAtLocal: string
closesAt: Unix milliseconds string
timeZone: IANA time-zone string
contentAcknowledged: on
```

### 共通検証

- `creationToken`はUUID形式であること。
- `intent`は`draft`または`publish`だけであること。
- 本文、締切、タイムゾーン、公開内容確認は既存の入力規則を満たすこと。
- 認証利用者はセッションから取得し、入力値から受け取らないこと。

### `intent = draft`

- 成功時は`DRAFT`状態で1件作成し、`303`で既存の確認画面へ移動する。
- 同じ利用者・同じ`creationToken`の同一内容再送は2件目を作らず、既存の確認画面へ`303`で移動する。

### `intent = publish`

- 成功時は`publishedAt`を作成時刻に設定して1件作成し、`303`で公開質問詳細へ移動する。
- 下書き確認画面や追加の公開確認を挟まない。
- 同じ利用者・同じ`creationToken`の同一内容再送は2件目を作らず、既存の公開質問詳細へ`303`で移動する。

### 競合・入力不正

- 同じ`creationToken`が別所有者、別内容、別意図ですでに使われている場合は、既存質問の内容や所有者を返さない安全な`409`とする。
- 入力不正は`400`で同じフォームを返し、入力値と英語の項目別エラーを保持する。再試行用には新しい`creationToken`を発行せず元の値を維持する。
- 保存先障害は`503`とし、成功したと誤表示しない。

## フォーム二重実行防止

- `data-submission-guard`を持つすべての状態変更フォームは、ブラウザー標準検証を通過した最初の送信直後に送信操作を無効化する。
- 実行したボタンの意図は隠し入力へ確定してから無効化し、`draft`と`publish`を取り違えない。
- 処理中は`Saving draft…`、`Publishing…`、`Deleting…`など操作別の英語文言を表示する。
- サーバー側の一意性、所有者条件、状態条件は画面側制御と独立して適用する。

## 所有者削除の表示

- `My Questions`の全状態、および認証済み所有者の公開質問詳細に削除操作を表示する。
- 確認領域は質問本文の安全な抜粋、現在状態、回答数、`This permanently deletes the question and all of its answers.`を表示する。
- 削除フォームは`expectedUpdatedAt`と`confirmDeletion=on`を送る。
- 非所有者には削除操作を表示しない。

## `POST /questions/:questionId/delete`

認証済み所有者の質問を削除する。

### 入力

```text
expectedUpdatedAt: safe integer string
confirmDeletion: on
```

### 成功時

- セッション由来利用者が保存済み`creatorUserId`と一致することを同じ変更処理で確認する。
- `expectedUpdatedAt`が保存済み値と一致することを確認する。
- `QUESTION_DELETED`監査記録の追記と質問削除を同一D1バッチで実行する。
- 既存の外部キー連鎖により関連回答を削除する。
- `303`で`/my/questions`へ移動し、`Question deleted.`を表示する。

### 拒否時

- 確認なし: `400`で削除せず確認エラーを返す。
- 更新競合: `409`で削除せず最新状態の再確認を促す。
- 不存在または非所有者: 両者を区別しない既存相当の`404 Question unavailable.`を返す。
- 保存先障害: `503`で削除成功を表示しない。
- CSRF検証失敗: 既存の共通拒否を返し、変更しない。

## 監査契約

削除成功時の新規記録:

```json
{
  "actorUserId": "session-user-id",
  "action": "QUESTION_DELETED",
  "targetType": "QUESTION",
  "targetId": "question-id",
  "outcome": "SUCCESS",
  "createdAt": 0
}
```

- `createdAt`は実際のサービス時刻を使う。
- 質問本文、回答本文、要約文、回答者、Cookie、Token、OAuth値を記録しない。
- 管理者削除の`ADMIN_QUESTION_DELETED`は変更しない。

## 回答締切初期化契約

- 新規フォームで保存済み締切がない場合だけ実行する。
- 現地翌日0時が現在から1時間以上先なら採用する。
- 1時間未満なら現地翌々日0時を採用する。
- `closesAtLocal`、`closesAt`、`timeZone`、表示中のUTC時刻を同じ値から更新する。
- 画面上のローカル時刻とUTC時刻は`YYYY-MM-DD HH:mm`形式で表示し、送信値と`datetime`属性の機械可読形式は変更しない。
- 編集画面、入力エラー後の再表示、既存下書きでは保存済み値を上書きしない。
