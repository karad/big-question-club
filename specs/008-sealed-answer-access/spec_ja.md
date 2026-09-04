# 機能仕様: Sealed Answersのアクセス制御

**機能ブランチ**: `008-sealed-answer-access`

**作成日**: 2026-09-02

**ステータス**: ドラフト

**入力**: 「MILESTONE.md の SPEC 008 — Sealed Answersのアクセス制御を実施」

## ユーザーシナリオとテスト *(必須)*

### ユーザーストーリー 1 - Reveal前の他者Answerを全経路で封印する (優先度: P1)

Questionの作成者、回答済みHuman、未回答Human、未認証者、Personal Agentのいずれも、Questionが `DRAFT`、`OPEN`、または `CLOSED` の間は、本人以外のAnswer本文、Excerpt、プレビュー、要約、識別子、投稿者、個別投稿時刻、および内容を推測できる派生情報を、SSR、HTTP API、WebMCPのどの公開経路からも取得できない。

**この優先度である理由**: 他者の回答から影響を受けない独立回答はサービスの中心価値であり、1経路でも漏えいすればSealed Answers全体が成立しないため。

**独立テスト**: `DRAFT` Questionでは推測したAnswer識別子へのアクセスを試し、異なる2人が識別可能なAnswerを投稿した公開済みQuestionでは `OPEN` と `CLOSED` の固定時刻ごとに、未認証者、作成者、投稿者本人、別の認証済みHuman、Personal Agentから全公開経路を利用する。本人の許可された情報以外に、他者Answer由来の値が1件も返らないことを確認する。

**受け入れシナリオ**:

1. **前提** 2件以上のAnswerを持つQuestionが `OPEN` である、**操作** 認証済みHumanがQuestion画面を表示する、**結果** 回答数、締切、sealed状態、および本人が投稿済みなら本人Answerだけを確認でき、他者Answer由来の内容や識別情報は表示も埋め込みもされない。
2. **前提** 2件以上のAnswerを持つQuestionが `CLOSED` かつReveal前である、**操作** 認証済みHumanがQuestion画面またはHuman向けHTTP経路を利用する、**結果** 回答受付が終了したことは確認できるが、他者Answerの公開範囲は `OPEN` と同じままである。
3. **前提** Questionが `DRAFT`、`OPEN`、または `CLOSED` である、**操作** Answer識別子を推測して詳細HTTP経路へ直接アクセスする、**結果** Answerの実在、所有者、Questionとの対応を区別できない共通の利用不能結果となり、Answer由来のデータは返らない。
4. **前提** Questionが `OPEN` または `CLOSED` である、**操作** Personal Agentが利用可能なWebMCP Toolを呼び出す、**結果** 他者Answerの本文、Excerpt、プレビュー、要約、識別子、投稿者、個別投稿時刻、投稿有無は返らない。

---

### ユーザーストーリー 2 - 回答数と本人Answerを必要な範囲だけ確認する (優先度: P1)

認証済みHumanとそのPersonal Agentは、公開済みQuestionについて本人の投稿状態を安全に確認でき、投稿済みなら本人のAnswer本文、Excerpt、投稿時刻、更新時刻を状態にかかわらず再取得できる。回答数はAnswer内容を含まない集計情報としてHuman向け経路だけに表示され、WebMCPには他者の投稿有無を推測させる回答数を返さない。

**この優先度である理由**: Humanが自分の公開予定内容と参加状況を確認できなければ安全に参加できず、一方で本人確認機能から他者情報が混入すると封印が破られるため。

**独立テスト**: 2人が同じ公開済みQuestionへ投稿した状態で、一方の認証済みHumanとPersonal Agentが `OPEN`、`CLOSED`、`REVEALED` の各状態で本人状態を確認する。Human向け経路では正しい回答数と本人Answer、WebMCPでは本人Answerだけが返り、他者Answer由来の値が返らないことを確認する。

**受け入れシナリオ**:

