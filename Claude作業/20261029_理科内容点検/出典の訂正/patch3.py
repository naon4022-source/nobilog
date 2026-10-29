# 候補3：写真を開いて確かめた出典ページのずれだけを直す。問題・答え・解説は変えない。
import json,os,glob,sys,copy
L={s['id']:s for s in json.load(open('../engine/台帳の写し.json'))}
FIX={ # id: (新しい台帳ID, 新しいページ, 根拠)
 "kaseigan-11":("source-0670",96,"問題文の「図39」は p96 にある（S__16629816 を目視）"),
 "kaseki-13":("source-0675",107,"観察3（5%塩酸）は右ページ p107 にある（S__16629822 を目視）"),
 "kaseki-14":("source-0675",107,"観察3（鉄くぎでひっかく）は右ページ p107 にある（S__16629822 を目視）"),
 "chikara-55":("source-0558",117,"p116 は光・凸レンズのまとめ。ばねののびのグラフは p117（S__16252994 を目視）"),
 "chikara-56":("source-0558",117,"同上"),
 "chikara-57":("source-0558",117,"同上"),
 "chikara-52":("source-0559",118,"p119 は凸レンズ・音・モノコードの記述問題。月面とばねの問題は p118（S__16252995 を目視）"),
 "chikara-66":("source-0559",118,"同上（質量は場所で変わらない＝p118 の月面の記述）"),
 "yure-67":("source-0512",25,"p22 はプレートと地形の変化。震度・マグニチュードは p25（S__16252944 を目視）"),
}
src,dst=sys.argv[1],sys.argv[2];os.makedirs(dst,exist_ok=True);log=[]
for f in sorted(glob.glob(src+'/tokkun-science-1-*.json')):
    d=json.load(open(f))
    for q in d['questions']:
        k=q['id'][17:]
        if k in FIX:
            sid,page,why=FIX[k];s=L[sid];assert page in s['pages'],k
            before={"source":copy.deepcopy(q['source']),"ref":q.get('ref')}
            oldp=q['source']['page'];q['source'].update({"id":sid,"file":s['file'],"sha256":s['sha256'],"page":page})
            if q.get('ref'):q['ref']=q['ref'].replace(f"p{oldp}",f"p{page}")
            log.append({"id":q['id'],"why":["出典"],"根拠":why,"before":before,"after":{"source":q['source'],"ref":q.get('ref')}})
    json.dump(d,open(os.path.join(dst,os.path.basename(f)),'w'),ensure_ascii=False,indent=1)
json.dump(log,open('../候補/出典_変更前後.json','w'),ensure_ascii=False,indent=1);print('変更',len(log))
