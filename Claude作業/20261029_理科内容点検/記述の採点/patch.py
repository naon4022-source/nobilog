# 記述問題（rubric）の採点条件だけを直す候補。問題文・解説・出典・ID・ほかの欄は変えない。
import json,copy,sys
P={
"chikara-37":{"allowNegation":True,"criteria2":["同じ","おなじ","等し","変わらない","かわらない"],"reject":[["より大き","より小さ","2倍","倍の力"]]},
"chisou-5":{"allowNegation":True,"criteria2":["運ばれてこな","運ばれな","はこばれてこな","届かな","とどかな","来な","こな","少な","すくな"]},
"chisou-7":{"minChars":20},
"futten-4":{"allowNegation":True,"criteria1":["種類","しゅるい","物質ごと","物質によって"],"reject":[["によって変わるから","で変わるから","によって変わる。","量によって決ま","量で決ま","質量によって決ま","体積によって決ま"]]},
"futten-10":{"allowNegation":True,"criteria2":["低い","ひくい","下","届かな","とどかな","達しな","上がらな","あがらな"],"reject":[["より高い","より高く","高いから"]]},
"futten-19":{"allowNegation":True,"reject":[["エタノールが多","エタノールを多く","エタノールの方が多","エタノールのほうが多","水がほとんど","水が少"]]},
"jishin-12":{"allowNegation":True,"reject":[["同時に届く"]]},
"jishin-13":{"criteria2":["近い","ちかい","すぐ","近か","ちかか","近く","ちかく"]},
"joutai-7":{"reject":[["体積が小さく","体積がへ","体積が減","体積は小さく"]]},
"joutai-8":{"reject":[["水の密度が氷より小","水の密度のほうが小","水の密度の方が小","水のほうが密度が小","水の方が密度が小","氷の密度が水より大","氷の密度のほうが大","氷の密度の方が大"]]},
"joutai-26":{"allowNegation":True,"reject":[["とけはじめ"]]},
"joutai-29":{"allowNegation":True,"criteria3":["気体","蒸発","沸騰し終わ","なくなるまで"]},
"joutai-33":{"reject":[["気体にする","気体にかえ","気体にもど"]]},
"kaseki-6":{"reject":[["ビカリアは古生代","サンヨウチュウは新生代","ビカリアは古い","サンヨウチュウは新しい"]]},
"lens-41":{"allowNegation":True,"reject":[["1点に集まるから","一点に集まるから","１点に集まるから","光が集まるから"]]},
"lens-50":{"allowNegation":True,"criteria2":["小さ","ちいさ","上下","左右","さかさま","実像"],"reject":[["同じ向きに見え","同じ向きのまま","同じ向きで大きく"]]},
"lens-52":{"reject":[["物体をレンズから遠ざけ","物体を遠ざけ","スクリーンをレンズに近づけ","スクリーンを近づけ"]]},
"musekitsui-1":{"allowNegation":True,"required":[["2つ","２つ","頭胸部"],["4対","４対"]],"reject":[["クモは体が3つ","クモの体は3つ","クモのあしは3対","クモはあしが3対","クモは昆虫類である"]]},
"oto-34":{"criteria3add":["おそ","遅"],"reject":[["音の速さは光の速さより速","音のほうが速","音の方が速","音が光より速","音は光より速","光のほうがおそ","光の方がおそ","光が音よりおそ","光は音よりおそ","光のほうが遅","光の方が遅","光が音より遅","光は音より遅","光のほうが音よりおそ","光の方が音よりおそ","光のほうが音より遅","光の方が音より遅","音のほうが光より速","音の方が光より速"]]},
"oto-64":{"reject":[["音のほうが速","音の方が速","音が光より速","音は光より速","光のほうがおそ","光の方がおそ","光が音よりおそ","光は音よりおそ","光のほうが遅","光の方が遅","光が音より遅","光は音より遅","光のほうが音よりおそ","光の方が音よりおそ","光のほうが音より遅","光の方が音より遅","音のほうが光より速","音の方が光より速"]]},
"yure-2":{"criteria2":["近い","ちかい","浅い","あさい","近か","ちかか","浅か","あさか","近く","浅く"]},
"yure-8":{"allowNegation":True,"reject":[["なくなり","二度と"]]},
}
def apply(a,p):
    a=copy.deepcopy(a)
    for k,v in p.items():
        if k in("allowNegation","minChars","required"):a[k]=v
        elif k=="reject":a["reject"]=v
        elif k=="criteria1":a["criteria"][0]["any"]=v
        elif k=="criteria2":a["criteria"][1]["any"]=v
        elif k=="criteria3":a["criteria"][2]["any"]=v
        elif k=="criteria3add":
            # oto-34 は3つ目の観点（速さ）に「おそ・遅」を足す
            c=[c for c in a["criteria"] if "速" in c["any"]][0];c["any"]=c["any"]+[x for x in v if x not in c["any"]]
    return a
if __name__=="__main__":
    src,dst=sys.argv[1],sys.argv[2];import os,glob
    os.makedirs(dst,exist_ok=True);log=[]
    for f in sorted(glob.glob(src+"/tokkun-science-1-*.json")):
        d=json.load(open(f))
        for q in d["questions"]:
            k=q["id"].replace("tokkun-science-1-","")
            if k in P:
                before=q["answer"];q["answer"]=apply(before,P[k]);log.append({"id":q["id"],"before":before,"after":q["answer"]})
        json.dump(d,open(os.path.join(dst,os.path.basename(f)),"w"),ensure_ascii=False,indent=1)
    json.dump(log,open(os.path.join(dst,"..","記述の採点_変更前後.json"),"w"),ensure_ascii=False,indent=1)
    print("変更した問題",len(log))
