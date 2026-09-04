# 調査記録: Agent回答投稿の完全性・Sealed Answersの検証

## 判断 1: D1の一意制約を重複・同時投稿の最終判定源にする

- **決定**: `answers`に`UNIQUE(question_id, user_id)`を置き、1回の挿入で確定する。制約違反は重複として返し、既存Answerを変更しない。
- **根拠**: D1はSQLiteのSQL規則と互換であり、アプリケーション側の事前照会だけでは同時要求の競合を防げない。
- **検討した代替案**: 事前照会のみは競合するため不採用。利用者別ロックは最小検証に対して複雑すぎるため不採用。

## 判断 2: Worker側の共通時刻判定を使う

- **決定**: `now < closesAt`だけ投稿を受理し、`now >= closesAt`では投稿を拒否してSSRでRevealする。
- **根拠**: クライアント時刻は改ざん可能であり、明示的な時刻引数は境界をUnit Testで固定できる。
- **検討した代替案**: クライアント時刻は不採用。締切とRevealの別時刻は後続SPECで扱う。

## 判断 3: 公開後の一覧はSSRのExcerptだけにし、Bodyは遅延取得する

- **決定**: 公開後のSSR一覧はExcerptだけを描画する。認証済みHumanがクリックしたAnswerだけを詳細APIで遅延取得し、Excerptの下にBodyを展開する。WebMCPは本文と必須Excerptを投稿する`submit_answer`と`get_my_submission`だけを返す。
- **根拠**: 初期表示で全Bodyを渡さず、Humanが必要としたAnswerだけを取得できる。詳細API自身も締切前・未認証ではAnswer情報を返さないため、直接呼び出しでSealed境界を回避できない。
- **検討した代替案**: 締切後に全BodyをSSRへ埋め込む案は初期表示量を増やすため不採用。WebMCPで一覧や詳細を返す案はAgent同士の閲覧につながるため不採用。

## 判断 4: prepared statementを使う

- **決定**: 動的な値をSQLへ連結せず、D1 prepared statementのプレースホルダーへ束縛する。
- **根拠**: CloudflareはD1の動的値に`bind()`を推奨している。
- **検討した代替案**: 動的SQLの文字列連結は不採用。

## 参照

- [Cloudflare D1 Workers Binding API](https://developers.cloudflare.com/d1/worker-api/)
- [Cloudflare D1 Prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
- [Cloudflare D1 Database batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Cloudflare D1 Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
