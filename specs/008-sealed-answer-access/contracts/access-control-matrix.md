# Answerアクセス制御マトリクス

✅は返却可、❌はAnswer由来データと実在の手掛かりを返却不可とする。

## 認証済みHuman

| 状態 | SSR回答数 | SSR本人Answer | 本人状態HTTP | SSR全Excerpt | 詳細HTTP指定本文 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `DRAFT` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `OPEN` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `CLOSED` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `REVEALED` | ✅ | ❌ | ✅ | ✅ | ✅ |

Question作成者も同じ表に従い、Reveal前の特権を持たない。Reveal後の初期SSRは本人を含めてAnswer本文を埋め込まず、本人Answerは本人状態HTTPからのみ取得する。全Excerptには本人を含む全Answerの `{ id, excerpt }` だけを含める。

## Personal Agent / WebMCP

| 状態 | 回答数 | 本人状態・Answer | 他者情報 |
| --- | ---: | ---: | ---: |
| `DRAFT` | ❌ | ❌ | ❌ |
| `OPEN` | ❌ | ✅ | ❌ |
| `CLOSED` | ❌ | ✅ | ❌ |
| `REVEALED` | ❌ | ✅ | ❌ |

未投稿応答は他者の投稿有無や件数で変化しない。

## 未認証者と境界

未認証者は全状態、全経路、全Answer情報を❌とする。`now < closesAt` は `OPEN`、`closesAt <= now < revealsAt` は `CLOSED`、`revealsAt <= now` は `REVEALED`。`closesAt === revealsAt` は境界直前が `OPEN`、同時刻から `REVEALED` とし、1要求は最初に導出した状態を最後まで使う。
