# M1-APP3 の検算
from fractions import Fraction as F
from math import gcd
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else F(s[n//2-1]+s[n//2],2)

def at(day,h,d):  # 日・時刻（時間の小数）に時差 d をたす
    t=day*24+h+d; return (int(t//24),t%24)
check('時差1',at(15,18,-7),(15,11)); check('時差2',at(15,18,-19),(14,23)); check('時差3',-2-(-19),17)
check('時差4',at(10,9,F(-35,10)-(-2)),(10,F(15,2)))
check('時差 振り返り',at(20,5,-19),(19,10))
check('パン1',F(18000,120),150); check('パン2',200-F(21600,120),20)
check('パン3',(F(23400-170*120,30),120-100),(100,20))
check('パン4',F(240*120-26400,120*3-300),40); check('パン4 確かめ',300*40+120*(240-120),26400)
check('コピー',(F(300,10-4),(10*30,300+4*30),(10*80,300+4*80)),(50,(300,420),(800,620)))
check('面積1 円',(4*F(1,4)*25,100),(25,100))
check('面積2',2*(F(36,4)-F(36,2)),(2*(9-18)))   # π の係数 9×2＝18、定数 −18×2＝−36
check('面積2 係数',(2*F(36,4),-2*F(36,2)),(18,-36))
poly=[('4',4,3,3),('6',6,4,3),('8',8,3,4),('12',12,5,3),('20',20,3,5)]
for n,f,k,v in poly: check('正多面体'+n,f+F(f*k,v)-F(f*k,2),2)
check('正二十面体',(F(20*3,2),F(20*3,5)),(30,12))
a=[3,8,11,7,2,0]; b=[0,3,7,11,8,2]; mid=[27,29,31,33,35,37]
check('気温 計',(sum(a),sum(b)),(31,31))
check('気温 最頻',(mid[a.index(max(a))],mid[b.index(max(b))]),(31,33))
check('気温 平均',(sum(x*y for x,y in zip(a,mid)),sum(x*y for x,y in zip(b,mid))),(955,1021))
check('気温 平均 小数',(round(955/31,1),round(1021/31,1)),(30.8,32.9))
check('気温 34以上',(round(2/31,2),round(10/31,2)),(0.06,0.32))
lcm=lambda a,b:a*b//gcd(a,b)
check('タイル',(gcd(48,72),(48//24)*(72//24)),(24,6)); check('最小公倍数',lcm(48,72),144)
check('バス',lcm(12,18),36); check('36と90',(gcd(36,90),lcm(36,90)),(18,180)); check('チャイム',lcm(15,20),60)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
