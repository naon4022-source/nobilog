from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[2]
s=(R/'.claude/verify/verify-eiken-vocab-browser.mjs').read_text()
s=s.replace("new URL('../../site-assets/',import.meta.url)","new URL('../../../site-assets/',import.meta.url)")
s=s.replace('<script src="/eiken-vocab.js"></script>','<script src="/sentence-shadowing.js"></script><script src="/eiken-vocab.js"></script>')
a='const body=await readFile(new URL(name,base));'
assert s.count(a)==1
s=s.replace(a,"let body;try{body=await readFile(new URL('integration-candidate/site-assets/'+name,import.meta.url));}catch{body=await readFile(new URL(name,base));}")
(H/'verify-vocab-regression.mjs').write_text(s)
print('Prepared existing vocab regression against integration candidates')
