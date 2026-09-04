# 実装計画: Google OAuthとWebMCPユーザー識別の検証

**ブランチ**: `002-google-oauth-identity` | **日付**: 2026-09-01 | **仕様**: [spec_ja.md](./spec_ja.md)

**入力**: `specs/002-google-oauth-identity/spec.md` の機能仕様

## 概要

Google OAuthでブラウザにログインしたBig Question Clubユーザーを、同じオリジンのWebMCP Tool Callでも同一のサービス内ユーザーとして識別できるかをP0で検証する。

既存のCloudflare Workers・Hono・Vite構成にBetter AuthとD1の認証用データを追加する。OAuthとセッションはアプリの正規オリジンで完結させ、WebMCPの`who_am_i` Toolはブラウザページから相対URLの本人確認APIを呼び出す。APIは受信した認証Cookieをサーバー側で検証し、認証済みの場合に限りサービス内ユーザーIDだけを返す。Googleのアカウント情報、OAuthトークン、Cookie値、Secretは画面・Tool応答・記録に返さない。

## 技術コンテキスト

**言語/バージョン**: TypeScript 6、Node.js 22.13以上（開発時）、ES2022

**主要依存関係**: Cloudflare Workers、Hono 4、Vite 8、Better Auth（Google OAuth）、Cloudflare D1、Vitest 4

**保存先**: Cloudflare D1。Better Authが管理するUser、Account、Session、Verificationの認証データだけを本SPECで保存する。

**テスト**: Vitestによるユニットテスト・統合テスト、ChromeのWebMCP対応環境と2つのテスト用Googleアカウントによる手動E2E検証

**対象プラットフォーム**: Cloudflare Workers、ChromeのWebMCP対応環境。OAuthコールバックはローカルHTTPと本番HTTPSの正規オリジンでのみ扱う。

**プロジェクト種別**: SSRを含む単一のWebアプリケーション

**性能目標**: ログイン状態での本人確認APIおよび`who_am_i` Toolは、通常の開発・検証ネットワークで2秒以内に結果を返す。

**制約**: 本人確認API・Toolは同一オリジンに限定する。`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_SECRET`、Cookie値、OAuthトークン、メールアドレスをリポジトリ、ログ、画面、Tool応答、検証記録へ含めない。ログアウト・認証失効・アカウント切替時に古いセッションを返さないため、セッションCookieキャッシュを有効化しない。

**規模/範囲**: P0の認証成立性検証。2つ以上のテスト用Googleアカウント、1つの本人確認API、1つの`who_am_i` Tool、ログイン状態表示、Go/No-Go記録を対象とし、Question・Answerの機能は対象外とする。

## 構成原則チェック

*ゲート: Phase 0の調査前に適合し、Phase 1の設計後に再確認する。*

`constitution.md` は未確定のテンプレートであり、適用可能な具体的原則は定義されていない。代わりにプロジェクトの`AGENTS.md`に従い、以下をゲートとする。

- ユニットテスト可能な認証結果の変換・入力検証・セッション分岐にはテストを作成する。
- 認証済みと未認証のHTTP導線およびWebMCPの本人確認導線は統合テストで保証する。
- Secret・トークン・メールアドレスをソース、テストfixture、ログ、Tool応答、文書に保存しない。
- P0がGoになるまで、P1の回答投稿などの本実装には進まない。

**判定（Phase 0前）**: 適合。永続化は認証状態の即時失効とアカウント切替の検証に必要であり、公開する個人情報はサービス内ユーザーIDに限定する。

## プロジェクト構成

### ドキュメント（本機能）

```text
specs/002-google-oauth-identity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── who-am-i.md
└── tasks.md
```

### ソースコード（リポジトリルート）

```text
src/
├── app.tsx                         # HonoルートとSSRページ
├── auth/
│   ├── auth.ts                     # Better Auth設定と認証ハンドラ
│   ├── config.ts                   # 環境設定の検証
│   └── session.ts                  # リクエストの認証結果を安全に変換
├── domain/
│   └── identity.ts                 # 本人確認の公開結果・エラー契約
├── routes/
│   ├── auth.ts                     # 認証状態と本人確認API
│   └── health.ts
├── webmcp/
│   └── register-who-am-i-tool.ts   # Tool登録と同一オリジンfetch
└── client.ts                       # ログイン状態表示とTool登録

tests/
├── integration/
│   ├── auth-route.test.ts
│   └── who-am-i-api.test.ts
└── unit/
    ├── auth-config.test.ts
    ├── identity.test.ts
    └── register-who-am-i-tool.test.ts
```

**構成判断**: 既存の単一Workerアプリを維持する。認証ルート、本人確認API、WebMCP Toolを同じ正規オリジンに置くことで、ブラウザの通常のセッションCookieを安全に利用し、CORSや第三者Cookieに依存しない。

## 複雑性の記録

該当なし。

## Constitution Check（Phase 1後）

**判定**: 適合。`data-model.md`は認証用の最小エンティティだけを定義し、`contracts/who-am-i.md`はサービス内ユーザーIDだけを公開する。`quickstart.md`はSecretを値として扱わず、実機検証でCookieやトークンを記録しない手順を定める。ユニット・統合・手動E2Eの各層で必要な振る舞いを確認する。
