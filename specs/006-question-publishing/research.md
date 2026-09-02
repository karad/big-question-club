# 技術調査: Question作成・公開フロー

## 1. Human向け作成導線

**決定**: 既存のHono JSXによるSSRを維持し、作成・編集・公開は同一OriginのHTML Form、成功後はredirectするPost/Redirect/Getで実装する。管理用JSON APIや新しいClient Frameworkは追加しない。

**理由**: 既存アプリはHonoの単一WorkerとJSXを使用しており、MVPの6導線はSSR Formで完結する。Form値はHonoの `parseBody()` で取得でき、画面と直接操作の認証・エラーを同じRoute境界で扱える。成功後のredirectは再読み込みによる重複送信を避ける。

**検討した代替案**:

- SPAと管理用JSON API: 状態同期と公開範囲を増やし、本SPECの価値に不要なため採用しない。
- Server-rendered HTML文字列: エスケープ漏れと画面重複を避けるため、既存のJSXを使う。
- WebMCP Toolでの作成: Humanだけに許可する仕様に反するため採用しない。

**根拠**: [Hono JSX](https://hono.dev/docs/guides/jsx)、[Hono Request `parseBody()`](https://hono.dev/docs/api/request)

## 2. Question本文の表示文字数

**決定**: `trim()`後の本文を `Intl.Segmenter` の `granularity: "grapheme"` で分割し、書記素クラスタを利用者が認識する1文字として10〜1,000文字を判定する。共通Domain関数が正規化済み本文と件数または項目別エラーを返す。

**理由**: JavaScriptの `length` はUTF-16 code unit数であり、絵文字、結合文字、旗などを画面上の文字数と一致させられない。`Intl.Segmenter` は書記素単位を標準APIで扱え、Cloudflare Workersは `Intl` を提供する。サーバー判定を正とし、クライアントのカウンターは同じ規則を使う補助表示に限定する。

**検討した代替案**:

- `string.length`: 利用者が見る文字数と不一致になるため採用しない。
- `[...text].length`: code pointは数えられるが結合文字や複合絵文字を分離するため採用しない。
- Unicode処理Library追加: 標準APIで満たせるため採用しない。

**根拠**: [MDN `Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)、[Cloudflare WorkersのWeb標準API](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)

## 3. 締切入力とタイムゾーン

**決定**: 画面では `datetime-local` を使用し、クライアント補助がブラウザーのローカル日時をUTC Unixミリ秒へ変換してhidden fieldへ設定する。同時に `Intl.DateTimeFormat().resolvedOptions().timeZone` のIANAタイムゾーン名とUTC ISO表現を表示・送信する。サーバーは絶対時刻だけを保存条件に使い、サービス側 `now` から1時間以上30日以内であることを再検証する。

**理由**: `datetime-local` の値自体にはタイムゾーンが含まれないため、文字列だけをサーバーで解釈すると環境依存になる。利用者のブラウザーで明示的に絶対時刻へ変換し、ローカル表現・タイムゾーン・UTCを確認させれば仕様の対応関係を示せる。クライアントのmin/maxや時計は補助であり、改ざん可能なのでサーバー検証を省略しない。

**検討した代替案**:

- `datetime-local`文字列をWorkerで `Date` へ変換: Workerのタイムゾーンで解釈され、利用者の時刻と一致しないため採用しない。
- UTCだけを利用者に入力させる: 誤入力しやすく、ローカル時刻確認要件に合わない。
- 日時LibraryまたはTemporal Polyfill: 本SPECの即時締切入力には過剰な依存となるため採用しない。

**根拠**: [MDN `datetime-local`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local)、[MDN HTML日時形式](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats)

## 4. FormのCSRF境界

**決定**: Question管理のunsafe methodへHono組み込みのCSRF Middlewareを適用し、既定の同一Origin `Origin`／`Sec-Fetch-Site` 検証を使う。Better AuthのRoute、既存WebMCP／Answer JSON APIへ無関係に広げず、Question管理Formのpathへ限定する。

**理由**: Cookie Sessionを使うHuman向けPOSTは、第三者SiteからのForm送信を拒否する必要がある。Honoの組み込みMiddlewareはHTML Formが送信可能なContent-Typeとunsafe methodに対してOriginとFetch Metadataを検証し、新しい依存を増やさない。

**検討した代替案**:

- SameSite Cookieだけに依存: Cookie設定だけをQuestion変更の防御層にしない。
- 独自CSRF token: 本MVPの同一Origin Formでは組み込み検証で要件を満たし、独自tokenの保存・更新が不要なため採用しない。
- App全体への一律適用: Better AuthやJSON Tool経路の既存契約を不用意に変えるため採用しない。

**根拠**: [Hono CSRF Protection](https://hono.dev/docs/middleware/builtin/csrf)

## 5. Draft編集と公開の競合

**決定**: Draft編集は `id + creatorUserId + publishedAt IS NULL + updatedAt` を条件にした単一更新で楽観的競合制御を行う。公開は `id + creatorUserId + publishedAt IS NULL + closesAt >= now + 1時間 + revealsAt = closesAt` を条件に公開時刻を設定する単一更新とする。変更0件の場合だけ本人所有の最新状態を再取得し、外部結果へ分類する。

**理由**: 読み取り後の無条件更新は、確認中に公開されたQuestionを古いDraftで上書きできる。条件付きの単一更新ならD1の各statementの原子性で公開後不変と二重公開を守れる。`updatedAt` は既存Schemaにあり、Migrationを追加せず編集競合を検出できる。

**検討した代替案**:

- 最終書き込み優先: 公開済み内容を上書きし得るため採用しない。
- Worker内mutex: 複数instanceで共有されないため採用しない。
- 新しいrevision列: `updatedAt`で同じ目的を満たせるためMigrationを増やさない。

**根拠**: [Cloudflare D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

## 6. 所有者境界と非列挙エラー

**決定**: 管理画面は `QuestionRepository.getOwnedQuestion(id, userId)` を唯一の取得入口とし、他人所有と存在しないQuestionをどちらも `null` に分類する。画面・編集・公開は同じ英語の `Question unavailable.` と404を返す。内部Repository結果は診断可能に分けても、外部応答では統合する。

**理由**: 一度汎用 `getQuestion(id)` で取得してから権限エラーを返すと、下書きの存在を推測できる。Query条件に所有者を含めることで、Routeが他人のQuestion内容へ触れずに非列挙契約を維持できる。

**検討した代替案**:

- 403と404の使い分け: 対象の存在を開示するため採用しない。
- UIで導線を隠すだけ: 直接POSTを防げないため採用しない。
- 全Question取得後のApplication側filter: 不要な他人データを境界外へ出すため採用しない。

## 7. My Questionsの集計

**決定**: QuestionとAnswerを左結合し、本人の `creatorUserId` で絞り、Question単位の回答数を集計して `createdAt DESC`、同時刻は `id DESC` で安定順序にする。戻り値はQuestionと `answerCount` だけで、Answer本文、Excerpt、投稿者IDを含めない。

**理由**: 一覧ごとの個別countはN+1 Queryになる。1 Queryの集計で本人境界と必要最小情報を同時に固定し、Reveal状態に依存せず回答数だけを表示できる。

**検討した代替案**:

- Question取得後に各件をcount: Query数が件数に比例するため採用しない。
- Answer一覧を取得してApplicationでcount: 非公開情報を不要に読み込むため採用しない。
- 回答数の保存列: Answerとの二重管理になるため採用しない。

## 8. テスト境界

**決定**: 書記素文字数、言語、締切、Form値解析はNode上のUnit Test、SSR表示・項目エラー・認証・CSRF・redirectはHono Integration Test、所有者付き取得・楽観的編集・原子的公開・集計一覧は分離D1 Integration Testで検証する。全自動テスト完了後にQuickstartでキーボード導線と2利用者の手動確認を行う。

**理由**: 純粋ロジックを高速に境界網羅し、実D1でしか保証できない条件付き更新と集計をmockへ委ねず、最終的な画面導線だけを手動確認に限定できる。プロジェクトのテスト方針にも一致する。

**検討した代替案**:

- すべてをBrowser E2Eにする: 失敗原因を切り分けにくく、反復コストが高い。
- Repository mockだけで競合を検証: D1 statement条件と集計契約を保証できない。
- 手動確認だけにする: 30件以上の入力境界と20件以上の認可ケースを反復保証できない。
