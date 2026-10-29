"""文字・数式を保ち、確認した7カードと差の図1枚の囲みだけを修正する。"""
from pathlib import Path
import shutil,json,subprocess,hashlib,xml.etree.ElementTree as ET
r=Path(__file__).resolve().parents[3];t=Path(__file__).resolve().parent;m=r/'教材整理/Claude_Codex共有/数学全体制作/メディア';(t/'svg').mkdir(exist_ok=True);production=t/'svg-production';(production/'制作ソース').mkdir(parents=True,exist_ok=True)
card_ids=['M1-C2-S1-M01','M1-C2-S1-M02','M1-C2-S1-M03','M1-C2-S2-M01','M1-C2-S2-M03','M1-C2-S2-M05','M1-C2-S3-M01'];ids=card_ids+['M1-C2-S2-D02'];manifest=[];ns={'s':'http://www.w3.org/2000/svg'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for ident in ids:
 p=m/(ident+'.svg');shutil.copy2(p,t/'previous'/p.name);s=p.read_text()
 if ident in card_ids:
  s=s.replace('y="375"','y="400"').replace('y="450"','y="475"').replace('rx="295" ry="113"','rx="315" ry="125"')
 else:
  a='>3x−8−(−5x)+2</text>';assert s.count(a)==1;s=s.replace(a,'>3x−8−(−5x)<tspan dx="110">+2</tspan></text>').replace('rx="105" ry="66"','rx="125" ry="80"')
 dest=t/'svg'/p.name;dest.write_text(s);text=lambda v:[''.join(n.itertext()) for n in ET.fromstring(v).findall('.//s:text',ns)];assert text(p.read_text())==text(s),ident+' text unchanged';manifest.append({'id':ident,'file':str(p),'copy':str(r/('site-assets/textbook-book-math1-'+ident.lower()+'.svg')),'before':sha(p),'after':sha(dest),'textPreserved':True})
for name in ['文字を使った式の比較図を作る.py','文字式計算の比較図を作る.py','文字式利用の比較図を作る.py']:
 src=m/'制作ソース'/name;shutil.copy2(src,t/'previous'/name);s=src.read_text()
 if name=='文字式計算の比較図を作る.py':
  assert '{375+j*75}' in s;s=s.replace('{375+j*75}','{(400 if i in (1,3,5) else 375)+j*75}');s=s.replace("s+='<ellipse cx=", "s+=f'<ellipse cx=").replace('rx="295" ry="113"','rx="{315 if i in (1,3,5) else 295}" ry="{125 if i in (1,3,5) else 113}"')
 else:s=s.replace('{375+j*75}','{400+j*75}').replace('rx="295" ry="113"','rx="315" ry="125"')
 dest=production/'制作ソース'/name;dest.write_text(s);subprocess.run(['python3',str(dest)],check=True)
for p in production.glob('M1-C2-*.svg'):
 expected=t/'svg'/p.name if p.stem in card_ids else m/p.name;assert p.read_bytes()==expected.read_bytes(),p.name+' only confirmed failing cards change'
(t/'svg-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print('8 exact-text SVG candidates; 3 generators reproduce corrected7 and preserve passing2 byte-for-byte')
