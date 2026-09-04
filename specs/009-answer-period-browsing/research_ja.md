# 技術調査: Challenge Core閲覧フロー

## 1. 実装境界

**決定**: SPEC 009はHomeとQuestion DetailのCore機能だけを実装し、専用Login、My Questions再設計、最終Visual Design、Reveal比較表現を含めない。

**理由**: 9月2日中に機能を完成させ、9月3日をChallengeで伝わる表現の制作へ使うため。

**検討した代替案**: 主要4画面と包括的品質を同時に完成する案は、Revealと表現へ進む時刻を遅らせるため不採用。

## 2. Home一覧投影

**決定**: `listOpenQuestions(snapshotNow)` で公開済みかつ `publishedAt <= now < closesAt` のQuestionと回答数だけを取得し、`closesAt ASC, publishedAt ASC, id ASC` で返す。

**理由**: N+1 Queryと非公開Question・Answer秘密値の持込みを避け、Homeに必要な情報だけを1回で取得できる。

**検討した代替案**: 全Question取得後の絞り込みとQuestionごとの回答数取得は、安全境界と時間効率の両方で不利なため不採用。

## 3. Question状態Snapshot

**決定**: HomeとQuestion Detailは要求ごとに `now()` を1回だけ取得し、既存 `getQuestionState`、一覧絞り込み、残り時間、Prompt可否へ同じ値を使う。

**理由**: 締切境界をまたぐ1応答でOpen表示とClosed動作が混在しない。

**検討した代替案**: Queryや表示項目ごとの時刻取得、Client時刻による状態判定は不整合を生むため不採用。

## 4. 閲覧者と本人Submission

**決定**: `anonymous`、`authenticated-unsubmitted`、`authenticated-submitted`、`submission-unavailable` を排他的に導出する。作成者一致は表示補助だけに使い、Answer認可へ使わない。

**理由**: 未回答Promptと本人Answerの同時表示を防ぎ、障害を未回答と誤認せず、SPEC 008の作成者非特権を維持できる。

**検討した代替案**: Routeへ個別条件を散らす案は表示矛盾を起こしやすいため不採用。

## 5. 認証導線

**決定**: 既存Google Sign in操作を再利用し、未ログインQuestion Detailから既存認証入口へ案内する。専用Login画面と任意Pageへの戻り先管理は追加しない。

**理由**: Core Demoでは既存認証が動作しており、新しいOpen Redirect対策やClient認証再設計を発生させずに参加導線を成立させられる。

**検討した代替案**: 専用Loginと `returnTo` allowlistは製品品質には有用だが、Challenge Coreの差別化を増やさないため後日に回す。

## 6. Visual Design境界

**決定**: SPEC 009では情報構造と安定したDOM hookだけを確定し、Typography、Color、Layout、Motion、Responsiveの最終表現はSPEC 010でHome・sealed・Revealを横断して完成する。

**理由**: 見た目を軽視するのではなく、機能完成後の9月3日を一貫したVisual Directionへ集中投資するため。

**検討した代替案**: SPEC 009で暫定CSSを作りSPEC 010で作り直す案は二重作業になるため不採用。

## 7. 既存SPECとの統合

**決定**: Agent依頼PromptとClipboardはSPEC 007、Answer認可・本人Answer・Reveal最小表示はSPEC 008を再利用する。Agent依頼Promptは、ChatGPTの組み込みブラウザを使い既存Chrome Tabを使わず、現在のOriginへ追従するQuestion絶対URLを含む確定済み1行文面を使用し、Context根拠と安全上の詳細指示は各WebMCP Tool契約からAgentへ渡す。Tool契約は現在の会話、利用可能な過去会話、Project ContextにあるUser自身の明示的・反復された記述を優先し、Assistant提案と比較・検討中の候補を確定事実とみなさない。明示的な個人見解がない場合はUserが答えそうな最善の代理回答を作成・投稿するが、未確認の個人事実や既知の信条として断定せず、その不足だけを理由にHumanへ確認しない。Prompt自体を初回投稿の許可とし、追加Previewや承認は要求しない。

**理由**: 既に実機検証済みのChallenge中心機能と安全境界を短期変更で壊さない。

**検討した代替案**: UI用に別のAnswer取得やPromptを作る案は契約重複と漏えい経路を増やすため不採用。

## 8. テスト分担

**決定**: 回答数・残り時間・閲覧者状態はUnit、SSR・認証・秘密値非露出はHono Integration、Open一覧はD1 Integrationで検証する。Manual TestはSPEC 010の画面完成後にCore Demo全体で行う。

**理由**: 本日中に自動回帰を保った機能完成へ到達し、明日のVisual作業後に同じ導線を二重に手動確認しないため。

**検討した代替案**: SPEC 009単独の包括的Browser確認は、SPEC 010でDOMと見た目が変わるため不採用。

## 9. 単一管理者の識別

**決定**: `ADMIN_EMAIL` で1つの正規化済みEmailを設定し、Session由来User IDでDBのUserを取得してEmailが完全一致する場合だけ管理権限を与える。設定不備はFail Closedとする。

**理由**: Google Loginで確認済みの既存Emailを利用でき、User IDの事前調査や別Passwordを不要にしつつ、入力値による権限昇格を防げる。

**検討した代替案**: User ID指定は安定するが事前取得が必要、DB Roleは複数管理者と権限管理を追加するため不採用。

## 10. 監査記録

**決定**: Login／LogoutはSession、Question／Answer入力は各TableのD1 Triggerで追記型 `audit_logs` へ記録する。Actor、Action、Target、Outcome、時刻だけを保存し、本文・Excerpt・認証秘密を複製しない。

**理由**: RouteやWebMCPなど入口が複数あっても記録漏れを防ぎ、削除後の運用経緯を残しながら機密値と不適切コンテンツの重複保管を避けられる。

**検討した代替案**: Route単位の記録は実装漏れと部分成功が起こりやすく、本文Snapshot保存は削除の意味と情報最小化に反するため不採用。

## 11. 管理削除

**決定**: Question削除は既存外部キーのCascadeで配下Answerを削除し、Answer削除は指定1件だけを削除する。管理者Actorを持つ専用監査記録と変更を同一D1 Batchで確定し、編集機能は設けない。

**理由**: 対象範囲が明確で、部分成功を避け、一般User操作のTrigger記録と管理者操作を区別できる。

**検討した代替案**: Soft Deleteは一般Queryすべての除外変更と復元権限を必要とし、期限内の最低限運用を超えるため不採用。

## 12. BAN強制

**決定**: `banned_users` を正本とし、BAN時に対象の全Sessionを削除する。Better AuthのSession作成前HookでもBANを照会して新規Sessionを拒否し、解除はBAN行を削除する。管理者自身のBANは拒否する。

**理由**: 既存Sessionと再Loginの両経路を閉じ、BAN解除をUser削除なしで安全に行える。

**検討した代替案**: User削除はQuestion／Answerの参照整合性と監査追跡を壊し、Session削除だけでは再Loginできるため不採用。
