# 技術調査: Sealed Answersのアクセス制御

## 1. 認可ポリシー

**決定**: `authenticated`、Route用途、Question状態、情報種別を入力し許可可否を返す純粋な決定表を `answer-visibility` Domainへ集約する。作成者は特別扱いしない。

**理由**: 全Routeで同じ規則を使い、180組以上を外部依存なしで網羅できる。

**検討した代替案**: Routeごとの条件分岐は差異が生じ、Roleベース認可は不要な作成者特権を招くため不採用。

## 2. 経路識別

**決定**: 偽装可能なHeaderではなく、登録Routeの用途を `human-ssr`、`human-detail`、`self-submission`、`webmcp-question` に固定する。

**理由**: 各Routeが返せる情報を静的に限定できる。

**検討した代替案**: Human／Agent判別Headerと汎用Answer APIは過剰公開につながるため不採用。

## 3. 状態と時刻

**決定**: 各要求でサービス側時刻を1回取得し、既存 `getQuestionState` の状態Snapshotを画面生成と認可に共用する。

**理由**: 境界を処理中にまたいでも1応答内でsealed表示と公開データが混在しない。

**検討した代替案**: Queryごとの再評価と状態名保存は既存契約との矛盾を生むため不採用。

## 4. 安全な投影

**決定**: 回答数、本人Answer、Reveal後Excerpt、指定本文を別投影とし、Domainが許可した投影だけをRepositoryから取得する。

**理由**: Userや個別時刻など不要な列の偶発的直列化を防げる。

**検討した代替案**: 全Answer取得後のRouteフィルタと専用公開Tableは秘密値の持込みと重複保存を招くため不採用。

## 5. 詳細非列挙

**決定**: 未認証、Reveal前、不在、別Questionを同じ `404 ANSWER_UNAVAILABLE` とし、認可成功後だけ本文を取得する。

**理由**: Status、code、Bodyから実在やQuestion間対応を判別できず、SPEC 004とも互換である。

**検討した代替案**: `401`／`403`／`404`の分類は識別子列挙を助けるため不採用。

## 6. 応答再利用防止

**決定**: 利用者依存の成功・失敗へ `Cache-Control: private, no-store` と `Vary: Cookie` を付ける。

**理由**: 本人AnswerとReveal結果を共有Cacheや別Sessionへ再利用させない。

**検討した代替案**: `no-cache` は保存を許し、URLへのUser ID追加は本人判定契約を壊すため不採用。

## 7. 未信頼Answer

**決定**: 本文とExcerptはescapeしたテキストとして扱い、初期SSRはExcerpt、詳細成功は本文1件だけを返す。

**理由**: 許可後も保存済みAnswerは未信頼入力である。

**検討した代替案**: HTML除去は原文を変え、Markdown／HTML renderingは本SPECに不要なため不採用。

## 8. テスト分担

**決定**: 決定表はUnit、認証・Header・SSR・HTTP・WebMCP非露出はHono Integration、列投影とQuestion間分離はD1 Integration、実SessionはQuickstart手動E2Eで検証する。

**理由**: 分岐原因を切り分けながら公開経路の最終導線も確認できる。

**検討した代替案**: E2Eだけ／Unitだけでは必要な境界を網羅できないため不採用。
