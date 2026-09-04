# タスク: 最小WebMCP接続

**入力**: `specs/001-minimal-webmcp-connection/` の設計成果物

**前提成果物**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/get-verification-question.md`、`quickstart.md`

**テスト方針**: 固定Question契約、入力検証、ブラウザ対応判定にはUnit Testを作成する。Worker経路と検証ページはIntegration Testで確認し、WebMCPの実ブラウザ・Personal Agent連携は手動E2Eで確認する。

**形式**: 各タスクは`- [ ] [TaskID] [P?] [Story?] 説明（ファイルパス）`に従う。

## Phase 1: セットアップ

**目的**: Cloudflare Workers上で動作する最小のTypeScript Webアプリを初期化する。

- [x] T001 Node.jsの対象バージョンとパッケージ管理方針を`package.json`へ定義する
- [x] T002 Cloudflare Workers、Hono、Hono JSX、Vite、Cloudflare Vite pluginの依存関係を`package.json`へ追加する
- [x] T003 [P] TypeScriptの厳格なコンパイル設定を`tsconfig.json`へ、lint・format設定を`eslint.config.js`と`.prettierrc.json`へ追加する
- [x] T004 [P] Cloudflare Workerのエントリポイントと互換日を`wrangler.jsonc`へ設定する
- [x] T005 [P] ViteとCloudflare Vite pluginを`vite.config.ts`へ設定する
- [x] T006 [P] Vitestの実行設定とテスト対象を`vitest.config.ts`へ追加する
- [x] T007 開発・ビルド・プレビュー・テスト・デプロイ用のnpm scriptsを`package.json`へ追加する

---

## Phase 2: 共通基盤

**目的**: すべてのユーザーストーリーを支えるWorker、Hono、固定Question契約、エラー表現を用意する。

**⚠️ CRITICAL**: このPhaseが完了するまでユーザーストーリーの実装を開始しない。

- [x] T008 WorkerからHonoアプリを公開するエントリポイントを`src/index.tsx`へ作成する
- [x] T009 Honoアプリの共通初期化とエラーハンドリングを`src/app.tsx`へ作成する
- [x] T010 [P] 成功結果・失敗結果・Tool入力の型を`src/domain/verification-question.ts`へ定義する
- [x] T011 [P] 固定Questionの必須項目を検証する純粋関数を`src/domain/verification-question.ts`へ実装する
- [x] T012 [P] WebMCP browser APIの最小型定義を`src/types/webmcp.d.ts`へ追加する
- [x] T013 [P] 稼働確認を返すhealth routeを`src/routes/health.ts`へ実装する
- [x] T014 Honoアプリへhealth routeと共通エラーハンドリングを接続する`src/app.tsx`を更新する

**Checkpoint**: Workerが起動し、固定Question契約とhealth checkを後続実装で利用できる。

---

## Phase 3: ユーザーストーリー1 — 検証用Questionを取得する (優先度: P1) 🎯 MVP

**Goal**: Personal Agentがページで公開されたToolを発見し、固定の英語Questionを取得できるようにする。

**Independent Test**: 対応Chromeで検証ページを開き、`get_verification_question`を呼び出して、契約どおりのQuestionを10回連続で取得できる。

### テスト

- [x] T015 [P] [US1] 固定Questionの必須項目・`language: en`・決定性を確認するUnit Testを`tests/unit/verification-question.test.ts`へ作成する
- [x] T016 [P] [US1] 空・不正・余分な入力を拒否するUnit Testを`tests/unit/verification-question.test.ts`へ追加する
- [x] T017 [P] [US1] WebMCP未対応・対応・登録失敗を判定するUnit Testを`tests/unit/browser-support.test.ts`へ作成する
- [x] T018 [P] [US1] 固定Question APIの成功・設定不備・障害結果を確認するIntegration Testを`tests/integration/verification-question-api.test.ts`へ作成する
- [x] T019 [P] [US1] 検証ページがTool登録状態を表示するIntegration Testを`tests/integration/verification-page.test.ts`へ作成する

### 実装

- [x] T020 [US1] 固定Question定数と成功結果の生成処理を`src/domain/verification-question.ts`へ実装する
- [x] T021 [US1] 入力・設定・取消・サービス障害を判別可能な失敗結果へ変換する処理を`src/domain/verification-question.ts`へ実装する
- [x] T022 [US1] 同一Originで固定Questionを返すAPI routeを`src/routes/verification-question.ts`へ実装する
- [x] T023 [US1] 固定Question API routeをHonoアプリへ接続する`src/app.tsx`を更新する
- [x] T024 [US1] WebMCPの利用可否と登録失敗理由を判定するアダプターを`src/webmcp/browser-support.ts`へ実装する
- [x] T025 [US1] `get_verification_question`を入力なし・読み取り専用として静的登録し、固定Question APIを呼び出すアダプターを`src/webmcp/register-tool.ts`へ実装する
- [x] T026 [US1] WebMCP Toolの登録・未対応・登録失敗を英語で可視化する検証ページを`src/app.tsx`へ実装する
- [x] T027 [US1] Tool名・入力Schema・成功／失敗結果を`specs/001-minimal-webmcp-connection/contracts/get-verification-question.md`に照らして確認し、契約差分を解消する`src/webmcp/register-tool.ts`を更新する
- [x] T028 [US1] Unit／Integration Testを実行し、失敗するテストを修正後にすべて成功させる`tests/unit/`と`tests/integration/`を更新する

**Checkpoint**: 対応ChromeでToolが1件だけ発見され、Question取得と失敗結果が契約どおりに動作する。

---

## Phase 4: ユーザーストーリー2 — 接続手順を再現する (優先度: P2)

**Goal**: 開発担当者が環境を起動・公開し、WebMCP接続の成功と失敗を同じ手順で再現できるようにする。

**Independent Test**: 初見の開発担当者が`quickstart.md`のみを使い、30分以内にローカル環境でQuestionを取得し、共有検証の準備条件を確認できる。

### テスト

- [x] T029 [P] [US2] health routeの成功結果とエラー境界を確認するIntegration Testを`tests/integration/health.test.ts`へ作成する
- [x] T030 [P] [US2] 検証ページのWebMCP未対応状態がQuestion成功として表示されないことを確認するIntegration Testを`tests/integration/verification-page.test.ts`へ追加する

### 実装と手順

- [x] T031 [US2] health routeをHonoアプリへ接続する`src/app.tsx`を更新する
- [x] T032 [US2] ローカル開発・ビルド・プレビュー・`workers.dev`公開の実行手順を`README.md`へ追加する
- [x] T033 [US2] Chrome flag、Origin Trial、DevToolsのTool確認、Personal Agent接続を含む検証手順を`specs/001-minimal-webmcp-connection/quickstart.md`へ具体化する
- [x] T034 [US2] 対応Chromeのバージョン、WebMCP flagまたはOrigin Trialの状態、検証URLを記録するテンプレートを`specs/001-minimal-webmcp-connection/validation-record.md`へ作成する
- [x] T035 [US2] 手動E2EでTool発見・10回連続取得・API障害・設定不備・取消を検証し、結果を`specs/001-minimal-webmcp-connection/validation-record.md`へ記録する

**Checkpoint**: 文書化された手順だけでローカル・共有検証を再現でき、WebMCP非対応や障害を成功と誤認しない。

---

## Phase 5: 仕上げと横断的確認

**目的**: 品質、設定、ドキュメントの整合性を最終確認する。

- [x] T036 [P] 固定Questionの内容、Tool description、英語の画面表示を`src/domain/verification-question.ts`と`src/app.tsx`でレビューする
- [x] T037 [P] Secretを設定ファイルへ含めず、ローカル秘密情報とWorker生成物を除外する`.gitignore`を追加・更新する
- [x] T038 `npm run lint`、`npm run test`、`npm run build`、`npm run preview`を実行し、結果を`specs/001-minimal-webmcp-connection/validation-record.md`へ記録する
- [x] T039 [P] `quickstart.md`の合格判定を最終確認し、再現性に関する未解決事項を`specs/001-minimal-webmcp-connection/validation-record.md`へ記録する
- [x] T040 `MILESTONE.md`のSPEC 001を、すべての完了条件と検証記録がそろった場合にのみ`[x]`へ更新する

## 依存関係と実行順

### Phase依存関係

- **Phase 1**: 依存なし。すぐに開始できる。
- **Phase 2**: Phase 1完了後。すべてのユーザーストーリーをブロックする。
- **US1 (P1)**: Phase 2完了後に開始できる。最小価値を提供するMVPである。
- **US2 (P2)**: US1の動作する検証ページに依存する。
- **Phase 5**: US1とUS2の完了後に実施する。

### ユーザーストーリーの依存関係

- **US1**: 他のユーザーストーリーに依存しない。
- **US2**: US1が提供するToolと検証ページを使う。

### 並行実行の機会

- Phase 1のT003〜T006はT001、T002の後に並行可能。
- Phase 2のT010〜T013はT008、T009と並行可能。
- US1のT015〜T019は実装前に並行可能。
- US2のT029、T030は並行可能。
- Phase 5のT036、T037、T039は並行可能。

## 実装戦略

### MVP優先

1. Phase 1とPhase 2を完了する。
2. US1を実装し、対応Chromeで固定Questionが取得できることを確認する。
3. ここで停止し、US1を単独で検証する。

### 段階的な提供

1. US1でWebMCP Toolの発見と固定Question取得を実証する。
2. US2で手順・公開・失敗確認を再現可能にする。
3. Phase 5のすべてを完了し、SPEC 001の完了判定を行う。

## 注記

- すべてのタスクはチェックボックス、連番ID、必要時の並行マーカー、ユーザーストーリーラベル、対象パスを持つ。
- WebMCPの実ブラウザ検証は、提案段階APIの変更に備えてChromeバージョンとOrigin Trial状態を必ず記録する。
