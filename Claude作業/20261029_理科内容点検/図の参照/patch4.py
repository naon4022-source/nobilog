# 候補4（任意）：「図○」「表1」だけでは、アプリで図が見えず、どこを見ればよいか分からない。
# 写真で目視した教科書のページを「教科書p○の図○」として書きそえる。答え・選択肢・解説は変えない。
import json,os,glob,sys,re,copy
# 写真を開いて確かめた、図・表の番号 → 教科書のページ（単元ごと）
FIG={"hana":{"図1":22,"図5":24,"図6":24,"図12":27},
 "kaha":{"図13":28,"図16":30,"図17":31,"図19":32,"図21":34,"表1":33},
 "sekitsui":{"図22":37,"図23":38,"図27":40,"図28":"42〜43"},
 "kaseigan":{"図36":94,"図39":96,"図41":97,"図29":87},
 "kazan":{"図29":87},
 "chisou":{"図43":100,"図44":101,"図47":103,"図48":104,"図49":105},
 "kaseki":{"図56":"110〜111","図55":109,"図57":110,"図62":113,"表1":108},
 "yure":{"図18":78,"図20":79,"図26":82}}
src,dst=sys.argv[1],sys.argv[2];os.makedirs(dst,exist_ok=True);log=[];skip=[]
for f in sorted(glob.glob(src+'/tokkun-science-1-*.json')):
    u=os.path.basename(f)[17:-5];d=json.load(open(f))
    for q in d['questions']:
        m=re.search(r'(図\d+|表1)',q['prompt'])
        if not m:continue
        k=m.group(1)
        if u not in FIG or k not in FIG[u]:skip.append(q['id']+':'+k);continue
        p=FIG[u][k];before=q['prompt']
        q['prompt']=q['prompt'][:m.start()]+f"教科書p{p}の{k}"+q['prompt'][m.end():]
        log.append({"id":q['id'],"why":["問題文"],"根拠":f"{k} は教科書 p{p}（写真で目視）","before":{"prompt":before},"after":{"prompt":q['prompt']}})
    json.dump(d,open(os.path.join(dst,os.path.basename(f)),'w'),ensure_ascii=False,indent=1)
json.dump(log,open('../候補/図の参照_変更前後.json','w'),ensure_ascii=False,indent=1)
json.dump(skip,open('図の参照_書きそえなかった.json','w'),ensure_ascii=False,indent=1)
print('書きそえた',len(log),'書きそえなかった',len(skip),skip)
