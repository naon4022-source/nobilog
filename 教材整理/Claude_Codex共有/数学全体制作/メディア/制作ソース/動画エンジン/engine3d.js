// 立体を3Dで回して描く部品（Claude・6章用。engine.js のあとに読みこむ）。共有の engine.js は変更しない。
const R3={
 mul:(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]],
 mm:(a,b)=>{const r=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)r.push(a[i*3]*b[j]+a[i*3+1]*b[3+j]+a[i*3+2]*b[6+j]);return r},
 x:a=>[1,0,0,0,Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a)],
 y:a=>[Math.cos(a),0,Math.sin(a),0,1,0,-Math.sin(a),0,Math.cos(a)],
 z:a=>[Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a),0,0,0,1],
 sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sc:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
 dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
 len:a=>Math.hypot(a[0],a[1],a[2]),unit:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]},
 lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
// 見る向き：少し上から見下ろす。y が上、z が手前
function view(yaw,pitch=-0.42){return R3.mm(R3.x(-pitch),R3.y(yaw))}
function proj(v,cx,cy,s,dist=900){const k=dist/(dist-v[2]*s);return [cx+v[0]*s*k,cy-v[1]*s*k,v[2]]}
function hexA(c,a){const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`}
function shade(c,k){const n=parseInt(c.slice(1),16);const f=x=>Math.round(clamp(x*k,0,255));return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`}
// 多面体：verts（3D）と faces（頂点番号の配列）。opt：{cx,cy,s,M(回転),color,alpha,edge,hidden(見えない辺を破線),hl:{面番号:色}, edgeHl:{"i-j":色}}
function poly(P,o){const M=o.M||view(0),pts=P.verts.map(v=>R3.mul(M,v)),pr=pts.map(v=>proj(v,o.cx,o.cy,o.s));
 const L=R3.unit([-0.4,0.6,0.7]);const fs=P.faces.map((f,i)=>{const a=pts[f[0]],b=pts[f[1]],c=pts[f[2]];let n=R3.unit(R3.cross(R3.sub(b,a),R3.sub(c,a)));const cen=f.reduce((s,k)=>R3.add(s,pts[k]),[0,0,0]).map(x=>x/f.length);if(R3.dot(n,cen)<0)n=R3.sc(n,-1);return {f,i,n,z:cen[2],front:n[2]>0}});
 const edges=new Map();fs.forEach(F=>F.f.forEach((v,k)=>{const w=F.f[(k+1)%F.f.length],key=v<w?v+'-'+w:w+'-'+v;const e=edges.get(key)||{a:Math.min(v,w),b:Math.max(v,w),front:false};e.front=e.front||F.front;edges.set(key,e)}));
 g.save();g.globalAlpha=(o.alpha??1);
 if(o.hidden!==false){g.setLineDash([9,8]);g.lineWidth=2.5;for(const e of edges.values())if(!e.front){g.strokeStyle=(o.edgeHl&&o.edgeHl[e.a+'-'+e.b])||hexA('#1d2b3a',.45);g.beginPath();g.moveTo(...pr[e.a].slice(0,2));g.lineTo(...pr[e.b].slice(0,2));g.stroke()}g.setLineDash([])}
 fs.filter(F=>F.front).sort((a,b)=>a.z-b.z).forEach(F=>{const base=(o.hl&&o.hl[F.i])||o.color||'#8ec1ec';const k=.78+.32*Math.max(0,R3.dot(F.n,L));g.fillStyle=o.faceAlpha?hexA2(shade(base,k),o.faceAlpha):shade(base,k);g.beginPath();F.f.forEach((v,j)=>j?g.lineTo(pr[v][0],pr[v][1]):g.moveTo(pr[v][0],pr[v][1]));g.closePath();g.fill()});
 g.lineWidth=o.edge??4;for(const e of edges.values())if(e.front){g.strokeStyle=(o.edgeHl&&o.edgeHl[e.a+'-'+e.b])||'#1d2b3a';g.beginPath();g.moveTo(...pr[e.a].slice(0,2));g.lineTo(...pr[e.b].slice(0,2));g.stroke()}
 g.restore();return pr}
