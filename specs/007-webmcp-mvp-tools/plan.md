# 実装計画: WebMCP MVP Tool群

**ブランチ**: `007-webmcp-mvp-tools` | **日付**: 2026-09-02 | **仕様**: [spec.md](./spec.md)

**入力**: `specs/007-webmcp-mvp-tools/spec.md` の機能仕様

## 概要

Question画面にHumanが明示的にAgent回答を開始する英語のコピペ用プロンプトを表示し、Personal Agentへ `get_question`、`submit_answer`、`update_answer`、`remove_answer`、`get_my_submission` の5 Toolだけを公開する。既存のBetter Auth Session、Questionライフサイクル、D1 Repositoryを継続利用し、Toolは同一Originの専用HTTP契約を呼び出す。Answerの更新・削除は本人・`OPEN`・対象存在をD1の条件付き単一Statementで確定し、締切後は不変、他者Answerは全Toolから非公開・変更不可とする。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上または24以上（開発時）、ES2022  
**主要依存関係**: Cloudflare Workers、Hono、Hono JSX、Vite、Better Auth 1.7、Drizzle ORM 0.45系、Wrangler、Cloudflare Workers Vitest Plugin 1系、Vitest 4、WebMCP Imperative API、標準Clipboard API  
**保存先**: Cloudflare D1。既存 `questions`、`answers`、`user` を利用し、`answers.updated_at` と表示文字契約に合わせる差分Migrationを1件追加する。  
**テスト**: VitestによるPrompt生成・書記素境界・エラー・WebMCP SchemaのUnit Test、Hono Appによる認証・HTTP契約・SSR Prompt UI Integration Test、Workers Vitest Pluginと分離D1によるMigration・本人限定更新削除・競合Integration Test、WebMCP対応ChromeとPersonal Agentによる手動E2E。  
**対象プラットフォーム**: Cloudflare Workers、Cloudflare D1、WebMCP対応Chrome、標準Clipboard APIを持つモダンブラウザー、ローカルMiniflare／workerd。  
**プロジェクト種別**: SSR、HTTP API、WebMCPを同一Workerで提供する単一Webアプリケーション。  
**性能目標**: ローカル検証環境で各Toolの成功・業務エラー応答を2秒以内、Question画面のPrompt表示を2秒以内、コピー結果通知を利用者操作から1秒以内に完了する。  
**制約**: アプリ表示、Tool名、description、エラー、識別子、コメントは英語、SpecKit文書は日本語。AgentはQuestionを一覧・検索・推薦せずHuman指定IDだけを扱う。Question本文と本人Answerは未信頼コンテンツ。Answer本文は1〜5,000表示文字、Excerptは改行なし1〜160表示文字。同時点の本人Answerは最大1件。更新・削除・再投稿は `OPEN` の間だけ。Session、Cookie、Token、Private Context、他者AnswerをToolへ入出力しない。  
**規模/範囲**: 6ユーザーストーリー、5 WebMCP Tool、5 HTTP契約、1 SSR Prompt欄、2 Repository変更操作、1 D1 Migration、Prompt／Domain／Tool Unit Test、HTTP／SSR／D1 Integration Test、実Agent手動E2E。Question探索、他者Answer Tool、Human向け一覧・Reveal UIの全面更新は対象外。

## 構成原則チェック

`constitution.md`は未確定テンプレートのため、`AGENTS.md`、機能仕様、既存設計をゲートとする。

- Answer入力とPrompt生成の純粋ロジックはUnit Testで境界と固定contractを保証する。
- Repository、D1 Schema、Migration、本人限定・締切・競合条件はWorkers D1 Integration Testを優先する。
- WebMCPからHTTP、認証、Repositoryをまたぐ導線とSSR表示条件はIntegration Testで保証する。
- 認証のSource of TruthはBetter Auth Session、Question状態はSPEC 005のライフサイクル判定、Answer一意性はD1制約を維持する。
- Tool入力にUser ID、Cookie、Tokenを受けず、本人はSessionからだけ決定する。
- Question本文と本人Answer出力へ未信頼annotationを付け、他者AnswerはDTO、Repository、Toolの各境界で除外する。
- アプリ表示文言、Tool description、コメント、識別子は英語とし、SpecKit成果物は日本語で作成する。
- 実装・調査・重要判断は `USE_CODEX.md` に記録する。

**Phase 0前の判定**: 適合。未解決の設計事項は本番Tool面、WebMCP annotation、更新・削除の競合、削除後再投稿、Unicode表示文字、Clipboard失敗時、テスト分担であり、Phase 0の調査で解決する。

**Phase 1後の判定**: 適合。5 Toolの限定公開、同一Origin HTTP契約、条件付き単一Statement、Hard Deleteと一意制約、`Intl.Segmenter`、サーバー生成Prompt、Clipboard段階的拡張、自動・手動テスト分担により全ゲートを満たす。未解決事項はない。

## プロジェクト構成

### この機能のドキュメント

```text
specs/007-webmcp-mvp-tools/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── agent-request-prompt.md
│   ├── answer-mutations.md
│   └── webmcp-tools.md
└── tasks.md
```

### ソースコード

```text
migrations/
└── 0005_answer_revisions.sql

src/
├── app.tsx
├── client.ts
├── client/
│   └── agent-request-prompt.ts
├── db/
│   └── schema.ts
├── domain/
│   ├── agent-request-prompt.ts
│   ├── answer-submission.ts
│   └── question.ts
├── repositories/
│   └── question-repository.ts
├── routes/
│   ├── answer-mutations.ts
│   ├── question.ts
│   └── submit-answer.ts
├── views/
│   └── question-detail.tsx
└── webmcp/
    ├── register-get-question-tool.ts
    ├── register-my-submission-tool.ts
    ├── register-remove-answer-tool.ts
    ├── register-submit-answer-tool.ts
    └── register-update-answer-tool.ts

tests/
├── d1/
│   ├── answer-mutation-repository.test.ts
│   └── schema-contract.test.ts
├── helpers/
│   └── question-repository.ts
├── integration/
│   ├── agent-request-prompt.test.ts
│   ├── answer-mutation-api.test.ts
│   └── webmcp-question-api.test.ts
└── unit/
    ├── agent-request-prompt.test.ts
    ├── agent-request-prompt-client.test.ts
    ├── answer-submission.test.ts
    ├── register-get-question-tool.test.ts
    ├── register-remove-answer-tool.test.ts
    └── register-update-answer-tool.test.ts
```

**構成判断**: 既存の単一Worker構成を維持する。Prompt文字列と表示条件の純粋部分は `domain/`、SSR構造は `views/`、HTTP認証と結果分類は `routes/`、D1の条件付き更新削除は既存Repository、各WebMCP Schemaと同一Origin呼び出しは `webmcp/` に置く。既存のP0 Tool登録は `client.ts` から外し、5 Toolを逐次登録する。Answerの表示文字判定はQuestion入力と共通化できる書記素関数へ寄せ、投稿・更新で同じ結果を使う。

## 複雑性の追跡

違反なし。Answer更新時刻とUnicode契約の整合に差分Migrationが必要だが、新しいサービス、状態管理Library、認証方式は追加しない。Route、Repository、WebMCP登録を分離するのは、5つの外部contractと本人限定D1条件をそれぞれ独立検証するための既存構成の継続である。
