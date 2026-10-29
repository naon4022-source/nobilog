# M1-C5-REVIEW の検算（π の係数）
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

check('R4',F(7,2)*2,7); check('R5',38*2,76); check('R6',(60+45,90+15),(105,105))
check('R7',180-90-47,43); check('R8',(circ(10),area(10)),(20,100))
check('R9',(arc(6,100),sec(6,100)),(F(10,3),10))
check('R10',F(24)/area(12)*360,60)
check('本文 別の方法',(sec(8,45),F(1,2)*arc(8,45)*8),(8,8))
check('総まとめ',(area(6),F(72,360)),(36,F(1,5)))
# 誤答例
check('誤R7',180-47,133); check('誤R8',(circ(5),area(5)),(10,25))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
