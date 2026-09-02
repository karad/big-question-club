# タスク: Question作成・公開フロー

**入力**: `specs/006-question-publishing/` の設計文書  
**前提**: plan.md、spec.md、research.md、data-model.md、contracts/question-management.md、quickstart.md

**テスト**: プロジェクト方針と仕様の測定可能な成果に従い、純粋入力ロジック、Repository／D1、SSR／Form／認可の自動テストを実装より先に作成する。

**構成**: 各ユーザーストーリーを独立して実装・検証できるよう、タスクをストーリー単位に配置する。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクへの依存がなく、異なるファイルで並行実行可能
- **[Story]**: `spec.md` のユーザーストーリー（US1〜US4）
- すべてのタスクに対象ファイルを明記する

## Phase 1: セットアップ

**目的**: 現在の品質基準を固定し、設計どおりのファイル境界を用意する

- [x] T001 現在のTypecheck・Lint・Format・Node Test・D1 Test・Build結果を `specs/006-question-publishing/validation-record.md` に記録する
- [x] T002 [P] `src/domain/question-input.ts`、`src/routes/question-management.tsx`、`src/views/question-management.tsx` の責務をplan.mdどおりに作成する
- [x] T003 [P] `tests/unit/question-input.test.ts`、`tests/integration/question-management.test.ts`、`tests/d1/question-management-repository.test.ts` のテストファイルを作成して既存設定から検出されることを確認する

---

## Phase 2: 基盤

**目的**: 全ユーザーストーリーが共有する入力契約、Repository契約、認証・CSRF・View境界を整える

**⚠️ CRITICAL**: このPhaseが完了するまでユーザーストーリー実装を開始しない

- [x] T004 `tests/unit/question-input.test.ts` にtrim、書記素クラスタ10／1,000文字、`en`／`ja`、締切1時間／30日、確認項目を含む30件以上の失敗先行Unit Testを追加する
- [x] T005 `src/domain/question.ts` にQuestion本文・締切範囲・対応言語の英語識別子と型を追加する
- [x] T006 `src/domain/question-input.ts` に `Intl.Segmenter` を使う文字数、Form値解析、正規化、項目別英語error、サービス時刻による締切検証を実装してT004を通す
- [x] T007 `src/repositories/question-repository.ts` に本人所有取得、Draft更新、本人一覧、競合・非列挙・一時障害を表す型付きRepository契約を追加する
- [x] T008 `tests/helpers/question-repository.ts` を拡張後のRepository契約へ追従させ、複数Question、所有者、Draft更新、一覧集計を保持できるin-memory fixtureを実装する
- [x] T009 [P] `src/views/question-management.tsx` に英語のDocument Layout、認証案内、非列挙404、一時障害、error summaryの共通JSX componentを実装する
- [x] T010 `src/app.tsx` にQuestion管理Formだけを対象とするHono CSRF Middleware境界を追加し、既存Better Auth・HTTP API・WebMCP routeを対象外に保つ

**Checkpoint**: 共通入力・認証・CSRF・Repository・View契約が利用可能

---

## Phase 3: ユーザーストーリー1 — Questionを下書きとして作成する (優先度: P1) 🎯 MVP

**目標**: 認証済みHumanが有効な本文・言語・締切・公開内容の確認を入力し、本人所有のDraftを保存できる

**独立テスト**: `/questions/new` から有効入力を送信して1件の `DRAFT` とReview redirectを得られ、無効入力と未認証操作では保存されず英語の項目別errorが表示される

### テスト

- [x] T011 [P] [US1] `tests/integration/question-management.test.ts` に作成画面、未認証、Form解析、項目別error、入力保持、JSX text escape、成功時303 redirectの失敗先行Integration Testを追加する
- [x] T012 [P] [US1] `tests/d1/question-management-repository.test.ts` に有効Draft、作成者外部キー、無効値非保存、`publishedAt === null`、`revealsAt === closesAt` の失敗先行D1 Testを追加する

### 実装

- [x] T013 [US1] `src/repositories/question-repository.ts` の `createDraft` を検証済みDomain入力だけからUUID付きQuestionを保存し、作成者不足とD1障害を安定分類する実装へ更新する
- [x] T014 [US1] `src/views/question-management.tsx` にQuestion textarea、文字数、英語・日本語選択、`datetime-local`、timezone／UTC確認、Moderation確認、関連付けた英語errorを持つ作成Formを実装する
- [x] T015 [US1] `src/client.ts` に書記素文字カウンターとローカル締切からUTC Unixミリ秒・IANA timezone・UTC ISO表示を生成するQuestion Form補助を追加する
- [x] T016 [US1] `src/routes/question-management.tsx` に認証済み作成画面GETとForm検証・Draft保存・error再表示・Reviewへの303を行うPOST handlerを実装する
- [x] T017 [US1] `src/app.tsx` で `/questions/new` をparameter routeより先に登録し、`POST /questions` と依存関係を接続してUS1 Integration Testを通す

