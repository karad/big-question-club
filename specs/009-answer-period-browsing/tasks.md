# タスク: Challenge Core閲覧フロー

**入力**: `specs/009-answer-period-browsing/` の設計ドキュメント  
**前提**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/core-browsing.md`、`quickstart.md`

**テスト**: Challenge Coreの機能と既存安全境界を本日中に固定するため、Storyごとに先行テストを作成する。Manual TestはSPEC 010完了後にまとめて実施する。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクへの依存がなく、異なるファイルで並行実行できる
- **[Story]**: 対応するユーザーストーリー（US1〜US9）
- すべてのタスクに具体的なファイルパスを含める

## Phase 1: Setup（最小準備）

**目的**: Core機能の検証記録だけを準備し、新規依存や大規模UI基盤を追加しない。

- [X] T001 自動検証結果と未解決事項を記録する雛形を作成する（`specs/009-answer-period-browsing/validation-record.md`）

---

## Phase 2: Foundational（表示判断）

**目的**: HomeとQuestion Detailで共用する最小の純粋表示判断を固定する。

- [X] T002 回答数0・1・複数、非負の残り時間、Question状態、未ログイン／未回答／回答済み／取得不能の排他的表示を検証するUnit Testを先に作成する（`tests/unit/question-browsing.test.ts`）
- [X] T003 T002を満たす回答数、期限、閲覧者状態の純粋な表示値導出を実装する（`src/domain/question-browsing.ts`）

**Checkpoint**: HomeとDetailが同じ状態・表示値を使える。

---

## Phase 3: User Story 1 - Open Questionを見つける（優先度: P1）🎯 MVP

**目標**: Homeで `OPEN` Questionだけを締切順に発見し、回答数・締切・sealedを確認してDetailへ進める。

**独立テスト**: 4状態・2言語・回答数0/1/複数のfixtureで、Homeに全 `OPEN` Questionだけが安定順序で表示され、空状態・障害状態・Detail linkが契約どおりであることを確認する。

### テスト

- [X] T004 [P] [US1] Open限定条件、締切境界、安定順序、回答数集計、Answer秘密列非取得のD1 Integration Testを先に作成する（`tests/d1/question-browsing-repository.test.ts`）
- [X] T005 [P] [US1] Homeの英語表示、一覧、0/1/複数、Detail link、空状態、503、要求単位 `now()` 1回を検証するIntegration Testを先に作成する（`tests/integration/home.test.ts`）

### 実装

- [X] T006 [US1] `listOpenQuestions(snapshotNow)` の最小集計投影とin-memory test doubleを実装する（`src/repositories/question-repository.ts`、`tests/helpers/question-repository.ts`）
- [X] T007 [US1] Question本文、回答数、sealed、絶対締切、残り時間、空・障害状態を描画するHome Viewを実装する（`src/views/home.tsx`）
- [X] T008 [US1] 1回の時刻SnapshotでHomeを生成するRouteを追加し既存 `/` へ登録する（`src/routes/home.tsx`、`src/app.tsx`）

**Checkpoint**: HumanがHomeでQuestionを選びDetailへ移動できる。

---

## Phase 4: User Story 2 - 回答期間中のsealed状態を理解する（優先度: P1）

**目標**: 未ログインと認証済みHumanがQuestion Detailで回答数・締切・sealed・次の行動を理解し、Reveal前の他者Answerを一切取得できない。

**独立テスト**: 秘密値を持つ他者AnswerがあるQuestionを未ログイン、作成者、認証済み未回答で開き、状態別表示が正しく秘密値がHTMLに0件であることを確認する。

### テスト

- [X] T009 [P] [US2] 未ログイン公開Detail、作成者、回答数、期限、sealed、Closed、Draft／missing同一404、公開取得障害のIntegration Testを先に作成する（`tests/integration/question-browsing.test.ts`）
- [X] T010 [P] [US2] 他者秘密値の本文・属性・埋め込み非露出、要求単位 `now()` 1回、Closed／Revealed認可非回帰Testを先に追加する（`tests/integration/question-visibility.test.ts`）

### 実装

- [X] T011 [US2] 既存Question Detail Viewへ公開情報、作成者表示、sealed／closed、未ログインSign in案内を追加する（`src/views/question-detail.tsx`）
- [X] T012 [US2] `questionPageRoute` を未ログイン公開、要求単位状態Snapshot、作成者内部比較、Draft非列挙へ変更する（`src/routes/question.ts`）
- [X] T013 [US2] 公開情報障害を503、本人状態障害をPrivate情報なしの安全表示、missing／Draftを同一404として分離する（`src/routes/question.ts`）
- [X] T014 [US2] Question本文を未信頼テキストとして扱い、SPEC 008のReveal Excerpt／本文遅延表示を維持する（`src/views/question-detail.tsx`、`src/routes/question.ts`）

**Checkpoint**: Question Detailでsealedの意味と参加導線が分かり、他者Answerが漏れない。

---

## Phase 5: User Story 3 - Agent回答後の変化を確認する（優先度: P1）

**目標**: Agent回答後の再読込で回答数と本人投稿状態が変化し、他者Answerを見ずに複数Agent参加を確認できる。

**独立テスト**: 2利用者が順に回答し、0→1→2の回答数、未回答Prompt、回答済み本人Answer、Submission障害が排他的に表示されることを確認する。

### テスト

- [X] T015 [US3] 未回答／回答済み／作成者／Submission障害、0→1→2回答数、Prompt排他性、本人分以外の秘密値非露出を先に追加検証する（`tests/integration/question-browsing.test.ts`）

### 実装

- [X] T016 [US3] SPEC 007のAgent依頼Sectionと、回答済み・本人Answer・Submission unavailableの排他的SectionをDetail Viewへ統合する（`src/views/question-detail.tsx`）
- [X] T017 [US3] 認証済みの場合だけ本人Answerを取得し、取得失敗を未回答へ変換せず安全な表示状態へ渡す（`src/routes/question.ts`）
- [X] T018 [US3] `Copy prompt` の成功／拒否statusと手動copy fallbackを回帰確認し、既存Clipboard契約を維持する（`tests/unit/agent-prompt-clipboard.test.ts`、`src/ui/agent-prompt-clipboard.ts`）

**Checkpoint**: 3分デモの回答前・1件回答・複数回答・sealedを機能として再現できる。

---

## Phase 6: Challenge Core回帰

**目的**: SPEC 010のVisual・Reveal実装へ安全に進める状態を確定する。

- [X] T019 HomeとQuestion Detailの英語文言、状態を指定できる安定したDOM hook、SPEC 010でVisual Designを適用する要素境界を固定する（`tests/integration/home.test.ts`、`tests/integration/question-browsing.test.ts`）
- [X] T020 全Unit／Integration／D1 Test、typecheck、lint、format、build、schema checkを実行し結果を記録する（`specs/009-answer-period-browsing/validation-record.md`、`USE_CODEX.md`）

---

## Phase 7: 公開運用Foundational（管理Schemaと契約）

**目的**: 管理機能の全Storyが共有する監査・BAN・管理者設定の正本を先に固定する。

- [X] T021 管理者Email正規化、未設定拒否、Audit actionの固定値を検証するUnit Testを先に作成する（`tests/unit/admin.test.ts`）
- [X] T022 BAN・Audit Table、Index、Triggerのfresh／upgrade契約を検証するD1 Testを先に作成する（`tests/d1/admin-schema.test.ts`、`tests/d1/fresh-schema.test.ts`、`tests/d1/schema-contract.test.ts`）
- [X] T023 T021を満たす管理者設定と管理型を実装する（`src/domain/admin.ts`、`src/types/env.d.ts`）
- [X] T024 T022を満たすBAN・Audit SchemaとMigrationを実装する（`src/db/schema.ts`、`migrations/0006_admin_operations.sql`）
- [X] T025 開発・デプロイ用の管理者環境設定例と安全な設定規則を追記する（`.dev.vars.example`、`README.md`）

**Checkpoint**: 管理者設定、BAN、Audit logの永続契約が独立して検証できる。

---

## Phase 8: User Story 4 - 運用操作を監査する（優先度: P1）

**目標**: Login／Logout、Question／Answer入力、管理操作の成功をActor・Target・時刻付きで追跡し、本文や認証秘密を複製しない。

**独立テスト**: 対象操作後のAudit logが期待Actionを1件持ち、Question／Answer秘密値を含まないことをD1で確認する。

### テスト

- [X] T026 [US4] Session作成・削除、Question／Answer作成・更新Triggerと秘密値非記録を検証するD1 Testを先に作成する（`tests/d1/audit-log.test.ts`）

### 実装

- [X] T027 [US4] Session、Question、Answerの成功操作を追記するD1 Triggerを実装する（`migrations/0006_admin_operations.sql`）
- [X] T028 [US4] Audit log一覧投影と管理操作用追記をAdmin Repositoryへ実装する（`src/repositories/admin-repository.ts`）

**Checkpoint**: 既存の入力経路を変更せず、DB上の成功操作が監査される。

---

## Phase 9: User Story 5 - 単一管理者として管理画面へ入る（優先度: P1）

**目標**: 設定EmailとSession Userが一致する1人だけが管理画面と管理操作へアクセスできる。

**独立テスト**: 未ログイン、一般User、管理者、設定不備の4状態でGETとPOSTを直接実行し、管理者以外に情報が0件であることを確認する。

### テスト

- [X] T029 [P] [US5] DB User Emailとの管理者一致・不一致・User欠落を検証するD1 Testを先に作成する（`tests/d1/admin-repository.test.ts`）
- [X] T030 [P] [US5] 未ログイン・一般User・設定不備の通常404、管理者200、private no-storeを検証するIntegration Testを先に作成する（`tests/integration/admin.test.ts`）

### 実装

- [X] T031 [US5] Session由来User IDと設定Emailを照合するAdmin Repository認可を実装する（`src/repositories/admin-repository.ts`）
- [X] T032 [US5] 全管理Routeへ共通のFail Closed認可と安全なError画面を実装する（`src/routes/admin.tsx`、`src/views/admin.tsx`）
- [X] T033 [US5] Admin Repositoryと `/club-operations` RouteをWorkerへ注入・登録する（`src/index.tsx`、`src/app.tsx`）

**Checkpoint**: 管理者以外は管理情報と変更操作へ到達できない。

---

## Phase 10: User Story 6 - 公開データを一覧する（優先度: P1）

**目標**: 管理者がUser、Question、Answer、Audit logを対象確認に必要な情報だけで一覧できる。

**独立テスト**: 複数Entityが新しい順に表示され、未信頼本文が実行可能なHTMLにならないことを確認する。

### テスト

- [X] T034 [P] [US6] User・Question・Answer・Audit logの管理者用投影、順序、BAN状態を検証するD1 Testを先に追加する（`tests/d1/admin-repository.test.ts`）
- [X] T035 [P] [US6] 4一覧、空状態、未信頼本文escape、Repository障害を検証するIntegration Testを先に追加する（`tests/integration/admin.test.ts`）

### 実装

- [X] T036 [US6] 4一覧を1つの管理Dashboardへ返す最小投影を実装する（`src/repositories/admin-repository.ts`）
- [X] T037 [US6] User・Question・Answer・Audit log Sectionと確認FormをHono JSXで実装する（`src/views/admin.tsx`）
- [X] T038 [US6] 管理Dashboard取得と障害表示を `/club-operations` GETへ実装する（`src/routes/admin.tsx`）

**Checkpoint**: 管理者が削除・BAN対象を一覧上で識別できる。

---

## Phase 11: User Story 7 - 不適切なQuestionを削除する（優先度: P1）

**目標**: 管理者がQuestionと配下Answerだけを削除し、管理者Actorの監査記録を残す。

**独立テスト**: Answerを持つQuestion削除で対象と配下だけが消え、別QuestionとAudit logが残ることを確認する。

### テスト

- [X] T039 [P] [US7] Question Cascade削除、missing、監査Actor、Batch原子性を検証するD1 Testを先に追加する（`tests/d1/admin-repository.test.ts`）
- [X] T040 [P] [US7] 管理者削除303、確認不足400、missing404、一般Userの通常404を検証するIntegration Testを先に追加する（`tests/integration/admin.test.ts`）

### 実装

- [X] T041 [US7] Question削除と管理者Audit追記を同一Batchで実装する（`src/repositories/admin-repository.ts`）
- [X] T042 [US7] Question削除POST Routeと明示確認Formを実装する（`src/routes/admin.tsx`、`src/views/admin.tsx`、`src/app.tsx`）

**Checkpoint**: 不適切なQuestionを配下Answerごと安全に除去できる。

---

## Phase 12: User Story 8 - 不適切なAnswerを削除する（優先度: P1）

**目標**: 管理者が指定Answerだけを削除し、Questionと他Answerを維持する。

**独立テスト**: 同一Questionの2件中1件だけが消え、回答数とAudit logへ反映されることを確認する。

### テスト

- [X] T043 [P] [US8] Answer単独削除、missing、他Answer維持、監査Actorを検証するD1 Testを先に追加する（`tests/d1/admin-repository.test.ts`）
- [X] T044 [P] [US8] 管理者削除303、確認不足400、missing404、一般Userの通常404を検証するIntegration Testを先に追加する（`tests/integration/admin.test.ts`）

### 実装

- [X] T045 [US8] Answer削除と管理者Audit追記を同一Batchで実装する（`src/repositories/admin-repository.ts`）
- [X] T046 [US8] Answer削除POST Routeと明示確認Formを実装する（`src/routes/admin.tsx`、`src/views/admin.tsx`、`src/app.tsx`）

**Checkpoint**: Questionを維持したまま不適切なAnswerだけを除去できる。

---

## Phase 13: User Story 9 - UserをBANする（優先度: P1）

**目標**: 管理者が一般UserをBANして既存・新規Sessionを停止し、必要時に解除できる。

**独立テスト**: BANで全Sessionが消え、新規Session作成が拒否され、解除後に作成でき、管理者自身はBANできないことを確認する。

### テスト

- [X] T047 [P] [US9] BAN／解除、全Session失効、自己BAN拒否、管理Auditを検証するD1 Testを先に追加する（`tests/d1/admin-repository.test.ts`）
- [X] T048 [P] [US9] BAN／解除Route、自己BAN409、一般Userの通常404を検証するIntegration Testを先に追加する（`tests/integration/admin.test.ts`）
- [X] T049 [P] [US9] BAN中UserのSession作成拒否とLogin監査を検証する認証Integration Testを先に追加する（`tests/integration/auth-ban.test.ts`）

### 実装

- [X] T050 [US9] BAN登録・全Session削除・Audit追記と解除を原子的に実装する（`src/repositories/admin-repository.ts`）
- [X] T051 [US9] Better AuthのSession作成前BAN拒否を実装する（`src/auth/auth.ts`）
- [X] T052 [US9] BAN／解除POST Routeと自己BAN拒否、管理画面操作を実装する（`src/routes/admin.tsx`、`src/views/admin.tsx`、`src/app.tsx`）

**Checkpoint**: BAN中Userは既存Sessionでも再Loginでもアプリを利用できない。

---

## Phase 14: 公開運用回帰と文書

- [X] T053 管理マニュアル、構成図、データモデル、契約、Quickstartを実装結果へ同期する（`specs/009-answer-period-browsing/admin-manual.md`、`specs/009-answer-period-browsing/architecture.md`、`specs/009-answer-period-browsing/data-model.md`、`specs/009-answer-period-browsing/contracts/admin-operations.md`、`specs/009-answer-period-browsing/quickstart.md`）
- [X] T054 全Unit／Integration／D1 Test、typecheck、lint、format、build、schema checkを実行し結果を記録する（`specs/009-answer-period-browsing/validation-record.md`、`USE_CODEX.md`）

---

## Phase 15: 管理画面Pathと存在の非開示

- [X] T055 [US5] 管理画面を `/club-operations` へ変更し、旧 `/admin`、未ログイン、一般User、設定不備を通常の404と同じ応答にする（`src/domain/admin.ts`、`src/app.tsx`、`src/routes/admin.tsx`、`src/views/admin.tsx`）
- [X] T056 [US5] 一般画面の管理Link非表示、旧Path非Redirect、認可前の管理文言非露出、`noindex, nofollow`を回帰Testと文書で固定する（`tests/integration/admin.test.ts`、`specs/009-answer-period-browsing/`、`README.md`）

---

## Phase 16: 共通Header

- [X] T057 Home、Question Detail、Question管理、認可済み管理画面へ共通のLogo Headerを実装し、Vite AssetとしてBuild・配信されることを検証する（`src/views/site-header.tsx`、`src/views/*.tsx`、`tests/integration/*.test.ts`）

---

## Phase 17: Agent依頼PromptのQuestion URL対応

- [X] T058 [US3] コピー用Promptを確定済みの1行文面とし、リクエスト元のOriginを含むQuestion絶対URLを埋め込み、QueryとFragmentを除外する。詳細なAgent向け指示はWebMCP Tool契約へ分離し、ローカル／本番OriginとHTML escapingをUnit／Integration Testで固定する（`src/domain/agent-request-prompt.ts`、`src/routes/question.ts`、`src/views/question-detail.tsx`、`tests/unit/agent-request-prompt.test.ts`、`tests/integration/agent-request-prompt.test.ts`）

---

## Phase 18: Personal Context根拠付き回答契約

- [X] T059 [US3] 確定した1行Prompt、User Context参照元、User自身の記述の優先、事実と検討の区別、Assistant提案の除外、根拠不足時の質問・投稿停止、追加承認不要、投稿結果確認を先行Unit／Integration Testで固定する（`tests/unit/agent-request-prompt.test.ts`、`tests/unit/register-five-tools.test.ts`、`tests/unit/register-submit-answer-tool.test.ts`、`tests/unit/register-my-submission-tool.test.ts`、`tests/integration/agent-request-prompt.test.ts`、`tests/integration/webmcp-question-api.test.ts`、`tests/integration/question-visibility.test.ts`）
- [X] T060 [US3] 確定した1行Promptを表示し、詳細な汎用Context根拠規則を `get_question` の固定instructionとTool description／Schemaへ実装する。初回Prompt自体を投稿許可とし追加Previewや承認を要求せず、根拠不足時はHumanへ質問して投稿しない契約と、投稿後の本人状態確認を実装する（`src/domain/agent-request-prompt.ts`、`src/routes/question.ts`、`src/webmcp/register-get-question-tool.ts`、`src/webmcp/register-submit-answer-tool.ts`、`src/webmcp/register-my-submission-tool.ts`）
- [X] T061 [US3] SPEC 007・009、README、MILESTONE、検証記録を確定契約へ同期し、全自動品質Gateを実行する（`specs/007-webmcp-mvp-tools/`、`specs/009-answer-period-browsing/`、`README.md`、`MILESTONE.md`、`USE_CODEX.md`）

---

## 依存関係と実行順序

```text
Setup -> Foundational -> US1 -> US2 -> US3 -> Core回帰 -> 管理Foundational -> US4 -> US5 -> US6 -> US7 -> US8 -> US9 -> 公開運用回帰 -> 管理画面非開示 -> 共通Header -> Question URL Prompt -> Context根拠付き回答契約
```

- US1はHomeからDetailへ進む入口を作る。
- US2は既存Detailを未ログイン公開とsealed説明へ拡張する。
- US3はUS2のDetailへ既存Agent Promptと本人状態を統合する。
- US4は管理操作全体の監査基盤を作る。
- US5はUS6〜US9が共有する管理認可を確立する。
- US6はUS7〜US9の対象確認画面を作る。
- US7とUS8はUS6後に独立して実装できる。
- US9は管理認可と監査基盤に依存するが、コンテンツ削除とは独立する。
- Manual TestとVisual確認はSPEC 010の全画面実装後にまとめて行う。

### 並行実行機会

- T004とT005はD1／HTTPの異なる先行Testとして並行可能。
- T009とT010は新規Detail契約／既存認可回帰として並行可能。
- T029とT030、T034とT035、T039とT040、T043とT044、T047〜T049はRepository／HTTP／認証の異なる先行Testとして並行可能。

## 実装戦略

1. T001〜T003で最小の表示判断を固定する。
2. T004〜T008でHomeのQuestion発見を完成する。
3. T009〜T014で公開Detailとsealedを完成する。
4. T015〜T018で回答後の状態変化を完成する。
5. T019〜T020で全自動回帰を通し、本日中にSPEC 010へ移る。
6. T021〜T025で公開運用のSchemaと設定を固定する。
7. T026〜T038で監査、管理認可、4一覧を完成する。
8. T039〜T052でQuestion／Answer削除とUser BANを順に完成する。
9. T053〜T054で文書同期と全自動回帰を行う。
10. T055〜T056で管理画面Pathと認可前の存在非開示を固定する。
11. T057で全HTML画面の共通Logo Headerを固定する。
12. T058でコピー用Promptに環境追従するQuestion絶対URLを埋め込む。
13. T059〜T061で確定Promptと汎用Context根拠規則、追加承認不要、根拠不足時の投稿停止、投稿結果確認をTool契約へ反映する。

## 注記

- 新規Dependency、専用Login、My Questions再設計を追加しない。公開運用に必要なMigrationは1件だけ追加する。
- 既存SPEC 007・008のToolとAnswer認可を変更しない。
- 見た目を暫定実装して作り直さず、SPEC 010で一貫したVisual Directionを適用する。
- テストは実装前に作成し、期待した理由で失敗することを確認する。
