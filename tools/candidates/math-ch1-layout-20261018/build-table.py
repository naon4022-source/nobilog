"""Clarify the blank D09 table using only the existing P059/P060 explanation."""
import pathlib, hashlib, json, xml.etree.ElementTree as ET
here = pathlib.Path(__file__).resolve().parent
root = here.parents[2]
name = 'M1-C1-S2-D09.svg'
before = (here/'previous'/name).read_text()
source = root/'教材整理/Claude_Codex共有/数学全体制作/Claude原稿/M1-C1-S2/本文.md'
draft = source.read_text()
labels = ['「いつでもできるか」の調べ方','その集合の数を2つ選んで、計算してみる。','（0 でわることは除く）']
for text in labels: assert text in draft
ns = '{http://www.w3.org/2000/svg}'
tree = ET.fromstring(before)
for n in tree.iter():
    if n.tag in (ns+'rect',ns+'text') and n.get('y') and float(n.get('y')) >= 270:
        n.set('y',str(int(float(n.get('y'))+40)))
group = tree.find(ns+'g')
for i,(y,size,text) in enumerate(zip([200,245,287],[40,36,34],labels)):
    node = ET.Element(ns+'text',{'x':'800','y':str(y),'font-size':str(size),'text-anchor':'middle'})
    node.text = text; group.insert(2+i,node)
old = [''.join(n.itertext()) for n in ET.fromstring(before).iter(ns+'text')]
now = [''.join(n.itertext()) for n in tree.iter(ns+'text')]
assert [t for t in now if t not in labels] == old
cells = [n for n in tree.iter(ns+'rect') if n.get('fill')=='white']
assert len(cells)==12
for r in cells:
    x,y,w,h = [float(r.get(k)) for k in ('x','y','width','height')]
    assert y+h <= 870
    assert not any(x<float(t.get('x'))<x+w and y<float(t.get('y'))<y+h for t in tree.iter(ns+'text'))
ET.register_namespace('',ns[1:-1]);candidate = ET.tostring(tree,encoding='unicode')
(here/'svg'/name).write_text(candidate)
(here/'D09-source-proof.json').write_text(json.dumps({'id':name[:-4],'source':str(source.relative_to(root)),'paragraphs':['M1-P059','M1-P060'],'sourceSha256':hashlib.sha256(draft.encode()).hexdigest(),'originalSha256':hashlib.sha256(before.encode()).hexdigest(),'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest(),'originalLabelsUnchanged':True,'blankAnswerCells':12,'addedText':labels},ensure_ascii=False,indent=2)+'\n')
print('D09: three existing source lines added in reading order; all original labels and 12 blank answer cells preserved.')
