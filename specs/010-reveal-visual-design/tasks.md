# タスク: 回答公開体験とチャレンジ向け視覚設計

**入力**: `specs/010-reveal-visual-design/`の設計文書

**前提資料**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**テスト方針**: 機能仕様のFR-033・FR-034および`AGENTS.md`に従い、純粋ロジック、永続化境界、主要画面状態、公開範囲、主要導線のテストを実装より先に追加する。手動確認は開発可能な項目の完了後にまとめて行う。

**編成方針**: ユーザーストーリー単位で独立実装・独立検証できるように分ける。同じP1内ではMILESTONEの「追加SPECをまずは優先する」に従い、ホーム改善、一覧、質問管理を回答公開比較より先に実施する。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 未完了タスクへの依存がなく、別ファイルで並行実施できる
- **[US1]〜[US6]**: `spec.md`のユーザーストーリー番号
- すべてのタスクに変更先または検証対象の正確なファイルパスを記載する

## 第1段階: 準備（共有基盤）

**目的**: Tailwind CSSとReact Icons由来資材を、既存Vite・Hono JSX構成へ再現可能に組み込む。

- [X] T001 Tailwind CSS 4系、`@tailwindcss/vite`、React Icons 5系、生成時用React・React DOMを追加し、固定された依存関係と資材生成コマンドを`package.json`と`package-lock.json`へ反映する
- [X] T002 `src/styles.css`をクライアント資材へ取り込み、固定名`client-dist/styles.css`を生成するTailwind公式プラグインとViteライブラリ設定を`vite.client.config.ts`へ追加する
- [X] T003 React Iconsの固定許可一覧を静的SVGへ決定的に変換し、利用者入力を受け付けない生成処理を`scripts/generate-icons.mjs`へ実装する
- [X] T004 T003の生成処理を実行してReact Icons由来の追跡可能な固定SVG辞書を`src/generated/icons.ts`へ作成する

---

## 第2段階: 基礎（全ストーリーの前提）

**目的**: 共通レイアウト、アイコン境界、視覚変数、クライアント初期化を用意する。

**重要**: この段階が完了するまでユーザーストーリー固有の実装を開始しない。

- [X] T005 [P] 生成済みアイコンが固定許可一覧だけを含み再生成で差分が出ないこと、およびCSS資材がビルドされることを`tests/integration/assets.test.ts`へ先に追加する
- [X] T006 [P] 意味を持つアイコンと装飾アイコンのアクセシブル属性を固定する表示テストを`tests/unit/icon.test.ts`へ先に追加する
- [X] T007 生成済み固定SVGだけを読み、英語ラベルまたは`aria-hidden`を排他的に出力する共通表示部品を`src/views/icon.tsx`へ実装する
- [X] T008 全画面のHTML骨格、`/styles.css`、`/client.js`、メタ情報、共通幅を集約する`SiteLayout`を`src/views/layout.tsx`へ実装する
- [X] T009 紙色・墨色・操作色・封印色・公開色、書体、フォーカス、画面幅、動き低減の共通変数と基礎規則を`src/styles.css`へ定義し、`src/client.ts`から読み込む

**確認地点**: CSSとアイコンの生成、共通SSR骨格、クライアント資材の読み込みが独立して検証できる。

---

## 第3段階: ユーザーストーリー 2 - ホームから回答可能・公開済み質問を見つける (優先度: P1) 🎯 追加仕様の最初の成果

**目標**: ホームへ回答受付中5件と公開済み10件を表示し、日時一括切替と質問ごとの依頼文開閉・コピーを提供する。

**独立テスト**: 6件以上の`OPEN`質問と11件以上の`REVEALED`質問を用意し、上限、順序、空・障害状態、認証別依頼文、日時一括切替、コピーをホームだけで確認する。

### テスト

- [X] T010 [P] [US2] ホーム2区分の上限・順序・排他性と本人回答状態の純粋な組み立てテストを`tests/unit/question-listing.test.ts`へ先に追加する
- [X] T011 [P] [US2] 回答受付中5件・公開済み10件・回答数・本人回答有無を回答秘密値なしで取得するD1テストを`tests/d1/question-browsing-repository.test.ts`へ先に追加する
- [X] T012 [P] [US2] ホームの2区分、空・部分障害、認証別依頼文、英語表示、利用者別Cache制御を`tests/integration/home.test.ts`へ先に追加する
- [X] T013 [P] [US2] 日時一括切替と質問単位の依頼文開閉・コピー成功失敗を`tests/unit/question-list.test.ts`と`tests/unit/agent-prompt-clipboard.test.ts`へ先に追加する

