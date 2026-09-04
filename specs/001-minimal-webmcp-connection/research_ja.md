# 調査結果: 最小WebMCP接続

## WebMCP Toolの公開方法

### Decision

ページ読み込み時に、入力なし・読み取り専用の`get_verification_question` Toolをimperative APIで静的登録する。実行時には同一Originの固定Question APIを呼び出す。

### Rationale

WebMCPはページ側のJavaScript機能をToolとして公開する。固定Questionを返すだけの機能にはフォーム送信は不要であり、1 Toolを1責務に保てる。同一Origin APIを経由すると、ページToolの登録だけでなくWorkerの可用性も検証できる。

### Alternatives considered

- Declarative API: フォーム送信向けであり、固定データ取得には不要なUIと入力を持ち込む。
- QuestionをJSバンドルに埋め込む: 最も単純だが、Worker/API接続の失敗を検証できない。
- MCPサーバーへの直接接続: ブラウザページでのWebMCP検証という本SPECの対象と異なる。

## Question契約と安全境界

### Decision

入力を受け付けず、`id`、`question`、`language`を持つ固定JSONだけを返す。入力Schemaは空のオブジェクトかつ余分なプロパティを許可しないものとし、実行関数側でも入力を再検証する。

### Rationale

入力をなくすことで、個人情報・Personal Context・Question選択値を受け取らない。返却値を固定化すると、10回連続取得時の決定性を自動テストできる。固定の管理下データはUser Generated Contentではないため、untrusted contentとして扱わない。

### Alternatives considered

- Question IDまたは言語を入力に持つ: 将来の複数Questionには有用だが、本SPECには不要な分岐と誤入力を増やす。
- 複数Questionを返す: Questionの公開・管理を扱う後続SPECの責務となる。

## 成功・失敗の契約

### Decision

成功時はQuestionだけを返し、設定不備・サービス障害・入力不備・取消は、Questionを含まない判別可能なエラー結果にする。

### Rationale

空文字や`null`をQuestionとして返すと、失敗を成功と誤認しうる。予測できる障害を固定のコードと再試行可否で返すことで、Agentと開発担当者が原因を区別できる。実行中止時には成功結果を返さない。

### Alternatives considered

- 例外を投げるだけ: Agentへ安定した再試行根拠を示しにくい。
- HTTP APIのレスポンスをそのまま返す: ページToolの契約がHTTP詳細へ不必要に依存する。

## 対応ブラウザと公開形態

### Decision

ローカル検証ではWebMCP testing flagを有効にした対応Chromeを使い、共有検証ではOrigin Trialが有効なHTTPSのトップレベル同一Originページを使う。非対応環境はWebMCP検証の失敗として明示する。

### Rationale

WebMCPは提案段階のブラウザ機能であり、Chrome公式はローカルではtesting flag、共有環境ではOrigin Trialを案内している。通常HTTP APIへ自動フォールバックすると、WebMCP経由の接続性を検証したことにならない。クロスOrigin iframeを使わなければ、権限委譲などの不要な変数を避けられる。

### Alternatives considered

- HTTP APIへの静かなフォールバック: 接続失敗を成功として誤認させるため採用しない。
- クロスOrigin iframe公開: 必要な権限設定と攻撃面を増やし、最初の接続検証には不要。

## 実行基盤と検証戦略

### Decision

Cloudflare Workers、Hono、Hono JSX、ViteとCloudflare Vite pluginで単一のWebアプリとして構成し、初回の共有先には`workers.dev`を使用する。固定Questionの契約は自動テストし、Chrome DevToolsと対応Personal AgentによるTool発見・10回連続呼び出しを手動E2Eで確認する。

### Rationale

プロジェクトの技術仕様に一致し、ローカルと本番に近いWorker runtimeで確認できる。固定の出力契約、エラー、登録条件は自動テストに向き、実Agentでの発見・呼び出しはブラウザ統合の確認が必要である。

### Alternatives considered

- 独自ドメインの初期導入: DNS設定を増やし、SPEC 001の目的から外れる。
- データベースを先に導入: 固定Questionの接続性だけを検証するには不要。
- Agentの自然言語操作だけで自動合否を判定する: Tool選択の確率性が接続検証と混ざる。

## 参考資料

- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [WebMCP security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
- [WebMCP DevTools debugging](https://developer.chrome.com/docs/devtools/application/webmcp)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Cloudflare Workers with Hono](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
