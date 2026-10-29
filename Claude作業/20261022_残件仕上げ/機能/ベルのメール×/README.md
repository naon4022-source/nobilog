# ベルのお知らせ一覧の角のうすい×（候補・未反映）

- 何が起きる：🔔 → お知らせ一覧の各行の右上に、うすい「×」（押せる大きさ36px）。押すと**本人の一覧から外れるだけ**。元のお知らせ・通知・提出・成績は消さない（物理削除なし）。
- 外した印：本人の記録 `ukey('noticeHidden')`（最大500件の id）。既読の印 `noticeRead` と同じ保存先なので、ほかの端末・読み直しでも外れたまま。ベルの数字も外したものを数えない。
- 通知トースト（画面に出る小さいお知らせ）を閉じる既存の×とは別物。トーストは変えていない。
- 差分：`index.diff`（35行）。元：index.html SHA-256 52eb3411e628d4373b1139d35efc53b768499c4438dd4878b065ff9f1b6b525e、候補：ca9239fb39eed1a972531b61c7bb62d83be87d1d77c6f185007b517a9c070b47。
- 取り込み（Codex）：今の index.html が上の元SHAと同じなら `patch -p0` 相当でそのまま当たる。違えば diff の4か所（CSS 1行・noticeHiddenSet/noticeHide・noticeRefresh の数・noticeOpen の一覧）を手で当てる。
- 確認：`node verify-bell-hide.mjs`（候補の index.html を ?demo=1 で開き、外への通信は止める。390/1280px・28件合格）。実アカウントでは確認していない。
