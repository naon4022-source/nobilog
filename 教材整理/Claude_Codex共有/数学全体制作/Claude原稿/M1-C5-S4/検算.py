# M1-C5-S4 の検算（π の係数）
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

check('導入',F(60,360),F(1,6))
check('例1基本',7*2,14)
check('例1標準',180-90-32,58)
check('例1応用',5*F(120,40),15)
check('確認6-2',6*F(150,30),30)
check('例2基本',(circ(4),area(4)),(8,16))
check('例2標準',(arc(12,150),sec(12,150),F(1,2)*arc(12,150)*12),(10,60,60))
a=F(4)/circ(10)*360; check('例2応用',(a,sec(10,a),F(1,2)*4*10),(72,20,20))
check('確認7-1',(arc(6,210),sec(6,210)),(7,21))
check('確認7-2',F(6)/(2*F(120,360)),9)
check('半円',(arc(5,180),sec(5,180)),(5,F(25,2)))
check('振り返り1',(circ(7),area(7)),(14,49))
check('振り返り2',(arc(9,80),sec(9,80)),(4,18))
check('練習240-2',180-90-24,66); check('練習240-3',45*F(12,3),180)
check('練習244-1',(circ(8),area(8)),(16,64))
check('練習244-2',(arc(8,270),sec(8,270)),(12,48))
a=F(5)/circ(15)*360; check('練習244-3',(a,sec(15,a),F(1,2)*5*15),(60,F(75,2),F(75,2)))
check('練習244-4 弧',arc(6,90),3)
check('チェック',(circ(3),area(3),arc(4,90)),(6,9,2))
check('豆知識 2倍',(area(2)/area(1),circ(2)/circ(1)),(4,2))
check('クイズ 半円',arc(2,180),2)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