### 実装

- [X] T014 [US2] ホーム投影型、5件・10件上限、本人回答表示状態を`src/domain/question-listing.ts`へ実装する
- [X] T015 [US2] 上限付き2区分と対象5件の本人回答有無を逐次問い合わせなしで返すリポジトリ契約・D1処理・メモリー補助を`src/repositories/question-repository.ts`と`tests/helpers/question-repository.ts`へ実装する
- [X] T016 [US2] 認証失敗を未回答に変換せず、同一時刻Snapshotと利用者別Cache制御で2区分を返すホーム経路を`src/routes/home.tsx`と`src/app.tsx`へ実装する
- [X] T017 [US2] 共通質問カード、ホーム2区分、全件リンク、封印・公開アイコン、閉じた依頼文領域を`src/views/question-card.tsx`と`src/views/home.tsx`へ実装する
- [X] T018 [US2] 同一一覧内の日時一括切替、独立した依頼文開閉、既存コピー処理の複数項目対応を`src/ui/question-list.ts`、`src/ui/agent-prompt-clipboard.ts`、`src/client.ts`へ実装する

**確認地点**: ホームだけで回答参加と公開済み質問発見の双方を開始でき、他者回答情報は含まれない。

---

## 第4段階: ユーザーストーリー 3 - 質問一覧をページ単位で閲覧する (優先度: P1)

**目標**: 回答受付中・公開済みの専用一覧を20件単位で安定して移動できるようにする。

**独立テスト**: 各状態を21件以上用意し、上限、順序、前後移動、現在位置、不正・範囲外ページ、秘密値非露出を専用一覧だけで確認する。

### テスト

- [X] T019 [P] [US3] 正のページ番号解析、総ページ計算、0件・境界件数・範囲外の単体テストを`tests/unit/question-listing.test.ts`へ先に追加する
- [X] T020 [P] [US3] 状態別20件取得、総件数、決定的順序、ページ間非重複、秘密値非投影を`tests/d1/question-browsing-repository.test.ts`へ先に追加する
- [X] T021 [P] [US3] 両一覧の英語見出し、ページ導線、不正指定、空・障害状態を`tests/integration/question-list.test.ts`へ先に追加する

### 実装

- [X] T022 [US3] `QuestionListPage`型、固定20件、ページ指定検証、前後移動判断を`src/domain/question-listing.ts`へ実装する
- [X] T023 [US3] `open`と`revealed`の状態別件数・ページ投影を`src/repositories/question-repository.ts`と`tests/helpers/question-repository.ts`へ実装する
- [X] T024 [US3] `/questions/open`と`/questions/revealed`の経路、同一時刻Snapshot、安全な範囲外応答を`src/routes/question-list.tsx`と`src/app.tsx`へ実装する
- [X] T025 [US3] 共通質問カードを再利用した20件一覧、`Previous`、`Next`、現在ページ、空・障害状態を`src/views/question-list.tsx`へ実装する

**確認地点**: ホーム上限を超える質問へ、キーボード操作可能なページ移動で到達できる。

---

## 第5段階: ユーザーストーリー 4 - 質問を下書き保存・即時公開・削除する (優先度: P1)

**目標**: 翌日0時の初期値、下書き保存と即時公開、保存先を含む二重実行防止、所有者削除を完成させる。

**独立テスト**: 新規質問画面だけで両作成意図と再送一意性を確認し、`My Questions`と所有者詳細だけで確認付き削除・連鎖削除・監査・認可拒否を確認する。

### テスト

