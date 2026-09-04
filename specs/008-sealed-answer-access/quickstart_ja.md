# 検証ガイド: Sealed Answersのアクセス制御

このガイドは [アクセス制御表](./contracts/access-control-matrix_ja.md)、[Human向けHTTP契約](./contracts/answer-http_ja.md)、[WebMCP契約](./contracts/webmcp-visibility_ja.md) を全経路で検証する。

## 前提

- Node.js 22.13以上または24以上、npm、Wrangler、ローカルD1を利用できる。
- WebMCP対応Chromeと、機微情報を含まないGoogle検証アカウント2つを利用する。
- 同じQuestionへ明確に識別可能な検証用本文・Excerptを各アカウントから投稿する。

## 自動検証

```bash
npm install
npm run db:migrate:local
npm run typecheck
npm run lint
npm run format
npm test
npm run test:d1
npm run build
npm run db:schema:check
```

期待結果は、認可決定表の全組み合わせ一致、Reveal前の全経路で他者秘密値0件、Reveal後SSRの本文0件、詳細HTTPの指定本文1件、WebMCPの他者情報0件、実在・不在・別Questionの共通拒否、利用者依存応答の安全なHeaderである。

## ローカル起動

```bash
npm run dev
```

表示された同一Originを別々のChrome Profileで開く。

## 実装対象と自動テスト

- Human SSR: `GET /questions/:questionId`
- 本人状態: `GET /api/questions/:questionId/my-submission`
- Reveal後本文: `GET /api/questions/:questionId/answers/:answerId`
- WebMCP Question: `GET /api/questions/:questionId`
- 利用者依存の成功・拒否: `Cache-Control: private, no-store` と `Vary: Cookie`
- Unit決定表: `tests/unit/answer-visibility.test.ts`
- HTTP／SSR／Session: `tests/integration/question-visibility.test.ts`
- WebMCP境界: `tests/integration/webmcp-question-api.test.ts` と `tests/unit/register-production-tools.test.ts`
- D1最小投影: `tests/d1/answer-visibility-repository.test.ts`

## Reveal前

1. AとBで同じ `OPEN` Questionへ異なるAnswerを投稿する。
2. Aの画面に回答数とA本人Answerがあり、Bの本文、Excerpt、ID、User、時刻がHTML Sourceにもないことを確認する。BとQuestion作成者でも対称に確認する。
3. 実在、不在、別QuestionのAnswer IDで詳細HTTPを呼び、すべて `404 ANSWER_UNAVAILABLE` かつ同じHeader／Bodyになることを確認する。
4. `CLOSED` fixtureでもRevealまでは同じsealed結果になることを確認する。

## Reveal後

1. `REVEALED` Questionの全Excerptが表示され、本文はHTML Sourceに0件であることを確認する。
2. 1件を選び、対応本文1件だけが取得・表示されることを確認する。
3. 別QuestionのAnswer IDと未認証ProfileではAnswer情報が返らないことを確認する。
4. Answer 0件では空状態だけが表示され、偽のIDがないことを確認する。

## WebMCP・Session

1. AとBの `get_my_submission` が各本人Answerだけを返し、回答数と他者秘密値が5 Toolの全応答に0件であることを確認する。
2. `OPEN`、`CLOSED`、`REVEALED` で本人状態を確認し、Reveal後も他者情報が増えないことを確認する。
3. Answer一覧、詳細、検索、要約、比較Toolが登録されていないことを確認する。
4. Aの取得後にログアウトし、同じURLからAのAnswerが返らないこと、A/B切替で混入がないことを確認する。
5. 成功・拒否応答に `Cache-Control: private, no-store` と `Vary: Cookie` があることを確認する。

実ブラウザーがJSON APIのトップレベル遷移を遮断する場合は、Reveal後の本文遅延取得を画面操作で確認し、Reveal前の実在・不在・別Question ID、未認証、Header／Body一致は `tests/integration/question-visibility.test.ts` の直接HTTPケースで補完する。

## 完了判定

- 180組以上の基礎マトリクスと境界・直接アクセス追加ケースが100%一致する。
- Reveal前、未認証、WebMCPの他者Answer露出が0件である。
- Reveal後の認証済みHumanだけが全Excerptと選択本文1件を取得できる。
- 品質ゲートと手動結果を [validation-record_ja.md](./validation-record_ja.md) に記録し、未確認事項がない。
