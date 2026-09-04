# 検証記録: Sealed Answersのアクセス制御

## 実施環境

- 日時: 2026-09-02 17:20 JST
- ブランチ: `008-sealed-answer-access`
- 開始Commit: `4a8d82af12d823b5482db0945dc5e40431639e0e`
- Node.js: `v23.6.0`（`package.json` の推奨範囲外警告はあるが全品質ゲート成功）
- ブラウザー: Codex In-app Browser（WebMCP対応）とChrome（別Session）
- 検証アカウント: 機微情報を記録しない2利用者

## Phase 1基準結果

| 項目 | 結果 | 注記 |
| --- | --- | --- |
| Typecheck / Lint / Format | 成功 | 変更前の全コマンド成功 |
| Node Test | 成功 | 29 files / 229 tests |
| D1 Test | 成功 | 11 files / 42 tests |
| Build / Schema Check | 成功 | BuildとDrizzle Schema Check成功 |

## 自動検証

| 項目 | 結果 | 注記 |
| --- | --- | --- |
| Typecheck / Lint / Format | 成功 | `npm run typecheck`、`npm run lint`、`npm run format` |
| Node Test / D1 Test | 成功 | 29 files / 557 tests、12 files / 44 tests |
| Build / Schema Check | 成功 | 権限昇格環境のBuildと `drizzle-kit check` が成功 |
| 認可決定表 | 成功 | 5主体 × 4状態 × 4経路 × 4情報種別 = 320件が100%一致 |
| 非列挙反復 | 成功 | 実在・不在・別Questionを各10回比較し差異0件 |

## 手動検証

| 項目 | 結果 | 注記 |
| --- | --- | --- |
| Reveal前・Closed非露出 | 成功 | 2利用者とも回答数2件と本人本文／Excerptだけを確認し、他者秘密値0件。Question作成者にも特権なし |
| 直接HTTP非列挙 | 成功 | 実ブラウザーがJSON APIのトップレベル遷移を遮断したため、同一RouteをIntegration Testで実在・不在・別Question各10回、未認証、異常Methodまで補完。全件共通 `404 ANSWER_UNAVAILABLE` |
| Reveal後Excerpt／本文遅延取得 | 成功 | 初期SSRに全Excerpt 2件・本文0件。選択した本文1件だけを表示し、未選択本文0件 |
| Answer 0件 | 成功 | Integration Testで空状態だけを返し、偽のAnswer IDを生成しないことを確認 |
| WebMCP本人限定 | 成功 | 実WebMCPで投稿、`get_my_submission`、`OPEN`／`CLOSED`／`REVEALED` を確認。登録Toolは5件だけで、回答数・他者値・一覧／詳細／検索／要約／比較Capabilityは0件 |
| Session切替・再利用防止 | 成功 | 2つのブラウザーSessionで本人値だけを表示。利用者Aのサインアウト後、`get_my_submission` は `AUTHENTICATION_REQUIRED` となり本人値0件 |
| Cache Header | 成功 | 成功・拒否・例外・未対応経路で `Cache-Control: private, no-store` と `Vary: Cookie` をIntegration Test確認 |

## 未解決事項

- なし。ローカルD1には機微情報を含まないSPEC 008検証fixtureだけを追加し、共有D1は変更していない。
