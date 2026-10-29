# 並べかえ（NG + ...）の正答に短縮形の言いかえを入れない：ev(...) → ev(..., contract=False)
import sys,re
for p in sys.argv[1:]:
    L=open(p).read().split('\n'); n=0
    for i,l in enumerate(L):
        if not l.startswith('X(') or 'NG +' not in l or 'contract=False' in l: continue
        j=l.find('ev(')
        if j<0: continue
        depth=0; k=j+2
        while k<len(l):
            ch=l[k]
            if ch=='(' : depth+=1
            elif ch==')':
                depth-=1
                if depth==0: break
            elif ch in '"\'':
                q=ch; k+=1
                while l[k]!=q:
                    if l[k]=='\\': k+=1
                    k+=1
            k+=1
        L[i]=l[:k]+', contract=False'+l[k:]; n+=1
    open(p,'w').write('\n'.join(L)); print(p,n)
