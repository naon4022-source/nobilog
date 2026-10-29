from pathlib import Path
r=Path(__file__).resolve().parents[1]
s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#f6f8fc"/><g font-family="Hiragino Sans,sans-serif" fill="#203348" font-size="40"><text x="90" y="100" font-size="48">2つのかっこ｜数と符号を、ひと組に見る</text><text x="800" y="210" text-anchor="middle" font-size="60">2(3a+4)−5(a−1)</text>'
for j,(label,eq) in enumerate([('① 1つめ：2を両方へ','6a+8'),('② 2つめ：−5ごと両方へ','−5a+5'),('③ 同じ種類をまとめる','(6a−5a)+(8+5)')]):
 y=275+j*170
 s+=f'<rect x="190" y="{y}" width="1220" height="135" rx="20" fill="white" stroke="#386a9a" stroke-width="4"/><text x="245" y="{y+60}">{label}</text><text x="1190" y="{y+90}" text-anchor="middle">{eq}</text>'
 if j<2:s+=f'<path d="M800 {y+145}v15l-12 -10m12 10l12 -10" fill="none" stroke="#386a9a" stroke-width="5"/>'
s+='</g></svg>'
(r/'M1-C2-S2-D04.svg').write_text(s)
p=r/'制作ソース'
base=(p/'M1-C1-S2-V10.html').read_text().split('const titles=')[0]
js="""window.renderAt=function(raw){const t=Math.max(1,Math.min(24,raw)),tilt=Math.max(0,Math.min(1,(t-17)/6)),yl=445-70*tilt,yr=445+70*tilt;g.fillStyle='#f6f8fc';g.fillRect(0,0,1280,720);box(35,25,1210,98,'#e8f0fa');text('てんびんが式になる',65,88,42,blue);box(45,147,1190,465,'white');g.fillStyle='#9baec1';g.beginPath();g.moveTo(640,250);g.lineTo(550,560);g.lineTo(730,560);g.closePath();g.fill();line(350,280-70*tilt,930,280+70*tilt,ink,8);dot(640,280,blue,12);for(const [x,y] of [[350,yl],[930,yr]]){line(x-100,y-165,x-100,y,ink,3);line(x+100,y-165,x+100,y,ink,3);line(x-125,y,x+125,y,ink,6)}for(let j=0;j<6;j++){const x=267+j*33;g.fillStyle='#c99c62';g.fillRect(x,yl-105,18,100);g.fillStyle=ink;g.beginPath();g.moveTo(x,yl-105);g.lineTo(x+9,yl-122);g.lineTo(x+18,yl-105);g.fill()}box(855,yr-105,150,98,'#e5efe7');text('y 円',930,yr-45,32,ink,'center');text('x円 × 6本',350,yl+65,30,ink,'center');if(t>=13)text(t<20?'6x＝y':'6x＜y',640,210,48,blue,'center');text(t<13?'鉛筆6本の代金と、y円を比べる':t<20?'同じ大きさなら、等号で表す':'右が大きい。口が大きいほうへ開く。',640,665,34,ink,'center');return {time:t,rightHeavier:tilt};};renderAt(0);</script>"""
(p/'M1-C2-S2-V05.html').write_text(base+js)
