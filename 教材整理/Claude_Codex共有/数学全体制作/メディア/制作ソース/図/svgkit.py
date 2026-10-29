"""教科書の図を SVG で描く小さな道具（Claude）。1600×900、文字は40px以上を基本にする。"""
import html, math, pathlib
INK='#203348'; BLUE='#1f5fa8'; SKY='#8ec1ec'; PALE='#e8f0fa'; ORANGE='#e07a1f'; RED='#c0392b'; GREEN='#2a8a5b'; PURPLE='#8a5cc2'; DIM='#9aa9bb'; BG='#f6f8fc'
FONT='Hiragino Sans,Hiragino Kaku Gothic ProN,sans-serif'
OUT=pathlib.Path(__file__).resolve().parents[2]   # メディア/
class S:
    def __init__(s, title, w=1600, h=900):
        s.w,s.h,s.title,s.o=w,h,title,[]
        s.rect(0,0,w,h,fill=BG,stroke='none',rx=0)
    def add(s,x): s.o.append(x); return s
    def text(s,x,y,t,size=44,col=INK,anchor='middle',weight=700,**k):
        extra=''.join(f' {a.replace("_","-")}="{v}"' for a,v in k.items())
        return s.add(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{col}" text-anchor="{anchor}" font-weight="{weight}"{extra}>{html.escape(str(t))}</text>')
    def line(s,x1,y1,x2,y2,col=INK,w=4,dash=None,cap='round'):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        return s.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{w}" stroke-linecap="{cap}"{d}/>')
    def arrow(s,x1,y1,x2,y2,col=INK,w=5,head=18,dash=None):
        s.line(x1,y1,x2,y2,col,w,dash); a=math.atan2(y2-y1,x2-x1)
        p=[(x2,y2),(x2-head*math.cos(a-.45),y2-head*math.sin(a-.45)),(x2-head*math.cos(a+.45),y2-head*math.sin(a+.45))]
        return s.poly(p,fill=col,stroke='none')
    def rect(s,x,y,w,h,fill='white',stroke=INK,sw=4,rx=18,dash=None):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        return s.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def circle(s,x,y,r,fill='none',stroke=INK,sw=4,dash=None):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        return s.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def ellipse(s,x,y,rx,ry,fill='none',stroke=INK,sw=4,dash=None):
        d=f' stroke-dasharray="{dash}"' if dash else ''
        return s.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')
    def poly(s,pts,fill='none',stroke=INK,sw=4,dash=None,close=True):
        d=f' stroke-dasharray="{dash}"' if dash else ''; tag='polygon' if close else 'polyline'
        return s.add(f'<{tag} points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in pts)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"{d}/>')
    def path(s,d,fill='none',stroke=INK,sw=4,dash=None):
        dd=f' stroke-dasharray="{dash}"' if dash else ''
        return s.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"{dd}/>')
    def frac(s,x,y,n,d,size=44,col=INK):
        w=max(len(str(n)),len(str(d)))*size*0.62+10
        s.text(x,y-8,n,size,col); s.line(x-w/2,y+2,x+w/2,y+2,col,3); s.text(x,y+size+4,d,size,col); return s
    def heading(s,t,size=44,col=BLUE):
        s.rect(40,30,len(t)*size*1.0+60,76,fill=PALE,stroke='none',rx=20); return s.text(70,84,t,size,col,'start',800)
    def card(s,x,y,w,h,title=None,col=BLUE,fill='white',sw=5,dash=None):
        s.rect(x,y,w,h,fill=fill,stroke=col,sw=sw,dash=dash,rx=24)
        if title: s.rect(x,y,w,70,fill=col,stroke='none',rx=24); s.rect(x,y+40,w,30,fill=col,stroke='none',rx=0); s.text(x+w/2,y+50,title,40,'white',weight=800)
        return s
    def lines(s,x,y,arr,size=40,col=INK,gap=None,anchor='middle'):
        gap=gap or size*1.35
        for k,t in enumerate(arr):
            if isinstance(t,tuple): s.text(x,y+k*gap,t[0],t[1] if len(t)>1 else size,t[2] if len(t)>2 else col,anchor)
            else: s.text(x,y+k*gap,t,size,col,anchor)
        return s
    def mistake(s,wrong,right,mark=None,steps=None,note=None):
        """よくあるまちがい：左✗カード（赤いふち・点線）と右○カード（緑）"""
        s.text(800,90,'よくあるまちがい',44,INK,weight=800)
        s.rect(60,140,700,640,fill='white',stroke=RED,sw=6,dash='18 10'); s.rect(840,140,700,640,fill='white',stroke=GREEN,sw=6)
        s.text(410,240,'✗',80,RED); s.text(1190,240,'○',80,GREEN)
        s.lines(410,340,wrong,40)
        if mark is not None:
            # mark＝まちがえた行の番号。その行を赤い丸でかこみ、下に「ここ！」
            ln=wrong[mark] if isinstance(wrong[mark],str) else wrong[mark][0]; y=340+mark*54-14; rx=max(130,len(ln)*21+30)
            s.ellipse(410,y,rx,38,stroke=RED,sw=6); s.arrow(410,690,410,y+44,RED,5); s.text(410,740,'ここ！',46,RED,weight=800)
        if steps:
            yy=320
            for k,t in enumerate(steps):
                s.rect(880,yy,620,90,fill='#edf5ef',stroke='none',rx=16); s.text(1190,yy+60,t,40)
                if k<len(steps)-1: s.arrow(1190,yy+94,1190,yy+128,GREEN,6)
                yy+=132
        else: s.lines(1190,340,right,40)
        if note: s.text(800,850,note,40,INK)
        return s
    def numline(s,x0,x1,y,lo,hi,step=1,labels=True,size=40,col=INK,lw=4):
        s.line(x0-20,y,x1+30,y,col,lw); s.arrow(x1+10,y,x1+40,y,col,lw,16)
        X=lambda v:x0+(v-lo)/(hi-lo)*(x1-x0)
        v=lo
        while v<=hi+1e-9:
            s.line(X(v),y-14,X(v),y+14,col,3)
            if labels: s.text(X(v),y+58,('−'+str(abs(v)) if v<0 else str(v)) if float(v).is_integer() else str(v),size,col)
            v=round(v+step,6)
        return X
    def axes(s,ox,oy,unit,xmin,xmax,ymin,ymax,grid=True,labels=True,size=36,step=1):
        X=lambda v:ox+v*unit; Y=lambda v:oy-v*unit
        if grid:
            for v in range(xmin,xmax+1): s.line(X(v),Y(ymin),X(v),Y(ymax),'#d5dee9',2)
            for v in range(ymin,ymax+1): s.line(X(xmin),Y(v),X(xmax),Y(v),'#d5dee9',2)
        s.arrow(X(xmin)-10,oy,X(xmax)+30,oy,INK,3,16); s.arrow(ox,Y(ymin)+10,ox,Y(ymax)-30,INK,3,16)
        s.text(X(xmax)+40,oy+14,'x',size,INK,'start',700,font_style='italic'); s.text(ox+14,Y(ymax)-34,'y',size,INK,'start',700,font_style='italic'); s.text(ox-24,oy+40,'O',size,INK)
        if labels:
            for v in range(xmin,xmax+1,step):
                if v: s.text(X(v),oy+42,('−' if v<0 else '')+str(abs(v)),size-6,INK)
            for v in range(ymin,ymax+1,step):
                if v: s.text(ox-14,Y(v)+12,('−' if v<0 else '')+str(abs(v)),size-6,INK,'end')
        return X,Y
    def save(s,name):
        body=''.join(s.o)
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s.w} {s.h}" role="img"><title>{html.escape(s.title)}</title><g font-family="{FONT}">{body}</g></svg>'
        from fraction_layout import final_svg
        svg = final_svg(name, svg)
        (OUT/(name+'.svg')).write_text(svg,encoding='utf-8'); return OUT/(name+'.svg')
