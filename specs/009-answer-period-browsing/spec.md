# 機能仕様: Challenge Core閲覧フロー

**機能ブランチ**: `009-answer-period-browsing`

**作成日**: 2026-09-02

**ステータス**: ドラフト

**入力**: 「WebMCP Challengeの締切に向け、SPEC 009を回答期間中の必須機能だけへ絞り、表現品質とReveal体験は必須のSPEC 010で完成させる」

## ユーザーシナリオとテスト *(必須)*

### ユーザーストーリー 1 - Open Questionを見つける (優先度: P1)

HumanはHomeを開き、現在回答を受け付けているBig Questionを見つける。各Questionの本文、回答数、回答締切、残り時間、Answerが非公開であることを確認し、自分で選んだQuestion Detailへ進む。

**この優先度である理由**: Humanが回答対象を選ぶことが、Personal Agentへ明示的に参加を依頼するWebMCP体験の起点だからである。

**独立テスト**: `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` と回答数0・1・複数のQuestionを用意し、Homeに `OPEN` だけが締切順で表示され、選択したDetailへ移動できることを確認する。

**受け入れシナリオ**:

1. **前提** 回答受付中のQuestionが複数ある、**操作** HumanがHomeを開く、**結果** `OPEN` Questionだけが回答締切の早い順で表示される。
2. **前提** Homeに `OPEN` Questionがある、**操作** Humanが一覧項目を確認する、**結果** Question本文、回答数、絶対締切、残り時間、`Answers are sealed` が英語のラベルとともに表示される。
3. **前提** Humanが一覧のQuestionを選択する、**操作** Detailへの導線を実行する、**結果** 選択したQuestion Detailへ移動する。
4. **前提** `OPEN` Questionがない、**操作** HumanがHomeを開く、**結果** `No open questions right now.` と既存のQuestion作成またはSign inへの導線が表示される。
5. **前提** Questionが締切へ到達した、**操作** HumanがHomeを再読込する、**結果** 対象Questionは一覧から除かれ、負の残り時間は表示されない。

---

### ユーザーストーリー 2 - 回答期間中のsealed状態を理解する (優先度: P1)

HumanはQuestion DetailでQuestion本文、回答数、回答締切、残り時間を確認し、Answerが締切までsealedであることを理解する。未ログインHumanにはSign inへの導線、認証済みで未回答のHumanにはSPEC 007のAgent依頼プロンプトを表示する。

**この優先度である理由**: 「HumanがQuestionを選び、Personal Agentが互いの回答を見ずに答える」というChallengeの中心的な仕組みを画面上で成立させるため。

**独立テスト**: 他者Answerへ一意な秘密値を入れた `OPEN` Questionを未ログイン、作成者、認証済み未回答の各状態で開き、公開情報と正しい次の行動だけが表示され、他者Answer情報がHTMLに含まれないことを確認する。

**受け入れシナリオ**:

1. **前提** Answerがある `OPEN` Questionである、**操作** HumanがDetailを開く、**結果** Question本文、回答数、絶対締切、残り時間、`Answers are sealed`、独立回答のため締切まで非公開である旨が表示される。
2. **前提** 未ログインHumanが `OPEN` Questionを開いている、**操作** 参加方法を確認する、**結果** `Sign in to answer with your personal agent.` と既存Google Sign inへの導線が表示され、Agent依頼プロンプトと本人投稿情報は表示されない。
3. **前提** 認証済みHumanが `OPEN` Questionへ未回答である、**操作** Detailを開く、**結果** SPEC 007の `Ask your personal agent`、固定英語プロンプト、`Copy prompt` が表示される。
4. **前提** Question作成者が自分の `OPEN` Questionを開く、**操作** Detailを確認する、**結果** 作成者であることを確認できるが、Reveal前の他者Answerを閲覧する特権は与えられない。
5. **前提** Questionが `CLOSED` である、**操作** HumanがDetailを開く、**結果** 回答受付終了とsealed継続が表示され、新規Agent依頼プロンプトと他者Answer内容は表示されない。
6. **前提** 存在しないQuestionまたは `DRAFT` の公開URLである、**操作** Humanがアクセスする、**結果** 両者は同じ `Question unavailable.` となり、Draftの存在や内容を推測できない。

---

### ユーザーストーリー 3 - Agent回答後の変化を確認する (優先度: P1)

認証済みHumanはPersonal Agentが回答した後にQuestion Detailを再読込し、回答数が増えたこと、自分のAgentが回答済みであること、自分のAnswerが締切までsealedであることを確認する。他者Answerの内容は確認できない。

**この優先度である理由**: 3分デモに必要な「0件→1件→複数件」「回答本文は見えない」という視覚的な変化を成立させるため。

**独立テスト**: 同じQuestionへ2利用者のPersonal Agentが順に回答し、各再読込で回答数と本人状態が正しく変化し、双方のHumanにも他者Answerが表示されないことを確認する。

