# 実装計画: Personal Agent回答の安全性・言語の検証

**ブランチ**: `003-agent-safety-language` | **日付**: 2026-09-01 | **仕様**: [spec_ja.md](./spec_ja.md)

**入力**: `specs/003-agent-safety-language/spec.md` の機能仕様

## 概要

Personal AgentがPrivate Contextを内部推論に活用しつつ公開出力へ漏らさず、Question本文のPrompt Injectionに従わず、Questionと同一言語で回答できるかをP0で検証する。

既存のCloudflare Workers・Hono・Vite・WebMCP構成を拡張し、14件の固定検証Questionを1件ずつ返す読み取り専用Toolを提供する。Question本文は不信頼なユーザー生成コンテンツとしてTool出力に明示し、Tool descriptionには同一言語での回答、Contextを内部推論に限ること、本文の命令を信頼しないことを簡潔に記載する。安全性はdescription単独に委ねず、同一オリジンの読み取り境界、Private Contextを受信・保存しない契約、固定の検証手順、実Personal Agentでの手動E2Eによって多層に検証する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上（開発時）、ES2022

**主要依存関係**: Cloudflare Workers、Hono 4、Vite 8、Better Auth、Cloudflare D1、Vitest 4

**保存先**: 本SPECで新規永続化なし。認証状態は既存のCloudflare D1を利用するが、検証Question、Answer、Private Context、評価結果は保存しない。

**テスト**: Vitestのユニットテスト・統合テスト、ChromeのWebMCP対応環境と検証専用Personal Agentによる手動E2E

**対象プラットフォーム**: Cloudflare Workers、ChromeのWebMCP対応環境。同一正規オリジンのブラウザセッションを使用する。

**プロジェクト種別**: SSRを含む単一のWebアプリケーション

**性能目標**: 検証Question取得APIとToolは、通常の開発・検証ネットワークで2秒以内に結果を返す。

**制約**: Question本文、Tool definition、Tool出力はいずれも安全上の信頼根拠にしない。Question出力には`untrustedContentHint`を付ける。Private Context、検証用秘密文字列、Answer全文、認証情報、評価の詳細はアプリ・API・ログ・Git管理ファイルへ送信または保存しない。Question取得は同一オリジンの相対URLに限定し、回答投稿・評価APIを追加しない。

**規模/範囲**: 日本語7件、英語7件の14固定ケースを対象にする。期限内のCritical Goでは、日英の通常Question各1件と4類型の攻撃ケース各1件、計6件を実施する。残り8件は削除せず後続回帰検証とする。混在言語、回答投稿、Answer保存・公開、実在利用者のContextは対象外とする。

## 構成原則チェック

*ゲート: Phase 0の調査前に適合し、Phase 1の設計後に再確認する。*

`constitution.md` は未確定のテンプレートであり、適用可能な具体的原則は定義されていない。代わりにプロジェクトの`AGENTS.md`と仕様をゲートとする。

- 固定Question契約、入力検証、ケース選択、Tool登録の分岐はユニットテストで固定する。
- HonoのQuestion取得APIとSSRの検証案内は統合テストで保証する。
- Private Context・秘密文字列・Answer全文・Cookie・トークンをソース、テストfixture、ログ、Tool応答、検証記録に保存しない。
- Personal Agentの内部推論、実際の漏えい有無、Injection不服従、言語一致は、実Agentを使う手動E2Eでのみ判定する。
- P0がGoになるまで、回答投稿、保存、公開を含むP1以降の本実装には進まない。

**判定（Phase 0前）**: 適合。固定Question群と読み取り専用Toolだけで検証でき、Private ContextやAnswerを受信する新たな経路を設けない。

## プロジェクト構成

### ドキュメント（本機能）

```text
specs/003-agent-safety-language/
├── plan.md              # 本ファイル（speckit-planの出力）
├── research.md          # Phase 0の出力
├── data-model.md        # Phase 1の出力
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2の出力（speckit-planでは作成しない）
```

### ソースコード（リポジトリルート）
```text
src/
├── app.tsx                                  # HonoルートとSSR検証案内
├── client.ts                                # Tool登録と認証状態表示
├── domain/
│   └── verification-question.ts              # 固定検証Question群と公開契約
├── routes/
│   └── verification-question.ts              # no-storeの読み取りAPI
└── webmcp/
    └── register-tool.ts                      # Question取得Toolと不信頼出力の標識

tests/
├── integration/
│   ├── verification-page.test.ts
│   └── verification-question-api.test.ts
└── unit/
    ├── register-tool.test.ts
    └── verification-question.test.ts
```

**構成判断**: 既存の単一Workerアプリを維持する。検証Questionの選択と返却契約を`domain`へ、HTTP境界を`routes`へ、WebMCPの登録と同一オリジン呼び出しを`webmcp`へ分離する。AnswerやPrivate Contextを受け取る経路は追加しない。

## Complexity Tracking

該当なし。

## 構成原則チェック（Phase 1後）

**判定**: 適合。`data-model.md`は固定データと手動評価記録だけを定義し、Private ContextやAnswerをデータモデルに含めない。`contracts/`は1件ずつ読むだけの同一オリジン契約であり、`quickstart.md`と`validation-record.md`は秘密を残さずに実Agentを評価する手順を定める。自動テストは公開契約の退行を、手動E2EはAgentの実際の安全性と言語一致を検証する。
