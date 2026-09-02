# 検証記録: Question作成・公開フロー

## 実装前ベースライン（2026-09-02）

- `npm run typecheck`: 成功
- `npm run lint`: 成功
- `npm run format`: 成功
- `npm test`: 19ファイル、118テスト成功
- `npm run test:d1`: 8ファイル、21テスト成功（ローカルportを使用するため権限昇格環境で実行）
- `npm run build`: 成功

実装前の未解決事項はない。D1テストで表示されるNode.js `punycode` deprecation warningは既存依存関係由来であり、テスト結果には影響しない。

## 実装後（2026-09-02）

- `npm run typecheck`: 成功
- `npm run lint`: 成功
- `npm run format`: 成功
- `npm test`: 21ファイル、198テスト成功
- `npm run test:d1`: 9ファイル、36テスト成功（ローカルportを使用するため権限昇格環境で実行）
- `npm run build`: 成功（Wranglerのログ出力先制約を除外するため権限昇格環境で最終確認）

入力契約は30件以上、Question管理の認証・所有者・CSRF・表示契約は20件以上、`My Questions` は15件以上の表示ケースで検証した。逐次10回および同時10件の公開要求でも、公開確定は1回だけであることをD1テストで確認した。

ローカルD1とGoogle OAuthの2利用者を用いた手動確認では、Draft作成・入力保持・編集・Review・公開確認・1回だけの公開・公開後編集拒否・4状態の一覧・利用者Bの空状態・所有者非列挙・Answer内容非露出を確認した。手動確認中に発見した空の締切をUnix epochとして初期表示する問題は修正し、再確認済みである。

未解決の実装事項はない。Node.js `punycode` deprecation warningは既存依存関係由来である。共有D1へのMigration適用は本SPECでは実施せず、既存のデプロイ手順に従う。