def plot(s,X,Y,f,x0,x1,col=BLUE,w=6,n=200,dash=None,ylim=None):
    pts=[];segs=[]
    for k in range(n+1):
        x=x0+(x1-x0)*k/n;y=f(x)
        if y is None or (ylim and not (ylim[0]<=y<=ylim[1])):
            if len(pts)>1: segs.append(pts)
            pts=[];continue
        pts.append((X(x),Y(y)))
    if len(pts)>1: segs.append(pts)
    for p in segs: s.poly(p,stroke=col,sw=w,dash=dash,close=False)
    return s
def dot(s,x,y,r=12,col=INK,fill=None): return s.circle(x,y,r,fill=fill or col,stroke=col,sw=3)
def P(cx,cy,r,deg): a=math.radians(deg); return (cx+r*math.cos(a), cy-r*math.sin(a))
def arc(s,cx,cy,r,d0,d1,col=INK,w=4,dash=None,fill='none',sector=False):
    x0,y0=P(cx,cy,r,d0);x1,y1=P(cx,cy,r,d1);large=1 if (d1-d0)%360>180 else 0
    d=(f'M{cx} {cy} L{x0:.1f} {y0:.1f} ' if sector else f'M{x0:.1f} {y0:.1f} ')+f'A{r} {r} 0 {large} 0 {x1:.1f} {y1:.1f}'+(' Z' if sector else '')
    return s.path(d,fill=fill,stroke=col,sw=w,dash=dash)
