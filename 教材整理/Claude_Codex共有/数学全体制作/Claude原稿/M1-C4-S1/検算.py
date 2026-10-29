# M1-C4-S1 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def prop(x,y): return F(y)/F(x)
def inv(x,y): return F(x)*F(y)

check('例1基本',[(20-2*x)//2 for x in (3,6)],[7,4]); check('例1基本 式',[10-x for x in (3,6)],[7,4])
check('例1標準',[60*x for x in range(1,6)],[60,120,180,240,300])
check('振り返り1',3**3,27)
check('練習1(イ)',F(12,4),3)
check('練習3',(12*16-12*15,12*15),(12,180))
check('練習4',F(30)/F('1.5'),20)
# 駐車場：30分ごとに100円（P169の例）
fee=lambda m: 100*(-(-m//30))
check('駐車場',[fee(m) for m in (10,45,60,61)],[100,200,200,300])
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
