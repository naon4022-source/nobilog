# 数の答え135問を、問題文の条件から作問とは別の式で計算しなおす（Fraction で正確に）
import json,sys
from fractions import Fraction as F
from decimal import Decimal,ROUND_HALF_UP
def r(x,n):return F(Decimal(x.numerator)/Decimal(x.denominator)).limit_denominator(10**9) if False else F(str(Decimal(x.numerator)/Decimal(x.denominator)).split('E')[0]) if False else F(Decimal(str(float(x))).quantize(Decimal(1).scaleb(-n),rounding=ROUND_HALF_UP))
g=lambda grams:F(grams,100)          # 100 gで1 N
C={
# chikara
"chikara-1":F(25,10)/F(5,10)*2,"chikara-2":14-60*F(18-14,100-60),"chikara-3":(14-60*F(4,40))+150*F(4,40),
"chikara-4":F(10,4)*F(25,10),"chikara-5":(10/F(25,10))/(F(10,4)),"chikara-6":F(9)/F(15,10)*F(2,10)*100,
"chikara-7":r(F(3)/F(4,10),1),"chikara-8":(F(20-12)/4)*100,"chikara-9":g(120)*5,"chikara-10":F(10)*(g(80)/4),
"chikara-11":10+2*2,"chikara-12":2*6*100,"chikara-13":g(300)/6*3,"chikara-16":300,"chikara-31":F(35,100)*100,
"chikara-39":F(18,10)*3,"chikara-40":F(20-10,2),"chikara-41":F(9,10)-4*F(9,10)/6,"chikara-44":F(8,6-2),
"chikara-45":F(15-10,2-1),"chikara-46":15+F(15-10,2-1)*1,"chikara-47":F(215-170,10)/3,"chikara-48":17-5*(F(45,10)/3),
"chikara-49":g(200)*4,"chikara-50":g(600)/6*5,"chikara-51":F(42,10)/6,"chikara-53":F(6,2)/6*2,"chikara-54":6/(F(1,2)*1)*F(1,10)/1 if False else F(6)/(F(1,10)*F(1,2)/F(1,10))*F(1,10)/1 if False else F(6)/F(1,2)*F(1,10),
"chikara-64":g(1500),"chikara-65":F(24,10)/F(8,10),"chikara-69":(20-16)/F(25-15,10),"chikara-70":16-F(15,10)*4,
# chisou
"chisou-1":95-((100-10)-((100-10)-(110-25))*F(400,200)),"chisou-3":2,"chisou-46":F(7,10)*100/10,"chisou-47":F(140)/F(7,10),
"chisou-54":60-5,"chisou-57":36-F(40-36,200)*100,"chisou-69":300*1000,
# futten
"futten-6":357-(-39),"futten-24":20+F(79,100)*5,"futten-25":r((F(79,100)*5)/(20+F(79,100)*5)*100,1),"futten-36":2,"futten-57":r(F(42,10)/5,2),"futten-70":100-78,
# jishin（A:48km P8 S14 / B:96km P14 S26）
"jishin-2":F(96-48,14-8)*(17-(8-48/F(96-48,14-8))),"jishin-3":F(48)*9/(14-8),"jishin-5":F(90-30,10)/F(90-30,20),
"jishin-7":(40+8*10)*F(5,40),"jishin-8":4*30/F(6),"jishin-9":(12/(F(1,4)-F(1,6)))/6,"jishin-11":2/(F(1,3)-F(1,6)),
"jishin-18":F(60,3)-(F(20,5)+4),"jishin-19":3*(F(20,5)+4),"jishin-20":5*(F(20,5)+4),"jishin-28":(52+20)-60,"jishin-35":0,
"jishin-36":10,"jishin-47":20-8,"jishin-48":10/(F(1,4)-F(1,6)),"jishin-49":F(15,5),"jishin-51":F(120-48,12),"jishin-52":F(96-48,24-12),
"jishin-53":F(70,F(35,10))-F(70,7),"jishin-55":F(100,4)-(F(24,6)+4),"jishin-66":F(90,15),"jishin-67":4*25,
# joutai
"joutai-1":r(F(40,44),2),"joutai-2":r(F(8,10)*60/54,2),"joutai-3":F(36)/F(8,10),"joutai-4":r(F(100)/F(92,100),1),
"joutai-5":50-F(92,100)*50,"joutai-6":20,"joutai-23":10-4,"joutai-25":18,"joutai-41":30,"joutai-43":2,"joutai-50":F(81,100)*100/90,"joutai-54":F(90)/F(9,10),
# kaseigan / kaseki
"kaseigan-5":25+10+5,"kaseigan-43":30+55,"kaseigan-45":15+40,
"kaseki-7":r(60-F(3600)*F(7*10**6,46*10**8),1),"kaseki-33":46-38,
# lens
"lens-1":F(24,2),"lens-2":4*15,"lens-3":F(48,2)/2,"lens-4":2*8,"lens-5":2*10,"lens-6":15,"lens-44":2*20,"lens-61":4,"lens-64":12,
# musekitsui
"musekitsui-8":3*2,"musekitsui-11":F(6,2),
# oto
"oto-1":340*(F(30,10)-F(25,10)),"oto-2":340*F(1,2)+340*F(15,10)/2,"oto-3":F(85*2)/F(1,2),"oto-4":340*(6-3),"oto-5":r(F(1500,340),1),
"oto-6":r(F(1000,340),1),"oto-7":F(340*3600,1000),"oto-8":F(1,250)/F(1,1000),"oto-9":440*F(1,2),"oto-37":340*F(4,10),
"oto-38":F(510,340),"oto-39":F(3000*2,1500),"oto-40":340*F(3,10)/2,"oto-41":F(680,2),"oto-42":r(340*F(45,10)/1000,1),
"oto-44":F(1,200),"oto-46":1/(4*F(1,1000)),"oto-65":r(F(100,340),2),
# tsuriai
"tsuriai-1":g(3200)/10,"tsuriai-2":F(25,10)/F(5,10),"tsuriai-3":F(45,10)*100,"tsuriai-4":g(1200)/2,"tsuriai-5":8*F(3,6),
"tsuriai-12":F(34,10),"tsuriai-13":20,"tsuriai-16":g(600),"tsuriai-19":g(250),"tsuriai-20":3*100,"tsuriai-24":20,"tsuriai-30":F(3)/F(1,2),
"tsuriai-31":F(25,10)*4,"tsuriai-32":15/F(20,2),"tsuriai-44":g(2000),"tsuriai-48":6,"tsuriai-49":0,"tsuriai-52":150,"tsuriai-54":7,"tsuriai-60":F(24,10),"tsuriai-69":3*2*100,
# yure
"yure-15":1000*32,
}
dir=sys.argv[1];bad=0;n=0;seen=set()
import glob,os
for f in sorted(glob.glob(dir+"/tokkun-science-1-*.json")):
    for q in json.load(open(f))["questions"]:
        k=q["id"][17:]
        if q["answer"]["kind"]!="number" or k.split("-")[0] in("hansha","kitai","kubetsu","mitsudo","noudo","youkaido"):continue
        n+=1;seen.add(k)
        if k not in C:print("検算なし",k);bad+=1;continue
        if F(q["answer"]["value"])!=F(C[k]):print("不一致",k,q["answer"]["value"],float(C[k]));bad+=1
print("数の答え",n,"検算した",len(seen&set(C)),"不一致・なし",bad);sys.exit(1 if bad else 0)
