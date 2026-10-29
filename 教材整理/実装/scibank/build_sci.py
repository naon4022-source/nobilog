"""理科の70問の小単元を作って検査し、教材整理/確認済み/ に書き出す。使った見開きを台帳で確認済みにし、単元一覧も更新する。"""
import json, sys, re
from kbank import ROOT, LEDGER_PATH
from check_k import check
from sci import PAGES, SPREAD_TITLES
import life1, life2, life3, earth1, earth2, earth3, matter1, matter2, matter3, energy1, energy2, energy3
UNITS = [life1.kansatsu, life1.nakama, life2.hana, life2.kaha, life2.bunrui, life3.sekitsui, life3.musekitsui,
         earth1.daichi, earth1.jishin, earth1.yure, earth2.kazan, earth2.kaseigan, earth3.chisou_full, earth3.taisekigan, earth3.kaseki,
         matter1.kubetsu, matter1.mitsudo, matter2.kitai, matter2.noudo, matter2.youkaido, matter3.joutai, matter3.futten,
         energy1.hansha, energy1.lens, energy2.oto, energy3.chikara, energy3.tsuriai]
OUT = ROOT / '教材整理/確認済み'
OUTLINE = ROOT / 'site-assets/material-outline.js'

def main():
    built, bad = [], 0
    for fn in UNITS:
        u = fn(); errs = check(u)
        print(u.uid, len(u.qs), 'OK' if not errs else f'NG {len(errs)}')
        for e in errs[:15]: print('  ', e)
        if errs: bad += 1; continue
        built.append(u)
    if bad: sys.exit(1)
    # 台帳：使った見開きを確認済みにする（目視した見開きだけ）
    ledger = json.loads(LEDGER_PATH.read_text(encoding='utf-8'))
    used = {}
    for u in built:
        for q in u.qs: used.setdefault(q['source']['file'], set()).add(q['source']['page'])
    for e in ledger:
        if e['file'] in used:
            left = min(used[e['file']]); left -= left % 2
            assert left in SPREAD_TITLES, ('未確認の見開き', e['file'], left)
            if e.get('verified') and e.get('visualTitle') == SPREAD_TITLES[left]: continue
            e.update({'verified': True, 'grade': 1, 'pages': [left, left + 1], 'gradeSource': 'user-confirmed-all-workbooks-grade-1',
                      'reviewNote': f'2026-10-05 Claude 原本p{left}〜{left + 1}を目視（見出し・問題番号・教科書ページの表示）。70問の類題（作り直した問題）の出典住所に使う。手書きの答えは採用しない。',
                      'visualReview': 'full-image-reviewed', 'contentArea': '理科', 'visualTitle': SPREAD_TITLES[left]})
    LEDGER_PATH.write_text(json.dumps(ledger, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for u in built:
        (OUT / f'{u.uid}.json').write_text(json.dumps(u.json(), ensure_ascii=False, indent=1), encoding='utf-8')
    # 単元一覧：理科ワークの行を、作った小単元の並びに置きかえる（ドリルの行と他教科はそのまま）
    src = OUTLINE.read_text(encoding='utf-8')
    head, body = src.split('globalThis.NobiMaterialOutline = ', 1)
    rows = json.loads(body.rstrip().rstrip(';'))
    keep = [r for r in rows if not (r['mode'] == 'workbook' and r['subject'] == '理科')]
    sci = [{'mode': 'workbook', 'grade': 1, 'subject': '理科', 'major': u.major, 'title': u.title, 'source': '確認済み問題バンク'} for u in built]
    at = next((i for i, r in enumerate(rows) if r['mode'] == 'workbook' and r['subject'] == '理科'), len(rows))
    before = [r for r in rows[:at] if r in keep]; after = [r for r in rows[at:] if r in keep]
    OUTLINE.write_text(head + 'globalThis.NobiMaterialOutline = ' + json.dumps(before + sci + after, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print('written', len(built))
if __name__ == '__main__': main()
