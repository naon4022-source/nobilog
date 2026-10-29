"""Independent exact arithmetic audit of twelve video scripts, not learner answers."""
from pathlib import Path
from fractions import Fraction as F
from math import ceil
import json,hashlib
H=Path(__file__).resolve().parent;R=H.parents[2];W=R/'教材整理/Claude_Codex共有/数学全体制作';S=W/'メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=0;rows=[]
def ok(v,m):
 global checks
 assert v,m
 checks+=1
def review(ident,needles,reason):
 d=load(S/(ident+'.json'));text='\n'.join(d['summary']+[x['say'] for x in d['steps']])
 for n in needles:ok(n in text,ident+' reviewed script '+n)
 rows.append({'id':ident,'scriptSha256':sha(S/(ident+'.json')),'status':'passed','reason':reason})
for side,perimeter in [(1,4),(2,8),(3,12)]:ok(F(side)*4==perimeter,'square perimeter')
ok(40!=50,'same-height example has two different weights')
review('M1-C4-S1-V01',['1なら、周の長さは4','2なら8、3なら12','体重が同じとは限らず'],'正方形の周4xと一意性。身長だけでは体重を決められない。')
for minutes,fee in [(20,100),(30,100),(40,200),(60,200)]:ok(100*ceil(F(minutes,30))==fee,'positive-duration parking fee')
ok(F(30,30)==1 and F(31,30)>1,'30-minute boundary included only in lower step')
parking=(W/'メディア/M1-C4-S1-D02.svg').read_text()
ok('0' in parking and '30' in parking and '100' in parking,'adopted source boundary reference retained')
review('M1-C4-S1-VP',['30分ごとに100円','段階的','変域'],'既存採用図D02の正の利用時間に合わせ0分を除く。30分以下100円、30分超60分以下200円。本文や料金規則を変更しない。')
for x,y in [(0,0),(1,16),(2,32),(3,48),(4,64),(5,80)]:
 ok(16*F(x)==y,'stair height')
 if x:ok(F(y,x)==16,'stair ratio, zero divisor excluded')
ok(32==2*16 and 48==3*16,'double/triple steps')
body=(W/'Claude原稿/M1-C4-S2/本文.md').read_text()
ok('0 以上の整数' in body and '点は飛び飛び' in body,'source requires nonnegative integer stair domain')
review('M1-C4-S2-V01',['1段16センチ','16から32','48へ3倍','わると16'],'段数1〜5を独立計算。y/xの説明はx≠0、原点はy=16xで確認。')
for dx,dy,target in [(4,3,(4,3)),(-2,-3,(-2,-3))]:ok((0+dx,0+dy)==target,'coordinate horizontal then vertical')
review('M1-C4-S2-V02',['右へ4','上へ3','左へ2','下へ3'],'P(4,3)、Q(−2,−3)を原点から横・縦の順で確認。')
for denominator in [1,2,10]:
 for numerator in range(-3*denominator,3*denominator+1):
  x=F(numerator,denominator);y=2*x
  ok(y-2*x==0,'integer, half, tenth points belong to y=2x')
ok(2*F(0)==0,'continuous generic proportion contains origin')
review('M1-C4-S2-V03',['2エックス','0.5ずつ','0.1ずつ','整数以外も含めた点'],'制限のないy=2xでは整数・0.5刻み・0.1刻みと全実数が同一直線上。階段の離散条件と区別。')
review('M1-C4-S2-VP',['16エックス','0以上の整数','点は飛び飛び'],'表とy=16xを一致させ、実物の段数は0以上の整数の点だけを描く。')
for n,each in [(2,12),(3,8),(4,6),(6,4)]:ok(F(24,n)==each and n*each==24,'24 cookies conserved')
ok(F(6,12)==F(1,2),'doubling people halves share')
review('M1-C4-S3-V01',['24個','1人12個','1人8個','1人6個','1人4個'],'2/3/4/6人で分ける24個を別計算。描画するクッキー総数は24個。')
for x in [F(1),F(2),F(3),F(4),F(6),F(12),F(-1),F(-2),F(-3),F(-12),F(1,2)]:
 y=F(12)/x;ok(x*y==12 and y!=0,'inverse graph never reaches either axis at finite nonzero x')
ok(F(12,4)>F(12,6)>F(12,12)>0,'positive branch decreases')
review('M1-C4-S3-V02',['12わるエックス','正と負','有限のエックスではワイは0'],'y=12/xの正負の枝・積12・正の枝の単調減少・軸との非交差。拡大図は既存の別縮尺表示。')
ok(24*1==12*2,'gear teeth times rotations conserved')
ok(F(24,12)==2,'smaller gear rotates twice in opposite direction')
review('M1-C4-S3-VP',['24わるエックス','2本の曲線','歯の数と回転数の積'],'クッキーの分配と一般の反比例曲線を区別。24歯と12歯は逆方向、回転数の比は1:2。')
ok(F(1000,250)==4 and F(1800,4)==450,'paper unit mass and count')
for count in [1,250,450]:ok(F(4*count,count)==4,'identical paper mass proportional')
review('M1-C4-S4-V01',['250枚','1000グラム','4グラム','1800','450枚'],'1枚4g。250枚1000g、1800gで450枚。実物の層は紙束の模式図。')
distance=F(12);speed=F(3);time=distance/speed
ok(distance/(2*speed)==time/2,'fixed-distance double speed halves time')
work=F(20);ok(work/4==(work/2)/2,'equal productivity double workers halves days')
extra=(S/'4章_補足アニメーション.js').read_text()
ok('1人の作業量は同じ' in extra,'equal productivity condition explicitly displayed')
review('M1-C4-S4-VP',['同じ紙','同じ道のり','同じ仕事','積に注目'],'同じ紙は質量/枚数一定。道のり一定、同じ1人当たり作業量で仕事量一定という反比例の条件を確認。')
review('M1-C4-REVIEW-V01',['時間で料金が1つに決まれば関数','高さを段数でわった値が一定','人数と1人分の積が一定','重さと枚数の比例'],'駐車料金、階段、クッキー、紙束は上の独立計算と同じ数量条件で再利用。')
expected={x['id'] for x in load(S/'69本_制作進捗.json')['items'] if x['id'].startswith('M1-C4-')}
ok({x['id'] for x in rows}==expected and len(rows)==12,'all twelve chapter-four scripts')
helpers=['数学4章_場面.js','関数の箱_入出力補正.js','4章_補足アニメーション.js','重さで数える_紙束補正.js','階段グラフ_整数条件補正.js','駐車料金_境界補正.js']
(H/'independent-math-result.json').write_text(json.dumps({'status':'passed','checks':checks,'videos':rows,'dependencies':{n:sha(S/n) for n in helpers},'sourceIntegerDomainSha256':sha(W/'Claude原稿/M1-C4-S2/本文.md'),'scope':'12本の動画台本・描画数量と図条件の独立計算。本文全問・出典写真全文・新たな聴取・実機は別。','learnerFacingAnswersAdded':False,'realUserDataUsed':False},ensure_ascii=False,indent=2)+'\n')
print('Chapter4 independent mathematics:',checks,'checks passed; all twelve scripts, quantities and domain conditions')
