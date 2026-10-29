# M1-C7-REVIEW の検算
from fractions import Fraction as F
from decimal import Decimal as D, ROUND_HALF_UP
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
r2=lambda x:D(str(float(x))).quantize(D("0.01"),rounding=ROUND_HALF_UP)
A=[D(x) for x in "4.2 5.8 6.1 6.5 7.0 7.3 7.4 7.8 8.1 8.2 8.5 8.6 8.9 9.0 9.4 9.7 10.2 10.8 11.5 12.6".split()]
fA=[2,6,8,3,1]; fB=[1,4,8,9,3]; mids=[5,7,9,11,13]
cum=lambda f:[sum(f[:i+1]) for i in range(len(f))]
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else (s[n//2-1]+s[n//2])/2

xs=[16,9,22,13,7,19,11]; check('R1',(max(xs),min(xs),max(xs)-min(xs)),(22,7,15)); check('R2',median(xs),13)
check('R3',F(14,40),F(35,100)); check('R4',F(3+9+12,40),F(3,5))
f=[3,8,6,3]; m=[2,6,10,14]; check('R5',F(sum(a*b for a,b in zip(f,m)),sum(f)),F(39,5))
check('R6',m[f.index(max(f))],6); check('R7',cum(f),[3,11,17,20])
check('R8',F(620,1000),F(62,100)); check('R9',F(62,100)*350,217)
check('R10',(F(1056,2400),F(846,1800)),(F(44,100),F(47,100)))
check('本文 別の方法',(F(8,20),F(2,20)+F(6,20)),(F(2,5),F(2,5)))
check('総まとめ',(median([3,8,5,10,4]),F(300,1200),F(10,40),F(6,10)*50),(5,F(1,4),F(1,4),30))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
