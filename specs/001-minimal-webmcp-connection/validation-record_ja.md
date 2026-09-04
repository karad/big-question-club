# 検証記録: 最小WebMCP接続

## 実行環境

| 項目 | 値 |
| --- | --- |
| 実施日 | 2026-09-01 |
| Node.js | 22.19.0 |
| npm | 10.9.2 |
| Chrome | 未実施 |
| WebMCP testing flag | 未実施 |
| Origin Trial | 未実施 |
| 検証URL | 未実施 |

## 自動検証

| 確認項目 | 結果 | 備考 |
| --- | --- | --- |
| TypeScript typecheck | PASS | `npm run typecheck` |
| Unit / Integration Test | PASS | `npm run test`: 6 files, 28 tests |
| Lint | PASS | `npm run lint` |
| Format | PASS | `npm run format` |
| Production build | PASS | `npm run build` |
| `/health` | PASS | `npm run preview`で`{ "status": "ok" }`を確認 |
| `/api/verification-question` | PASS | `npm run preview`で固定Questionを確認 |
| 検証ページ | PASS | WebMCP Tool名・初期表示をHTTP応答で確認 |

## 手動WebMCP E2E

| 確認項目 | 結果 | 記録 |
| --- | --- | --- |
| ChromeでToolを1件発見する | PASS | 2026-09-01にユーザーが手動確認済み（Chromeバージョンは未記録） |
| Toolを10回連続で呼び出す | PASS | 2026-09-01にユーザーが手動確認済み |
| 任意入力でQuestionを返さない | PASS | `INVALID_ARGUMENT`かつQuestionフィールドなしをDevToolsで確認 |
| API障害時にQuestionを返さない | PASS | 2026-09-01にユーザーが手動確認済み |
| 設定不備時にQuestionを返さない | PASS | 2026-09-01にユーザーが手動確認済み |
| 取消後にQuestionを返さない | PASS | 2026-09-01にユーザーが手動確認済み |

## T035 手動E2Eテスト手順

### 事前準備

1. Node.js 22.13以降のLTS、またはNode.js 24以降を使用する。
2. `npm install`、`npm run build`、`npm run preview`を順に実行する。
3. previewが表示したローカルURLを控える。共有環境で検証する場合は、先に`npm run deploy`で`workers.dev`へ公開し、そのHTTPS URLを控える。
4. ローカル検証ではChromeの`chrome://flags/#enable-webmcp-testing`を有効にしてChromeを再起動する。共有環境では、公開URLのOriginに有効なWebMCP Origin Trialを設定する。
5. 対応Chromeで検証URLをトップレベルタブとして開く。iframe内では実施しない。

### Tool登録の確認

1. DevToolsを開き、Application内のWebMCPパネルを表示する。
2. `get_verification_question`が1件だけ登録されていることを確認する。
3. 以下が一致することを確認する。
   - Tool名: `get_verification_question`
   - 入力Schema: 空のobject、`additionalProperties: false`
   - metadata: `readOnlyHint: true`、`untrustedContentHint: false`
4. 検証ページの状態表示が`WebMCP tool registered...`となることを確認する。

### 成功経路の確認

1. DevToolsのWebMCPパネルまたはPersonal Agentから、入力なしでToolを呼び出す。
2. 以下の値をすべて含む`kind: "question"`の結果を確認する。
   - `id`: `verification-question-v1`
   - `question`: `How should people prepare for a future where AI can do most of today's work?`
   - `language`: `en`
3. 同じTool呼び出しを合計10回実行する。
4. 10件すべてで、上記3フィールドの値が完全に一致することを確認する。
5. Personal Agentを使用した場合は、AgentがToolを発見し、同じ結果を取得したことも記録する。

### 失敗経路の確認

1. Toolへ任意のプロパティを持つ入力を渡し、`INVALID_ARGUMENT`が返り、Questionフィールドが含まれないことを確認する。
2. DevToolsでネットワークをOfflineにするか、`/api/verification-question`を503応答にしてToolを呼び出す。`SERVICE_UNAVAILABLE`が返り、`retryable: true`かつQuestionフィールドが含まれないことを確認する。
3. Tool実行中にリクエストを取消し、`REQUEST_CANCELLED`が返り、Questionフィールドが含まれないことを確認する。
4. 開発環境で固定Questionの必須項目を一時的に欠かせてToolを呼び出す。`INVALID_CONFIGURATION`が返り、`retryable: false`かつQuestionフィールドが含まれないことを確認する。
5. 変更した固定Question設定は、確認後に必ず元へ戻す。

### 記録テンプレート

| 項目 | 記録値 |
| --- | --- |
| 実施日 | 2026-09-01|
| Chromeバージョン | 152.0.7977.65|
| 検証URL | http://localhost:5173/|
| ローカルflagまたはOrigin Trial | |
| 使用したPersonal Agent | |
| Tool登録数 | |
| 10回連続取得の結果 | PASS |
| 入力不備の結果 | PASS |
| API障害の結果 | PASS |
| 取消の結果 | PASS |
| 設定不備の結果 | PASS |
| 補足・障害内容 | |

## 未解決事項

- `workers.dev`へのデプロイとOrigin Trial設定は外部アカウントの変更を伴うため、まだ実施していない。