**Checkpoint**: User Story 1だけでDraft作成MVPを独立検証可能

---

## Phase 4: ユーザーストーリー2 — 下書きを確認して公開する (優先度: P1)

**目標**: 本人Draftだけを編集・確認し、実行時再検証と条件付き更新により1回だけ公開できる

**独立テスト**: 本人Draftを更新してReview内容へ反映し、明示確認後に `OPEN` へ公開でき、stale編集、期限範囲外、二重・同時公開、公開後編集では保存内容が変わらない

### テスト

- [x] T018 [P] [US2] `tests/integration/question-management.test.ts` に本人編集、Review、公開確認、締切再検証、stale response、公開後409、303 detail redirectの失敗先行Integration Testを追加する
- [x] T019 [P] [US2] `tests/d1/question-management-repository.test.ts` に本人所有取得、expectedUpdatedAt一致更新、stale更新、他人更新、公開済み更新拒否の失敗先行D1 Testを追加する
- [x] T020 [US2] `tests/d1/question-management-repository.test.ts` に締切境界、`revealsAt === closesAt`、逐次10回・同時10件の公開要求で1回だけ確定する失敗先行D1 Testを追加する

### 実装

- [x] T021 [US2] `src/repositories/question-repository.ts` に `id + creatorUserId` の本人所有取得と `publishedAt IS NULL + expectedUpdatedAt` の条件付きDraft更新・競合分類を実装する
- [x] T022 [US2] `src/repositories/question-repository.ts` の公開を本人・Draft・`now + 1時間 <= closesAt <= now + 30日`・`revealsAt === closesAt` の単一条件付き更新へ強化する
- [x] T023 [US2] `src/views/question-management.tsx` にexpectedUpdatedAtを含むDraft編集Formと、stale／公開済み状態を英語で回復可能に示すViewを実装する
- [x] T024 [US2] `src/views/question-management.tsx` に完全な本文、主言語、ローカル／timezone／UTC締切、sealed説明、不可逆性、明示確認、Edit導線を持つReview Viewを実装する
- [x] T025 [US2] `src/routes/question-management.tsx` に本人Draftの編集GET／POST、最新状態取得、400／404／409／503分類、Reviewへの303を実装する
- [x] T026 [US2] `src/routes/question-management.tsx` にReview GETと公開POSTを実装し、confirmPublication・expectedUpdatedAt・実行時入力条件を再検証してdetailへ303する
- [x] T027 [US2] `tests/helpers/question-repository.ts` の編集・公開fixtureを実D1と同じ所有者・競合・締切・一回公開semanticsへ揃え、US2 Integration Testを通す

**Checkpoint**: User Story 1と2でDraft作成から不可逆な公開まで独立検証可能

---

## Phase 5: ユーザーストーリー3 — My Questionsで自分のQuestionを管理する (優先度: P2)

**目標**: 本人所有Questionだけを新しい順に状態・締切・回答数・状態別導線付きで一覧できる

**独立テスト**: 2利用者と4状態のQuestionを用意し、`/my/questions` が本人分だけを安定した新しい順で表示し、Draftと公開済みで正しい導線を分け、Answer内容を含めない

### テスト

- [x] T028 [P] [US3] `tests/d1/question-management-repository.test.ts` に本人絞り込み、`createdAt DESC + id DESC`、0件、各QuestionのanswerCount、Answer非取得を検証する失敗先行D1 Testを追加する
- [x] T029 [P] [US3] `tests/integration/question-management.test.ts` に4状態、空状態、本人限定、状態別英語導線、Answer本文・Excerpt・投稿者非露出を含む15件以上の失敗先行表示Testを追加する

### 実装

- [x] T030 [US3] `src/repositories/question-repository.ts` にQuestionとAnswer件数を1 Queryで集計し、本人所有分だけを安定した新しい順で返す `listByCreator` を実装する
- [x] T031 [US3] `src/views/question-management.tsx` に本文先頭、現在状態、締切、回答数、Draft／公開済み別導線、英語空状態を持つMy Questions Viewを実装する
- [x] T032 [US3] `src/routes/question-management.tsx` にSession User ID・共通 `now`・本人一覧Queryを使う `GET /my/questions` handlerと503分類を実装する
- [x] T033 [US3] `src/app.tsx` に `/my/questions` routeと認証済みHumanが到達できる英語navigationを接続し、既存Question detail導線を維持する

**Checkpoint**: User Story 3を本人一覧として独立検証可能

---

## Phase 6: ユーザーストーリー4 — 権限外の閲覧・変更を拒否する (優先度: P2)

**目標**: 未認証、他人所有、存在しない、Personal Agent向け経路、cross-site FormからQuestion管理情報と変更を保護する

**独立テスト**: 2利用者で全管理GET／POSTを試し、他人所有とmissingが同じ404になり、未認証は401、cross-site unsafe requestは403、WebMCPに管理Toolが増えず、保存値が変化しない

### テスト

