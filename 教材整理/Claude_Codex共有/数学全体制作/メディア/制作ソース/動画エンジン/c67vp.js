// まとめ動画（VP・章のふりかえり）用の小さな部品（Claude）。engine.js・engine3d.js・c67.js のあとに読む
function card4(x,y,w,h,title,col,a){g.globalAlpha=a;rbox(x,y,w,h,22,'#ffffff',col,4);rbox(x,y,w,52,22,col);g.fillStyle=col;g.fillRect(x,y+30,w,22);text(title,x+w/2,y+38,30,'#fff','center',800);g.globalAlpha=1}
// 直方体と辺 AB の関係（交わる赤・平行青・ねじれ橙）
const VBOX={verts:[[-1.3,.75,.85],[1.3,.75,.85],[1.3,.75,-.85],[-1.3,.75,-.85],[-1.3,-.75,.85],[1.3,-.75,.85],[1.3,-.75,-.85],[-1.3,-.75,-.85]],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]};
function miniBox(cx,cy,s,yaw,k){const M=view(yaw,-0.38),o={cx,cy,s,M};poly(VBOX,{...o,color:'#dfe9f5',faceAlpha:.35,edge:2.5});const N='ABCDEFGH',L=(e,c,w)=>line3(VBOX.verts[N.indexOf(e[0])],VBOX.verts[N.indexOf(e[1])],o,c,w);
 L('AB',C.ink,8);if(k>=1)['DA','AE','BC','BF'].forEach(e=>L(e,C.red,6));if(k>=2)['CD','EF','GH'].forEach(e=>L(e,C.blue,6));if(k>=3)['CG','DH','HE','FG'].forEach(e=>L(e,C.orange,7))}
// 回転体（長方形・直角三角形・半円）を th まで回す
const VPROF={rect:[[0,1],[1,1],[1,-1],[0,-1]],tri:[[0,1.25],[1.05,-1],[0,-1]],semi:[...Array(25)].map((_,k)=>{const a=Math.PI*k/24;return [1.12*Math.sin(a),1.12*Math.cos(a)]})};
const VCOL={rect:'#8ec1ec',tri:'#c9a7e8',semi:'#9bd3a8'};
function miniSweep(k,cx,cy,s,th,yaw=.35){const o={cx,cy,s,M:view(yaw,-0.35)};line3([0,-1.6,0],[0,1.6,0],o,C.ink,2.5,[10,7]);if(th>0.02)surf(lathe(VPROF[k],Math.max(2,Math.round(40*th/(2*Math.PI))),th),{...o,color:VCOL[k],alpha:.92});
 const pts=VPROF[k].map(([x,y])=>pt3([x*Math.cos(th),y,x*Math.sin(th)],o));g.fillStyle=hexA(C.orange,.5);g.strokeStyle=C.orange;g.lineWidth=3;g.beginPath();pts.forEach((q,j)=>j?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fill();g.stroke()}
// 展開図：円柱（長方形＋円2つ）と円錐（おうぎ形＋円）
function netCyl(cx,cy,s,a){g.globalAlpha=a;g.fillStyle='#8ec1ec';g.strokeStyle=C.ink;g.lineWidth=3;const w=2*Math.PI*s,h=2.2*s;g.fillRect(cx-w/2,cy-h/2,w,h);g.strokeRect(cx-w/2,cy-h/2,w,h);
 g.fillStyle='#f2c48d';[[cx,cy-h/2-s],[cx,cy+h/2+s]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,s,0,7);g.fill();g.stroke()});g.globalAlpha=1}
function netCone(cx,cy,R,r,a,col='#c9a7e8'){g.globalAlpha=a;const th=2*Math.PI*r/R;g.fillStyle=col;g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R,Math.PI/2-th/2,Math.PI/2+th/2);g.closePath();g.fill();g.stroke();
 g.fillStyle='#f2c48d';g.beginPath();g.arc(cx,cy+R+r,r,0,7);g.fill();g.stroke();g.globalAlpha=1}
// 3Dの円柱・円錐・球（体積の話で使う）
function miniCyl(cx,cy,s,a=1,col='#8ec1ec',fill=1){const o={cx,cy,s,M:view(.3,-.35)};surf(lathe([[1,1],[1,-1]],40),{...o,color:col,alpha:a});surf(lathe([[0,1],[1,1]],40),{...o,color:col,alpha:a})}
function miniCone(cx,cy,s,a=1,col='#c9a7e8'){const o={cx,cy,s,M:view(.3,-.35)};surf(lathe([[0,1],[1,-1]],40),{...o,color:col,alpha:a});surf(lathe([[0,-1],[1,-1]],40),{...o,color:col,alpha:a})}
function miniBall(cx,cy,s,a=1,col='#9bd3a8'){const o={cx,cy,s,M:view(.3,-.35)};surf(lathe(VPROF.semi.map(([x,y])=>[x/1.12,y/1.12]),40),{...o,color:col,alpha:a})}
// ヒストグラム（小）
function miniHist(h,x0,y0,bw,u,col='#8ec1ec',a=1,hot=-1){g.globalAlpha=a;h.forEach((c,k)=>{if(!c)return;g.fillStyle=k===hot?C.orange:col;g.strokeStyle=C.ink;g.lineWidth=2;g.fillRect(x0+k*bw,y0-c*u,bw,c*u);g.strokeRect(x0+k*bw,y0-c*u,bw,c*u)});g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.moveTo(x0-4,y0);g.lineTo(x0+h.length*bw+4,y0);g.stroke();g.globalAlpha=1}
function cupIcon(x,y,s,state){g.save();g.translate(x,y);g.rotate(state===0?0:state===1?Math.PI:Math.PI/2);g.fillStyle='#f6f1e7';g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.moveTo(-26*s,-34*s);g.lineTo(26*s,-34*s);g.lineTo(18*s,34*s);g.lineTo(-18*s,34*s);g.closePath();g.fill();g.stroke();g.beginPath();g.ellipse(0,-34*s,26*s,7*s,0,0,7);g.stroke();g.restore()}
