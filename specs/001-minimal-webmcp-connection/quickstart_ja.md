# 検証ガイド: 最小WebMCP接続

## 前提条件

- CloudflareアカウントにWorkerを公開できること。
- Node.jsのプロジェクト推奨バージョンを利用できること。
- WebMCP対応のChromeと、WebMCP対応Personal Agentを利用できること。
- ローカル検証ではChromeの`chrome://flags/#enable-webmcp-testing`を有効にすること。
- 共有検証では、対象Originに有効なWebMCP Origin Trial設定を用意すること。

## ローカル検証

1. Node.js 22.13以降のLTS、またはNode.js 24以降を選択する。
2. `npm install`を実行する。
3. `npm run dev`を実行する。
4. Viteが表示するローカルURLを、Chromeのトップレベルタブで開く。
5. Chromeの`chrome://flags/#enable-webmcp-testing`を有効にし、Chromeを再起動する。
6. DevToolsのWebMCPパネルで`get_verification_question`が1件だけ登録されていることを確認する。
7. Personal Agentの接続先としてそのページを指定し、Toolを呼び出す。
8. [Tool契約](contracts/get-verification-question_ja.md)どおりの固定Questionを受け取ることを確認する。
9. 同じ呼び出しを10回繰り返し、`id`、`question`、`language`が毎回一致することを確認する。

## 共有検証

1. `npm run build`と`npm run preview`を実行し、本番に近いプレビューでローカル検証と同じ手順を確認する。
2. `npm run deploy`でWorkerを`workers.dev`へ公開する。
3. Cloudflareの公開URLをWebMCP Origin Trialの対象Originへ追加する。
4. HTTPSの公開URLをChromeで開き、DevToolsのWebMCPパネルでTool登録を確認する。
5. Personal AgentからToolを発見し、10回連続でQuestionを取得する。

## 失敗確認

1. WebMCPが無効なChrome、または非対応ブラウザでページを開く。
2. ページに`WebMCP is unavailable`が表示され、通常のHTTP APIの成功ではなく明確な検証失敗になることを確認する。
3. DevToolsまたはネットワーク遮断で`/api/verification-question`を失敗させる。
4. ToolがQuestionを返さず、`SERVICE_UNAVAILABLE`か`REQUEST_CANCELLED`を返すことを確認する。
5. 開発環境で固定Questionの必須項目を欠く状態を作り、`INVALID_CONFIGURATION`が返ることを確認する。

## 合格判定

- 接続設定後2分以内に固定Questionを取得できる。
- 10回連続取得で返却値が完全に一致する。
- 初見の開発担当者が本書を用い、30分以内に接続確認を再現できる。
- 接続不能・設定不備時に成功扱いのQuestionが返らない。
