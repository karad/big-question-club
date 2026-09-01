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
