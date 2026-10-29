# M1-APP1 の検算
from fractions import Fraction as F
from math import gcd
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else F(s[n//2-1]+s[n//2],2)

check('例1',(F(3600,12),F(3600,12)*60),(300,18000)); check('例2',F(2400,80),30)
check('確認1',F(240,3),80); check('確認2',45*F(4,3),60); check('確認3',F(6000,70+50),50)
check('例3',F(52,40),F(13,10)); check('例4',3000*F(75,100),2250)
check('確認4',F(72,480),F(15,100)); check('確認5',84/F(35,100),240)
check('4.68÷1.2',F(468,100)/F(12,10),F(39,10))
check('例5',(F(2,3)+F(3,8),F(5,6)/F(10,9),F(6,10)*F(5,12)),(F(25,24),F(3,4),F(1,4)))
check('確認6',(F(315,100)/F(45,100),F(7,10)-F(1,4),F(4,9)/F(2,3)*F(3,2)),(7,F(9,20),1))
check('確認7',F(24,10)/F(8,10),3)
x=[3,5,2,7,5,4,6,8]; check('例6',(F(sum(x),8),median(x),max(set(x),key=x.count)),(5,5,5))
x=[12,8,15,20,8,10,25,8,14]; check('確認8',(F(sum(x),9),median(x),max(set(x),key=x.count)),(F(120,9),12,8))
check('振り返り',(F(1500,20),F(2,5)/F(4,10)),(75,1))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
