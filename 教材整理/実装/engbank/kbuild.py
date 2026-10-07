"""70問の小単元を検査して 教材整理/確認済み/ に書き出す共通部品（英語・社会・国語で使う。理科の build_sci.py と同じ流れ）。
- 検査に1つでも落ちたら何も書かない
- 台帳は、問題の出典に使った写真（目視した見開き）だけを確認済みにする
- 単元一覧（material-outline.js）は、その教科・分野のワークの行だけを作った小単元に置きかえる"""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scibank'))
from kbank import ROOT, LEDGER_PATH

OUT = ROOT / '教材整理/確認済み'
OUTLINE = ROOT / 'site-assets/material-outline.js'

def build(units, check, file_info, *, subject, area, row_filter, today='2026-10-07', write=True):
    """units: KUnit を返す関数の並び。check(u)->エラーの並び。
    file_info: 写真のファイル名 -> (印刷ページの並び, 見開きの見出し)。目視した写真だけを入れる。
    row_filter(row): 置きかえる単元一覧の行か"""
    built, bad = [], 0
    for fn in units:
        u = fn(); errs = check(u)
        print(u.uid, len(u.qs), 'OK' if not errs else f'NG {len(errs)}')
        for e in errs[:20]: print('  ', e)
        if errs: bad += 1; continue
        built.append(u)
    if bad: print('NG units:', bad); sys.exit(1)
    if not write: return built
    ledger = json.loads(LEDGER_PATH.read_text(encoding='utf-8'))
    used = {}
    for u in built:
        for q in u.qs: used.setdefault(q['source']['file'], set()).add(q['source']['page'])
    seen = set()
    for e in ledger:
        if e['file'] not in used: continue
        assert e['file'] in file_info, ('目視していない写真', e['file'])
        pages, title = file_info[e['file']]
        assert used[e['file']] <= set(pages), ('ページが見開きの外', e['file'], used[e['file']], pages)
        seen.add(e['file'])
        if e.get('verified') and e.get('visualTitle') == title and e.get('pages') == list(pages): continue
        e.update({'verified': True, 'grade': 1, 'pages': list(pages), 'gradeSource': 'user-confirmed-all-workbooks-grade-1',
                  'reviewNote': f'{today} Claude 原本p{pages[0]}' + (f'〜{pages[-1]}' if len(pages) > 1 else '') + 'を目視（見出し・問題番号・教科書ページの表示）。70問の類題（作り直した問題）の出典住所に使う。手書きの答えは採用しない。',
                  'visualReview': 'full-image-reviewed', 'contentArea': area, 'visualTitle': title})
    assert seen == set(used), ('台帳にない写真', set(used) - seen)
    LEDGER_PATH.write_text(json.dumps(ledger, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for u in built:
        (OUT / f'{u.uid}.json').write_text(json.dumps(u.json(), ensure_ascii=False, indent=1), encoding='utf-8')
    src = OUTLINE.read_text(encoding='utf-8')
    head, body = src.split('globalThis.NobiMaterialOutline = ', 1)
    rows = json.loads(body.rstrip().rstrip(';'))
    hit = lambda r: r['mode'] == 'workbook' and r['subject'] == subject and row_filter(r)
    new = [{'mode': 'workbook', 'grade': 1, 'subject': subject, 'major': u.major, 'title': u.title, 'source': '確認済み問題バンク'} for u in built]
    at = next((i for i, r in enumerate(rows) if hit(r)), None)
    if at is None:  # その教科の最後のワーク行のあと（なければ末尾）
        idx = [i for i, r in enumerate(rows) if r['mode'] == 'workbook' and r['subject'] == subject]
        at = idx[-1] + 1 if idx else len(rows)
    before = [r for r in rows[:at] if not hit(r)]; after = [r for r in rows[at:] if not hit(r)]
    OUTLINE.write_text(head + 'globalThis.NobiMaterialOutline = ' + json.dumps(before + new + after, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print('written', len(built), 'units,', sum(len(u.qs) for u in built), 'questions')
    return built
