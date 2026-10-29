# AIを中学生向けアプリで使うときの規約確認（Claude・2026-10-08）

## 結論
- **Gemini API**：追加利用規約に「18歳以上であること」と「18歳未満を対象とする、または18歳未満が使う見込みのあるアプリでは使わない」がある（2024年5月版〜2025年11月20日版まで同じ）。料金を払っても、保護者名義でも変わらない。→ のびログでは**実Geminiを使わない**（模擬AIのまま）。
  - 出典：https://ai.google.dev/gemini-api/terms_preview ／ https://ai.google.dev/gemini-api/terms-archive/terms_11_20_25
- **Vertex AI（Google Cloud）**：同じような制限があるという情報がある（未確認。採用するなら規約本文を確認する）。
- **Google Workspace for Education の Gemini アプリ**：学校向けの別契約で生徒も使えるが、アプリに組み込むAPIではない。
- **Anthropic（Claude）API**：未成年向けの製品は、追加の安全対策（年齢確認・内容フィルター・監視と報告・AIであることの表示・子ども向けの安全なシステムプロンプト・COPPAなど法令順守）を条件に認めている。
  - 出典：https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
  - ※この文書を書いているのはAnthropicのClaudeなので、利害関係がある。比べるなら OpenAI など他社の規約も本文で確認すること。

## いまの状態
- 確認版は GEMINI_ENABLED="0"・GEMINI_MOCK="1"（模擬AI）。回数制限・予算・本人確認の仕組みはそのまま使える。
- 切り替えるときは、規約が子ども利用を認める会社を選び、上の安全対策を満たしてから、なおの承認を得る。
