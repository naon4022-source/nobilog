# M1-C5-S2 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
# π をふくむ値は「π の係数」で表す
def circ(r): return 2*F(r)
def area(r): return F(r)**2
def arc(r,a): return 2*F(r)*F(a,360)
def sec(r,a): return F(r)**2*F(a,360)
def line_hit(h1,h2,w):
    """ℓ から上へ h1 の A、上へ h2 の B（横の差 w）。寄る点の、A の真下からの横の位置"""
    return F(w)*F(h1,h1+h2)

mv=lambda p,dx,dy:(p[0]+dx,p[1]+dy)
check('例1基本',[mv(p,6,1) for p in [(2,1),(5,1),(2,4)]],[(8,2),(11,2),(8,5)])
check('例1基本 辺',(5-2,11-8),(3,3))
check('例1応用',F(10,2),5)
check('確認2-2',mv((3,2),4,-1),(7,1))
check('例2基本',F(9,2),F(9,2))
check('例2標準',F(84,2),42)
check('確認3-1',27*2,54)
check('例3基本',F(8*5,2),20)
check('例3応用',90+45,135)
check('確認4-1',(60+15,45+30),(75,75))
check('確認4-2',(F(6*8,2),F(2*24,10)),(24,F(24,5)))
check('練習218-2',(mv((1,5),7,-3),mv((4,6),7,-3)),((8,2),(11,3)))
check('練習218-3',90+90,180)
# 練習218-4：ℓ を 0、m を 4 として、点 −1 を ℓ→m の順に折り返す
x=-1; x=-x; x=2*4-x; check('練習218-4',x-(-1),8)
check('練習222-2',F(146,2),73)
check('練習222-3',F(12,2)+F(12,4),9)
check('練習226-3',F(35*2,10),7)
check('練習226-4',(90+60+15,180-15),(165,165))
check('振り返り',(4,120,7),(4,120,7))
check('チェック1',F(118,2),59)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
