# M1-C4-REVIEW の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def prop(x,y): return F(y)/F(x)
def inv(x,y): return F(x)*F(y)

check('R1(ウ)',F(24*2),48)
check('R3',prop(-3,15)*4,-20); check('R4',inv(-2,9),-18); check('R5',(-4+7,2-5),(3,-3))
check('R6',F(3,4)*-8,-6); check('R7',F(-28,4),-7); check('R8',prop(6,-4),F(-2,3))
a=prop(60,150); check('R9',(a,F(450)/a),(F(5,2),180))
check('R10',[F(x*10,2) for x in (0,4,10)],[0,20,50])
# 誤答例
check('誤R3',prop(3,15)*4,20); check('誤R9',F(450)*a,1125)
# 本の追加.json のクイズ
check('総まとめ1',prop(2,-10)*-3,15); check('総まとめ2',F(inv(3,4),-2),-6)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
