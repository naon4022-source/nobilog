# M1-C6-REVIEW の検算（π の係数）
from fractions import Fraction as F
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
# π をふくむ値は「π の係数」で表す
prism=lambda n:(n+2,3*n,2*n)       # 角柱 面・辺・頂点
pyramid=lambda n:(n+1,2*n,n+1)     # 角錐
euler=lambda f,e,v:f+v-e
cyl_v=lambda r,h:F(r)**2*h
cone_v=lambda r,h:F(1,3)*F(r)**2*h
sph_v=lambda r:F(4,3)*F(r)**3
sph_s=lambda r:4*F(r)**2
cone_side=lambda l,r:F(l)*r
angle=lambda r,l:F(360)*r/l

check('R1',prism(5),(7,15,10)); check('R1 オイラー',euler(*prism(5)),2)
check('R5',cyl_v(3,10),90); check('R6',F(1,3)*81*12,324); check('R7',cone_v(5,12),100)
check('R8',sph_s(9),324)
check('R9',(angle(6,15),cone_side(15,6)+36),(144,126))
check('R10',cyl_v(3,5),45)
check('本文 別の方法',(cone_side(6,2),F(36)*angle(2,6)/360),(12,12))
check('総まとめ',(F(1,3)*12*5,sph_v(2)),(20,F(32,3)))
# 誤答例
check('誤R6',81*12,972); check('誤R7',F(25)*12,300); check('誤R10',cyl_v(5,3),75); check('誤R9',cone_side(15,6),90)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
