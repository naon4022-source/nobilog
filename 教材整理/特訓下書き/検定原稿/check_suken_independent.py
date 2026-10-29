# 数検原稿の「次の計算をしよう」の答えを、作成コードとは別の方法で検算する（Claude・2026-10-14）
# 問題文の式を自前の構文解析で読み直し（帯分数・分数のかたまり・指数・かっこ・暗黙のかけ算は×÷より先）、
# 数は分数で正確に計算、文字式は乱数を5回代入して答えの式と比べる。
import json,re,sys,random
from fractions import Fraction as F
SUP={'²':2,'³':3,'⁴':4,'⁵':5}
def lex(s):
    s=s.replace('−','-').replace('－','-').replace('＋','+').replace('（','(').replace('）',')')
    T=[];i=0
    while i<len(s):
        c=s[i]
        if c==' ': i+=1; continue
        m=re.match(r'(\d+) (\d+)/(\d+)(?![\d.])',s[i:])
        if m: T.append(('num',F(int(m.group(1)))+F(int(m.group(2)),int(m.group(3))))); i+=m.end(); continue
        m=re.match(r'(\d+)/(\d+)(?![\d.])',s[i:])
        if m and (not T or T[-1][0] in ('op','(')): T.append(('num',F(int(m.group(1)),int(m.group(2))))); i+=m.end(); continue
        m=re.match(r'\d+(\.\d+)?',s[i:])
        if m: T.append(('num',F(m.group(0)))); i+=m.end(); continue
        if c in SUP: T.append(('pow',SUP[c])); i+=1; continue
        if c=='^': m=re.match(r'\^(\d+)',s[i:]); T.append(('pow',int(m.group(1)))); i+=m.end(); continue
        if c.isalpha(): T.append(('var',c)); i+=1; continue
        if c in '+-×÷*/': T.append(('op',c)); i+=1; continue
        if c in '()': T.append((c,c)); i+=1; continue
        raise ValueError('文字 '+c)
    return T
class P:
    def __init__(s,T,env): s.T=T; s.i=0; s.env=env
    def peek(s): return s.T[s.i] if s.i<len(s.T) else (None,None)
    def take(s): t=s.T[s.i]; s.i+=1; return t
    def expr(s):
        v=s.term()
        while s.peek()[0]=='op' and s.peek()[1] in '+-':
            o=s.take()[1]; w=s.term(); v=v+w if o=='+' else v-w
        return v
    def term(s):                       # ×÷ （明示）
        v=s.unary()
        while s.peek()[0]=='op' and s.peek()[1] in '×÷*/':
            o=s.take()[1]; w=s.unary(); v=v*w if o in '×*' else v/w
        return v
    def unary(s):
        if s.peek()==('op','-'): s.take(); return -s.unary()
        if s.peek()==('op','+'): s.take(); return s.unary()
        return s.juxt()
    def juxt(s):                       # 暗黙のかけ算（3x、2(a+b)、xy）は×÷より先
        v=s.power()
        while s.peek()[0] in ('num','var','('):
            v=v*s.power()
        return v
    def power(s):
        t=s.take()
        if t[0]=='num': v=t[1]
        elif t[0]=='var': v=s.env[t[1]]
        elif t[0]=='(':
            v=s.expr(); assert s.take()[0]==')'
        else: raise ValueError('予期しない '+str(t))
        while s.peek()[0]=='pow': v=v**s.take()[1]
        return v
def ev(e,env):
    p=P(lex(e),env); v=p.expr(); assert p.i==len(p.T),'読み残し'; return v
bad=ok=skip=0
for f in sys.argv[1:]:
    for q in json.load(open(f))['questions']:
        p=q['prompt']; a=q['answer']
        m=re.search(r'計算をしよう[^\n]*\n(.+)$',p)
        if not m or a['kind'] not in ('number','expr'): skip+=1; continue
        e=m.group(1).strip()
        try:
            if a['kind']=='number': good = ev(e,{})==F(a['value'])
            else:
                vs=sorted(set(re.findall(r'[a-z]',e+a['value']))); good=True
                for _ in range(6):
                    env={v:F(random.choice([x for x in range(-9,10) if x]),random.randint(1,4)) for v in vs}
                    if ev(e,env)!=ev(a['value'],env): good=False
            if good: ok+=1
            else: bad+=1; print('不一致',q['id'],e,'答え',a['value'])
        except Exception as ex: skip+=1; print('読めない',q['id'],e,'|',ex)
print('一致',ok,'不一致',bad,'対象外（計算以外の問題）',skip)

# ── 方程式・連立方程式・2次方程式・式の値・等式の変形（答えを元の式に代入して確かめる）──
def split_eq(line):
    l,r=re.split(r'[=＝]',line); return l,r
ok2=bad2=0
def judge(cond,qid,msg):
    global ok2,bad2
    if cond: ok2+=1
    else: bad2+=1; print('不一致',qid,msg)
for f in sys.argv[1:]:
    for q in json.load(open(f))['questions']:
        p=q['prompt']; a=q['answer']; L=p.split('\n'); qid=q['id']
        try:
            if '連立方程式を解こう' in p:
                x,y=[F(v) for v in a['values']]
                for line in L[-2:]:
                    l,r=split_eq(line); judge(ev(l,{'x':x,'y':y})==ev(r,{'x':x,'y':y}),qid,line)
            elif '2次方程式を解こう' in p:
                sols=[F(v) for v in re.split('[、,]',a['accepted'][0])]
                l,r=split_eq(L[-1])
                for v in sols: judge(ev(l,{'x':v})==ev(r,{'x':v}),qid,L[-1])
            elif '方程式を解こう' in p:
                v=F(a['accepted'][0].split('=')[-1].replace('−','-'))
                l,r=split_eq(L[-1]); judge(ev(l,{'x':v})==ev(r,{'x':v}),qid,L[-1])
            elif 'のとき、次の式の値' in p:
                env={k:F(val.replace('−','-')) for k,val in re.findall(r'([a-z])＝(−?\d+)',L[0])}
                judge(ev(L[-1],env)==F(a['value']),qid,L[-1])
            elif 'について解こう' in p:
                tgt=re.search(r'([a-z])について',p).group(1)
                l,r=split_eq(L[-1]); vs=sorted(set(re.findall(r'[a-z]',L[-1]))-{tgt})
                good=True
                for _ in range(5):
                    env={v:F(random.choice([1,2,3,4,5,-2,-3]),random.randint(1,3)) for v in vs}
                    env[tgt]=ev(a['value'],env)
                    if ev(l,env)!=ev(r,env): good=False
                judge(good,qid,L[-1])
        except Exception as ex: print('読めない',qid,ex)
print('代入による確認：一致',ok2,'不一致',bad2)
