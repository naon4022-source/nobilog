# Claude と ChatGPT を合わせて1日10回・全部記録（候補・未反映・実通信なし）

- 方針（ユーザー）：「毎日クロードとチャットGPT合計で十回全部記録しておいて」。実Geminiは停止のまま。
- 回数：今ある `cf-worker/src/ai-trial-control.mjs` の `runRealAITrial`（全アカウント合計10回/日・同時1つ・3回続けて失敗で停止）をそのまま使う。提供元に関係なく合計で数えるので、Claude 6回＋ChatGPT 4回で11回目は送らない。
- `ai-call-log.mjs`：1回ずつ `ai-log:<日本時間の日付>:<id>` に記録。中身は提供元・モデル・用途・本人UID・結果・理由コード・時間・トークン数だけ。問題文・答え・AIの返事・鍵は入れない。
  - 結果：success／failed（送ったが失敗）／unsent（上限・停止・混雑で送らなかった）／unknown（送ったあと結果が返らなかった。無料扱いにしない）。
  - 使えるモデル：Claude は `claude-haiku-5-5`・`claude-sonnet-5-5`、ChatGPT は今の openai-policy と同じ `gpt-6-luna`・`gpt-6.1-sol`。
- `anthropic-transport.mjs`：Claude（Messages API）への接続。宛先は固定、転送は拒否、返事は64KBまで、相手のエラー本文はそのまま返さない、鍵がなければ送らない。
- 確認：`node verify-ai-calls.mjs`（にせの fetch・隔離 SQLite・28件）。本物の鍵・本物の通信・本物のアカウントでは試していない。
- 取り込み（Codex）：ヒント・相談・ノート分析の各経路で、提供元を呼ぶところを `loggedCall(db,{provider,model,purpose,uid},work,{run:runRealAITrial})` で包む。Claude を使うかどうか・どのプランでどのモデルかは、今の OpenAI の決まり（openai-policy）とユーザーの決定に合わせる。`ANTHROPIC_API_KEY` の登録は本人が行う（値は読まない）。
- 未決：Claude のどのモデルをどのプランに使うか、料金（実費の根拠）、年齢・同意・保管・退会の説明（OpenAI と同じ扱いでよいか）。記録の保存期間。