1. **前提** 認証済みHumanが公開済みQuestionへ投稿済みである、**操作** Human向け画面または本人確認用HTTP経路を利用する、**結果** Question状態が `OPEN`、`CLOSED`、`REVEALED` のいずれでも本人のAnswer本文、Excerpt、投稿時刻、更新時刻を確認できる。
2. **前提** 認証済みHumanが公開済みQuestionへ未投稿で、他者は投稿済みである、**操作** 本人の投稿状態を確認する、**結果** 本人について未投稿であることだけが返り、他者の投稿件数や内容によって応答形式は変わらない。
3. **前提** 公開済みQuestionに複数のAnswerがある、**操作** 認証済みHumanがHuman向けQuestion画面を表示する、**結果** 正確な回答数を確認できるが、Reveal前はその件数以外に他者Answerを識別または推測できる情報は返らない。
4. **前提** 同じQuestionと利用者状態である、**操作** Personal AgentがWebMCPからQuestionまたは本人の投稿状態を確認する、**結果** 回答数、他者の投稿有無、および他者Answer由来の情報は返らない。

---

### ユーザーストーリー 3 - Reveal後は認証済みHumanだけが全Answerを読む (優先度: P1)

Questionが `REVEALED` になると、認証済みHumanはHuman向けSSRで全AnswerのExcerptを確認し、選択したAnswerの本文だけをHuman向け詳細HTTP経路から取得できる。未認証者とPersonal AgentにはReveal後も他者Answerを公開しない。

**この優先度である理由**: 封印された独立回答を適切な時点でHumanが比較できることがサービスの成果であり、同時にAgentへの他者回答非公開という境界を維持する必要があるため。

**独立テスト**: 2件以上のAnswerを持つ `REVEALED` Questionを用意し、認証済みHuman、未認証者、Personal Agentの各主体からSSR、詳細HTTP、WebMCPを利用する。認証済みHumanだけが全Excerptと選択した本文を取得でき、その他の主体には他者Answerが0件であることを確認する。

**受け入れシナリオ**:

1. **前提** 2件以上のAnswerを持つQuestionが `REVEALED` である、**操作** 認証済みHumanがQuestion画面を表示する、**結果** 全AnswerのExcerptが安定した順序で表示されるが、各本文は選択前に取得も埋め込みもされない。
2. **前提** 認証済みHumanがReveal後のExcerpt一覧を表示している、**操作** 1件を選択する、**結果** 対応するAnswer本文だけが返り、選択していないAnswer本文は返らない。
3. **前提** Questionが `REVEALED` である、**操作** 未認証者がSSRまたはAnswer詳細HTTPへ直接アクセスする、**結果** Answer本文、Excerpt、識別子、および実在の手掛かりは返らない。
4. **前提** Questionが `REVEALED` である、**操作** Personal AgentがWebMCPを利用する、**結果** 本人の投稿状態と本人Answerを除き、他者Answerの本文、Excerpt、識別子、投稿者、個別投稿時刻、回答数は返らない。
5. **前提** Reveal後のQuestionにAnswerが0件である、**操作** 認証済みHumanがQuestion画面を表示する、**結果** 回答がないことを確認でき、存在しないAnswerや識別子は生成されない。

---

### ユーザーストーリー 4 - 直接アクセスと境界時刻を回帰検証する (優先度: P2)

開発担当者は、Question状態を唯一の判定源とするアクセス制御表を使い、主体、公開経路、Question状態、情報種別の全組み合わせを反復可能に検証できる。URL推測、存在しない識別子、認証失効、応答キャッシュ、処理中の境界時刻到達があっても、許可されていないAnswer情報は漏れない。

**この優先度である理由**: 個別画面の正常系だけでは、直接HTTPアクセスや状態境界、将来の経路追加による認可漏れを継続的に防げないため。

**独立テスト**: 未認証者、投稿者本人、Question作成者、別の認証済みHuman、Personal Agentと、4状態、SSR・HTTP API・WebMCP、回答数・本人Answer・他者Answerの組み合わせをアクセス制御表から実行し、期待結果との一致率と秘密値の非露出を確認する。

**受け入れシナリオ**:

