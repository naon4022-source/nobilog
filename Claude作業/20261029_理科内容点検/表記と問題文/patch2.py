# 候補2：問題文の誤り2件・単位のない数の答え・数の答えの種類・区切りの書き方のゆれ。値・解説・出典は変えない。
import json,copy,sys,os,glob,re
PROMPT={
 "oto-50":("カタカナで答えよう。","漢字3字で答えよう。"),   # 答えは「超音波」（漢字）なのに「カタカナで」と書いてあった
 "hana-42":("マツの雌花と雄花に共通してないものを、2つ選ぼう","マツの雌花にも雄花にもないものを、2つ選ぼう"),  # 「共通してない」は胚珠（雌花だけにある）とも読める
}
UNITS={"kaseki-33":["億年","億年間"],"oto-7":["km/h","km"],"oto-8":["目盛り","目もり","めもり"],"tsuriai-4":["目盛り","目もり","めもり"],"tsuriai-30":["目盛り","目もり","めもり"]}
TONUM={"chikara-16":("300",["g","ｇ","グラム"]),"chikara-53":("1",["cm"]),"jishin-35":("0",["km"]),"futten-36":("2",["回"]),
 "tsuriai-24":("20",["N","ニュートン"]),"tsuriai-48":("6",["N","ニュートン"]),"tsuriai-49":("0",["N","ニュートン"]),"tsuriai-52":("150",["N","ニュートン"]),"tsuriai-54":("7",["N","ニュートン"]),"tsuriai-60":("2.4",["N","ニュートン"])}
ADD={"futten-56":["水のほうが4.2g重い","水の方が4.2g重い","水のほうが4.2 g重い","水の方が4.2 g重い"],
 "yure-35":["マグニチュード7の地震が約1000倍","M7の地震が約1000倍"],
 "tsuriai-56":["9N、下向き","9 N、下向き","下向き、9N","下向き、9 N","下向きで9N","下向きで9 N"]}
def seps(acc):
    out=list(acc)
    for v in acc:
        if "、" in v:
            for s in ("・"," ","　"):out.append(v.replace("、",s))
            parts=v.split("、")
            if len(parts)==2 and not re.search(r"[は・,]",v):out.append(parts[0]+"と"+parts[1])
    seen=[];[seen.append(x) for x in out if x not in seen];return seen
src,dst=sys.argv[1],sys.argv[2];os.makedirs(dst,exist_ok=True);log=[]
U='chikara chisou futten hana jishin joutai kaha kaseigan kaseki kazan lens musekitsui oto sekitsui tsuriai yure'.split()
for f in sorted(glob.glob(src+"/tokkun-science-1-*.json")):
    d=json.load(open(f));u=os.path.basename(f)[17:-5]
    for q in d["questions"]:
        k=q["id"].replace("tokkun-science-1-","");before={"prompt":q["prompt"],"answer":copy.deepcopy(q["answer"])};why=[]
        if k in PROMPT:
            a,b=PROMPT[k];assert q["prompt"].count(a)==1,k;q["prompt"]=q["prompt"].replace(a,b);why.append("問題文")
        if k in UNITS:q["answer"]["units"]=UNITS[k];why.append("単位")
        if k in TONUM:v,un=TONUM[k];assert v in q["answer"]["accepted"],k;q["answer"]={"kind":"number","value":v,"units":un};why.append("数の答え")
        if k in ADD:q["answer"]["accepted"]=q["answer"]["accepted"]+[x for x in ADD[k] if x not in q["answer"]["accepted"]];why.append("表記")
        if u in U and q["answer"]["kind"]=="exact":
            new=seps(q["answer"]["accepted"])
            if new!=q["answer"]["accepted"]:q["answer"]["accepted"]=new;why.append("区切り")
        if why:log.append({"id":q["id"],"why":why,"before":before,"after":{"prompt":q["prompt"],"answer":q["answer"]}})
    json.dump(d,open(os.path.join(dst,os.path.basename(f)),"w"),ensure_ascii=False,indent=1)
json.dump(log,open(os.path.join(dst,"..","表記と問題文_変更前後.json"),"w"),ensure_ascii=False,indent=1)
import collections;print("変更した問題",len(log),collections.Counter(w for x in log for w in x["why"]))
