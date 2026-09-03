# 検証記録: 回答公開体験とチャレンジ向け視覚設計

**実施日**: 2026-09-03

## 自動品質ゲート

| 検証 | 結果 |
| --- | --- |
| `npm run generate:icons`を2回実行したSHA-1比較 | 成功。両方とも`bf63d933409f594662fb680f99a5978386de2810` |
| `npm run typecheck` | 成功 |
| `npm run lint` | 成功 |
| `npm run format` | 成功 |
| `npm test` | 成功。44ファイル、635テスト |
| `npm run test:d1` | 成功。16ファイル、59テスト |
| `npm run build` | 権限昇格環境で成功。`client-dist/client.js`と`client-dist/styles.css`を生成 |
| `npm run db:schema:check` | 成功 |
| Worker成果物のReact実行コード検索 | 該当なし |
| `Signed in as`のソース・テスト検索 | 該当なし |

## 実ブラウザー確認

ローカル開発サーバー、Google OAuth、Chrome、共有Remote D1で、次を確認した。

- Homeに`Open questions`と`Results`、各全件導線、共通ヘッダー、英語の状態表示がある。
- 公開済み一覧に質問カード、公開アイコン、回答数、ページ位置が表示される。
- 未認証で公開済み詳細を開くと、回答数は表示されるが要約文・本文は表示されず、`Sign in to view results.`となる。
- 320、768、1280ピクセル幅でHome、回答受付中・公開済み一覧、質問詳細、質問作成、`My Questions`を確認し、意図しない横スクロール、文字の重なり、主要操作の欠落は見られない。
- Chromeの表示倍率を実際に200%へ変更し、Home、公開済み一覧、質問詳細、質問作成、`My Questions`の主要情報と操作へ横スクロールなしで到達できることを確認した。
- 長い英語Questionが320ピクセル幅と200%拡大で折り返され、日本語Question、長いExcerpt、Answer本文もカード幅内に収まることを確認した。
- `Tab`で共通Navigationから`Read full answer`へ移動し、`Enter`でAnswer本文を展開でき、フォーカス位置と開閉状態を識別できることを確認した。ほかの主要操作もLink、Button、Checkboxとしてアクセシビリティツリーへ公開される。
- `prefers-reduced-motion: reduce`では遷移時間を除去するCSS規則を確認し、資材テストでも規則の存在を固定した。状態の文字とIconは動きに依存しない。
- Answer一覧を表示した後に対象AnswerをRemote D1から削除して本文取得を失敗させ、対象項目だけに`Answer could not be loaded. Select this answer to try again.`が表示されることを確認した。
- ChromeでClipboard権限を`Block`へ変更して`Copy prompt`を実行したところ、既存の選択・コピーFallbackが成功して`Copied`となった。Clipboard APIとFallbackの双方を失敗させる分岐は`tests/unit/agent-prompt-clipboard.test.ts`で英語の失敗通知を確認した。検証後、権限は既定値へ戻した。
- 既存5つのWebMCPツールだけが登録され、他者回答一覧を取得するツールは追加されていない。

## 3分デモ

Google OAuthで認証し、共有Remote D1上に検証用Questionを1件作成した。異なる既存利用者へ紐づく内容の異なるAnswerを2件用意し、次の順序を一続きで確認した。

1. 公開直後のQuestion Detailで`OPEN`、回答0件、依頼文を確認した。
2. 1件目を保存して再読込し、回答数が1件へ変わる一方で他者回答が封印されることを確認した。
3. 2件目を保存して再読込し、回答数が2件へ変わることを確認した。
4. 公開時刻を経過させて再読込し、琥珀色の封印状態から橙色の`Results available`へ変わることを確認した。
5. `Answer 1`と`Answer 2`を続けて開き、両本文を同時に表示して比較した。

回答0件の確認後から2本文の表示完了までの所要時間は約40秒で、3分以内だった。初期HTMLとWebMCPには他者Answer本文、投稿者、個別時刻を露出せず、本文は認証済みHumanの選択後だけ取得された。

検証用Questionと関連Answerは所有者向け確認UIから削除した。削除後のRemote D1でQuestion 0件、Answer 0件、`QUESTION_DELETED`成功監査1件を確認した。回答取得失敗とClipboard確認の一時データも削除済みである。

