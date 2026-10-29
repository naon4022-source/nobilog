# manifest の SHA とバイト数が実際のファイルと一致するか、manifest にないファイルがないかを確かめる
import json,hashlib,os,sys
m=json.load(open('manifest.json'));bad=0;seen=set()
for d,_,fs in os.walk('.'):
    for f in fs:
        p=os.path.join(d,f)[2:]
        if p in('manifest.json','verify_manifest.py') or p.startswith('検証ログ/manifest'):continue
        seen.add(p);b=open(p,'rb').read()
        if p not in m:bad+=1;print('manifestにない',p);continue
        if m[p]['sha256']!=hashlib.sha256(b).hexdigest() or m[p]['bytes']!=len(b):bad+=1;print('不一致',p)
for p in m:
    if p not in seen:bad+=1;print('実物がない',p)
print('ファイル',len(seen),'不一致',bad);sys.exit(1 if bad else 0)
