# M1-C6-S3 の検算（π の係数）
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

check('例1基本',angle(3,18),60)
# 立方体の近道：展開図で A(0,6) から G(12,6 下) へ。x=6 での y
check('例1標準',F(6)*F(6,12),3)
check('例1応用',F(1000,600),F(5,3))
check('確認1-1',angle(4,24),60)
check('確認1-2',F(4)*F(4,8),2)
check('3:2:1',(cyl_v(3,6),sph_v(3),cone_v(3,6)),(54,36,18))
check('3:2:1 残り',cyl_v(3,6)-sph_v(3),cone_v(3,6))
check('振り返り1',angle(5,30),60)
check('振り返り2',F(1000,25),40)
check('練習1',angle(2,12),60); check('練習2',F(1000,100),10)
check('練習3',cone_v(4,6)/16,2); check('練習4',cyl_v(6,12)-sph_v(6),144)
check('チェック',(angle(F(3,2),9),F(200,50)),(60,4))
check('クイズ',F(500,100),5)
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
