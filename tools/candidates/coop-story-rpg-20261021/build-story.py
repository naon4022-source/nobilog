"""Build the new RPG story draft, without touching textbook content."""
from pathlib import Path
import hashlib,json,re
H=Path(__file__).resolve().parent
source=(H/'物語構成.md').read_text()
chapters=list(re.finditer(r'^## 第(\d+)章[　 ]+(.+)$',source,re.M))
assert [int(m[1]) for m in chapters]==list(range(1,13))
stages=[]
for i,match in enumerate(chapters):
 text=source[match.end():chapters[i+1].start() if i+1<len(chapters) else len(source)].strip()
 headings=list(re.finditer(r'^### ([一二三])[　 ]+(.+)$',text,re.M))
 assert [m[1] for m in headings]==['一','二','三']
 sections=[]
 for j,heading in enumerate(headings):
  prose=text[heading.end():headings[j+1].start() if j+1<len(headings) else len(text)].strip()
  paragraphs=prose.split('\n\n')
  assert all(p.strip() for p in paragraphs)
  assert '\n\n'.join(paragraphs)==prose
  sections.append({'title':heading[2],'paragraphs':paragraphs})
 stages.append({'id':f'story_{i+1:02d}','number':i+1,'title':match[2],'sections':sections,'nextStageId':f'story_{i+2:02d}' if i<11 else None})
catalog={'v':1,'title':'余白の国と、名前のない手紙','status':'draft','stages':stages}
serialized=json.dumps(catalog,ensure_ascii=False,indent=2)+'\n'
(H/'story-catalog.json').write_text(serialized)
(H/'story-catalog.mjs').write_text('export default '+serialized.rstrip()+';\n')
report={'status':'all twelve draft chapters serialized; content and game UI review remain','sourceSha256':hashlib.sha256((H/'物語構成.md').read_bytes()).hexdigest(),'jsonSha256':hashlib.sha256((H/'story-catalog.json').read_bytes()).hexdigest(),'moduleSha256':hashlib.sha256((H/'story-catalog.mjs').read_bytes()).hexdigest(),'chapters':len(stages),'sections':sum(len(s['sections']) for s in stages),'paragraphs':sum(len(x['paragraphs']) for s in stages for x in s['sections']),'proseCharacters':sum(len(p) for s in stages for x in s['sections'] for p in x['paragraphs']),'storyReviewed':False,'mainIntegrated':False,'published':False}
(H/'story-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