def right_mark(s,x,y,ux,uy,vx,vy,size=26,col=INK):
    """点(x,y)で、向き u と v（単位ベクトル）が直角であることを示す小さな四角"""
    a=(x+ux*size,y+uy*size);b=(x+(ux+vx)*size,y+(uy+vy)*size);c=(x+vx*size,y+vy*size)
    return s.poly([a,b,c],stroke=col,sw=3,close=False)
def tick(s,x1,y1,x2,y2,n=1,col=RED,size=16):
    mx,my=(x1+x2)/2,(y1+y2)/2;dx,dy=x2-x1,y2-y1;L=math.hypot(dx,dy);ux,uy=dx/L,dy/L;nx,ny=-uy,ux
    for k in range(n):
        o=(k-(n-1)/2)*10;cx,cy=mx+ux*o,my+uy*o;s.line(cx-nx*size,cy-ny*size,cx+nx*size,cy+ny*size,col,4)
    return s
def label_pt(s,x,y,t,dx=0,dy=-24,size=40,col=INK,r=9):
    s.circle(x,y,r,fill=col,stroke=col,sw=2);return s.text(x+dx,y+dy,t,size,col)
# ---- 見取図（斜投影：奥行きは右上 30°、長さ半分） ----
def oblique(ox,oy,u,k=0.5,deg=35):
    c,sn=math.cos(math.radians(deg))*k,math.sin(math.radians(deg))*k
    return lambda x,y,z:(ox+(x+z*c)*u, oy-(y+z*sn)*u)
def cuboid(s,ox,oy,u,W,H,D,fill='#e6eef8',labels=True,lw=4,hidden=True,col=INK):
    pr=oblique(ox,oy,u);V={'A':(0,H,0),'B':(W,H,0),'C':(W,H,D),'D':(0,H,D),'E':(0,0,0),'F':(W,0,0),'G':(W,0,D),'H':(0,0,D)}
    p={k:pr(*v) for k,v in V.items()}
    s.poly([p['A'],p['B'],p['C'],p['D']],fill=fill,stroke='none');s.poly([p['A'],p['B'],p['F'],p['E']],fill=fill,stroke='none');s.poly([p['B'],p['C'],p['G'],p['F']],fill=fill,stroke='none')
    E=['AB','BC','CD','DA','EF','FG','AE','BF','CG']
    for e in E: s.line(*p[e[0]],*p[e[1]],col,lw)
    if hidden:
        for e in ('GH','HE','DH'): s.line(*p[e[0]],*p[e[1]],col,3,'10 8')
    if labels:
        off={'A':(-26,-14),'B':(18,-14),'C':(18,-14),'D':(-22,-16),'E':(-26,34),'F':(10,40),'G':(24,30),'H':(-28,20)}
        for k,(dx,dy) in off.items(): s.text(p[k][0]+dx,p[k][1]+dy+10,k,38)
    return p