1. **前提** 同じQuestionについて回答締切またはReveal時刻の直前である、**操作** 境界直前、同時刻、直後に各公開経路へ要求する、**結果** すべての経路がサービス側の同じQuestion状態に従い、境界時刻と同時に後の状態へ一意に切り替わる。
2. **前提** Answer詳細の実在する識別子、存在しない識別子、別Questionに属する識別子がある、**操作** 許可されない主体または状態で直接HTTPアクセスする、**結果** 外部からこれらを区別できない共通結果となる。
3. **前提** 認証済み応答の生成前後でセッションが無効である、**操作** 本人AnswerまたはReveal後Answerへアクセスする、**結果** 認証を要するデータは返らず、以前の利用者向け応答が再利用されない。
4. **前提** 取得処理中にQuestionが `CLOSED` から `REVEALED` へ到達する、**操作** 他者Answerを取得する、**結果** 1回の認可判断に用いたQuestion状態と返却内容が矛盾せず、部分的なExcerptや本文を返さない。

### エッジケース

- 回答締切とReveal時刻が同一の場合、境界直前は `OPEN`、境界と同時刻以後は `REVEALED` とし、受付可能かつ他者Answer公開済みとなる重複状態を作らない。
- 回答締切よりReveal時刻が後の場合、その間の `CLOSED` では回答受付を終了するが、他者Answerの公開範囲は `OPEN` と同じsealed状態を維持する。
- 公開時刻が未確定の `DRAFT` は、Question作成者向け管理経路を除く公開経路で存在を開示せず、Answer情報は返さない。
- Question作成者が自分ではAnswerを投稿していない場合も、Reveal前に作成者特権で他者Answerへアクセスできない。
- 本人Answerと他者Answerの識別子を取り違えた直接要求でも、所有者の付け替えや他者Answerの返却を行わない。
- Answer識別子が別Questionに属する場合、指定Question内に存在しない場合と同じ結果にし、Question間の関連を漏らさない。
- Answer本文やExcerptにHTML、スクリプト、URL、制御文字、秘密を装う文字列が含まれても、許可されていない応答本文、HTML属性、埋め込みデータ、ログ用メッセージ、エラーへ混入させない。
- HEAD、未対応メソッド、不正なパラメータ、過剰なクエリ項目など通常と異なる直接HTTP要求でも、Answer内容や存在確認の別経路を作らない。
- 取得途中の保存障害や認証障害では部分成功を返さず、内部例外、認証情報、Answer内容を含まない共通の失敗結果にする。
- 認証済み利用者ごとに内容が変わるQuestion画面、本人Answer、Reveal後Answerの応答は、別利用者や未認証者へ再利用されない。

## 要件 *(必須)*

### 機能要件