**受け入れシナリオ**:

1. **前提** 認証済みHumanのPersonal Agentが回答を投稿した、**操作** HumanがQuestion Detailを再読込する、**結果** `Your agent has answered.`、`Your answer remains sealed until the deadline.`、本人Answerが表示され、新規回答用プロンプトは表示されない。
2. **前提** 1人目のPersonal Agentが回答済みである、**操作** 別利用者のPersonal Agentが同じQuestionへ回答し画面を再読込する、**結果** 回答数が2件へ増え、各利用者は本人Answerだけを確認できる。
3. **前提** 他者Answerに識別可能な本文・Excerptがある、**操作** 未ログインHuman、Question作成者、未回答Human、回答済みHumanが `OPEN` または `CLOSED` Detailを開く、**結果** 他者Answerの本文、Excerpt、識別子、投稿者、個別時刻の露出は0件である。
4. **前提** 本人投稿状態の取得に失敗する、**操作** 認証済みHumanがDetailを開く、**結果** 未回答と誤表示せず `Your submission status is temporarily unavailable. Try again.` と表示し、Agent依頼プロンプトと本人Answerを表示しない。
5. **前提** Questionが `REVEALED` である、**操作** HumanがDetailを開く、**結果** SPEC 008で実装済みのReveal最小閲覧を後退させず、新規回答用プロンプトは表示されない。Challenge向けの完成表示はSPEC 010で扱う。

### エッジケース

- 回答締切の直前・同時刻・直後はサービス側のQuestion状態を正とし、同時刻以後に新規Agent依頼プロンプトや負の残り時間を表示しない。
- 回答数は `0 answers`、`1 answer`、`n answers` と単複を正しく表示し、投票数や世論の代表数と誤解させない。
- Question本文が日本語でもApplication UIは英語とし、Question本文を翻訳しない。
- Question本文と本人AnswerにHTML、Script、長い文字列が含まれても、画面構造や実行可能な内容として解釈しない。
- HomeまたはDetailの公開情報取得に失敗した場合、空一覧や回答0件と誤表示せず、一時的に利用できないことを表示する。
- 認証または本人Answer取得に失敗した場合、Private情報とAgent依頼プロンプトを表示しない。
- 利用者ごとに異なるDetail応答を別利用者または未ログインHumanへ再利用しない。

## 要件 *(必須)*

### 機能要件

- **FR-001**: システムは、Homeにサービス側現在時刻で `OPEN` と判定した公開Questionだけを表示しなければならない。
- **FR-002**: システムは、HomeのQuestionを回答締切の昇順、同一締切では一貫した順序で表示しなければならない。
- **FR-003**: システムは、Homeの各Questionに本文、回答数、絶対締切、非負の残り時間、`Answers are sealed`、Detailへの導線を表示しなければならない。
- **FR-004**: システムは、Open QuestionがないHomeに `No open questions right now.` と既存のQuestion作成またはSign inへの導線を表示しなければならない。
- **FR-005**: システムは、公開済みQuestion Detailを未ログインHumanと認証済みHumanに提供し、Question本文、現在状態、回答数、絶対締切、残り時間を表示しなければならない。
- **FR-006**: システムは、`OPEN` Questionに `Answers are sealed` と、独立回答を守るため締切までAnswerが非公開である英語説明を表示しなければならない。
- **FR-007**: システムは、未ログインHumanに既存Google Sign inへの導線を表示し、Agent依頼プロンプトと本人投稿情報を表示してはならない。
- **FR-008**: システムは、認証済みかつ未回答のHumanの `OPEN` Questionに限り、SPEC 007の固定Agent依頼プロンプト、選択可能な全文、`Copy prompt`、コピー結果を表示しなければならない。
- **FR-009**: システムは、認証済みかつ回答済みのHumanに `Your agent has answered.`、`Your answer remains sealed until the deadline.`、本人Answerを表示し、新規Agent依頼プロンプトを表示してはならない。
- **FR-010**: システムは、Question作成者であることを本人投稿状態やReveal前のAnswer閲覧権限と混同してはならない。
- **FR-011**: システムは、`CLOSED` Questionに回答受付終了とsealed継続を表示し、新規Agent依頼プロンプトと他者Answer内容を表示してはならない。
- **FR-012**: システムは、`REVEALED` QuestionでSPEC 008の既存閲覧・アクセス制御を維持し、新規Agent依頼プロンプトを表示してはならない。
- **FR-013**: システムは、Question Detailの回答数を再読込時の最新集計値として表示し、0件から複数件への変化をHumanが確認できるようにしなければならない。
- **FR-014**: システムは、`OPEN` と `CLOSED` で他者Answerの本文、Excerpt、識別子、投稿者、個別時刻をHTML本文、属性、埋め込みデータ、Errorへ含めてはならない。
- **FR-015**: システムは、存在しないQuestionと公開URLから指定された `DRAFT` Questionを同じ利用不能結果で扱わなければならない。
- **FR-016**: システムは、本人投稿状態を有効なSessionからだけ判定し、取得不能時は未回答へ変換せず、Private情報とAgent依頼プロンプトを非表示にしなければならない。
- **FR-017**: システムは、Application UIを英語で表示し、Question本文と本人Answerを保存言語の未信頼テキストとして扱わなければならない。
- **FR-018**: システムは、利用者ごとに内容が異なるQuestion Detailを別Sessionへ再利用してはならない。
- **FR-019**: システムは、Home一覧、Question Detailの閲覧者状態、締切境界、回答数、Reveal前秘密値非露出を自動回帰テストで保証しなければならない。
- **FR-020**: 本SPECの完了判定は、専用Login画面、Login後の高度な戻り先管理、My Questionsの再設計、Reveal結果の完成表示、Challenge Visual Design、包括的なAccessibility監査に依存してはならない。

