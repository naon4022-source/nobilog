// 6章・7章の動画で共通に使う絵（Claude）。engine.js・engine3d.js のあとに読みこむ。
// ---- 頂点のまわりに正多角形を集める扇（平らな状態 t=0 → 折り曲げた状態 t=1）----
const DEG=Math.PI/180;
function vertexInfo(name){const P=SOLIDS[name],V=P.verts[0];const nb=new Set();P.faces.forEach(f=>{const i=f.indexOf(0);if(i>=0){nb.add(f[(i+1)%f.length]);nb.add(f[(i+f.length-1)%f.length])}});
 const a=R3.unit(R3.sc(V,-1)),L=R3.len(R3.sub(P.verts[[...nb][0]],V));
 // 頂点から内側への向き a を真下 (0,-1,0) にそろえる回転
 const t=R3.unit(R3.cross(a,[0,-1,0])),c=R3.dot(a,[0,-1,0]),s=Math.sqrt(1-c*c);const K=[0,-t[2],t[1],t[2],0,-t[0],-t[1],t[0],0];const KK=R3.mm(K,K);const Q=[1,0,0,0,1,0,0,0,1].map((x,i)=>x+s*K[i]+(1-c)*KK[i]);
 let es=[...nb].map(k=>R3.unit(R3.mul(Q,R3.sub(P.verts[k],V))));es.sort((p,q)=>Math.atan2(p[2],p[0])-Math.atan2(q[2],q[0]));return {es,L}}
function fanDirs(n,m,t,solid){const alpha=(n-2)*180/n*DEG;let fold=null,phi0=0;if(solid){fold=vertexInfo(solid).es;phi0=Math.atan2(fold[0][2],fold[0][0])}
 const d=[];for(let k=0;k<=m;k++){const fl=[Math.cos(phi0+k*alpha),0,Math.sin(phi0+k*alpha)];if(!fold||t<=0){d.push(fl);continue}const fo=fold[k%m];d.push(R3.unit(R3.lerp(fl,fo,t)))}return {d,alpha}}
// n角形を m 個、頂点のまわりに。o={cx,cy,s,yaw,t,solid,gap(すきまを塗る),over(重なりを赤く),col}
function drawFan(n,m,o){const tt=o.t||0,{d,alpha}=fanDirs(n,m,tt,o.solid),M=view(o.yaw||0,o.pitch??(-1.0+0.5*tt)),ext=2*Math.PI/n;const faces=[];o={...o,s:o.s*({3:1,4:.86,5:.72,6:.6}[n]||1)};
 for(let k=0;k<m;k++){const u=d[k],w0=R3.sub(d[k+1],R3.sc(u,R3.dot(d[k+1],u))),w=R3.unit(w0);let x=0,y=0,ph=0;const pts=[[0,0,0]];for(let j=1;j<n;j++){x+=Math.cos(ph);y+=Math.sin(ph);ph+=ext;pts.push(R3.add(R3.sc(u,x),R3.sc(w,y)))}
  const sc=pts.map(p=>R3.mul(M,p)),cen=sc.reduce((s,p)=>R3.add(s,p),[0,0,0]).map(v=>v/n);faces.push({k,sc,z:cen[2]})}
 // すきま（最後の辺と最初の辺のあいだ）
 if(o.gap){const a0=d[m],a1=d[0];const ar=[];for(let j=0;j<=16;j++){ar.push(R3.mul(M,R3.sc(R3.unit(R3.lerp(a0,a1,j/16)),0.9)))}const g0=proj([0,0,0],o.cx,o.cy,o.s);g.fillStyle=hexA(C.orange,.28*(o.gapAlpha??1));g.beginPath();g.moveTo(g0[0],g0[1]);ar.forEach(p=>{const q=proj(p,o.cx,o.cy,o.s);g.lineTo(q[0],q[1])});g.closePath();g.fill()}
 faces.sort((a,b)=>a.z-b.z).forEach(F=>{const over=o.over&&F.k===m-1;g.fillStyle=over?hexA(C.red,.55):hexA(o.col||'#8ec1ec',.92);g.strokeStyle=C.ink;g.lineWidth=3.5;g.beginPath();F.sc.forEach((p,j)=>{const q=proj(p,o.cx,o.cy,o.s);j?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1])});g.closePath();g.fill();g.stroke()});
 const v0=proj([0,0,0],o.cx,o.cy,o.s);g.fillStyle=C.orange;g.beginPath();g.arc(v0[0],v0[1],9,0,7);g.fill();return {alpha}}
// 角の合計の式（例：60°×3＝180°）と判定
function angleLine(n,m,x,y,shown=1){const a=(n-2)*180/n,tot=a*m,ok=tot<360;g.globalAlpha=shown;text(`${a}°×${m}＝${tot}°`,x,y,46,C.ink,'center',800);
 const lab=ok?`すきま ${360-tot}° → 立体になる`:tot===360?'ぴったり 360° → 平らになる':`${tot-360}° はみ出す → 重なる`;text(lab,x,y+52,34,ok?C.green:C.red,'center',800);g.globalAlpha=1}
const SOLIDNAME={tetra:'正四面体',cube:'正六面体（立方体）',octa:'正八面体',dodeca:'正十二面体',icosa:'正二十面体'};
const SOLIDCOL={tetra:'#f2a65a',cube:'#8ec1ec',octa:'#9bd3a8',dodeca:'#c9a7e8',icosa:'#f4b6c2'};
function solidPanel(name,cx,cy,s,yaw,alpha=1,label=true){poly(SOLIDS[name],{cx,cy,s,M:view(yaw,-0.35),color:SOLIDCOL[name],alpha});if(label){g.globalAlpha=alpha;text(SOLIDNAME[name],cx,cy+s+58,name==='cube'?30:36,C.ink,'center',800);g.globalAlpha=1}}
function bigX(x,y,r,alpha=1){g.globalAlpha=alpha;g.strokeStyle=C.red;g.lineWidth=12;g.lineCap='round';g.beginPath();g.moveTo(x-r,y-r);g.lineTo(x+r,y+r);g.moveTo(x+r,y-r);g.lineTo(x-r,y+r);g.stroke();g.lineCap='butt';g.globalAlpha=1}
