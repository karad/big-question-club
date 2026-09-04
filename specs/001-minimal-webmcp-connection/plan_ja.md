# 実装計画: 最小WebMCP接続

**Branch**: `main` | **Date**: 2026-09-01 | **Spec**: [spec_ja.md](spec_ja.md)

**Input**: `specs/001-minimal-webmcp-connection/spec.md`

## 概要

固定の英語Questionを返す読み取り専用WebMCP Toolを、Cloudflare Workers上のHonoアプリが提供する。ブラウザページでToolを静的登録し、対応Personal Agentによる発見・呼び出しを検証する。認証、保存、Answer投稿、複数Questionは実装しない。

## 技術コンテキスト

**言語／バージョン**: TypeScript 5系、Node.jsの現行LTS

**主要依存関係**: Cloudflare Workers、Hono、Hono JSX、Vite、Cloudflare Vite plugin、WebMCP browser API

**Storage**: なし。固定Questionをアプリケーション内の定数として管理する。

**Testing**: VitestによるUnit／Integration Test、対応ChromeとPersonal Agentによる手動E2E

**対象プラットフォーム**: Cloudflare Workers、WebMCP対応ChromeのトップレベルHTTPSページ

**プロジェクト種別**: SSR Webアプリケーション

**性能目標**: 開発環境または共有環境で、接続後2分以内にQuestionを取得できること。

**制約**: 入力なしの読み取り専用Toolを1つだけ公開する。ログイン・個人情報・Personal Context・永続ストレージ・HTTP APIへのフォールバックを使わない。

**規模／範囲**: 固定Question 1件、Tool 1件、検証画面 1ページ、health check 1経路。回答投稿やHuman向けMVP画面は後続SPECで扱う。

## 憲章チェック

*Gate: Phase 0の調査前に確認し、Phase 1の設計後に再確認する。*

`constitution.md`は未記入のテンプレートであり、適用可能なプロジェクト固有の原則は定義されていない。リポジトリの開発ガイドに従い、仕様ドキュメントを日本語で作成し、固定契約と分岐を持つ純粋ロジックにはUnit Testを追加する。Gateは合格。

設計後も同じ条件を満たしており、追加の複雑性違反はない。

## プロジェクト構造

### ドキュメント

```text
specs/001-minimal-webmcp-connection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── get-verification-question.md
└── tasks.md
```

### ソースコード

```text
src/
├── app.tsx                       # Honoアプリと検証ページ
├── index.tsx                     # Workerエントリポイント
├── domain/
│   └── verification-question.ts  # 固定Questionと契約検証
├── routes/
│   └── health.ts                 # 稼働確認経路
├── webmcp/
│   ├── register-tool.ts           # Tool登録アダプター
│   └── browser-support.ts         # WebMCP利用可否の検出
└── types/
    └── webmcp.d.ts                # 提案段階APIの最小型定義

tests/
├── unit/
│   ├── verification-question.test.ts
│   └── browser-support.test.ts
└── integration/
    ├── health.test.ts
    └── verification-page.test.ts
```

**構造の決定**: Cloudflare Workerを単一のWebアプリとして構成する。固定Questionの純粋な契約は`domain/`へ分離し、ブラウザ固有のWebMCP登録は`webmcp/`へ隔離する。これにより、提案段階のブラウザAPI変更を登録アダプターへ閉じ込める。

## 複雑性の記録

憲章違反はないため、記録項目はない。