### 主要エンティティ

- **Open Question一覧項目**: Homeで発見できるQuestionの本文、回答数、締切、残り時間、sealed状態、Detail導線。
- **Question閲覧状態**: Question状態、認証状態、作成者一致、本人Submission状態を組み合わせた排他的な表示判断。
- **本人Submission**: 未投稿、投稿済み、取得不能のいずれか。投稿済みの場合だけ本人Answerを表示する。
- **表示期限**: 絶対締切と、同じサービス時刻Snapshotから導出した非負の残り時間。

## 成功基準 *(必須)*

### 測定可能な成果

- **SC-001**: 4つのQuestion状態を含む検証データで、Homeに表示されるQuestionの100%が `OPEN` であり、対象の全 `OPEN` Questionが締切順に表示される。
- **SC-002**: 未ログイン、作成者、認証済み未回答、認証済み回答済みの各状態で、Question、回答数、期限、sealed、次の行動の表示が100%期待結果と一致する。
- **SC-003**: 2人のPersonal Agentが順に回答したとき、再読込後の回答数が0件、1件、2件へ正しく変化し、各Humanに表示されるAnswerは本人分だけである。
- **SC-004**: `OPEN` と `CLOSED` の全検証主体で、他者Answer由来の秘密値露出がHTML本文、属性、埋め込みデータ、Errorのいずれにも0件である。
- **SC-005**: 回答締切の直前・同時刻・直後で、Question状態、残り時間、新規Agent依頼プロンプトの表示がサービス側判定と100%一致し、負の残り時間が0件である。
- **SC-006**: HumanはHomeを開いてから2分以内にOpen Questionを選び、sealedの意味と締切を確認し、Personal Agentへ渡すPromptへ到達できる。
- **SC-007**: 既存のQuestion作成、Google認証、5つのWebMCP Tool、Answer更新・削除、Reveal最小閲覧に関する自動回帰テストが100%成功する。

## 前提

- SPEC 005のQuestion状態判定、SPEC 006のQuestion作成・My Questions、SPEC 007のAgent依頼Promptと5 Tool、SPEC 008のAnswerアクセス制御とReveal最小閲覧を再利用する。
- Homeと公開済みQuestion Detailは、Challengeの体験を理解してからSign inを判断できるよう未ログインHumanにも提供する。
- 回答数はAnswer内容を含まない集計値としてHuman向け画面へ表示し、WebMCPへは追加しない。
- Question作成者は自分のQuestionへ回答できるが、作成者であることによるReveal前の閲覧特権は持たない。
- Questionは任意の言語で記述できる。主言語の入力・表示・APIメタデータは設けず、Personal AgentがQuestion本文から回答言語を判断する。
- 本SPECは本日中にChallenge Core機能を完成させる単位とする。画面のVisual Design、表現の磨き込み、Reveal後の比較体験は、必須のSPEC 010でまとめて完成させる。
- Manual TestはSPEC 010の画面実装完了後に、Core Demo全体としてまとめて実施する。

## 依存関係

- SPEC 005「ドメインデータモデルとQuestionライフサイクル」
- SPEC 006「Question作成・公開フロー」
- SPEC 007「WebMCP MVP Tool群」
- SPEC 008「Sealed Answersのアクセス制御」

## 対象外

- Challenge向けVisual Direction、Typography、Color、Layout、Motion、完成版Responsive表現（SPEC 010）
- Reveal後のAnswer一覧・比較を伝える完成版Human UI（SPEC 010）
- 専用Login画面、Login前Pageへの高度な復帰、認証Navigationの全面再設計
- My QuestionsとQuestion管理画面の再設計
- `axe-core`など新規Accessibility Test依存、VoiceOver、200% Zoom、JavaScript無効の網羅検証
- Question検索、推薦、ページ分割、`My Answers`
- 投票、順位付け、Best Answer、Winner、Consensus、AI Summary
- 追加の提出文書、包括的Cross-browser検証、非必須Hardening（SPEC 011）
