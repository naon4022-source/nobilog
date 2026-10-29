# M1-C4-S4 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def prop(x,y): return F(y)/F(x)
def inv(x,y): return F(x)*F(y)

a=prop(250,1000); check('例1基本',(a,F(1800)/a),(4,450))
check('例1標準',(75*16,F(1200,60)),(1200,20)); check('例1応用',(4*3,F(12,6)),(12,2))
check('確認8-1',(F(120,40),F(900)/3),(3,300)); check('確認8-2',F(30*8,20),12)
check('2人くらべ',(100*6-80*6,F(1200,100),F(1200,80)),(120,12,15))
check('振り返り2',F(36,9),4)
check('練習1',(F(360,100),F(360,100)*250),(F(18,5),900))
check('練習2',F(5*6,10),3); check('練習3',F(36*10,24),15); check('練習4',F(300,90-70),15)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