- **FR-001**: システムは、Questionの公開有無とサービス側現在時刻から導出した `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` の現在状態を、Answer公開可否の唯一の状態判定源として使用しなければならない。
- **FR-002**: システムは、1回のAnswer取得または画面生成についてQuestion状態を一貫して扱い、経路固有の締切比較や利用者端末時刻で公開可否を上書きしてはならない。
- **FR-003**: システムは、Answer情報を「回答数」「本人Answer」「他者Answer」に区分し、主体、経路、Question状態ごとの許可を明示した単一のアクセス制御ポリシーに従わなければならない。
- **FR-004**: システムは、`DRAFT` Questionを作成者向け管理経路以外から取得できないものとして扱い、公開経路ではQuestionおよびAnswerの存在を開示してはならない。
- **FR-005**: システムは、`OPEN` と `CLOSED` のQuestionについて、未認証者、Question作成者、別の認証済みHuman、Personal Agentへ他者Answerの本文、Excerpt、プレビュー、要約、識別子、投稿者、個別投稿時刻、更新時刻を返してはならない。
- **FR-006**: システムは、Question作成者にReveal前の他者Answerを閲覧する特権を付与してはならない。
- **FR-007**: システムは、公開済みQuestionの回答数をAnswer内容を含まない集計情報として認証済みHuman向けSSRに返せるものとし、`OPEN`、`CLOSED`、`REVEALED` で同じ集計規則を使用しなければならない。
- **FR-008**: システムは、WebMCPのQuestion取得および本人投稿状態の応答へ回答数を含めず、他者の投稿有無によってWebMCP応答の項目構成を変えてはならない。
- **FR-009**: システムは、認証済みUserが公開済みQuestionについて本人の投稿状態を確認でき、本人が投稿済みならQuestion状態にかかわらず本人のAnswer本文、Excerpt、投稿時刻、更新時刻だけを取得できるようにしなければならない。
- **FR-010**: システムは、本人が未投稿の場合、他者の投稿有無と件数にかかわらず本人について同じ未投稿結果を返さなければならない。
- **FR-011**: システムは、`REVEALED` Questionについて、認証済みHuman向けSSRに全Answerの識別子とExcerptだけを一覧として返せるようにし、Answer本文を初期画面へ埋め込んではならない。
- **FR-012**: システムは、認証済みHumanが `REVEALED` Questionの一覧から1件を指定した場合に限り、Human向け詳細HTTP経路からそのQuestionに属する指定Answerの本文と識別子だけを返さなければならない。
- **FR-013**: システムは、Answer一覧および詳細本文のHuman向け公開を `REVEALED` に限定し、`DRAFT`、`OPEN`、`CLOSED` では認証済みHumanにも返してはならない。
- **FR-014**: システムは、未認証者へQuestion状態を問わず本人Answer、全Answer一覧、Answer本文、Excerpt、Answer識別子を返してはならない。
- **FR-015**: システムは、WebMCPへQuestion状態を問わず他者Answerの本文、Excerpt、プレビュー、要約、識別子、投稿者、個別投稿時刻、更新時刻、回答数を返してはならない。
- **FR-016**: システムは、WebMCPに他者Answerの一覧、詳細、検索、要約、比較を行うCapabilityを提供してはならない。
- **FR-017**: システムは、Human向けAnswer詳細HTTP経路への許可されない要求に対し、対象Answerが実在する、存在しない、または別Questionに属するかを区別できない共通の利用不能結果を返さなければならない。
- **FR-018**: システムは、URL、パスパラメータ、クエリ、要求本文から指定された利用者識別子を本人判定に使用せず、有効な認証済みセッションだけから本人を決定しなければならない。
- **FR-019**: システムは、Answerを含む、または認証状態によって内容が変わるすべてのSSR・HTTP応答が、別の利用者または未認証者へ再利用されないようにしなければならない。
- **FR-020**: システムは、認可失敗、存在しない対象、入力不正、取得障害の外部エラーへAnswer本文、Excerpt、識別子、投稿者、認証情報、内部例外を含めてはならない。
- **FR-021**: システムは、Answer本文やExcerptを、許可された認証済みHumanへの返却時にも実行可能な内容、画面構造、属性、または未検証の埋め込みデータとして解釈してはならない。
- **FR-022**: システムは、未認証者、Question作成者、投稿者本人、別の認証済みHuman、Personal Agentの各主体、4つのQuestion状態、SSR・HTTP API・WebMCPの各経路、回答数・本人Answer・他者Answerの各情報種別を組み合わせた回帰テストマトリクスを維持しなければならない。
- **FR-023**: 回帰テストは、境界時刻の直前・同時刻・直後、実在・不存在・別QuestionのAnswer識別子、認証失効、Answerが0件と複数件のケースを含まなければならない。
- **FR-024**: このSPECの範囲では、HomeやQuestion Detailの完成版UI、Reveal後の表示順のプロダクト決定、Answerの投票・順位付け・検索・要約、未認証者へのAnswer公開、WebMCPへの他者Answer公開、管理者特権を提供してはならない。

### 主要エンティティ

- **Question**: Answerの対象となる問い。公開時刻、回答締切、Reveal時刻を持ち、現在状態がAnswer公開可否の唯一の状態判定源になる。
- **Question状態**: `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` の排他的な判定結果。`OPEN` と `CLOSED` は他者Answerをsealedとし、`REVEALED` だけが認証済みHuman向け公開を許可する。
- **Answer**: UserがQuestionへ投稿した公開予定の回答。本文、Excerpt、投稿者、Question、投稿時刻、更新時刻を持つ。アクセス判断では本人Answerと他者Answerを区別する。
- **認証主体**: 未認証者、Question作成者、投稿者本人、別の認証済みHuman、Personal Agentというアクセス元の区分。Question作成者はReveal前の閲覧特権を持たず、Personal Agentは常に本人Answerだけを扱う。
- **公開経路**: SSR、Human向けHTTP API、WebMCPの外部接点。各経路は同じQuestion状態とアクセス制御ポリシーを使用するが、Reveal後に他者Answerを読めるのは認証済みHuman向け経路だけである。
- **Answer公開情報**: 回答数、本人Answer、他者Answerという認可単位。本文だけでなくExcerpt、プレビュー、要約、識別子、投稿者、個別時刻など内容や実在を示すデータを含む。

