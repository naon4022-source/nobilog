# M1-C5-S1 の検算
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

check('例1応用',35+50,85)
check('振り返り2',180-118,62)
check('練習1 直線の本数',3*2//2,3)
check('練習3',180-40-90,50)
check('チェック2',180-65,115)
check('豆知識 4点',4*3//2,6)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
