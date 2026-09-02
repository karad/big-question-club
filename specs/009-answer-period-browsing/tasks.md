# タスク: Challenge Core閲覧フロー

**入力**: `specs/009-answer-period-browsing/` の設計ドキュメント  
**前提**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/core-browsing.md`、`quickstart.md`

**テスト**: Challenge Coreの機能と既存安全境界を本日中に固定するため、Storyごとに先行テストを作成する。Manual TestはSPEC 010完了後にまとめて実施する。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクへの依存がなく、異なるファイルで並行実行できる
- **[Story]**: 対応するユーザーストーリー（US1〜US3）
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

## 依存関係と実行順序

```text
Setup -> Foundational -> US1 -> US2 -> US3 -> Core回帰
```

- US1はHomeからDetailへ進む入口を作る。
- US2は既存Detailを未ログイン公開とsealed説明へ拡張する。
- US3はUS2のDetailへ既存Agent Promptと本人状態を統合する。
- Manual TestとVisual確認はSPEC 010の全画面実装後にまとめて行う。

### 並行実行機会

- T004とT005はD1／HTTPの異なる先行Testとして並行可能。
- T009とT010は新規Detail契約／既存認可回帰として並行可能。

## 実装戦略

1. T001〜T003で最小の表示判断を固定する。
2. T004〜T008でHomeのQuestion発見を完成する。
3. T009〜T014で公開Detailとsealedを完成する。
4. T015〜T018で回答後の状態変化を完成する。
5. T019〜T020で全自動回帰を通し、本日中にSPEC 010へ移る。

## 注記

- 新規Dependency、Migration、専用Login、My Questions再設計を追加しない。
- 既存SPEC 007・008のToolとAnswer認可を変更しない。
- 見た目を暫定実装して作り直さず、SPEC 010で一貫したVisual Directionを適用する。
- テストは実装前に作成し、期待した理由で失敗することを確認する。