## 成功基準 *(必須)*

### 測定可能な成果

- **SC-001**: 未認証者、Question作成者、投稿者本人、別の認証済みHuman、Personal Agent、4状態、3公開経路を含むアクセス制御マトリクスの全ケースで、期待する許可・拒否との一致率が100%となる。
- **SC-002**: `DRAFT`、`OPEN`、`CLOSED` の各状態で、識別可能な秘密値を含む他者AnswerへSSR、直接HTTP、WebMCPからアクセスしたとき、本文、Excerpt、プレビュー、要約、識別子、投稿者、個別時刻の露出が0件である。
- **SC-003**: Reveal時刻の1単位前、同時刻、1単位後に各公開経路を検証し、認証済みHuman向け他者Answerの公開は同時刻以後だけ100%成功し、Personal Agentへの他者Answer公開は全時点で0件である。
- **SC-004**: 実在、存在しない、別Questionに属するAnswer識別子へ許可されない直接HTTP要求を各10回行っても、外部の結果から3種類を判別できる差異とAnswer由来データの露出が0件である。
- **SC-005**: 2人以上が投稿した公開済みQuestionについて、投稿者本人は `OPEN`、`CLOSED`、`REVEALED` の全状態で本人Answerを100%再取得でき、未投稿者の本人確認応答は他者の投稿有無によって変化しない。
- **SC-006**: `REVEALED` Questionで認証済みHumanが一覧を開いたとき、全AnswerのExcerptを確認でき、初期応答にAnswer本文は0件である。任意の1件を選択したとき、返る本文は対応する1件だけである。
- **SC-007**: 認証済み利用者ごとに異なるAnswerを持つ応答を連続して取得する回帰検証で、別利用者または未認証者への応答混入が0件である。
- **SC-008**: 開発担当者は、文書化された回帰テストマトリクスと手順を使い、60分以内に全経路のReveal前非露出、境界時刻切替、Reveal後のHuman限定公開、WebMCP本人限定を判定できる。

## 前提

- SPEC 005で定義したQuestion状態判定を再利用し、公開経路ごとに別の状態規則を設けない。
- SPEC 006のMVPでは回答締切とReveal時刻は同じ値だが、アクセス制御は将来の `CLOSED` 期間にも対応し、Reveal時刻まではsealedを維持する。
- SPEC 007のWebMCPはHumanが指定したQuestionと本人Answerだけを扱い、Reveal後も他者Answerや回答数を扱わない契約を継続する。
- 回答数は本文、Excerpt、識別子、投稿者を含まない集計値であり、認証済みHuman向けQuestion画面で公開しても独立回答を損なわないものとする。
- Reveal後のAnswer閲覧主体は有効なセッションを持つHumanに限定し、未認証者への公開はMVPの対象外とする。
- Answer一覧の既定順序は現在の安定した投稿順を維持するが、最終的な比較体験と表示順のプロダクト要件はSPEC 010で確定する。
- 許可されていないAnswer詳細の共通結果は、利用者が再認証すべきか対象が存在しないかをAnswer単位で判別させないことを優先する。

## 依存関係

- SPEC 002「Google OAuthとWebMCPユーザー識別の検証」が完了し、Human向け画面とWebMCPで認証済みUserを一貫して識別できること。
- SPEC 004「Agent回答投稿の完全性・Sealed Answersの検証」が完了し、3公開経路での基礎的な非露出とReveal後Human閲覧の検証結果が利用できること。
- SPEC 005「ドメインデータモデルとQuestionライフサイクル」が完了し、4状態と境界時刻を一意に判定できること。
- SPEC 007「WebMCP MVP Tool群」が完了し、本人Answer取得と他者Answer非公開のTool契約が利用できること。

## 対象外

- Home、Question Detail、Login、My Questionsの完成版レイアウト、ナビゲーション、アクセシビリティ（SPEC 009）
- Reveal後のAnswer比較画面、最終的な表示順、参加者別の表示差、空状態の完成版UI（SPEC 010）
- Answerの投票、順位付け、検索、推薦、要約、Agent間の議論
- WebMCPまたは未認証者への他者Answer公開
- Question、Answerの管理者向け削除、監査ログ、データ保持期間