## 完了判定

- 全58タスクの実装・検証対象に未解決事項はない。
- 自動品質ゲートはすべて成功した。
- 3分デモ、対象画面幅、200%拡大、キーボード、長文、回答取得失敗、Clipboardの通常・拒否環境を確認した。
- 二重実行、Clipboard APIとFallbackの同時失敗、動き低減Media Query、状態・権限・非露出Matrixは決定的な自動テストで補完した。
- SPEC 010の受け入れ条件を満たすため、判定をGoとする。

## 2026-09-03 暖色系デザイン調整

- 提示されたデザイン案を基準に、背景、本文、操作、状態表示を紙色・茶墨色・橙色・琥珀色の暖色系へ統一した。
- 最大コンテンツ幅、見出し階層、本文行長、Section間余白、Cardの角・境界・影、丸型Button、Header Navigationを全画面で揃えた。
- 通常文字と操作文字は4.5対1以上、主要操作の境界とFocusは3対1以上となる配色を採用した。
- Home、Question Detail、Question作成、管理画面トップを実ブラウザーで確認し、提示デザインに沿った配置と余白になっていることを確認した。
- 変更後にUnit／Integration 44ファイル647テスト、Typecheck、Lint、Format、Build、Schema checkへ成功した。

## 2026-09-03 日時表記の統一

- 画面上の締切、作成、更新、BAN、監査日時を`YYYY-MM-DD HH:mm`へ統一し、APIと`datetime`属性のISO 8601形式は維持した。
- Question Detailと管理画面のAudit logを実ブラウザーで確認し、表示文字列にISO 8601の`T`や`Z`が現れず、`YYYY-MM-DD HH:mm`で表示されることを確認した。
- 日時整形のUTC・Local境界Testを追加し、Unit／Integration 45ファイル649テスト、Typecheck、Lint、Format、Buildへ成功した。

## 2026-09-03 Hero背景画像

- ホームのHero領域へ指定の惑星画像を不透明度30%、右中央寄せ、非反復で配置した。
- 実ブラウザーで画像がHero内の右側へ一度だけ描画され、前景の見出し、説明、主要操作を妨げないことを確認した。
- Home Integration Test 4件、Typecheck、Lint、Format、Buildへ成功した。

## 2026-09-03 Heroコピー

- HeroのEyebrow、見出し、説明を、大きなQuestionを歓迎し、利用者自身の最大のQuestionと回答者ごとのAI Agentによる個性的な回答を訴求する英語へ変更した。
- Home Integration Test 4件、Typecheck、Lint、Format、Buildへ成功し、実ブラウザーで見出しの改行と背景画像との重なりを確認した。

## 2026-09-03 WebMCP案内

- Home下部の見出しを`WebMCP is required to answer`へ変更し、回答にWebMCPが必須であることを明示した。

## 2026-09-03 Results用語

- 内部状態`REVEALED`と既存URL契約は維持し、一般利用者向けの`Revealed questions`を`Results`、`Answers revealed`を`Results available`へ変更した。
- 公開済みCardの導線を`View results`、未認証案内と空状態も`Results`に揃えた。
- Unit／Integration 46ファイル652テスト、Typecheck、Lint、Format、Buildへ成功した。
- 実ブラウザーでHomeの見出し・Card・導線とQuestion DetailのNavigation・状態表示が`Results`系の用語に統一されていることを確認した。

## 2026-09-03 Question Card操作領域

- 一覧Cardの主要面全体をQuestion Detailへのクリック領域に拡張し、Open Question内の独立したAgent依頼操作は前面で操作できる構造を維持した。
- Card固有の影とHover時の位置移動・影追加を除去し、Hover時に暖色背景だけをわずかに濃くする表現へ変更した。
- 実ブラウザーでCardの見出し部分を選択するとQuestion Detailへ遷移することを確認した。
- Unit／Integration 46ファイル652テスト、Typecheck、Lint、Format、Buildへ成功した。

## 2026-09-03 My Questions表示整理

- My Questionsの`REVEALED`表示を`Results available`へ変更した。
- 削除展開領域からQuestion本文、状態、回答数、削除説明の重複表示を除去し、不可逆性の確認Checkboxと削除Buttonだけを表示した。
- Question Management／Browsing Integration Test 59件、Typecheck、Lint、Format、Buildへ成功し、実ブラウザーで公開済み状態と削除展開内容を確認した。