- [X] T026 [P] [US4] 翌日0時、1時間未満時の翌々日、月末・年末・夏時間補正、既存値非上書きの単体テストを`tests/unit/question-deadline.test.ts`へ先に追加する
- [X] T027 [P] [US4] 最初の有効送信、操作意図保持、ボタン無効化、無効フォーム非ロックの単体テストを`tests/unit/form-submission-guard.test.ts`へ先に追加する
- [X] T028 [P] [US4] `draft`・`publish`作成、同一トークン再送、異内容競合、入力エラー、所有者削除のHTTPテストを`tests/integration/question-management.test.ts`へ先に追加する
- [X] T029 [P] [US4] 作成トークン一意性、即時公開、所有者・版条件付き削除、回答連鎖削除、`QUESTION_DELETED`監査のD1テストを`tests/d1/question-management-repository.test.ts`へ先に追加する
- [X] T030 [P] [US4] 所有者・非所有者・未認証・全質問状態で削除操作の表示と非表示を`tests/integration/question-browsing.test.ts`へ先に追加する

### 実装

- [X] T031 [P] [US4] 現地日付の最初の有効な午前0時と`datetime-local`値を計算する純粋ロジックを`src/domain/question-deadline.ts`へ実装する
- [X] T032 [P] [US4] `QUESTION_DELETED`監査操作値と作成意図・作成トークン・削除結果型を`src/domain/admin.ts`と`src/repositories/question-repository.ts`へ追加する
- [X] T033 [US4] 指定IDによる下書き・即時公開の条件付き作成、同一再送判定、所有者・版条件付き監査付き削除を`src/repositories/question-repository.ts`と`tests/helpers/question-repository.ts`へ実装する
- [X] T034 [US4] `POST /questions`の`intent`分岐と作成トークン検証、`POST /questions/:questionId/delete`の認証・確認・競合・Redirectを`src/routes/question-management.tsx`と`src/app.tsx`へ実装する
- [X] T035 [US4] 新規フォームへ一意な作成トークン、`Save as draft`、`Publish question`、所有質問へ英語の削除確認と結果通知を`src/views/question-management.tsx`と`src/views/question-detail.tsx`へ実装する
- [X] T036 [US4] 回答締切初期化と全状態変更フォームの操作別二重送信防止を`src/ui/deadline-display.ts`、`src/ui/form-submission-guard.ts`、`src/client.ts`へ実装する

**確認地点**: 直接再送を含め1つの作成意図から質問は最大1件となり、所有者削除は回答・監査と整合する。

---

## 第6段階: ユーザーストーリー 1 - 公開された独立回答を比較する (優先度: P1)

**目標**: 公開後の要約文を安定した匿名順で表示し、必要な本文を複数件開いたまま比較できるようにする。

**独立テスト**: 回答0・1・複数件の`REVEALED`質問を使い、匿名連番、順序、初期本文非埋め込み、複数展開、項目別エラー、未認証・WebMCP非露出を確認する。

### テスト

- [X] T037 [P] [US1] 初回投稿時刻と識別子による回答順、匿名連番、0・1・複数件を`tests/d1/question-browsing-repository.test.ts`へ先に追加する
- [X] T038 [P] [US1] 公開状態、空表示、要約文一覧、本文非埋め込み、未認証拒否を`tests/integration/question-browsing.test.ts`と`tests/integration/question-visibility.test.ts`へ先に追加する
- [X] T039 [P] [US1] 回答ごとの処理中・展開・折り畳み・取得済み再利用・再試行・複数同時展開を`tests/unit/revealed-answers.test.ts`へ先に追加する

### 実装

- [X] T040 [US1] 公開要約文投影へ初回投稿順を保証する情報と匿名連番を追加し、回答者情報を除外する処理を`src/repositories/question-repository.ts`と`src/domain/question-browsing.ts`へ実装する
- [X] T041 [US1] 封印から公開への状態表現、`Answer 1`からの要約文一覧、`No answers were submitted.`、本文格納領域を`src/views/question-detail.tsx`へ実装する
- [X] T042 [US1] 回答ごとの遅延取得、処理中表示、複数同時展開、取得済み本文再利用、項目別再試行を`src/ui/revealed-answers.ts`と`src/client.ts`へ実装する
- [X] T043 [US1] 既存回答詳細経路の認証・`REVEALED`・質問所属・`private, no-store`契約を維持して画面導線と結合する処理を`src/routes/question.ts`へ実装する

**確認地点**: 認証済み人だけが2件以上の回答本文を比較でき、初期HTMLとWebMCPには他者本文がない。

---

## 第7段階: ユーザーストーリー 5 - 一貫した視覚設計で状態を理解する (優先度: P1)

**目標**: ホームから公開回答までを、統一された書体・配色・配置・アイコン・動き・画面幅対応で仕上げる。

