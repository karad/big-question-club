# 実装計画: Question作成・公開フロー

**ブランチ**: `006-question-publishing` | **日付**: 2026-09-02 | **仕様**: [spec_ja.md](./spec_ja.md)

**入力**: `specs/006-question-publishing/spec.md` の機能仕様

## 概要

認証済みHumanが任意言語のQuestion本文と回答締切を入力し、下書き保存、編集、確認、不可逆な公開を行えるSSR画面を追加する。回答言語はPersonal AgentがQuestion本文から判断する。既存のHono JSX、Better Auth Session、Question Repository、D1 Schemaを継続利用し、入力規則は純粋なDomain関数、所有者と状態を伴う変更はRepositoryの条件付き書き込み、Human向け操作は同一OriginのHTML FormとCSRF保護で成立させる。`My Questions` は本人所有Questionだけを回答数付きで新しい順に返し、Answer内容や他者情報を扱わない。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022  
**主要依存関係**: Cloudflare Workers、Hono、Hono JSX、Hono CSRF Middleware、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Cloudflare Workers Vitest Plugin 1系、Vitest 4  
**保存先**: 既存のCloudflare D1。SPEC 005の `questions`、`answers`、`user` を変更せず利用し、本SPECではMigrationを追加しない。  
**テスト**: Vitestによる入力検証・文字数・時刻境界のUnit Test、Hono Appを使うSSR／Form／認証／CSRF Integration Test、Workers Vitest Pluginと分離D1を使う所有者・競合・一覧QueryのIntegration Test、Quickstartによる全導線の手動確認。  
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、モダンブラウザー、ローカルMiniflare／workerd。  
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。  
**性能目標**: 作成、編集、公開、`My Questions` の各操作はローカル検証環境で2秒以内に完了する。逐次10回・同時10件の公開要求でも公開確定は1回だけとする。  
**制約**: 表示文言は英語、SpecKit文書は日本語。本文は任意言語のtrim後の書記素クラスタ10〜1,000文字、締切は各変更・公開時のサービス時刻から1時間以上30日以内、`revealsAt === closesAt`。公開後の主要項目は不変。締切判定はクライアント時刻ではなく送信された絶対時刻をサービス時刻で再検証する。他人の下書きは存在有無も開示しない。
**規模/範囲**: 4ユーザーストーリー、6つのHuman向け画面／操作、1つの入力Domain契約、既存Repositoryの作成・取得・編集・公開・一覧拡張、30件以上の入力ケース、20件以上の認可ケース、15件以上の一覧表示ケース。WebMCP Tool追加、一般公開一覧、Answer閲覧変更、Migrationは対象外。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 本文文字数、締切、確認項目の純粋な入力判定はUnit Testで境界条件を固定する。
- Question RepositoryとD1の所有者条件、公開の一意性、競合更新、集計一覧はD1 Integration Testで保証する。
- Human向け画面の状態分岐、項目別エラー、認証、CSRF、非列挙応答はHono Integration Testで保証する。
- QuestionのSource of Truthは既存D1 SchemaとRepository、認証のSource of TruthはBetter Auth Session、状態のSource of TruthはSPEC 005のライフサイクル判定を維持する。
- 表示文言、コメント、識別子は英語とし、SpecKit成果物は日本語で作成する。
- Question本文はHono JSXのテキストとして描画し、未信頼内容をHTMLまたは命令として解釈しない。
- 実装・調査・重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。未解決の設計事項はUnicode表示文字の数え方、ローカル締切から絶対時刻への変換、HTML FormのCSRF、公開・編集競合、非列挙エラーであり、Phase 0で解決する。

**Phase 1後の判定**: 適合。`Intl.Segmenter`による共通入力契約、ブラウザーで生成した絶対時刻とIANAタイムゾーンの確認、Honoの同一Origin CSRF Middleware、D1の条件付き更新、本人所有取得のRepository境界、JSXのテキスト描画により各ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/006-question-publishing/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── question-management.md
└── tasks.md
```

### ソースコード

```text
src/
├── app.tsx
├── client.ts
├── domain/
│   ├── question.ts
│   ├── question-input.ts
│   └── question-lifecycle.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   └── question-management.tsx
└── views/
    └── question-management.tsx

tests/
├── d1/
│   └── question-management-repository.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   └── question-management.test.ts
└── unit/
    └── question-input.test.ts
```

**構成判断**: 既存の単一Worker構成を維持する。入力の正規化・書記素文字数・締切範囲は `src/domain/question-input.ts` に集約し、すべての保存・公開経路が同じ結果を使う。D1の所有者条件、Draft限定更新、公開の条件付き更新、本人一覧は既存 `QuestionRepository` を拡張する。Routeは認証・Form解析・結果分類、ViewはHono JSXによる英語UIとアクセシビリティ属性を担当し、`src/client.ts` はローカル日時を絶対時刻へ変換して確認表示する最小の補助だけを追加する。

## 複雑性の追跡

違反なし。新しいValidation Libraryや日時Libraryは追加せず、標準Web APIと既存のHono／Drizzle境界で実装する。RouteとViewの分離は6導線の状態・エラー分岐をテスト可能に保つための最小構成である。
