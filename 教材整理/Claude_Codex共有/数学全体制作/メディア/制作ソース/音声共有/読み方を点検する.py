# -*- coding: utf-8 -*-
"""台本の読み残し候補を報告する。自動置換・発音の合格判定はしない。"""
from pathlib import Path
import json,re,sys
BASE=Path(__file__).resolve().parent.parent

def issues(step):
    out=[]
    spoken=step.get('yomi',step.get('say',''))
    if not isinstance(spoken,str) or not spoken.strip():return ['音声の文が空、または文字列ではない']
    if re.search(r'[A-Za-z/×÷=＝−^²³≤≥]',spoken):out.append('記号・英字の読みを文脈に合わせて指定する')
    if re.search(r'ぷんの(?:いち|に|さん|よん|ご|ろく|なな|はち|きゅう|一|二|三)',spoken):out.append('分数の「ぶん」を「ぷん」にしていないか確認する')
    if re.search(r'\d+(?:\.\d+)?分',spoken):out.append('時間の「ふん・ぷん」と分数の「ぶん」を確認する')
    if step.get('cap',step.get('say'))!=step.get('say'):out.append('字幕と音声の意味が一致するか確認する')
    return out

def test():
    assert issues({'say':'x−2'})
    assert issues({'say':'3分の1','yomi':'さんぷんのいち'})
    assert issues({'say':'3分'})
    assert not issues({'say':'3分の1','yomi':'さんぶんのいち'})
    assert not issues({'say':'x−2','yomi':'えっくすひくに'})
    assert not issues({'say':'1分','yomi':'いっぷん'})
    assert issues({'say':''})
    assert issues({'say':'同じ','cap':'別の文'})
    print('8 witnesses passed（実聴検証ではない）')

if '--self-test' in sys.argv:test()
else:
    result=[]
    for path in sorted(BASE.glob('M1-*.json')):
        if path.name.endswith('.timeline.json'):continue  # 時間割は音声用の台本ではない
        obj=json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(obj,dict) or 'steps' not in obj:continue
        for n,st in enumerate(obj['steps'],1):
            result.append({'id':path.stem,'step':n,'say':st.get('say'), 'yomi':st.get('yomi'),'reviewCandidates':issues(st)})
    report={'scope':'制作ソース直下にある既存の台本だけ。未制作台本・全動画・実際の発音を確認済みとはしない。','steps':len(result),'candidates':sum(bool(r['reviewCandidates']) for r in result),'items':result}
    (BASE/'音声共有/読み点検結果.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"台本 {len(set(r['id'] for r in result))}本、{len(result)}文、再確認候補 {report['candidates']}文")
