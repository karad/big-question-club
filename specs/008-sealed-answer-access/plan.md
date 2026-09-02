# 実装計画: Sealed Answersのアクセス制御

**ブランチ**: `008-sealed-answer-access` | **日付**: 2026-09-02 | **仕様**: [spec.md](./spec.md)

**入力**: `specs/008-sealed-answer-access/spec.md` の機能仕様

## 概要

既存のQuestionライフサイクル判定をAnswer公開可否の唯一の状態源とし、認証、経路、情報種別を入力にする純粋なアクセス制御ポリシーへ集約する。認証済みHuman向けSSRは公開済みQuestionの回答数と本人Answerを扱い、`REVEALED` でのみ全Excerptを表示する。Human向け詳細HTTPは `REVEALED` の指定本文1件だけを返し、WebMCPは全状態で本人Answer以外を返さない。利用者依存応答を再利用不可とし、直接アクセス、識別子推測、境界時刻、失効Sessionを回帰テストで固定する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022  
**主要依存関係**: Cloudflare Workers、Hono、Hono JSX、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Cloudflare Workers Vitest Plugin 1系、Vitest 4、WebMCP Imperative API  
**保存先**: 既存Cloudflare D1の `questions`、`answers`、`user`。SchemaとMigrationは変更しない。  
**テスト**: 認可決定表のUnit Test、SSR・HTTP・WebMCP互換経路のHono Integration Test、投影・所有者・Question間分離のD1 Integration Test、2利用者の手動E2E。  
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、WebMCP対応Chrome、モダンブラウザー、ローカルMiniflare／workerd。  
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。  
**性能目標**: ローカル環境でQuestion画面、本人状態、Answer詳細の許可・拒否応答を各2秒以内とし、Reveal後の初期SSRへAnswer本文を0件とする。  
**制約**: Question状態は1要求につきサービス側時刻を1回取得して導出する。`DRAFT`、`OPEN`、`CLOSED` では他者Answerを全経路で封印し、`REVEALED` の他者Answerは認証済みHuman向けSSRと詳細HTTPだけに許可する。WebMCPは回答数と他者Answerを常に返さない。利用者依存応答は `private, no-store` とCookie依存を明示し、許可されない詳細要求は実在性を区別しない。表示文言・コメント・識別子は英語、SpecKit文書は日本語とする。  
**規模/範囲**: 4ユーザーストーリー、5主体、4状態、3公開経路、3情報種別からなる180組以上の基礎マトリクス、既存Domain／Route／Repositoryの限定変更、Unit／HTTP／D1 Integration Test、実ブラウザー確認。新規Migration、完成版UI、要約・検索・順位付けは対象外。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 状態、認証、経路、情報種別から許可を返す分岐の多い純粋ロジックはUnit Testで全組み合わせを固定する。
- QuestionとAnswerのSource of Truthは既存RepositoryとD1、状態は `getQuestionState`、本人はBetter Auth Sessionを維持する。
- Repository投影はD1 Integration Test、認証からSSR／HTTP／WebMCPまでの導線はIntegration Testで保証する。
- RouteはUser IDを入力から受けず、Sessionから得た本人とサーバー側時刻だけを認可入力にする。
- 他者本文を初期SSRへ埋め込まず、Answer由来データを共通エラーへ含めず、表示時は未信頼テキストとして扱う。
- アプリ表示文言、コメント、識別子は英語、SpecKit成果物は日本語で作成し、重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。認可入力軸、経路識別、状態評価時刻、安全な投影、詳細非列挙、利用者別キャッシュ、テスト分担をPhase 0で解決する。

**Phase 1後の判定**: 適合。Route用途で固定する純粋な決定表、要求単位の状態Snapshot、既存Session、許可後だけ実行する最小投影、共通404、`private, no-store` と `Vary: Cookie`、Unit／HTTP／D1／手動E2Eの分担により全ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/008-sealed-answer-access/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-record.md
├── contracts/
│   ├── access-control-matrix.md
│   ├── answer-http.md
│   └── webmcp-visibility.md
└── tasks.md
```

### ソースコード

```text
src/
├── app.tsx
├── domain/
│   ├── answer-visibility.ts
│   └── question-lifecycle.ts
├── repositories/question-repository.ts
├── routes/question.ts
├── views/question-detail.tsx
└── webmcp/
    ├── register-get-question-tool.ts
    └── register-my-submission-tool.ts

tests/
├── d1/answer-visibility-repository.test.ts
├── helpers/
│   ├── question-repository.ts
│   └── visibility-matrix.ts
├── integration/
│   ├── question-visibility.test.ts
│   └── webmcp-question-api.test.ts
└── unit/answer-visibility.test.ts
```

**構成判断**: 既存の単一Worker構成を維持する。アクセス決定表は `domain/answer-visibility.ts`、状態導出は既存 `question-lifecycle.ts`、認証と要求単位Snapshotは `routes/question.ts`、安全な列投影は既存Repository、英語SSRは既存Viewへ置く。WebMCPは既存本人限定HTTP契約を継続し、他者Answer Capabilityを追加しない。

## 複雑性の追跡

違反なし。新規サービス、依存関係、Schema、Migrationは追加しない。認可決定表と公開経路別の最小投影は、Route間の分岐重複を避け、将来の経路追加を全組み合わせテストで検出するための最小変更である。
