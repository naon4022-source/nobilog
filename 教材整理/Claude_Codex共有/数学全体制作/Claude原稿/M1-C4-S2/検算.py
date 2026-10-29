# M1-C4-S2 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def prop(x,y): return F(y)/F(x)
def inv(x,y): return F(x)*F(y)

check('導入 階段',[16*x for x in range(1,6)],[16,32,48,64,80]); check('3.2m',F(320,16),20)
check('負の比例',-2*-3,6)
check('例1標準',[-4*x for x in (-2,-1,0,1,2,3)],[8,4,0,-4,-8,-12])
check('例1応用',{prop(x,y) for x,y in ((2,-3),(4,-6),(6,-9),(8,-12))},{F(-3,2)})
check('確認2-2',F(1,2)*-6,-3)
check('例2基本',prop(6,-18),-3); check('例2標準',(prop(-4,10),prop(-4,10)*8),(F(-5,2),-20))
check('確認3-1',prop(-2,14),-7); check('確認3-2',(-3+5,4-6),(2,-2))
check('例3標準',F(-3,5)*5,-3); check('例3応用',prop(-2,6),-3)
check('確認4-1',F(5,2)*2,5); check('確認4-2',prop(4,-10),F(-5,2))
check('振り返り1',prop(3,-12)*-5,20); check('振り返り2',F(-1,3)*3,-1)
check('練習175-1',F(6,2),3); check('練習175-2',-6*F(-1,2),3)
check('練習175-3',(prop(-2,10),prop(1,-5),prop(-2,10)*4),(-5,-5,-20))
check('練習179-1',prop(5,-35),-7); check('練習179-2',prop(6,4)*-9,-6)
check('練習179-4',F((3-(-2))*(1-(-3)),2),10)
check('練習183-3',prop(-4,-6),F(3,2)); check('練習183-4',prop(2,-8)*-3,12)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
