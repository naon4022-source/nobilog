# 保全：原本と候補をくらべ、変更前後の記録にある問題の prompt/answer 以外は1字も変わっていないことを確かめる
import json,glob,os,sys,hashlib
orig,cand=sys.argv[1],sys.argv[2];logs=sys.argv[3:]
allowed={}
for L in logs:
    for x in json.load(open(L)):
        w=x.get("why",["採点"]);allowed.setdefault(x["id"],set()).update((["answer"] if ("出典" not in w and w!=["問題文"]) or "問題文" in w and "answer" in x.get("after",{}) else [])+(["prompt"] if "問題文" in w else [])+(["source","ref"] if "出典" in w else []))
bad=0;n=0;changed=0
for f in sorted(glob.glob(orig+"/tokkun-science-1-*.json")):
    a=json.load(open(f));b=json.load(open(os.path.join(cand,os.path.basename(f))))
    if {k:v for k,v in a.items() if k!="questions"}!={k:v for k,v in b.items() if k!="questions"}:bad+=1;print("unit meta",f)
    if [q["id"] for q in a["questions"]]!=[q["id"] for q in b["questions"]]:bad+=1;print("ids",f)
    for qa,qb in zip(a["questions"],b["questions"]):
        n+=1;keys=set(qa)|set(qb)
        diff={k for k in keys if qa.get(k)!=qb.get(k)}
        if diff:changed+=1
        if diff-allowed.get(qa["id"],set()):bad+=1;print("unexpected",qa["id"],diff)
print("問題",n,"変わった問題",changed,"許可外の変更",bad);sys.exit(1 if bad else 0)