**独立テスト**: 主要画面を320・768・1280ピクセル相当、200%拡大、キーボード、動き低減で確認し、英語表示、生の利用者ID非表示、状態の知覚可能性を検証する。

### テスト

- [X] T044 [P] [US5] 共通スタイル資材、英語ランドマーク、アイコン名、フォーカス、`Signed in as`非表示を`tests/integration/assets.test.ts`と`tests/integration/home.test.ts`へ先に追加する
- [X] T045 [P] [US5] 質問詳細・作成・確認・所有一覧の共通骨格とアクセシブル状態表示を`tests/integration/question-browsing.test.ts`と`tests/integration/question-management.test.ts`へ先に追加する

### 実装

- [X] T046 [US5] 共通`SiteLayout`とReact Icons由来アイコンをヘッダー・ナビゲーションへ適用し、生の利用者ID表示を除去する変更を`src/views/layout.tsx`、`src/views/site-header.tsx`、`src/client.ts`へ実装する
- [X] T047 [P] [US5] ホーム・両質問一覧・共通カードのTailwindクラス、封印琥珀色、公開橙色、短い遷移、長文折返しを`src/views/home.tsx`、`src/views/question-list.tsx`、`src/views/question-card.tsx`へ実装する
- [X] T048 [P] [US5] 質問詳細・公開回答・本人回答の読解階層、状態アイコン、複数回答の縦比較、処理中・空・エラー状態を`src/views/question-detail.tsx`へ実装する
- [X] T049 [P] [US5] 質問作成・確認・所有一覧のフォーム、主要・危険操作、エラー、処理中、狭い画面のTailwindクラスを`src/views/question-management.tsx`へ実装する
- [X] T050 [US5] 主要画面の共通配色、4.5対1・3対1のコントラスト、200%拡大、320ピクセル幅、視認可能なフォーカス、動き低減を`src/styles.css`で最終調整する

**確認地点**: 主要画面が同じ製品として認識でき、色・アイコン・文字の複数手段で状態を理解できる。

---

## 第8段階: ユーザーストーリー 6 - 3分デモで主要体験を伝える (優先度: P1)

**目標**: 回答0件から2件、封印から公開、2回答比較までのデモ導線と安全境界を一続きで保証する。

**独立テスト**: 2利用者と1質問で規定導線を実行し、3分以内の画面遷移、状態変化、WebMCP非露出を確認する。

### テストと検証

- [X] T051 [US6] ホーム、依頼文、回答数0・1・2件、封印、公開、2本文比較を結ぶ自動結合シナリオを`tests/integration/challenge-demo.test.ts`へ先に追加する
- [X] T052 [US6] 既存5つのWebMCPツールが他者回答数・要約文・本文・識別子を返さない回帰を`tests/integration/webmcp-question-api.test.ts`と`tests/unit/register-five-tools.test.ts`へ追加する
- [X] T053 [US6] `quickstart.md`の3分デモを2件以上の異なる実回答で手動実施し、所要時間、画面遷移、封印・公開、非露出結果を`specs/010-reveal-visual-design/validation-record.md`へ記録する

**確認地点**: Challengeの中心価値と安全境界を3分以内の一続きのデモとして再現できる。

---

## 第9段階: 仕上げと横断確認

**目的**: 全ストーリーを統合し、文書・品質ゲート・マイルストーンを完了状態へ揃える。

- [X] T054 [P] ホーム・質問一覧・質問詳細・質問管理の変更内容と操作方法を`README.md`および既存の`specs/009-answer-period-browsing/user-manual.md`へ反映する
- [X] T055 [P] React Icons生成、Tailwind CSS資材、質問一覧、所有者削除、3分デモの開発・検証手順を`specs/010-reveal-visual-design/quickstart.md`へ実装結果に合わせて更新する
- [X] T056 全Nodeテスト、D1テスト、型検査、Lint、Format、Build、Schema検査、アイコン再生成差分検査を実行し、結果を`specs/010-reveal-visual-design/validation-record.md`へ記録する
- [X] T057 320・768・1280ピクセル相当、200%拡大、キーボード、動き低減、長文、コピー失敗、回答取得失敗をまとめて手動確認し、結果を`specs/010-reveal-visual-design/validation-record.md`へ追記する
- [X] T058 すべての受け入れ条件と未解決事項を確認し、完了時だけ`MILESTONE.md`のSPEC 010を完了へ更新して、使用モデルと重要判断を`USE_CODEX.md`へ記録する

