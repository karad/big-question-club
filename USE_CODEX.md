# Codex利用記録

## 2026-09-01

- `GPT-5`: 企画書・技術検証計画・技術仕様を確認し、MVP実装順のマイルストーンを`MILESTONE.md`へ作成した。
- `GPT-5`: SpecKitの各SPECをおおむね30〜40タスクで実装する前提に合わせ、マイルストーンを技術検証とMVP本実装の11 SPECへ再編した。
- `GPT-5`: SpecKitを用いてSPEC 001「実行基盤と最小WebMCP接続」の仕様と品質チェックリストを作成した。
- `GPT-5`: SPEC 001の技術調査、実装計画、データモデル、Tool契約、検証ガイド、依存順の実装タスクをSpecKitで作成した。
- `GPT-5`: SPEC 001のPhase 1を実装し、Cloudflare Workers・Hono・Vite・TypeScript・Vitestの開発基盤と検証用スクリプトを設定した。
- `GPT-5`: SPEC 001のPhase 2からPhase 5を実装し、固定Question API、WebMCP Tool登録、検証画面、Unit／Integration Test、再現手順を追加した。手動WebMCP E2Eと外部公開が必要なタスクは未完了として記録した。
- `GPT-5`: WebMCP Tool登録をインラインJavaScript文字列からViteでビルドする`src/client.ts`へ移し、HTMLが静的クライアントアセットを参照する構成へ変更した。
- `GPT-5`: Chrome DevToolsがTool実行時に実行オプションを省略するケースに対応し、`INVALID_ARGUMENT`の返却をユニットテストで固定した。
- `GPT-5`: 手動WebMCP E2Eの完了記録を反映し、SPEC 001のT035・T040とマイルストーンを完了に更新した。
- `GPT-5`: SpecKitを用いてSPEC 002「Google OAuthとWebMCPユーザー識別の検証」の仕様と品質チェックリストを作成した。
- `GPT-5`: SpecKitを用いてSPEC 002の技術調査、実装計画、認証データモデル、`who_am_i`契約、実機検証ガイドを作成した。
- `GPT-5`: SpecKitを用いてSPEC 002を40件の依存順タスクへ分解し、認証・WebMCP導線のテストとGo/No-Go検証を計画した。
- `GPT-5`: Google OAuthとCloudflare D1の実装前準備を、安全なSecret管理とリダイレクトURI登録を含む手順書としてSPEC 002へ追加した。
- `GPT-5`: SPEC 002のPhase 1でBetter Auth依存関係、Secretのローカルテンプレート、Git除外、認証検証のREADME導線を追加し、D1バインディングを要する作業は事前準備待ちとして保留した。
- `GPT-5`: SPEC 002の認証基盤、Better AuthのD1スキーマ、`who_am_i` API・WebMCP Tool・UI導線、Unit／Integration Test、Go/No-Go検証記録テンプレートを実装し、実機OAuth検証を保留として記録した。
- `GPT-5`: Google OAuth実機検証で判明したBetter Auth 1.7.2の`account.issuer`列不足をD1マイグレーションで修正し、同一アカウントの連続10回`who_am_i`確認を完了した。
- `GPT-5`: OAuth実機検証用に安全なログアウトUIを追加し、ログアウト後に`who_am_i`が識別子を返さず`AUTHENTICATION_REQUIRED`となることを確認した。
- `GPT-5`: Google OAuthの2アカウント実機検証で、各アカウント内の`who_am_i`安定性、画面との一致、アカウント分離、ログアウト後のアカウント切替を確認した。
- `GPT-5`: Google OAuthの認可拒否後に`who_am_i`が識別子を返さず`AUTHENTICATION_REQUIRED`となることを実機確認した。
- `GPT-5`: 検証用D1セッションを強制失効して未認証応答を確認し、SPEC 002の全受け入れ条件を満たすGo判定とマイルストーン完了を記録した。
- `GPT-5`: SpecKitを用いてSPEC 003「Personal Agent回答の安全性・言語の検証」の仕様と品質チェックリストを作成した。
- `GPT-5`: SpecKitを用いてSPEC 003の技術調査、実装計画、固定検証Questionのデータモデル、WebMCP契約、手動検証ガイドを作成した。
- `GPT-5`: SpecKitを用いてSPEC 003を40件の依存順タスクへ分解し、固定Question契約の自動テストと実Personal Agentによる手動Go/No-Go検証を計画した。
- `GPT-5`: SPEC 003のPhase 1で既存品質ゲートを確認し、WebMCPの読み取り専用・不信頼コンテンツannotation型と、既存認証導線を維持する同一オリジン境界を検証記録へ残した。
- `GPT-5`: SPEC 003のPhase 2〜5で、14件の安全性・言語検証Question、ケース別API、読み取り専用かつ不信頼コンテンツ標識付きWebMCP Tool、Unit／Integration Testを実装した。

## 2026-09-02

- `GPT-5`: SPEC 003の手動E2Eで通常の日本語Question `case-ja-01` を評価し、Private Context非出力・言語一致・関連回答を確認した。
- `GPT-5`: SPEC 003の期限内のCritical Go基準を6ケースへ更新し、日本語・英語の通常Questionと4類型の攻撃QuestionすべてでPrivate Context非出力・Injection不服従・言語一致を確認した。残り8ケースは後続回帰検証として維持した。
- `GPT-5`: SPEC 003で未実施の8件の回帰検証を、仕様内の未完了タスクからリポジトリ直下のバックログへ移管した。
