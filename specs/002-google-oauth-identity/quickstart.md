# 検証ガイド: Google OAuthとWebMCPユーザー識別

## 目的

このガイドは、[仕様](./spec.md)の成功基準SC-001からSC-005を実ブラウザで確認し、Go/No-Goを記録するための手順である。APIとToolの返却形式は[本人確認契約](./contracts/who-am-i.md)を参照する。実装前のGoogle Cloud・Cloudflare準備は[Google OAuth・Cloudflare事前準備手順](./oauth-cloudflare-setup.md)を参照する。

## 前提条件

- Node.js 22.13以上とnpmが利用できる。
- Cloudflareアカウントと、D1へ認証データを保存できる検証環境がある。
- Google Cloud ConsoleでOAuth同意画面とWeb application型OAuthクライアントを用意できる。
- テスト専用の異なるGoogleアカウントを2つ利用できる。
- ChromeのWebMCP対応環境とPersonal Agentを利用できる。
- Secretの実値をターミナル履歴、リポジトリ、スクリーンショット、検証記録に残さない。

## 認証設定

1. ローカル用とデプロイ先用の正規Originを決める。デプロイ先はHTTPSを使う。
2. Google Cloud Consoleで、各Originに対応する`/api/auth/callback/google`を承認済みリダイレクトURIとして登録する。scheme、host、port、pathを完全に一致させる。
3. `BETTER_AUTH_URL`へパスなしの正規Originを設定する。
4. `BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`を環境設定またはCloudflare Secretとして設定する。値は文書やコミットに追加しない。
5. 認証用D1データを検証環境に適用する。

## 起動と事前確認

1. 依存関係を導入後、`npm run dev`でローカル開発サーバーを起動する。共有検証では`npm run build`と`npm run deploy`を使用する。
2. Chromeで正規Originをトップレベルタブとして開く。
3. WebMCP検証用のChrome設定を有効にし、ページが`who_am_i`を登録したことを確認する。
4. ブラウザの本人確認表示と`GET /api/who-am-i`が、未ログイン時に`AUTHENTICATION_REQUIRED`を返すことを確認する。

## Go/No-Go検証マトリクス

| ケース | 操作 | 期待結果 | 判定 |
| --- | --- | --- | --- |
| 同一アカウント | アカウントAでログインし、ブラウザとToolから10回ずつ確認する | 毎回同じ`userId`を返す | 1回でも不一致または未認証ならNo-Go |
| アカウント分離 | アカウントA・Bで各5回Toolを確認する | 各アカウント内では一定、AとBの`userId`は異なる | 一致または混同が1回でもあればNo-Go |
| 未認証・失効 | ログアウト、認可拒否、失効状態で確認する | すべて`AUTHENTICATION_REQUIRED`で、`userId`を含まない | `userId`が1回でも返ればNo-Go |
| アカウント切替 | AをログアウトしBでログインして確認する | Bの`userId`だけを返す | Aの`userId`または未認証が返ればNo-Go |

各ケースについて、実行日時、ページOrigin、API URL、HTTP状態、ブラウザの`userId`、Toolの`userId`、期待との一致、判定を記録する。Cookie値、Authorization値、OAuthトークン、メールアドレス、Secretは記録しない。

## 自動確認

実装後に次を実行する。

```sh
npm test
npm run typecheck
npm run lint
npm run format
```

すべて成功し、かつGo/No-Goマトリクスの全ケースが期待結果を満たしたときだけGoとする。
