# M1-C7-S1 の検算
from fractions import Fraction as F
from decimal import Decimal as D, ROUND_HALF_UP
ok=ng=0
def check(n,g,w):
    global ok,ng
    if g==w: ok+=1
    else: ng+=1; print("NG",n,g,w)
r2=lambda x:D(str(float(x))).quantize(D("0.01"),rounding=ROUND_HALF_UP)
A=[D(x) for x in "4.2 5.8 6.1 6.5 7.0 7.3 7.4 7.8 8.1 8.2 8.5 8.6 8.9 9.0 9.4 9.7 10.2 10.8 11.5 12.6".split()]
fA=[2,6,8,3,1]; fB=[1,4,8,9,3]; mids=[5,7,9,11,13]
cum=lambda f:[sum(f[:i+1]) for i in range(len(f))]
def median(xs):
    s=sorted(xs);n=len(s);return s[n//2] if n%2 else (s[n//2-1]+s[n//2])/2

check('A 度数',[sum(1 for x in A if lo<=x<lo+2) for lo in range(4,14,2)],fA)
check('A 範囲',max(A)-min(A),D('8.4'))
check('A 累積',cum(fA),[2,8,16,19,20])
check('A 平均',sum(A)/len(A),D('8.38'))
check('A 中央値',median(A),D('8.35'))
check('A 相対',[r2(F(f,20)) for f in fA],[D(x) for x in '0.10 0.30 0.40 0.15 0.05'.split()])
check('B 相対',[r2(F(f,25)) for f in fB],[D(x) for x in '0.04 0.16 0.32 0.36 0.12'.split()])
check('A 表平均',F(sum(m*f for m,f in zip(mids,fA)),20),F(17,2))
check('B 表平均',F(sum(m*f for m,f in zip(mids,fB)),25),F(243,25))
check('B 累積',cum(fB),[1,5,13,22,25])
check('OPEN 8m以上',(sum(fA[2:]),sum(fB[2:])),(12,20))
check('8m以上 割合',(F(12,20),F(20,25)),(F(3,5),F(4,5)))
check('10m以上',(r2(F(4,20)),r2(F(12,25))),(D('0.20'),D('0.48')))
check('例1基本',D('10.2')-D('7.6'),D('2.6'))
xs=[6,9,4,7,9,8,5]; check('例2基本',(sum(xs),median(xs)),(48,7))
check('確認1-1',35-18,17); check('確認1-2',3+7+10,20)
check('確認2-1',median([12,15,9,20,14,17]),F(29,2)); check('確認2-2',F(6,40),F(3,20))
check('確認3-1',F(5*2+15*5+25*3,10),16)
xs=[34,28,41,30,37]; check('振り返り1',(F(sum(xs),5),median(xs)),(34,34)); check('振り返り2',F(35,50),F(7,10))
check('練習298-1',D('7.3')-D('4.8'),D('2.5')); check('練習298-3',4+6+9+5,24)
xs=[3,7,5,9,4,7,6,7]; check('練習302-1',(max(set(xs),key=xs.count),median(xs)),(7,F(13,2)))
check('練習302-3',25*F(24,100),6); check('練習302-4',60*5-(52+58+63+71),56)
check('練習306-1',F(15*4+25*10+35*6,20),26); check('練習306-2',cum([4,10,6]),[4,14,20])
check('チェック',(F(20+25,2),F(12,50)),(F(45,2),F(6,25)))
print(f"検算 {ok}件 OK, NG {ng}件"); raise SystemExit(1 if ng else 0)
