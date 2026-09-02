# 実装計画: ドメインデータモデルとQuestionライフサイクル

**ブランチ**: `005-domain-data-lifecycle` | **日付**: 2026-09-02 | **仕様**: [spec.md](./spec.md)

**入力**: `specs/005-domain-data-lifecycle/spec.md` の機能仕様

## 概要

User、Session、Question、Answerを1つのD1データベースで整合して保存し、Questionの公開時刻・回答締切・Reveal時刻とサービス側基準時刻から `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` を排他的に導出する。Drizzle Schemaをデータ構造の型付きSource of Truthにし、既存のWrangler Migration履歴を維持した差分Migration、単一のライフサイクル判定、Repository境界、D1実装上の一意・参照・時刻制約を追加する。純粋な状態判定はUnit Test、実際のD1 Schema・Migration・同時書き込みはCloudflare WorkersのVitest統合を用いるIntegration Testで保証する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022  
**主要依存関係**: Cloudflare Workers、Hono、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Drizzle Kit 0.31系、Wrangler、Cloudflare Workers Vitest Plugin 1系、Vitest 4  
**保存先**: Cloudflare D1。Better Authの認証テーブルとQuestion／Answerテーブルは、外部キーが成立する同一データベースに置く。  
**テスト**: Vitestによる純粋ドメインUnit Test、Workers Vitest Pluginと分離D1を使うSchema／Migration／Repository Integration Test、QuickstartによるローカルMigration検証。  
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、ローカルMiniflare／workerd。  
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。  
**性能目標**: 状態判定は同期的に完了し、D1を使う単一の保存・取得操作は検証環境で2秒以内に完了する。同一User・Questionへの10件同時投稿でもAnswerは1件だけ確定する。  
**制約**: 時刻はUTC Unixミリ秒で保存・比較する。状態名は保存しない。状態境界では後の状態を優先する。User／SessionはBetter Authだけが更新し、アプリケーションは認証済みUser IDだけを参照する。Answer作成はQuestionが `OPEN` の場合に限り、同一User・Questionの一意性をD1制約で最終保証する。既存の有効なUser／SessionはMigrationで維持し、SPEC 004の検証専用Question／Answerだけを置換可能とする。  
**規模/範囲**: 4主要エンティティ、4状態、1件の差分Migration、Question／Answer用Repository、20件以上の状態境界ケース、空DBとSPEC 004 Schemaからの2種類のMigration経路。Question作成UI、外部API契約、公開認可、閲覧UIは対象外。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- 状態判定、時刻順序、不正遷移などの純粋ロジックはUnit Testで境界条件を固定する。
- Schema、Migration、一意制約、参照整合性、RepositoryとD1の接続はIntegration Testで保証する。
- User／SessionのSource of TruthはBetter Auth、Question／AnswerのSource of TruthはRepositoryとD1制約に分離する。
- 表示文言、コメント、識別子は英語とし、SpecKit成果物は日本語で作成する。
- 既存の変更と認証データを上書きせず、Migration適用前後を検証可能にする。
- 実装・調査・重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。未解決の技術事項はDrizzle／Wrangler履歴の共存、D1の原子的書き込み、Migrationの実DBテスト方法であり、Phase 0で解決する。

**Phase 1後の判定**: 適合。既存Migration台帳を維持する差分SQL、Drizzle Schema、単一の状態関数、Better AuthとRepositoryの責務分離、Workers Vitest PluginによるD1 Integration Testで各ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/005-domain-data-lifecycle/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── domain-persistence.md
└── tasks.md
```

### ソースコード

```text
drizzle.config.ts
migrations/
├── 0001_better_auth.sql
└── 0004_domain_data_lifecycle.sql

src/
├── auth/
│   └── session.ts
├── db/
│   ├── client.ts
│   └── schema.ts
├── domain/
│   ├── question.ts
│   └── question-lifecycle.ts
└── repositories/
    └── question-repository.ts

tests/
├── d1/
│   ├── apply-migrations.ts
│   ├── fresh-schema.test.ts
│   ├── legacy-upgrade.test.ts
│   └── question-repository.test.ts
├── helpers/
│   └── question-repository.ts
└── unit/
    └── question-lifecycle.test.ts

vitest.config.ts
vitest.d1.config.ts
```

**構成判断**: 既存の単一Worker構成を維持する。`src/db/`にDrizzleのSchemaとD1クライアント生成を集約し、`src/domain/question-lifecycle.ts`に保存方法を知らないライフサイクル契約、`src/repositories/question-repository.ts`にD1永続化境界を置く。既存のNode環境Unit／Integration Testは `vitest.config.ts` に残し、D1実体を必要とするテストだけを `vitest.d1.config.ts` でworkerd上に分離する。

## 複雑性の追跡

違反なし。2つのVitest設定は、既存の高速なNodeテストを維持しながらD1固有のMigration・制約を実ランタイム相当で検証するための最小分離である。
