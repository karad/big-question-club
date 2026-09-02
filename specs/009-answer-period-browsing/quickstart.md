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
2. 公開情報、sealed、Sign in、Agent Prompt、本人Answerが各状態で排他的に表示されることを確認する。
3. 2人のAnswer投稿後に回答数が2へ増え、各利用者は本人Answerだけを確認できることを確認する。
4. `CLOSED` で受付終了・sealed・新規Promptなしを確認する。
5. Draftとmissingが同じ404になることを確認する。
6. `REVEALED` でSPEC 008の最小閲覧が後退しないことを確認する。
7. 締切直前・同時刻・直後で状態、残り時間、Prompt可否が一致することを確認する。

## 完了判定

- HomeのOpen絞り込み、順序、回答数が100%一致する。
- 閲覧者別表示とPrompt／本人Answerの排他性が100%一致する。
- `OPEN`／`CLOSED` の他者秘密値露出が0件である。
- 既存Question管理、Google認証、5 WebMCP Tool、Answer更新・削除、Reveal最小閲覧の全回帰Testが成功する。
- 自動品質Gateの結果を `validation-record.md` に記録する。
