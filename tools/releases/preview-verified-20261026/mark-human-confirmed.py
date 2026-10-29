# -*- coding: utf-8 -*-
from pathlib import Path
import ast
import json

b = Path('tools/releases/preview-verified-20261026')
p = b / 'deployment.json'
value = json.loads(p.read_text())
value.update(status='preview v2.51.0 published/verified; user confirmed lock opens pricing',
             userLoginConfirmation={'status': 'user-confirmed pricing opened', 'dateJST': '2026-10-27',
                                    'scope': 'Current account only; no passwords, grades or all-five-profile login results collected',
                                    'correction': 'User corrected the previously selected negative option'})
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
p = b / 'intent.json'
value = json.loads(p.read_text())
value['status'] = 'preview publication priority complete; user confirmed pricing opened; broad goal unfinished'
value['remaining'] = ['Return to Claude18 integration and30-question choice improvements, textbook vision/media/source coverage and other non-admin work; no new release authorized']
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
source = ast.parse((b / 'update-status.py').read_text())
files = next(ast.literal_eval(node.value) for node in source.body if isinstance(node, ast.Assign)
             and any(isinstance(target, ast.Name) and target.id == 'files' for target in node.targets))
note = '\n\n2026-10-27 本人確認追記：ユーザーが直前の選択回答を訂正し、確認版で鍵から料金説明が開いたと確認。現在のアカウントでの導線確認であり、実5アカウントすべてのログイン確認とは呼ばない。パスワードや成績は取得していない。今回の確認版公開/導線対応は完了、追加18問/既存30問改善と全体残件は継続する。\n'
for file in files:
    p = Path(file)
    p.write_text(p.read_text() + note)
p = Path('AI連絡/現在の状況.md')
text = p.read_text().replace('本人のログイン後にプランと料金説明への移動が合うかは確認待ち。', '本人が料金説明が開いたと確認済み。実5アカウントの個別ログインや表示プランまで確認したとは扱わない。', 1)
p.write_text(text)
p = Path('tools/candidates/textbook-ai-20261026/review/resume.json')
value = json.loads(p.read_text())
value['priorityPreviewPublicationUserConfirmation'] = 'User corrected negative selection and confirmed pricing opened on2026-10-27; no credential/private data obtained'
value['status'] = 'active; preview v2.51.0 published and user-confirmed pricing route; independent48-question expansion candidate in progress'
p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
print('User confirmation recorded in all8 records; whole goal remains active/incomplete.')
