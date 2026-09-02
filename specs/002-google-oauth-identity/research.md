# 技術調査: Google OAuthとWebMCPユーザー識別の検証

## 決定 1: Better Authを同一WorkerのHonoルートへ統合する

- **決定**: Better Authの認証ハンドラを`/api/auth/*`で受け、既存のHonoアプリと同一のCloudflare Workerで実行する。Workersの互換性設定にはBetter Authの要件に応じたNode.js互換性を追加する。
- **根拠**: Hono統合は標準のRequest/Responseを共有でき、認証済みセッションを本人確認APIでそのまま検証できる。別サービスに分けないため、Cookie共有やCORSを新たな検証対象にしない。
- **検討した代替案**: 別オリジンの認証バックエンド、または独自OAuth実装。前者は第三者Cookie・CORS・CSRFの論点を追加し、後者はOAuthのstate検証などを自前で実装する必要があるため採用しない。
- **出典**: [Better Auth Hono integration](https://better-auth.com/docs/integrations/hono)、[Better Auth installation](https://better-auth.com/docs/installation)

## 決定 2: Google OAuthは正規オリジンのコールバックURIを明示登録する

- **決定**: Google Cloud ConsoleではWeb application型OAuthクライアントを使い、ローカルとデプロイ先それぞれの`/api/auth/callback/google`を承認済みリダイレクトURIへ正確に登録する。`BETTER_AUTH_URL`にはパスを含めない正規オリジンを設定する。
- **根拠**: GoogleはリダイレクトURIのscheme、host、port、pathの一致を要求する。正規オリジンの明示により、デプロイ時の`redirect_uri_mismatch`を検証前に防ぐ。
- **検討した代替案**: localhostだけを登録する、または任意のリダイレクト先を許す。前者は共有検証をできず、後者はOAuthの安全性要件に反するため採用しない。
- **出典**: [Better Auth Google OAuth](https://better-auth.com/docs/authentication/google)、[Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

## 決定 3: D1の永続セッションを利用し、Cookieキャッシュを無効にする

- **決定**: Better Authが管理するUser、Account、Session、VerificationをD1に保存する。セッションCookieキャッシュは有効化しない。
- **根拠**: このP0ではログアウト、認証失効、別アカウントへの切替後に過去のユーザー識別子を返さないことを確認する。永続セッションをサーバー側で確認する構成なら、その検証が可能になる。
- **検討した代替案**: ステートレスなトークンだけで識別する方式、またはCookieキャッシュ。前者・後者とも失効や切替の即時性を検証しにくく、今回のGo/No-Go目的に適さないため採用しない。
- **出典**: [Better Auth session management](https://better-auth.com/docs/concepts/session-management)、[Better Auth cookies](https://better-auth.com/docs/concepts/cookies)

## 決定 4: `who_am_i` Toolは相対URLで同一オリジンの本人確認APIを呼び出す

- **決定**: WebMCP Toolは登録されたページの相対URL`/api/who-am-i`を通常の`fetch`で呼び出し、明示的なCookie値の読み取り・転送は行わない。
- **根拠**: Fetchの既定credentialsは`same-origin`であり、同一オリジンならブラウザのCookieがリクエストに含まれる。`HttpOnly` Cookieも送信できるため、JavaScriptへ秘密のセッション値を公開する必要がない。
- **検討した代替案**: 異なるオリジンへの`credentials: include`、Tool入力でトークンを渡す。前者はCORSと第三者Cookie制限・CSRFリスクを追加し、後者はToolへ認証情報を露出するため採用しない。
- **出典**: [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)、[MDN Fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)、[MDN Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## 決定 5: P0のGo/No-Goは実ブラウザの4ケースで判定する

- **決定**: 同一アカウントでの連続確認、2アカウントの分離、ログアウト・認可拒否・認証失効、アカウント切替を実機で確認する。ページのorigin、リクエスト先、HTTP結果、サービス内ユーザーIDの一致だけを記録する。
- **根拠**: ユニットテストではブラウザCookieの実際の送信とGoogleログインの挙動を証明できない。4ケースが仕様のSC-001からSC-005を直接検証する。
- **検討した代替案**: 自動テストだけによる合格判定。Google OAuthとWebMCPの実ブラウザ連携を確認できないため採用しない。
- **出典**: [Chrome WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)、[MDN Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site)

## 環境設定の記録方針

| 設定名 | 用途 | 管理方針 |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | セッションの署名・暗号化 | 高エントロピー値をSecretとして設定し、リポジトリに保存しない |
| `BETTER_AUTH_URL` | 正規オリジンの識別 | ローカルまたはデプロイ先のパスなしOriginを設定する |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントの識別 | 開発・デプロイ環境の設定として注入する |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントの認証 | Secretとして設定し、リポジトリに保存しない |
