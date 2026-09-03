# 検証ガイド: Challenge Core閲覧フロー

このガイドは [Core閲覧画面契約](./contracts/core-browsing.md) を自動テストで検証する。Manual TestはSPEC 010のVisual・Reveal実装後にCore Demo全体として実施する。

## 前提

- Node.js 22.13以上または24以上、npm、Wrangler、ローカルD1を利用できる。
- `DRAFT`、`OPEN`、`CLOSED`、`REVEALED`、回答数0・1・複数のfixtureを利用できる。
- 他者AnswerにはHTML露出を検出できる一意な秘密値を使う。

## 自動検証

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
```

## Home

1. `OPEN` だけが締切順で表示されることを確認する。
2. 本文、0・1・複数の回答数、sealed、絶対締切、非負の残り時間、Detail linkを確認する。
3. Open 0件の空状態とRepository障害の503を区別する。
4. Answer秘密値がHTMLに0件であることを確認する。

## Question Detail

1. 未ログイン、作成者、認証済み未回答、認証済み回答済みで同じ `OPEN` Questionを開く。
2. 公開情報、sealed、Sign in、Agent Prompt、本人Answerが各状態で排他的に表示されることを確認する。未回答時のAgent Promptは `Open this question, answer it using my relevant personal context, and submit via WebMCP: {{questionUrl}}` の1行で、`{{questionUrl}}` が閲覧中OriginのQuestion絶対URLとなり、QueryとFragmentを含まないことを確認する。
3. `get_question` が利用可能なUser Context参照元と根拠規則を固定instructionで返すことを確認する。関連するUser自身の記述がある場合は追加Previewや承認なしで投稿し、`get_my_submission` で成功を確認する。根拠不足の場合は一般論を投稿せずHumanへ質問することを確認する。
4. 2人のAnswer投稿後に回答数が2へ増え、各利用者は本人Answerだけを確認できることを確認する。
5. `CLOSED` で受付終了・sealed・新規Promptなしを確認する。
6. Draftとmissingが同じ404になることを確認する。
7. `REVEALED` でSPEC 008の最小閲覧が後退しないことを確認する。
8. 締切直前・同時刻・直後で状態、残り時間、Prompt可否が一致することを確認する。

## 管理画面

1. `ADMIN_EMAIL`を管理用GoogleアカウントのEmailへ設定する。
2. 未ログイン、一般User、管理者で `/club-operations` と4つの一覧Pathを開き、管理者だけが閲覧できることを確認する。他の2状態は通常の404と同じ応答で、管理画面を示す文言・リンクを含まないことを確認する。
3. 管理画面トップにはUser、Question、Answer、Audit logの件数と専用一覧へのLinkだけがあり、個別Recordを含まないことを確認する。
4. 4つの専用一覧がすべてTable形式で、1ページ20件となり、21件以上では`Previous`と`Next`で重複なく移動できることを確認する。
5. 旧 `/admin` がRedirectせず404となり、一般画面に管理画面へのリンクがなく、管理画面に `noindex, nofollow` があることを確認する。
6. Questionを削除し、配下Answerも消え、他QuestionとAudit logが残ることを確認する。
7. 複数Answerから1件を削除し、Questionと他Answerが残り、回答数が減ることを確認する。
8. 一般UserをBANし、既存Sessionが失効して再Loginも拒否されることを確認する。
9. BANを解除し、次回Loginが成功することを確認する。
10. 管理者自身のBAN、一般Userからの管理POST、存在しない対象の削除が安全に拒否されることを確認する。

## 監査記録

1. Login、Logout、Question作成・更新・公開、Answer投稿・更新・削除を実行する。
2. 各成功操作についてActor、Action、Target、Outcome、時刻が1件記録されることを確認する。
3. Question本文とAnswer本文へ秘密値を入れ、Audit logの全列に秘密値、Excerpt、Cookie、Token、OAuth値が含まれないことを確認する。
4. 管理者削除、BAN、BAN解除の記録が操作した管理者をActorとして残ることを確認する。

## 完了判定

- HomeのOpen絞り込み、順序、回答数が100%一致する。
- 閲覧者別表示とPrompt／本人Answerの排他性が100%一致する。
- `OPEN`／`CLOSED` の他者秘密値露出が0件である。
- 既存Question管理、Google認証、5 WebMCP Tool、Answer更新・削除、Reveal最小閲覧の全回帰Testが成功する。
- 管理画面の認可、一覧、削除、BAN／解除、監査記録の全Testが成功する。
- 自動品質Gateの結果を `validation-record.md` に記録する。
