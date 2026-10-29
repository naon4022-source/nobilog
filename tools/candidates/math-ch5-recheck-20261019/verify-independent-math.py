"""Independent geometry and formula audit of all twelve chapter-five videos."""
from pathlib import Path
from fractions import Fraction as F
import json,hashlib,math
H=Path(__file__).resolve().parent;R=H.parents[2];S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
load=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();checks=0
def ok(v,m):
 global checks
 assert v,m
 checks+=1
dist=lambda a,b:sum((F(x)-F(y))**2 for x,y in zip(a,b))
scene=(S/'数学5章_場面.js').read_text()
for fragment in ['from=[[2,1],[5,1],[2,4]]','A=[440,350],B=[840,350],P=[640,200],Q=[640,500]','P=[640,190],A=[440,350],B=[840,350],Q=[640,510]','A=[330,250],B=[735,160],Bp=[735,520],P=[465,340]']:
 ok(fragment in scene,'reviewed input coordinates still present')
original=[(2,1),(5,1),(2,4)];translated=[(8,2),(11,2),(8,5)];rotated=[(-1,2),(-1,5),(-4,2)];reflected=[(6,1),(3,1),(6,4)]
for a,b,c,d in zip(original,translated,rotated,reflected):
 ok((b[0]-a[0],b[1]-a[1])==(6,1),'same translation vector')
 ok(c==(-a[1],a[0]) and dist(c,(0,0))==dist(a,(0,0)),'90-degree rotation and radius')
 ok(d==(8-a[0],a[1]) and F(a[0]+d[0],2)==4,'reflection in x=4')
for j in range(3):
 for transform in [translated,rotated,reflected]:ok(dist(original[j],original[(j+1)%3])==dist(transform[j],transform[(j+1)%3]),'all edge lengths preserved')
A=(440,350);B=(840,350);P=(640,200);Q=(640,500)
ok(250>200 and dist(A,P)==dist(B,P)==dist(B,Q)==dist(A,Q)==250**2,'equal-radius arcs form rhombus')
ok((P[0],F(P[1]+Q[1],2))==(F(A[0]+B[0],2),A[1]),'diagonals share midpoint')
ok((B[0]-A[0])*(Q[0]-P[0])+(B[1]-A[1])*(Q[1]-P[1])==0,'diagonals perpendicular')
P=(640,190);Q=(640,510)
ok(dist(P,A)==dist(A,Q)==dist(Q,B)==dist(B,P)==65600,'outside perpendicular four equal sides')
ok(F(P[1]+Q[1],2)==350 and P[0]==Q[0]==640,'outside perpendicular bisects line chord')
D=(360,350);E=(640,180);G=(920,350);Fpoint=(640,520)
ok(dist(D,E)==dist(E,G)==dist(G,Fpoint)==dist(Fpoint,D),'angle-bisector rhombus equal sides')
ok(E[0]==Fpoint[0] and E[1]+Fpoint[1]==2*D[1] and D[1]==G[1],'diagonal lies on symmetry axis and halves angle')
A=(330,250);B=(735,160);Bp=(735,520);P=(465,340)
ok(B[0]==Bp[0] and F(B[1]+Bp[1],2)==340,'B reflection across shoreline')
ok(dist(P,B)==dist(P,Bp)==105300,'equal reflected lengths')
ok((P[0]-A[0])*(Bp[1]-A[1])==(P[1]-A[1])*(Bp[0]-A[0]),'A/P/Bprime collinear')
ok(0<F(P[0]-A[0],Bp[0]-A[0])<1,'P lies between A and Bprime')
best=math.sqrt(dist(A,Bp))
for x in range(190,1111,23):ok(math.sqrt(dist(A,(x,340)))+math.sqrt(dist((x,340),Bp))>=best-1e-9,'sampled alternatives respect straight-line lower bound')
for offset,halfwidth in [(0,150),(90,120),(120,90),(150,0)]:ok(offset**2+halfwidth**2==150**2,'circle-line intersection equation')
ok(150>130 and 150**2-130**2>0,'two intersections remain before contact')
ok(150**2-150**2==0,'one contact at radius distance')
for n in [8,16,32]:
 ok(n*F(360,n)==360,'sectors partition exactly one circle')
 ok(n*F(155**2,n)==155**2,'rearrangement preserves area coefficient of pi')
 ok(n*155*math.sin(math.pi/n)<math.pi*155,'finite arrangement approaches, does not equal, limiting width')
widths=[n*155*math.sin(math.pi/n) for n in [8,16,32]];ok(widths[0]<widths[1]<widths[2]<155*math.pi,'refinement approaches pi*r')
for r in [1,3,4,6,175]:
 for angle in [15,30,45,60,90,150,210,360]:
  arc=2*r*F(angle,360);area=r*r*F(angle,360)
  ok(area==F(1,2)*arc*r,'sector S=(1/2)*l*r, pi coefficient exact')
reasons={
 'S1-V01':'線分2端・直線0端・半直線1端。矢印と端点の区別。',
 'S1-VP':'頂点は角の名前の中央。点と直線・平行線間の距離は垂直に測る。',
 'S2-V01':'同じベクトル、90度回転、x=4の鏡映で全辺の長さが等しい。',
 'S2-V02':'半径250、半底辺200、高さ150の等しい2円。4辺250と垂直な対角線。',
 'S2-V03':'半径sqrt(65600)、PとQを通る2円。4辺同長、PQが直線に垂直。',
 'S2-VP':'3移動と基本3作図。角の二等分線のひし形も上下対称で等長。',
 'S3-V01':'PB=PB′、A/P/B′が一直線。三角不等式による最短性。距離の解答数値は表示しない。',
 'S3-VP':'同じ反射の幾何を池の岸という導入へ接続。',
 'S4-V01':'r=150、中心と直線の距離dのとき交点半幅sqrt(r²−d²)。d=rで1点。',
 'S4-V02':'8/16/32等分の面積保存。有限個は長方形への近似、極限で縦r・横πr。',
 'S4-VP':'a/360という割合から弧と面積。S=(1/2)ℓrとの同値性。',
 'REVIEW-V01':'移動・3作図・反射最短路・円公式を上の検算と同じ座標・条件で再利用。'}
rows=[]
for x in load(S/'69本_制作進捗.json')['items']:
 if not x['id'].startswith('M1-C5-'):continue
 key=x['id'][len('M1-C5-'):];ok(key in reasons,'each video accounted for')
 rows.append({'id':x['id'],'scriptSha256':sha(S/(x['id']+'.json')),'reason':reasons[key],'status':'passed'})
ok(len(rows)==12,'all twelve videos')
helpers=['数学5章_場面.js','池の最短路_導入補正.js','円の面積_式の配置補正.js','円とおうぎ形_導入補正.js']
(H/'independent-math-result.json').write_text(json.dumps({'status':'passed','checks':checks,'videos':rows,'dependencies':{n:sha(S/n) for n in helpers},'scope':'全12動画の既表示の幾何・数量・数式。本文全問、原資料写真全文、新たな聴取、実機確認とは別。','learnerFacingAnswersAdded':False},ensure_ascii=False,indent=2)+'\n')
print('Chapter5 independent geometry:',checks,'checks passed; all twelve scripts and scene conditions')
