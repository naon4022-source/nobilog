# M1-C5-S3 の検算
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

check('例1基本',line_hit(2,4,9),3)
check('例1基本 格子',[(3*k,2-2*k) for k in range(4)][-1],(9,-4))
check('確認5-1',line_hit(3,3,8),4)
check('振り返り1',line_hit(1,2,6),2)
check('練習2',line_hit(2,6,12),3)
check('チェック1',line_hit(4,4,10),5)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