function hexA2(rgb,a){return rgb.replace('rgb(','rgba(').replace(')',`,${a})`)}
// 正多面体：頂点を作り、面は「双対の向き」に最も近い頂点を集めて求める
const PHI=(1+Math.sqrt(5))/2;
function signs(v){let out=[[]];v.forEach(x=>{out=out.flatMap(o=>x===0?[[...o,0]]:[[...o,x],[...o,-x]])});return out}
function cyc(v){return [v,[v[1],v[2],v[0]],[v[2],v[0],v[1]]]}
// 凸多面体の面：3点で作る平面のうち、ほかの全部の頂点が片側にあるものを面とする
function hullFaces(verts){const out=new Map(),n=verts.length;
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=j+1;k<n;k++){let nm=R3.cross(R3.sub(verts[j],verts[i]),R3.sub(verts[k],verts[i]));if(R3.len(nm)<1e-9)continue;nm=R3.unit(nm);let d=R3.dot(nm,verts[i]);
  let pos=0,neg=0;for(const v of verts){const x=R3.dot(nm,v)-d;if(x>1e-7)pos++;else if(x<-1e-7)neg++}if(pos&&neg)continue;if(pos){nm=R3.sc(nm,-1);d=-d}
  const idx=verts.map((v,q)=>Math.abs(R3.dot(nm,v)-d)<1e-7?q:-1).filter(q=>q>=0),key=idx.join(',');if(out.has(key))continue;
  const c=idx.reduce((s,q)=>R3.add(s,verts[q]),[0,0,0]).map(x=>x/idx.length),u=R3.unit(R3.sub(verts[idx[0]],c)),w=R3.cross(nm,u);
  out.set(key,idx.sort((p,q)=>{const a=R3.sub(verts[p],c),b=R3.sub(verts[q],c);return Math.atan2(R3.dot(a,w),R3.dot(a,u))-Math.atan2(R3.dot(b,w),R3.dot(b,u))}))}
 return [...out.values()]}
function norm1(vs){const r=Math.max(...vs.map(R3.len));return vs.map(v=>R3.sc(v,1/r))}
const SOLIDS=(()=>{const tet=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],cube=signs([1,1,1]),oct=[...signs([1,0,0]),...signs([0,1,0]),...signs([0,0,1])].filter((v,i,a)=>a.findIndex(w=>w+''===v+'')===i);
 const ico=cyc([0,1,PHI]).flatMap(signs),dod=[...signs([1,1,1]),...cyc([0,1/PHI,PHI]).flatMap(signs)];
 const mk=v=>({verts:norm1(v),faces:hullFaces(norm1(v))});
 return {tetra:mk(tet),cube:mk(cube),octa:mk(oct),dodeca:mk(dod),icosa:mk(ico)}})();
// 回転体などの曲面：経線（側面の形）を回して網を作る。prof：[[r,y],...]
function lathe(prof,n=40,ang=Math.PI*2){const verts=[],faces=[];prof.forEach(([r,y])=>{for(let k=0;k<=n;k++){const a=ang*k/n;verts.push([r*Math.cos(a),y,r*Math.sin(a)])}});
 for(let i=0;i<prof.length-1;i++)for(let k=0;k<n;k++){const a=i*(n+1)+k,b=a+1,c=a+n+1,d=c+1;faces.push([a,b,d,c])}return {verts,faces}}
// 曲面は辺を描かずに面だけ塗る（輪郭は別に描く）
function surf(P,o){const M=o.M||view(0),pts=P.verts.map(v=>R3.mul(M,v)),pr=pts.map(v=>proj(v,o.cx,o.cy,o.s));const L=R3.unit([-0.4,0.6,0.7]);
 const fs=P.faces.map(f=>{const q=f.map(i=>pts[i]);let n=R3.cross(R3.sub(q[1],q[0]),R3.sub(q[3]||q[2],q[0]));if(R3.len(n)<1e-9)n=R3.cross(R3.sub(q[2],q[1]),R3.sub(q[3]||q[0],q[1]));n=R3.unit(n);return {f,n,z:q.reduce((s,v)=>s+v[2],0)/q.length}}).sort((a,b)=>a.z-b.z);
 g.save();g.globalAlpha=o.alpha??1;fs.forEach(F=>{const k=.72+.38*Math.abs(R3.dot(F.n,L));g.fillStyle=shade(o.color||'#8ec1ec',k);g.strokeStyle=g.fillStyle;g.lineWidth=1;g.beginPath();F.f.forEach((v,j)=>j?g.lineTo(pr[v][0],pr[v][1]):g.moveTo(pr[v][0],pr[v][1]));g.closePath();g.fill();g.stroke()});g.restore();return pr}
// 3Dの線（点線にもできる）
function line3(a,b,o,col='#1d2b3a',w=4,dash=[]){const M=o.M||view(0),p=proj(R3.mul(M,a),o.cx,o.cy,o.s),q=proj(R3.mul(M,b),o.cx,o.cy,o.s);g.strokeStyle=col;g.lineWidth=w;g.setLineDash(dash);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke();g.setLineDash([]);return [p,q]}
function pt3(a,o){const M=o.M||view(0);return proj(R3.mul(M,a),o.cx,o.cy,o.s)}