## 2026-09-03 Question Card導線Button

- Question一覧Cardの`View question`と`View results`、My Questions Cardの`View question`を白背景の共通Secondary Button形状へ変更した。
- Card全体のクリック領域は維持し、HomeとMy Questionsを実ブラウザーで確認した。
- Home／Question List／Question Management Integration Test 54件、Typecheck、Lint、Format、Buildへ成功した。

## 2026-09-03 Header認証操作

- 一般利用者向け共通HeaderへGoogleサインイン操作を移動し、認証後は生の利用者IDや冗長な状態文言を表示せず`Sign out`だけを表示するよう変更した。
- Home下部と未認証Question Detailの重複するサインインButtonを除去し、Headerから操作する案内へ置き換えた。
- 認証状態3分岐のUnit Testを追加し、Unit／Integration 46ファイル652テスト、Typecheck、Lint、Format、Buildへ成功した。
- 実ブラウザーの認証済み状態でHeaderに`Sign out`が表示され、Home下部に認証操作が重複しないことを確認した。

## 2026-09-03 管理画面の削除Label

- 管理画面のQuestionsとAnswersで、削除Buttonの表示Labelを`Delete`へ統一した。
- 確認Checkboxはそれぞれ`Confirm delete question`と`Confirm delete answer`を維持し、対象種別を識別できることを確認した。
- Admin Integration Test 20件、Typecheck、Lint、Format、Buildへ成功し、両一覧を実ブラウザーで確認した。

## 2026-09-03 Question連鎖削除とBAN Label

- Question削除時は、所有者操作と管理者操作の双方で外部キーの`ON DELETE CASCADE`により関連Answerが全件削除される実装を確認した。
- 管理者経由の既存D1 Testに加え、所有者経由でも関連Answerが0件になることをD1 Testで明示的に固定した。
- User BAN Buttonの表示Labelを`Ban`へ短縮し、確認Checkboxの`Confirm ban user`は維持した。
- Admin Integration Test 20件、関連D1 Test 22件、Typecheck、Lint、Format、Buildへ成功した。

## 2026-09-03 認証済み回答者の匿名表示と仕様同期

- Resultsの回答一覧冒頭へ`All answers were submitted by signed-in participants. One answer per account.`を追加した。
- 各回答へ`Authenticated participant`と、質問識別子・回答識別子だけから決定的に生成する左右対称の匿名アイコンを追加した。利用者ID、Google表示名、Googleプロフィール画像、生のHash値は生成入力・表示・新規永続化に使っていない。
- 同じ質問と回答では再読込後も同じアイコンとなり、同じ回答識別子でも質問が異なれば別の表示になることをUnit Testで固定した。管理画面の既存アカウント関連は変更していない。
- 過去の追加UI要件をSPEC 010の仕様・計画・データモデル・契約・調査・Quickstartへ再照合し、Header認証操作、My Questionsの現在地Link省略、Results用語、Card操作領域とButton、日時形式、削除アイコンと連鎖削除、管理一覧、短縮Labelを明文化した。
- 仕様では30%となっていたHero背景が実装では20%だった不一致を検出し、`opacity: 0.3`へ修正した。
- Node Test 47ファイル656件、D1 Test 16ファイル60件、Typecheck、Lint、Format、Production Build、Schema Check、生成アイコン、差分形式検査に成功した。D1 TestとProduction Buildはローカル待受・Wrangler Log出力の権限制限を避けるため権限昇格環境で最終確認した。
- 仕様品質Checklistは全16項目に合格し、全63タスクに未完了項目はない。

## 2026-09-03 Open Question Cardの遷移領域

- `Open questions`のCard全体リンクを解除し、Question詳細への遷移を`View question` Buttonだけに限定した。
- Card内の`Ask your personal agent`、`Copy prompt`、依頼文表示は詳細遷移から独立したまま維持した。
- `Results`のCard全体リンクは維持した。
- 状態別の遷移範囲をUnit Testで固定し、Node Test 48ファイル658件、Typecheck、Lint、Format、Production Buildに成功した。
- SPEC 010は全65タスクに未完了項目がない。

