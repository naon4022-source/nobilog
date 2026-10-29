# M1-C6-S2 の検算（π の係数）
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

check('例5基本',F(5*6,2)*10,150)
check('例5標準',(cone_v(3,8),cyl_v(3,8)),(24,72))
check('例5応用',sph_v(9),972)
check('確認5-1',F(1,3)*36*10,120)
check('確認5-2',cyl_v(4,7),112)
check('例6基本',(6*(4+5+4+5)+2*20,2*(20+30+24)),(148,148))
check('例6標準',8*2*5+2*25,130)
check('例6応用',F(8*7,2)*4+64,176)
check('確認6-1',(9*2*2,9*2*2+2*4),(36,44))
check('確認6-2',10*(3+4+5)+2*6,132)
check('例7基本',(cone_side(10,4),F(10)**2*angle(4,10)/360),(40,40))
check('例7標準',cone_side(10,4)+16,56)
check('例7応用',(sph_s(5),sph_v(5)),(100,F(500,3)))
check('確認7-1',cone_side(8,3)+9,33)
check('確認7-2',sph_s(5)/F(5)**2,4)
check('円錐から円柱',(cone_v(6,9),cone_v(6,9)/36),(108,3))
check('振り返り1',cone_v(6,5),60)
check('振り返り2',cone_side(13,5)+25,90)
check('練習273-1',(24*5,F(24*5,3)),(120,40)); check('練習273-2',cone_v(6,10),120)
check('練習273-3',sph_v(3),36); check('練習273-4',sph_v(3)/9,4)
check('練習277-1',6*25,150); check('練習277-2',7*2*3+2*9,60)
check('練習277-3',F(6*10,2)*4+36,156); check('練習277-4',F(62,2)-6,25)
check('練習281-1',sph_s(2),16); check('練習281-2',(cone_side(12,5),cone_side(12,5)+25),(60,85))
check('練習281-3',(angle(2,8),cone_side(8,2)),(90,16)); check('練習281-4',sph_s(3)/2+9,27)
check('チェック',(cone_v(3,4),sph_s(1)),(12,4))
check('豆知識 半径3',(sph_v(3),sph_s(3)),(36,36))
check('クイズ',(6*9,2*1*10,cone_side(5,2),sph_s(3)),(54,20,10,36))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