- [x] T034 [P] [US4] `tests/integration/question-management.test.ts` に全管理routeの未認証、missing／other owner同一応答、cross-site Form、Personal Agent管理操作不存在を含む20件以上の失敗先行認可Matrixを追加する
- [x] T035 [P] [US4] `tests/d1/question-management-repository.test.ts` に他人の本文を返さない本人所有Queryと、権限外編集・公開で全Question列が不変であることを検証するD1 Testを追加する

### 実装

- [x] T036 [US4] `src/routes/question-management.tsx` の全管理handlerを本人所有Repositoryだけから取得するよう統一し、missing／other ownerを同じ404・`Question unavailable.` へ写像する
- [x] T037 [US4] `src/app.tsx` のQuestion管理CSRF適用pathとroute順を最終化し、`src/client.ts` に管理用WebMCP Toolを登録しないことを認可Matrixで固定する

**Checkpoint**: 4ユーザーストーリーと全権限境界を独立検証可能

---

## Phase 7: 仕上げと横断品質

**目的**: 全ストーリーを統合し、文書・自動品質ゲート・手動導線を完了する

- [x] T038 [P] Question作成・My Questions・公開不可逆性・ローカル検証導線を `README.md` に追記し、実装上の重要判断を `USE_CODEX.md` に記録する
- [x] T039 `npm run typecheck`、`npm run lint`、`npm run format`、`npm test`、`npm run test:d1`、`npm run build` を実行し、件数・結果・未解決事項を `specs/006-question-publishing/validation-record.md` に記録する
- [x] T040 全開発可能タスクの完了後に `specs/006-question-publishing/quickstart.md` の2利用者・入力境界・公開・My Questions・所有者・CSRF・キーボード手動確認を実施し、結果を同ファイルへ記録する

---

## 依存関係と実行順

### Phase依存関係

- **Phase 1（セットアップ）**: 依存なし
- **Phase 2（基盤）**: Phase 1完了後。全ユーザーストーリーをblockする
- **Phase 3（US1）**: Phase 2完了後。Draft作成MVP
- **Phase 4（US2）**: Phase 2完了後に開始可能だが、統合時はUS1のForm／Draft作成を利用する
- **Phase 5（US3）**: Phase 2完了後に開始可能。実データ導線の確認はUS1／US2後
- **Phase 6（US4）**: Phase 2完了後に開始可能。全管理routeの最終MatrixはUS1〜US3後
- **Phase 7（仕上げ）**: 対象とする全ストーリー完了後

### ユーザーストーリー依存グラフ

```text
Setup → Foundation → US1 ──> US2 ──┐
                     ├────> US3 ──┼─> US4 final matrix → Polish
                     └────────────┘
```

- **US1 (P1)**: Foundation後に開始。独立したDraft作成MVP
- **US2 (P1)**: Foundation後にRepository単位で開始できる。画面統合はUS1 Formを再利用
- **US3 (P2)**: Foundation後に開始でき、US1／US2の完了を必須とせずfixtureで独立検証可能
- **US4 (P2)**: 各route単位で並行可能。全経路Matrixの完了はUS1〜US3のroute実装後

### 各ストーリー内の順序

- 失敗先行Testを作成し、対象要件を満たさないことを確認する
- Domain／Repository契約を先に実装する
- Viewを実装する
- RouteとApp wiringを実装する
- ストーリーの独立Testを通してから次のCheckpointへ進む

## 並行実行例

### User Story 1

```text
T011: tests/integration/question-management.test.ts のSSR／Form Test
T012: tests/d1/question-management-repository.test.ts のDraft永続化Test
```

### User Story 2

```text
T018: tests/integration/question-management.test.ts の編集／Review／公開Test
T019: tests/d1/question-management-repository.test.ts のDraft競合更新Test
```

### User Story 3

```text
T028: tests/d1/question-management-repository.test.ts の集計Query Test
T029: tests/integration/question-management.test.ts の一覧表示Test
```

### User Story 4

```text
T034: tests/integration/question-management.test.ts の認可Matrix
T035: tests/d1/question-management-repository.test.ts の所有者不変条件Test
```

## 実装戦略

### MVP First

1. Phase 1を完了する
2. Phase 2を完了する
3. Phase 3のUS1を完了する
4. Draft作成を独立検証する
5. US2の公開導線へ進む

### 段階的提供

1. Setup + Foundation: 入力・認証・Repository基盤
2. US1: Draft作成
3. US2: Draft編集・Review・公開
4. US3: My Questions
5. US4: 全管理経路の権限hardening
6. Polish: 全品質ゲートと手動確認

## 注記

- `[P]` は異なるファイルで未完了タスクに依存しない作業だけに付ける
- 各ストーリーのTestは実装前に失敗を確認する
- Migration追加は計画しない。既存Schemaで満たせない事実が判明した場合は実装を停止し、設計を再確認する
- 手動テストは自動品質ゲートと全開発可能タスクの完了後にまとめて実施する
- 他人のQuestion本文、Answer内容、Session／OAuth情報をtest logや検証記録へ残さない