---

## 第10段階: 採用済み回答者匿名表示と仕様同期

**目的**: 認証済み回答である安心感と質問横断追跡を防ぐ匿名性を両立し、追加UI改修をSPEC成果物へ同期する。

- [X] T059 [P] [US1] 質問単位匿名アイコンの決定性・質問間分離・模様境界と、認証説明・回答者秘密値非露出の失敗先行Testを`tests/unit/anonymous-participant.test.ts`、`tests/integration/question-visibility.test.ts`、`tests/integration/challenge-demo.test.ts`へ追加する
- [X] T060 [US1] 質問識別子と回答識別子だけから匿名アイコンを生成する純粋処理を`src/domain/anonymous-participant.ts`へ実装し、公開結果の冒頭説明、各回答の匿名アイコン、`Authenticated participant`を`src/views/question-detail.tsx`へ表示する
- [X] T061 [US5] Hero背景の実装を仕様どおり不透明度30%へ修正し、過去のHeader、Card、日時、削除、管理一覧、英語Label変更と今回の匿名回答者方針をSPEC、計画、データモデル、契約、調査、Quickstartへ同期する
- [X] T062 全Nodeテスト、D1テスト、型検査、Lint、Format、Build、Schema検査を実行し、結果を`specs/010-reveal-visual-design/validation-record.md`へ記録する
- [X] T063 受け入れ条件、仕様品質Checklist、未解決事項を再確認し、使用モデルと重要判断を`USE_CODEX.md`へ記録する
- [X] T064 [P] [US2] Open Questionは`View question`だけ、ResultsはCard面全体から遷移する状態分岐Testを`tests/unit/question-card.test.ts`へ追加する
- [X] T065 [US2] `src/views/question-card.tsx`のCard全体リンクをResultsだけに限定し、SPEC、画面契約、Quickstart、利用者文書、検証記録を同期する
- [X] T066 [P] [US2] 明示的な個人見解がない場合の最善の代理回答、未確認事実の非断定、不要な確認質問の禁止を`tests/unit/register-five-tools.test.ts`、`tests/unit/register-submit-answer-tool.test.ts`、WebMCP API結合Testへ追加する
- [X] T067 [US2] `get_question`の固定instructionと`get_question`・`submit_answer`のdescriptionを代理回答方針へ更新し、SPEC 007・009・010の関連成果物へ同期する
- [X] T068 全Nodeテスト、型検査、Lint、Format、Production Buildを実行し、結果を`specs/010-reveal-visual-design/validation-record.md`と`USE_CODEX.md`へ記録する
- [X] T069 [P] [US2] Agent依頼PromptがChatGPTの組み込みブラウザを指定し既存Chrome Tabを除外する固定文面Testを`tests/unit/agent-request-prompt.test.ts`と`tests/integration/agent-request-prompt.test.ts`へ追加する
- [X] T070 [US2] `src/domain/agent-request-prompt.ts`の1行Promptを組み込みブラウザ指定へ更新し、README、MILESTONE、SPEC 007・009・010の関連成果物へ同期する
- [X] T071 全Nodeテスト、型検査、Lint、Format、Production Buildを実行し、結果を`specs/010-reveal-visual-design/validation-record.md`と`USE_CODEX.md`へ記録する
- [X] T072 [P] [US1] [US2] Question Cardと詳細の回答済み時だけの`Answered`、公開前の本人回答限定表示、Resultsの`Your answer`、回答者利用者ID非露出をUnit／Integration／D1 Testで固定する
- [X] T073 [US1] [US2] 本人回答済みQuestion集合と公開Excerptの`isOwn`投影をRepositoryへ実装し、Question Card・詳細へ緑色の回答状態Tag、公開結果の本人回答へ`Your answer` Tagを表示する
- [X] T074 SPEC、計画、データモデル、画面契約、調査、Quickstartを同期し、全Nodeテスト、D1テスト、型検査、Lint、Format、Production Build、Schema検査の結果を検証記録と`USE_CODEX.md`へ記録する
- [X] T075 [US2] 回答済みQuestion CardのCheck Iconと`Your agent has answered.`を横並びにし、表示回帰Testと検証記録を更新する
- [X] T076 [US2] 未回答時の`Not answered` Tagを除去し、回答済みの場合だけ`Answered` Tagを表示するよう実装・Test・SPEC成果物を同期する

