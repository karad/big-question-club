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

- Homeに`Open questions`と`Revealed questions`、各全件導線、共通ヘッダー、英語の状態表示がある。
- 公開済み一覧に質問カード、公開アイコン、回答数、ページ位置が表示される。
- 未認証で公開済み詳細を開くと、回答数は表示されるが要約文・本文は表示されず、`Sign in to view revealed answers.`となる。
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
4. 公開時刻を経過させて再読込し、琥珀色の封印状態から橙色の`Answers revealed.`へ変わることを確認した。
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
