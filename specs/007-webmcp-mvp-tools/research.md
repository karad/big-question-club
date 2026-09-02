# 技術調査: WebMCP MVP Tool群

## 判断 1: Agent向けの本番Tool面を5 Toolへ限定する

- **決定**: WebMCPへ登録する本番Toolを `get_question`、`submit_answer`、`update_answer`、`remove_answer`、`get_my_submission` の5件に限定し、P0検証用のQuestion取得Toolと `who_am_i` は本番登録から外す。各Toolは名前、英語description、厳密な入力Schema、状態変更annotation、実行関数を個別に持つ。
- **根拠**: ChromeのImperative APIはToolの名前、description、入力Schemaを主要なAgent契約としており、公開Capabilityを小さくするほどAgentの誤選択と意図しないトークン消費を抑えられる。Question一覧・検索Toolを登録しなければ、Agent自身が回答対象を探索する導線も作られない。
- **検討した代替案**: P0検証Toolを本番Toolと併存させる案は、利用目的が重複してAgentのTool選択を曖昧にするため不採用。単一の汎用 `manage_answer` Toolは操作ごとの確認意図とSchemaが不明確になるため不採用。
- **参照**: [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## 判断 2: Tool出力の信頼境界をannotationと固定descriptionで示す

- **決定**: `get_question` と `get_my_submission` は `readOnlyHint: true`、3つの書き込みToolは `readOnlyHint: false` とする。Question本文または本人Answerを返す読み取りToolは `untrustedContentHint: true`、本文を返さない書き込み結果は `false` とする。Question本文は固定instructionと別フィールドで返し、descriptionにはQuestion探索禁止、Private Context非開示、更新・削除はHumanの明示依頼時だけという境界を含める。
- **根拠**: Chromeの公式セキュリティガイドは、利用者生成コンテンツを返すToolへ `untrustedContentHint`、状態変更しないToolへ `readOnlyHint` を付けることを推奨している。descriptionだけに安全性を委ねず、サーバーの認証・本人限定Repository・非公開DTOと組み合わせる必要がある。
- **検討した代替案**: 全Toolを未信頼扱いにする案は状態だけの成功応答まで同じ扱いになり区別が弱まるため不採用。annotationなしはAgentが確認要否と未信頼データを判断しづらいため不採用。
- **参照**: [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

## 判断 3: Toolは同一Originの専用HTTP契約を呼び出す

- **決定**: 各WebMCP Toolは同一Originの相対URLだけを `fetch` し、CookieやTokenを入力・出力しない。`get_question` と `get_my_submission` は既存GET経路を契約へ合わせ、`update_answer` と `remove_answer` は本人Answer用の同一路径へ `PUT` と `DELETE` で追加する。全応答を `Cache-Control: no-store` とし、AbortSignalを `fetch` へ渡す。
- **根拠**: 既存の認証済みブラウザーSessionを自然に利用でき、Tool層とHTTP層の両方で同じ契約をIntegration Testできる。AbortSignalの転送は、Agentや利用者が中断した要求の不要な継続を抑えるChrome公式パターンである。
- **検討した代替案**: Tool実行関数からRepositoryを直接呼ぶ案はブラウザー側からD1へアクセスできず、HTTP契約の検証も分断されるため不採用。認証値をTool引数にする案はSessionとの二重認証と漏えい面を増やすため不採用。
- **参照**: [Chrome WebMCP Imperative API - cancellation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

## 判断 4: Answer更新・削除を条件付き単一Statementで確定する

- **決定**: Repositoryの更新は、対象Answerの `question_id` とSession由来 `user_id`、Questionの公開済み・`now < closes_at` 条件を同じ `UPDATE` Statementへ含める。削除も同じ条件を持つ `DELETE` Statementで行い、`meta.changes === 1` だけを成功とする。動的値はすべてprepared statementへbindする。
- **根拠**: 事前照会後に更新・削除する二段階処理では、その間に締切到達や削除競合が起こり得る。条件付き単一書き込みなら、本人・受付中・対象存在を確定時点で同時に強制できる。D1の実行結果は変更件数を返し、prepared statementのbindは公式に推奨される。
- **検討した代替案**: 事前照会と無条件書き込みはTOCTOU競合があるため不採用。利用者別ロックはCloudflare Workers/D1のMVPに対して複雑すぎるため不採用。
- **参照**: [Cloudflare D1 Prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)

## 判断 5: 削除はHard Deleteとし、締切前の再投稿を許可する

- **決定**: `remove_answer` は本人Answer行を削除し、`get_my_submission` は直後から `not_submitted` を返す。Questionが `OPEN` なら同じUserは再び `submit_answer` できるが、`UNIQUE(question_id, user_id)`により同時点のAnswerは最大1件に保つ。回答締切以降は更新・削除・再投稿をすべて拒否する。
- **根拠**: Humanが誤回答や公開したくない内容を締切前に撤回でき、削除後の再参加も直感的である。MVPの監査ログは対象外であり、Tombstoneを導入すると状態、保持期間、公開件数の意味が増える。
- **検討した代替案**: Tombstoneにより再投稿を永久禁止する案はHumanの訂正目的と合わないため不採用。Soft DeleteはReveal件数、本人状態、保持方針を追加で定義する必要があるため不採用。

## 判断 6: Answerに更新時刻を追加し、書記素制限をDomain契約へ統一する

- **決定**: 差分Migrationで `answers.updated_at` を追加し既存行は `created_at` で初期化する。Answer表再構築時にSQLのコードポイント上限CHECKを外し、空白のみ・Excerpt改行禁止・一意性・参照整合性はDBで維持する。1〜5,000および1〜160の表示文字上限は `Intl.Segmenter` を使う共通Domain関数で投稿・更新の両方へ強制する。
- **根拠**: SQLiteの `length()` は書記素クラスタを数えず、絵文字や結合文字で画面上の文字数と不一致になる。SPEC 006で採用済みの `Intl.Segmenter` と同じ規則をAnswerにも適用すればUIとToolの契約が一致する。更新時刻を保存することで `get_my_submission` と競合検証が最新変更を追跡できる。
- **検討した代替案**: `created_at`だけを維持する案は更新後の時刻を再取得できないため不採用。SQL `length()`を表示文字数とみなす案はUnicode境界ケースで仕様と一致しないため不採用。

## 判断 7: コピペ用プロンプトはサーバー生成しClipboard APIを段階的に使う

- **決定**: 純粋関数が固定英語テンプレートへQuestion IDだけを埋め込み、Question本文を含めない。SSRは未投稿の認証済みUserかつ `OPEN` の場合だけ、選択可能な読み取り専用テキストと `Copy prompt` ボタンを表示する。クリック時に `navigator.clipboard.writeText()`を呼び、成功は `Copied`、失敗は英語のstatusで通知する。失敗してもテキストは残す。
- **根拠**: サーバー生成なら表示とコピー元を同一文字列にでき、Question本文のPrompt Injectionがテンプレートへ混入しない。Clipboard APIの `writeText()` はPromiseを返しSecure Contextを必要とするため、ユーザー操作から呼び出し、失敗時の手動コピーを常に残す必要がある。
- **検討した代替案**: Question本文をプロンプトへ埋め込む案は内容重複とInjection面を増やすため不採用。コピー専用で表示テキストを隠す案は権限拒否時に利用不能になるため不採用。
- **参照**: [MDN Clipboard.writeText](https://developer.mozilla.org/docs/Web/API/Clipboard/writeText)、[MDN Clipboard API security](https://developer.mozilla.org/docs/Web/API/Clipboard_API)

## 判断 8: 自動テストと実ブラウザーWebMCP確認を分担する

- **決定**: Domainの書記素境界・Prompt生成・エラー分類・Tool SchemaはUnit Test、D1のMigration・条件付き更新削除・競合はWorkers D1 Integration Test、HTTP認証・DTO・SSR表示・非露出はHono Integration Testで保証する。実際のPersonal AgentによるTool選択、Clipboard、5 ToolのE2EはQuickstartで確認する。
- **根拠**: 外部AgentのTool解釈と実ブラウザーSessionはVitestだけでは保証できない。一方、所有者条件や締切競合を手動確認だけにすると回帰原因を切り分けられない。
- **検討した代替案**: すべてを手動E2Eに寄せる案は再現性が低いため不採用。自動テストだけでWebMCP成立を判定する案は実AgentのTool解釈を確認できないため不採用。

