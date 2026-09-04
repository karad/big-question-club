# クイックスタート: Question作成・公開フロー

## 目的

SPEC 006の実装完了後に、入力境界、認証・所有者境界、下書き編集、不可逆な公開、`My Questions`、英語UI、キーボード導線を再現可能に検証する。実装中は自動テストを先に完了し、手動確認は開発可能な項目がすべて完了してからまとめて実施する。

詳細な入力・状態は [data-model_ja.md](./data-model_ja.md)、HTTP／画面結果は [contracts/question-management_ja.md](./contracts/question-management_ja.md) を参照する。

## 前提

- Node.js 22.13以上または24以上とnpmが利用できる。
- 依存関係を `npm install` 済みである。
- `.dev.vars` にGoogle OAuthのローカル検証値が設定されている。
- ローカルD1へ全Migrationを適用できる。
- Google OAuthで使えるテスト利用者を2人用意できる。
- Questionや画面へ実在の個人情報、機密情報、OAuth値を入力しない。

## 1. 自動品質ゲート

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
```

期待結果:

- 30件以上の本文・締切・確認入力ケースがすべて期待結果と一致する。
- 20件以上の未認証・所有者不一致・存在しない・公開済み操作で不正変更が0件となる。
- 逐次10回・同時10件の公開要求でも、公開時刻が1つだけ確定する。
- `My Questions` の15件以上の状態・空状態・複数利用者ケースで本人所有分と回答数だけが返る。
- Typecheck、Lint、Format、Buildが成功する。

失敗した品質ゲートがある場合は手動確認へ進まない。

## 2. ローカル環境

```bash
npm run db:migrate:local
npm run dev
```

ブラウザーで表示されたローカルURLを開き、利用者AでGoogle OAuthへsign inする。

## 3. Draft作成と入力エラー

1. `/questions/new` を開く。
2. Question、Answer deadline、公開内容の確認が英語で表示されることを確認する。
3. 空白、9文字、1,001文字、現在から1時間未満、30日超、未選択の確認を順に送信する。
4. 各送信で保存されず、英語の項目別errorと入力値が表示されることを確認する。
5. 絵文字・結合文字を含む10文字と1,000文字の境界値で、表示カウンターとサーバー結果が一致することを確認する。
6. 任意の言語による有効なQuestion、1時間以上30日以内の締切、確認を入力し `Save draft` を実行する。

期待結果:

- 有効な1件だけが `DRAFT` となる。
- Reviewには本文、ローカル日時、IANAタイムゾーン、UTC締切が表示される。
- Question本文にHTML風文字列を含めてもtextとして表示され、実行・解釈されない。

## 4. Draft編集と公開

1. Reviewから `Edit` を開き、本文と締切を変更して保存する。
2. Reviewへ変更が反映されることを確認する。
3. 公開確認を選択せずに `Publish question` を送信し、公開されないことを確認する。
4. 確認を選択して公開する。
5. 同じ公開操作を再送信し、既存内容と公開時刻が変わらないことを確認する。
6. 公開済みQuestionの編集先へ直接アクセスし、変更できないことを確認する。

期待結果:

- 公開は1回だけ確定し、直後の状態は `OPEN` となる。
- 本文、締切、Reveal時刻、作成者は公開後に変化しない。
- 締切はReveal時刻と同じである。

## 5. My Questions

1. 利用者AでDraft、Open、Closed、Revealedを少なくとも1件ずつ用意する。
2. `/my/questions` を開く。
3. 新しい順、本文の先頭、状態、締切、回答数、状態別導線を確認する。
4. Draftには `Edit` と `Review and publish`、公開済みには `View question` だけがあることを確認する。
5. Questionを持たない利用者Bで開き、空状態と `Create a question` を確認する。

期待結果:

- 各利用者は本人所有Questionだけを確認できる。
- Answer本文、Excerpt、投稿者情報はHTMLにも含まれない。

## 6. 所有者・認証・CSRF

1. 利用者AのDraft識別子を用意する。
2. sign out状態で作成、一覧、編集、Review、公開へアクセスする。
3. 利用者Bで、利用者AのDraftに対するGETとPOSTを直接試す。
4. 存在しない識別子への同じ操作とResponseを比較する。
5. 同一Originを示すheaderのないcross-site相当のForm POSTを自動Integration Testで確認する。

期待結果:

- 未認証操作はQuestionを変更せず、sign-inが必要と英語で案内される。
- 他人所有と存在しないQuestionは同じ404と文言になり、Draft内容を含まない。
- CSRF拒否は403で、Question情報を含まず、保存値を変更しない。

## 7. キーボードとエラー復旧

1. マウスを使わず、作成画面の全項目、`Save draft`、Review、`Edit`、公開確認、`Publish question`、`My Questions` を操作する。
2. 無効入力を1回送り、error summaryから該当項目へ移動して修正する。
3. 10分以内にDraft作成から公開、一覧への復帰まで完了する。

期待結果:

- すべての入力に可視labelがあり、focus順が画面順と一致する。
- errorは項目と関連付けられ、色だけに依存しない。
- 操作不能な必須項目が0件である。

## 8. 記録

検証日、実行環境、自動品質ゲート結果、2利用者の所有者確認、公開一意性、キーボード所要時間、未解決事項を本ファイル末尾または同等の検証記録へ追記する。実在のUser ID、email、Session値、Question本文の機密情報は記録しない。

## 9. 実施結果（2026-09-02）

- 実行環境: macOS、Node.js、Vite開発サーバー、全Migration適用済みローカルD1、Google OAuthテスト利用者2人
- 自動品質ゲート: Typecheck、Lint、Format、Node Test 198件、D1 Test 36件、Buildがすべて成功
- 入力境界: 9／10／1,000／1,001書記素、1時間未満、30日超、公開内容の未確認を確認。結合文字と絵文字の表示カウンターはサーバー契約と一致した
- Draft／公開: 作成、入力保持、編集、Review反映、公開確認未選択時の拒否、1回だけの公開、公開後編集拒否を確認した
- `My Questions`: `DRAFT`、`OPEN`、`CLOSED`、`REVEALED` の新しい順表示、状態別導線、回答数、利用者Bの空状態を確認した。検証用Answerの本文・ExcerptはHTMLへ含まれなかった
- 所有者境界: 利用者Bから利用者AのQuestionと存在しないQuestionへアクセスし、同じ `Question unavailable.` 表示となることを確認した。POST、401、403、保存値不変は自動Integration Testで確認した
- HTML／英語UI: HTML風本文はtextとして保持され、script dialogは発生しなかった。管理UIとerrorは英語で表示された
- キーボード: すべての操作要素がnative controlまたはlinkで、可視label、error summaryの対象anchor、正の`tabindex`を使わない画面順のfocus順を確認した。Draft作成から公開、一覧復帰までは10分以内だった
- 公開一意性: 手動で公開後の編集拒否を確認し、逐次10回・同時10件の一意性はD1 Testで確認した
- 未解決事項: なし。既存依存関係由来のNode.js `punycode` deprecation warningのみ継続して表示される