def cylinder3(s,cx,by,r,h,fill=SKY,ry=None,col=INK,lw=4,water=None):
    ry=ry or r*0.32;ty=by-h
    s.path(f'M{cx-r} {ty} L{cx-r} {by} A{r} {ry} 0 0 0 {cx+r} {by} L{cx+r} {ty} Z',fill=fill,stroke='none')
    if water is not None:
        wy=by-h*water;s.path(f'M{cx-r} {wy} L{cx-r} {by} A{r} {ry} 0 0 0 {cx+r} {by} L{cx+r} {wy} Z',fill='#5f9fd8',stroke='none');s.ellipse(cx,wy,r,ry,fill='#4a8ccc',stroke='none')
    s.ellipse(cx,ty,r,ry,fill='#cfe3f6' if water is None or water<1 else '#4a8ccc',stroke=col,sw=lw);s.line(cx-r,ty,cx-r,by,col,lw);s.line(cx+r,ty,cx+r,by,col,lw)
    s.path(f'M{cx-r} {by} A{r} {ry} 0 0 0 {cx+r} {by}',stroke=col,sw=lw);s.path(f'M{cx-r} {by} A{r} {ry} 0 0 1 {cx+r} {by}',stroke=col,sw=3,dash='10 8')
def cone3(s,cx,by,r,h,fill='#c9a7e8',ry=None,col=INK,lw=4,down=False):
    ry=ry or r*0.32
    if not down:
        ax,ay=cx,by-h;s.path(f'M{cx-r} {by} L{ax} {ay} L{cx+r} {by} A{r} {ry} 0 0 1 {cx-r} {by}Z',fill=fill,stroke='none')
        s.line(cx-r,by,ax,ay,col,lw);s.line(cx+r,by,ax,ay,col,lw);s.path(f'M{cx-r} {by} A{r} {ry} 0 0 0 {cx+r} {by}',stroke=col,sw=lw);s.path(f'M{cx-r} {by} A{r} {ry} 0 0 1 {cx+r} {by}',stroke=col,sw=3,dash='10 8')
    else:
        ty=by-h;s.path(f'M{cx-r} {ty} L{cx} {by} L{cx+r} {ty}Z',fill=fill,stroke='none');s.ellipse(cx,ty,r,ry,fill='#e4d4f5',stroke=col,sw=lw);s.line(cx-r,ty,cx,by,col,lw);s.line(cx+r,ty,cx,by,col,lw)
def sphere3(s,cx,cy,r,fill='#9bd3a8',col=INK,lw=4):
    s.circle(cx,cy,r,fill=fill,stroke=col,sw=lw);s.path(f'M{cx-r} {cy} A{r} {r*0.3} 0 0 0 {cx+r} {cy}',stroke=col,sw=3);s.path(f'M{cx-r} {cy} A{r} {r*0.3} 0 0 1 {cx+r} {cy}',stroke=col,sw=2,dash='8 8')
# ---- グラフ枠（データの章） ----
def chart(s,x0,y0,w,h,xlo,xhi,ylo,yhi,xt,yt,xlab='',ylab='',size=30,fx=str,fy=str,grid=True):
    X=lambda v:x0+(v-xlo)/(xhi-xlo)*w; Y=lambda v:y0-(v-ylo)/(yhi-ylo)*h
    if grid:
        for v in yt: s.line(x0,Y(v),x0+w,Y(v),'#d5dee9',2)
    s.line(x0,y0,x0+w+20,y0,INK,3);s.line(x0,y0,x0,y0-h-20,INK,3)
    for v in xt: s.line(X(v),y0,X(v),y0+8,INK,3);s.text(X(v),y0+40,fx(v),size)
    for v in yt: s.text(x0-14,Y(v)+10,fy(v),size,INK,'end')
    if xlab: s.text(x0+w+30,y0+40,xlab,size,INK,'start')
    if ylab: s.text(x0,y0-h-40,ylab,size,INK,'middle')
    return X,Y
def hist(s,X,Y,edges,freq,fill=SKY,col=INK,sw=3,pattern=None):
    for a,b,f in zip(edges,edges[1:],freq):
        if f: s.rect(X(a),Y(f),X(b)-X(a),Y(0)-Y(f),fill=fill,stroke=col,sw=sw,rx=0)
