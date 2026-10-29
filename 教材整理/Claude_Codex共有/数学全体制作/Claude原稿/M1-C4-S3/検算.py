# M1-C4-S3 の検算
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
def prop(x,y): return F(y)/F(x)
def inv(x,y): return F(x)*F(y)

check('導入 クッキー',{inv(x,F(24,x)) for x in (1,2,3,4,6,8,12,24)},{24})
check('例1基本',inv(3,6),18); check('例1標準',inv(3,-8),-24)
check('例1応用',(F(-24,-6),F(-24,9)/F(-8)),(4,F(1,3)))
check('確認5-2',inv(-5,6),-30)
check('例2基本',[(x,10//x) for x in range(1,11) if 10%x==0],[(1,10),(2,5),(5,2),(10,1)])
check('例2標準',F(-8,4),-2); check('例2応用',(inv(-3,-5),F(15,5)),(15,3))
check('確認6-1',F(18,6),3); check('確認6-2',inv(2,-9),-18)
check('歯車',(24*10,F(240,12)),(240,20))
check('振り返り1',F(inv(4,-6),-3),8)
check('振り返り2',sum(1 for x in range(1,21) if 20%x==0),6)
check('練習190-2',F(inv(6,-4),-8),3); check('練習190-3',(inv(2,15),inv(3,10),F(30,-5)),(30,30,-6))
check('練習194-1',F(6,-2),-3); check('練習194-2',inv(4,-5),-20)
check('練習194-3',[(x,-16//x) for x in range(1,17) if 16%x==0],[(1,-16),(2,-8),(4,-4),(8,-2),(16,-1)])
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
