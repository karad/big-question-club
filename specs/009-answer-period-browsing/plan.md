# 実装計画: Challenge Core閲覧フロー

**ブランチ**: `009-answer-period-browsing` | **日付**: 2026-09-02 | **仕様**: [spec.md](./spec.md)

**入力**: `specs/009-answer-period-browsing/spec.md` の機能仕様

## 概要

WebMCP ChallengeのCore Demoを本日中に機能完成させるため、既存の単一Worker構成を維持し、HomeのOpen Question一覧とQuestion Detailの回答期間中状態だけを追加・整理する。SPEC 007のAgent依頼PromptとSPEC 008のAnswer認可・Reveal最小表示をそのまま利用し、Open一覧の最小D1投影、要求単位の時刻Snapshot、未ログイン／未回答／回答済みの排他的表示をUnit・HTTP・D1 Testで固定する。最終Visual DesignとReveal比較表現は必須のSPEC 010へ移す。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022  
**主要依存関係**: 既存のCloudflare Workers、Hono、Hono JSX、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Vitest 4、WebMCP Imperative API。新規依存は追加しない。  
**保存先**: 既存Cloudflare D1の `questions`、`answers`。Schema、Migration、Indexは変更しない。  
**テスト**: 表示状態・締切・回答数のUnit Test、Home／Question DetailのHono Integration Test、Open一覧投影のD1 Integration Test、既存SPEC 007・008回帰。  
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、WebMCP対応Chrome、モダンブラウザー、ローカルMiniflare／workerd。  
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。  
**性能目標**: ローカル検証でHomeとQuestion Detailの初期HTMLを各2秒以内に返し、Home一覧を1回の集計Queryで取得する。  
**制約**: 1要求でサービス時刻を1回だけ取得する。`OPEN` と `CLOSED` では他者Answerを取得・表示・埋め込みしない。`REVEALED` はSPEC 008を後退させない。アプリ表示文言・コメント・識別子は英語、SpecKit文書は日本語とする。  
**規模/範囲**: 3ユーザーストーリー、HomeとQuestion Detail、4閲覧者状態、4Question状態、回答数0・1・複数、締切境界と障害状態。Visual Design、専用Login、My Questions再設計、包括的Accessibilityは対象外。

## 構成原則チェック

`constitution.md` は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 表示状態、回答数単複、残り時間はUnit Test可能な純粋関数として境界を固定する。
- Question状態は既存 `getQuestionState`、本人はBetter Auth Session、永続化は既存RepositoryとD1を唯一のSource of Truthとする。
- Open一覧の絞り込み・順序・集計はD1 Integration Test、認証からSSRまでの導線はIntegration Testで保証する。
- RouteはUser IDを入力から受けず、Session由来本人と要求単位のサービス時刻だけで表示状態を決める。
- Home投影にAnswer本文・Excerpt・Userを含めず、Question本文と本人Answerを未信頼テキストとして扱う。
- 既存SPEC 007・008の安全契約を再利用し、短期都合で弱めない。
- アプリ表示文言、コメント、識別子は英語、SpecKit成果物は日本語で作成し、重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。Open一覧、状態Snapshot、閲覧者状態、既存認証導線、SPEC境界、テスト分担をPhase 0で解決する。

**Phase 1後の判定**: 適合。新規依存・Schema変更なしの最小投影、純粋表示判断、既存Route／Viewの限定変更、Unit／HTTP／D1回帰により全ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/009-answer-period-browsing/
├── spec.md
├── plan.md
├── architecture.md
├── user-manual.md
├── admin-manual.md
├── research.md
├── data-model.md
├── quickstart.md
├── validation-record.md
├── contracts/
│   └── core-browsing.md
└── tasks.md
```

### ソースコード

```text
src/
├── app.tsx
├── domain/
│   └── question-browsing.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   ├── home.tsx
│   └── question.ts
└── views/
    ├── home.tsx
    └── question-detail.tsx

tests/
├── d1/
│   └── question-browsing-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── home.test.ts
│   ├── question-browsing.test.ts
│   └── question-visibility.test.ts
└── unit/
    └── question-browsing.test.ts
```

**構成判断**: 既存の単一WorkerとRoute分割を維持する。画面非依存の表示値は `domain/question-browsing.ts`、Home一覧は既存Repositoryへの最小投影、HTTP判断はHomeと既存Question Route、SSRは画面別Viewへ置く。大規模な共通Layout化、Client再設計、認証Route追加は行わない。

## 複雑性の追跡

違反なし。新規依存、Service、Table、Column、Index、Migrationを追加しない。新しいDomain helper、Home投影、Home Route／Viewは、Core Demoに不足しているQuestion発見と状態表示を安全に加える最小構成である。
