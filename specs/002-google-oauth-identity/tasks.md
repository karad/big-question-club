# タスク: Google OAuthとWebMCPユーザー識別の検証

**入力**: `specs/002-google-oauth-identity/` の設計成果物

**前提**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/who-am-i.md`、`quickstart.md`

**テスト**: プロジェクトのテスト方針に従い、純粋な認証結果・環境設定・WebMCP Toolの分岐はユニットテスト、HTTP導線は統合テストを作成する。Google OAuthとブラウザCookieの実際の引継ぎは手動E2Eで確認する。

**構成**: タスクは、各ユーザーストーリーを独立して実装・検証できるように整理している。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクと異なるファイルを扱い、並行して実行できる。
- **[Story]**: 対応するユーザーストーリー（`US1`、`US2`、`US3`）。
- 各タスクには変更対象となる正確なファイルパスを含める。

## Phase 1: セットアップ（共有基盤）

**目的**: 認証検証に必要な依存関係、Cloudflare設定、Secret管理の土台を用意する。

- [X] T001 `package.json`でBetter AuthとD1用の依存関係・実行スクリプトを定義し、`package-lock.json`を更新する
- [X] T002 [P] `wrangler.jsonc`にD1バインディングとBetter Authが必要とするWorkers互換性設定を追加する
- [X] T003 [P] `.dev.vars.example`にSecretを含まない`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`の設定名と説明を追加する
- [X] T004 [P] `.gitignore`で`.dev.vars`、認証用のローカル設定、生成されたD1開発データを除外する
- [X] T005 `README.md`に認証検証の前提、Secretをコミットしない運用、SPEC 002の検証ガイドへのリンクを追加する

---

## Phase 2: 基盤機能（すべてのユーザーストーリーをブロックする前提）

**目的**: 認証データ、環境設定、セッション検証、共通のエラー契約を実装する。

**⚠️ 重要**: このPhaseが完了するまでユーザーストーリーの実装を開始しない。

- [X] T006 Better Authの認証スキーマを生成し、`migrations/0001_better_auth.sql`にUser、Account、Session、VerificationのD1定義を追加する
- [X] T007 [P] `src/types/env.d.ts`にD1バインディングと認証環境変数のWorkers型を追加する
- [X] T008 [P] `tests/unit/auth-config.test.ts`に不足値、localhost、HTTPSの正規Origin、Secret値を出力しない設定検証テストを追加する
- [X] T009 [P] `tests/unit/identity.test.ts`に認証済み、未認証、異常時の公開結果がUser ID以外を含まないテストを追加する
- [X] T010 `src/auth/config.ts`に認証環境変数の読取り・正規Origin検証・安全な設定エラー変換を実装する
- [X] T011 `src/domain/identity.ts`に`who_am_i` API/Tool共通の成功・未認証・一時失敗レスポンスと入力検証を実装する
- [X] T012 `src/auth/auth.ts`にGoogle OAuth、D1永続セッション、Cookieキャッシュ無効、アカウント選択を設定したBetter Authインスタンスを実装する
- [X] T013 `src/auth/session.ts`にリクエストの現在のセッションから公開可能なUser IDだけを抽出する関数を実装する
- [X] T014 `src/routes/auth.ts`にBetter Authハンドラとログイン状態を安全に取得する共有ルート関数を実装する
- [X] T015 `src/app.tsx`に`/api/auth/*`の認証ハンドラをcatch-allより前に登録し、認証用依存関係をWorker環境へ注入する

**チェックポイント**: D1へ認証スキーマを適用でき、環境設定とセッション検証の共有基盤がテスト可能な状態になる。

---

## Phase 3: ユーザーストーリー1 — ログイン済みユーザーとしてWebMCPを利用する（優先度: P1）🎯 MVP

**目標**: Google OAuthでログインしたブラウザと`who_am_i` Toolが同じサービス内User IDを返す。

**独立テスト**: テスト用アカウントでログインし、ブラウザの本人確認表示、`GET /api/who-am-i`、WebMCPの`who_am_i`が同じUser IDを返すことを確認する。

### ユーザーストーリー1のテスト

- [X] T016 [P] [US1] `tests/integration/who-am-i-api.test.ts`に有効なセッションで`GET /api/who-am-i`が`200`とUser IDだけを返す統合テストを追加する
- [X] T017 [P] [US1] `tests/unit/register-who-am-i-tool.test.ts`に空入力、同一オリジンfetch、成功結果、AbortSignalのToolユニットテストを追加する
- [X] T018 [P] [US1] `tests/integration/auth-page.test.ts`に認証済みページがUser IDだけを表示し、メールアドレス・Cookie値を含めないテストを追加する

### ユーザーストーリー1の実装

- [X] T019 [P] [US1] `src/routes/who-am-i.ts`に現在のセッションを検証して`GET /api/who-am-i`を返すルートを実装する
- [X] T020 [P] [US1] `src/webmcp/register-who-am-i-tool.ts`に空入力の読み取り専用`who_am_i` Toolと相対URL`/api/who-am-i`へのfetchを実装する
- [X] T021 [US1] `src/app.tsx`に`GET /api/who-am-i`と認証済み状態を示すSSRページを登録する
- [X] T022 [US1] `src/client.ts`に`who_am_i` Toolの登録と、WebMCP対応状況を英語で表示する処理を実装する
- [X] T023 [US1] `src/types/webmcp.d.ts`に`who_am_i` Toolが使用する型を追加し、既存のQuestion Tool型との互換性を保つ
- [X] T024 [US1] `tests/integration/who-am-i-api.test.ts`と`tests/unit/register-who-am-i-tool.test.ts`を通し、APIとToolの成功契約が`contracts/who-am-i.md`と一致することを確認する
- [X] T025 [US1] `specs/002-google-oauth-identity/quickstart.md`の同一アカウント10回確認を実施し、結果を`specs/002-google-oauth-identity/validation-record.md`へ記録する

**チェックポイント**: US1が独立して動作し、ログイン済みブラウザとWebMCP ToolのUser ID一致を検証できる。

---

## Phase 4: ユーザーストーリー2 — アカウントを混同せずに識別する（優先度: P2）

**目標**: 未認証状態、異なるGoogleアカウント、アカウント切替で、User IDの誤返却・混同を防ぐ。

**独立テスト**: アカウントA・Bのセッション、未認証、失効セッションを模擬したHTTP/WebMCP確認で、認証済みの現在User IDだけが返ることを確認する。

### ユーザーストーリー2のテスト

- [X] T026 [P] [US2] `tests/integration/who-am-i-api.test.ts`に未認証・失効・破損Cookieが`401 AUTHENTICATION_REQUIRED`となりUser IDを返さないテストを追加する
- [X] T027 [P] [US2] `tests/unit/identity.test.ts`に異なるUser ID、過去セッション、匿名代替識別子を公開しない変換テストを追加する
- [X] T028 [P] [US2] `tests/unit/register-who-am-i-tool.test.ts`に`401`と`500`を安全なToolエラーへ変換するテストを追加する

### ユーザーストーリー2の実装

- [X] T029 [US2] `src/auth/session.ts`と`src/routes/who-am-i.ts`で未認証・失効・破損した認証情報を`AUTHENTICATION_REQUIRED`へ統一して変換する
- [X] T030 [US2] `src/webmcp/register-who-am-i-tool.ts`で未認証と一時失敗を契約どおりのTool結果へ変換し、例外・レスポンス本文に識別情報を出さない
- [X] T031 [US2] `specs/002-google-oauth-identity/quickstart.md`のアカウント分離、未認証・失効、アカウント切替を実施し、結果を`specs/002-google-oauth-identity/validation-record.md`へ記録する

**チェックポイント**: US1の成功導線を損なわず、異なるアカウントや無効な認証状態でUser IDを誤返却しない。

---

## Phase 5: ユーザーストーリー3 — 検証結果からGo/No-Goを判断する（優先度: P3）

**目標**: 再現可能な記録から、WebMCPとGoogle OAuthのユーザー識別がP0を通過したかを判断できる。

**独立テスト**: 全4ケースの期待・実測・判定を、Secretを含めない形式で記録し、1つでも失敗ならNo-Goと結論付けられることを確認する。

### ユーザーストーリー3のテスト

- [X] T032 [P] [US3] `tests/unit/identity.test.ts`に検証記録へ出力可能な値がUser ID・状態・安全なエラーコードだけであるテストを追加する

### ユーザーストーリー3の実装

- [X] T033 [US3] `specs/002-google-oauth-identity/validation-record.md`に4ケース、実行日時、Origin、HTTP状態、ID一致、Go/No-Goの秘密情報を含まない記録テンプレートを作成する
- [X] T034 [US3] `specs/002-google-oauth-identity/quickstart.md`と`specs/002-google-oauth-identity/validation-record.md`で、いずれかのログイン済み不一致または未認証がNo-Goとなる判定規則を相互に一致させる
- [X] T035 [US3] `specs/002-google-oauth-identity/validation-record.md`に自動テスト結果と手動E2Eの全結果を記録し、仕様のSC-001からSC-005に対するGo/No-Goを確定する

**チェックポイント**: プロダクト責任者が検証記録だけでP0の結論を再確認できる。

---

## Phase 6: 仕上げと横断的な確認

**目的**: 実装・文書・品質ゲートを揃え、後続SPECへ進める状態を確定する。

- [X] T036 [P] `tests/integration/auth-route.test.ts`にGoogle OAuthの開始・コールバック失敗がSecret、トークン、メールアドレスを返さない統合テストを追加する
- [X] T037 `src/app.tsx`と`src/routes/auth.ts`に認証エラーの安全なHTTP応答と、認証状態表示の英語文言を反映する
- [X] T038 [P] `README.md`と`specs/002-google-oauth-identity/quickstart.md`の環境変数名、リダイレクトURI、手動検証手順を相互に照合して更新する
- [X] T039 `package.json`の品質コマンドを使い、`npm test`、`npm run typecheck`、`npm run lint`、`npm run format`を実行して`specs/002-google-oauth-identity/validation-record.md`へ結果を記録する
- [X] T040 `MILESTONE.md`のSPEC 002チェック、`USE_CODEX.md`、`specs/002-google-oauth-identity/validation-record.md`を更新し、Go/No-Go、受け入れ条件、未解決事項を記録する

---

## 依存関係と実行順

### Phase依存関係

- **Phase 1（セットアップ）**: 直ちに開始できる。
- **Phase 2（基盤機能）**: Phase 1完了後に開始し、すべてのユーザーストーリーをブロックする。
- **Phase 3（US1）**: Phase 2完了後に開始する。P0の最小価値を提供する。
- **Phase 4（US2）**: Phase 2完了後に技術的には開始できるが、US1の本人確認API・Tool実装を再利用するためUS1のチェックポイント後に進める。
- **Phase 5（US3）**: US1とUS2の実機検証結果に依存する。
- **Phase 6（仕上げ）**: 必要なユーザーストーリーの完了後に実行する。

### ユーザーストーリー依存関係

```text
セットアップ → 基盤機能 → US1（ログイン済み識別） → US2（アカウント分離） → US3（Go/No-Go記録） → 仕上げ
```

- **US1（P1）**: 基盤機能完了後に独立して検証できる。
- **US2（P2）**: US1のAPI・Tool契約を再利用して、異常・切替状態を検証する。
- **US3（P3）**: US1・US2の実測結果を記録して判定する。

### 並行実行の例

#### US1

```text
T016 tests/integration/who-am-i-api.test.ts
T017 tests/unit/register-who-am-i-tool.test.ts
T018 tests/integration/auth-page.test.ts

T019 src/routes/who-am-i.ts
T020 src/webmcp/register-who-am-i-tool.ts
```

#### US2

```text
T026 tests/integration/who-am-i-api.test.ts
T027 tests/unit/identity.test.ts
T028 tests/unit/register-who-am-i-tool.test.ts
```

## 実装戦略

### MVPを先に実装する

1. Phase 1とPhase 2を完了する。
2. Phase 3のUS1を完了する。
3. 同一アカウントの10回確認を実機で実施し、User ID一致を確認する。
4. US1の結果が不一致または未認証ならNo-Goとして止め、後続の回答投稿機能には進まない。

### 段階的に提供する

1. US1でログイン済みの同一ユーザー識別を成立させる。
2. US2でアカウントの混同がないことを確認する。
3. US3で全ケースを記録してP0のGo/No-Goを確定する。
4. Goの場合のみ、SPEC 003以降のP0検証へ進む。

## 注記

- `[P]`のタスクは、前提タスクの完了後に異なるファイルを扱う範囲で並行実行できる。
- 本タスクのUI表示文言とコード内コメント・識別子は英語で作成する。
- OAuth Secret、Cookie値、アクセストークン、Googleアカウントのメールアドレスをコミット、fixture、ログ、画面、Tool応答、検証記録に含めない。