---

## 依存関係と実行順序

### 段階間の依存関係

- **第1段階（準備）**: 依存なし。直ちに開始できる。
- **第2段階（基礎）**: 第1段階に依存し、全ユーザーストーリーをブロックする。
- **第3段階（US2）**: 第2段階後に開始する。MILESTONEの追加仕様を優先する最初の画面成果。
- **第4段階（US3）**: 第2段階後に独立着手できるが、共通質問カードを再利用する場合はT017後に統合する。
- **第5段階（US4）**: 第2段階後に独立着手できる。質問作成・削除の保存先変更を先に確定する。
- **第6段階（US1）**: 第2段階後に独立着手できる。公開比較の画面統合はT017の共通カード規則と整合させる。
- **第7段階（US5）**: US1〜US4の実装済み画面を対象に最終視覚調整するため、第3〜6段階に依存する。
- **第8段階（US6）**: 主要導線全体を扱うため、第3〜7段階に依存する。
- **第9段階（仕上げ）**: 希望する全ユーザーストーリーの完了後に実施する。
- **第10段階（採用済み追加要件）**: T059の失敗先行Test後にT060とT061を実施し、T062・T063で横断検証する。
- **第11段階（本人回答状態の可視化）**: T072の回帰Testを基準にT073を確認し、T074で仕様成果物と品質ゲートを同期する。

### ユーザーストーリー依存図

```text
準備 -> 基礎 -> US2 ─┐
              -> US3 ─┼-> US5 -> US6 -> 仕上げ
              -> US4 ─┤
              -> US1 ─┘
```

### 各ユーザーストーリー内

- 対象テストを先に作成し、期待する失敗を確認してから実装する。
- 純粋ロジックと型を保存先・経路より先に実装する。
- 保存先処理を経路より先に実装する。
- 経路とSSRをクライアント操作より先に完成させる。
- 各確認地点でそのストーリーのテストを単独実行してから次へ進む。

## 並行実施例

### US2

```text
T010: question-listing単体テスト
T011: D1ホーム投影テスト
T012: ホーム結合テスト
T013: 日時・依頼文クライアントテスト
```

### US3

```text
T019: ページ計算単体テスト
T020: D1ページ投影テスト
T021: 一覧経路結合テスト
```

### US4

```text
T026: 回答締切初期値テスト
T027: 二重送信防止テスト
T028: 質問管理HTTPテスト
T029: 作成・削除D1テスト
T030: 削除表示テスト
```

### US1

```text
T037: 公開回答順D1テスト
T038: 公開範囲HTTPテスト
T039: 回答展開クライアントテスト
```

### US5

```text
T047: ホーム・一覧・カードの視覚実装
T048: 質問詳細・回答比較の視覚実装
T049: 質問管理の視覚実装
```

## 実装戦略

### 追加仕様を先に完成させる最小範囲

1. 第1・2段階でTailwind CSS、React Icons由来資材、共通レイアウトを用意する。
2. US2でホーム2区分、依頼文開閉、日時一括切替を完成する。
3. US3で20件単位の全件一覧を完成する。
4. US4で翌日0時、下書き・即時公開、二重実行防止、所有者削除を完成する。
5. 各ストーリーを独立検証してから回答公開比較へ進む。

### Challenge価値の完成

1. US1で封印解除と2件以上の回答比較を完成する。
2. US5で全主要画面の視覚品質、画面幅対応、アクセシビリティを揃える。
3. US6で0・1・2件、封印、公開、比較、WebMCP非露出を3分デモとして固定する。
4. 第9段階で全品質ゲートと手動確認をまとめて実施する。

## 注記

- `[P]`は別ファイルかつ未完了タスクへの依存がない作業だけに付けた。
- ユーザーストーリー段階の全タスクは対応する`[USn]`を持つ。
- React Iconsは生成元として使い、生成済み固定SVG以外の生HTMLを利用者入力から作らない。
- 手動テストはT053・T057まで行わず、開発可能な機能と自動テストを先に完了する。
- 他者の既存変更を上書きせず、各確認地点で差分と回帰を確認する。
