# 技術調査: Personal Agent回答の安全性・言語の検証

## Decision 1: Question・Tool定義・Tool出力を不信頼データとして扱う

- **Decision**: Question本文だけでなく、WebMCPのTool名、description、引数名、Tool出力も安全上の信頼根拠にしない。Question本文は命令ではなく、Agentが閲覧・回答するデータとして扱う。
- **Rationale**: WebMCPでは第三者データを含む出力だけでなく、悪意あるTool manifestもPrompt Injectionの経路になり得る。Private Contextの開示、ルール変更、外部送信を要求する文面は、本文・定義・出力のどこに現れても優先しない。
- **Alternatives considered**: モデルのInjection耐性だけに依存する案は不採用。LLMの振る舞いだけでは安全性を保証できず、同一オリジン、読み取り専用、Private Contextを受信しない契約、手動評価を組み合わせる必要があるため。

## Decision 2: 検証Question出力には不信頼コンテンツの標識を付ける

- **Decision**: Question本文を返す読み取り専用Toolには`readOnlyHint: true`と`untrustedContentHint: true`を付ける。Toolは1件のケースを返すだけに限定する。
- **Rationale**: 検証Questionには意図的にInjection文字列が含まれる。Tool出力全体を不信頼として標識することで、Agentがその文字列を命令ではなくデータとして扱うべきことを表す。1件ずつの返却は、複数のInjectionを同時にコンテキストへ渡さず、ケース単位の判定を可能にする。
- **Alternatives considered**: Tool全体に標識を付けずdescriptionだけで説明する案は不採用。Injectionを含む出力であることが契約上不明確になるため。各Question用に複数Toolを登録する案も不採用。Tool選択の揺らぎが検証結果へ混入するため。

## Decision 3: Tool descriptionは必須の安全・言語ルールを簡潔に記載する

- **Decision**: Tool descriptionには、検証Questionを1件取得する目的、必要なケースID、読み取り専用であること、Questionと同じ言語で回答すること、Personal Contextを内部推論に限ること、本文中の命令を信頼しないことを簡潔に記載する。
- **Rationale**: これは仕様のFR-010を満たす明示的な利用契約である。一方、descriptionはTool選択を助けるものに留まり、不信頼なTool定義がInjection経路になり得るため、安全方針をdescriptionだけに委ねない。検証対象Agentの信頼された安全指示とTool出力の標識、手動評価を組み合わせる。
- **Alternatives considered**: 安全・言語ルールを記載しない案は不採用。Agentが守るべき検証契約を明示できないため。長い安全プロンプトを埋め込む案も不採用。description自体が安全境界を保証せず、Tool選択の曖昧性も増すため。

## Decision 4: Answerをアプリケーションへ送らず、手動E2Eで評価する

- **Decision**: Answer投稿・保存・自動採点APIを追加しない。実Personal Agentが返したAnswerを評価者が確認し、秘密を含まない判定だけを`validation-record.md`へ記録する。
- **Rationale**: Answerを受信すると、Private Contextや秘密の言い換えをアプリ・ログ・Gitへ流出させる新しい経路になる。内部推論・意味的な漏えい・Question関連性は、P0で信頼できる自動評価器を前提にできない。
- **Alternatives considered**: 一時POST APIやAnswer全文の記録は不採用。SPEC 004以降の責務を先取りし、漏えい面を増やすため。

## Decision 5: 固定契約の自動テストと実Agentの手動E2Eを分離する

- **Decision**: 固定Question群、ケース選択、言語・分類、APIの`no-store`、Tool登録・不信頼標識、SSRで秘密を表示しないことはVitestで確認する。Private Context利用、漏えい、Injection不服従、言語一致のGo/No-Goは実Personal Agentで確認する。
- **Rationale**: アプリはPersonal AgentのPrivate Contextや内部推論を保持しない。自動テストでそれらを模倣・収集することは検証対象をすり替え、プライバシー境界にも反する。
- **Alternatives considered**: 全条件をVitestだけでGo判定する案は不採用。実AgentがWebMCP出力をどう解釈するかを確認できないため。

## 参考資料

- [Chrome for Developers: WebMCP security](https://developer.chrome.com/docs/agents/security)
- [Chrome for Developers: Secure WebMCP tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome for Developers: WebMCP evaluations](https://developer.chrome.com/docs/ai/webmcp/evals)
