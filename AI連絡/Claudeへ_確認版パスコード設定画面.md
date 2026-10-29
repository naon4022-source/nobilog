# Claudeへの依頼：ブラウザで開く4プラン設定

ユーザーは「プラン確認版パスコード設定.app」を拒否し、「開けるようにして、アプリではなくClaudeで作って」と依頼しました。あなたに任せるのはブラウザで開ける4プラン確認版のパスコード設定画面だけです。Codexが同時に教材画像を作っています。この担当外を変更しないでください。報告は日本語。

場所は /Users/shimizunaotomoo/Desktop/my-app 本体。CodexはAGENTS.md、SECURITY.md、preview/README.md、HANDOFFの機密を伏せた内容を確認済みです。あなたはAGENTS.md、SECURITY.md、preview/README.md、AI連絡/作業連絡.mdの今回の末尾を確認してください。HANDOFF、秘密値、パスワード、認証ストア、.env、実ユーザーデータは読み出さず、秘密値をログへ出さないでください。CLIに設定されている通常の認証は使用して構いません。新しいエージェントは追加しない。

Codexがいま用意した状態：
- preview/src/index.mjs に p_mini/p_standard/p_pro/p_unlimit のログイン選択・別UID・別リース。通常確認版はu1で従来どおり。
- PREVIEW_PLAN_PEPPER/HASHESという環境変数のハッシュ登録を仮実装しましたが、ユーザーは未登録。これをブラウザからの設定に改める。
- cf-worker/src/plans.mjs が4UIDの初回プランを割り当てる。PREVIEW_PLAN_ACCOUNTS=1設定済み。ただしまだ配信していない。
- cf-worker/src/learning-assistant.mjs、index.html、material-ui/bridge、教材画像・本データはCodex担当。触らない。
- 元から大きな未コミット差分があるので保全する。既存の認証・確認版パスコードを上書きしない。

実装の提案（より安全で確実な方法なら理由を記録して改善可）：
1. 確認版Worker内に /preview-plan-setup のブラウザ画面を追加する。通常確認版u1の認証済みcookieと現在のactive-session所有権が必要。未ログインなら普通の確認版ログインへ案内。p_*は403。画面は日本語で見やすく、スマホ/Mac対応。4プランの入力欄はpassword、送信後は原文を表示せず消す。再入力の確認、4プラン違う数字、通常確認版パスコードとの重複禁止。
2. 原文PINは保存・読み返し・ログ・URL・クライアント永続保存しない。既存のPREVIEW_PIN_PEPPERをサーバー内でHMAC処理にだけ利用し、ドメイン分離文字列（例 plan-pin:v1:<UID>:<PIN>）で検証値を作る。4つの検証値を専用D1 auth_kvのprivateキー（例 preview-profile-pin:<UID>）にbatchで一括保存。環境秘密値は画面へ出さない。通常確認版のPREVIEW_PIN_HASH/PEPPER、u1記録、セッションを変えない。
3. 4プランのログインはこのprivate検証値を参照し、番号を照合する。プランUIDは固定allowlist、未知のID・重複フォームフィールド・大きなbody・異なるOriginを拒否。総当たりのIP/全体制限を維持。Origin/Content-Type、CSRF、HttpOnly/Secure/SameSiteを維持。設定画面はno-store、frame-ancestors none。
4. サーバー内の既存秘密値利用は必要な実装だが、エージェントがその値を取得してはならない。実パスコード登録はユーザーが画面から自分で行う。検証は架空値とメモリSQLiteだけ。ブラウザから採点・問題開始しない。
5. 関連検証を増やす：u1のみ設定、p_*拒否、未認証拒否、異なるOrigin、4件一括rollback、番号は返答に含まない、4プロフィールが別セッション、通常ログイン保全、390/1280pxで動作。作業前後の bash .claude/verify/run.sh を行い、失敗を成功扱いしない（直近は大文字本棚のクリックが一度タイムアウトし、単独再実行47件は成功）。不安定なら詳細を報告。
6. 編集してよいのは preview/src/index.mjs、preview/build.py（必要時のみ）、新規の確認版設定専用asset、関連する .claude/verify/ の検証、AI連絡/作業連絡.mdへの追記だけ。.app/秘密登録スクリプトは削除せず、今回は使わない。Cloudflare再設定、実秘密値登録、確認版配信、本番配信、コミット、削除はしない。

完了したら：何を変えたか、検証結果、Codexが確認版に配信したあとユーザーが開くパス、未確認事項を AI連絡/作業連絡.md に追記し、短く報告。途中で認証や承認不足になったらそこで止めて、理由を報告。許可を全面バイパスするオプションは使わない。