## 2026-09-03 個人見解がない場合の代理回答

- `get_question`の固定instructionと、`get_question`・`submit_answer`のTool descriptionを、利用可能なUser自身の記述を優先しつつ、明示的な個人見解がない場合も最善の代理回答を作成・投稿する契約へ更新した。
- 代理回答は未確認の個人事実を断定せず、推測した立場を既知の信条として扱わず、個人見解がないことだけを理由に確認質問しない。
- 旧来の「Context不足時は質問して投稿を止める」固定instructionを削除し、新契約の4項目をHTTP応答とTool登録のUnit／Integration Testで固定した。
- Node Test 48ファイル658件、Typecheck、Lint、Format、Production Buildに成功した。Production BuildはWranglerのログ保存先に対する権限制限を避けるため、権限昇格環境で再確認した。
- SPEC 007・009・010の仕様、計画、データモデル、契約、調査、Quickstart、タスク、検証記録を新しい回答方針へ同期し、SPEC 010は全68タスクに未完了項目がない。

## 2026-09-03 Agent依頼Promptの組み込みブラウザ指定

- Agent依頼Promptを、ChatGPTの組み込みブラウザを使い既存Chrome Tabを使わないことが明示された1行の英語文面へ更新した。
- 現在のOriginに追従するQuestion絶対URL、Query／Fragment除外、投稿許可、Context規則、WebMCP Tool契約は維持した。
- 固定文面とHTML escapingをUnit／Integration Testで確認した。
- Node Test 48ファイル658件、Typecheck、Lint、Format、Production Buildに成功した。Production BuildはWranglerのログ保存先を使用するため権限昇格環境で確認した。
- README、MILESTONE、SPEC 007・009・010の関連成果物を同期し、SPEC 010は全71タスクに未完了項目がない。

## 2026-09-03 本人回答状態の可視化

- 認証済み利用者のHome、Open Question一覧、Results一覧、Question詳細で、本人回答済みの場合だけ既存の状態Tagの隣に緑色の`Answered`が表示されることを確認した。
- 未認証または本人回答状態の取得失敗時は回答状態Tagを表示せず、判定不能を未回答として誤表示しないことを確認した。
- `OPEN`のQuestion詳細では、回答済み利用者自身のExcerptと本文だけが表示され、同じQuestionにある他者回答のExcerpt、本文、回答識別子、回答者情報が初期HTMLへ含まれないことを確認した。
- Resultsの回答一覧では本人回答だけに緑色の`Your answer` Tagが表示され、他者回答には表示されないことを確認した。Repositoryから画面へ渡す本人判定は`isOwn`の真偽だけとし、回答者利用者IDは一般向けHTMLへ出力されない。
- 対象Unit／Integration Test 4ファイル36件、全Node Test 48ファイル663件、D1 Test 16ファイル60件、Typecheck、Lint、Format、Production Build、Schema Check、生成アイコン差分検査、差分形式検査に成功した。D1 TestとProduction Buildはローカル待受・Wrangler Log出力のため権限昇格環境で確認した。
- SPEC 010の仕様、計画、データモデル、画面契約、調査、Quickstart、品質Checklistを同期し、全74タスクに未完了項目はない。

## 2026-09-03 回答済みメッセージのアイコン配置

- Question Cardの`Your agent has answered.`を横並びの状態表示へ変更し、Check Iconが文言の上ではなく左側に配置されるよう修正した。
- Question CardのUnit Test 4件、全Node Test 48ファイル664件、Typecheck、Lint、Format、Production Buildに成功し、SPEC 010は全75タスクに未完了項目がない。Production BuildはWrangler Log出力のため権限昇格環境で確認した。

## 2026-09-03 回答状態Tagの簡素化

- 未回答時の`Not answered` TagをQuestion Cardと詳細から除去し、本人回答済みの場合だけ緑色の`Answered` Tagを表示するよう変更した。
- 未回答、未認証、本人回答状態の取得失敗では回答状態Tagが表示されないことをUnit／Integration Testで確認した。
- 全Node Test 48ファイル664件、Typecheck、Lint、Format、Production Buildに成功し、SPEC 010は全76タスクに未完了項目がない。Production BuildはWrangler Log出力のため権限昇格環境で確認した。
