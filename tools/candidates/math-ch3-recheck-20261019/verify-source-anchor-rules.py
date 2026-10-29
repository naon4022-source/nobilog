"""Exercise the actual candidate builder function against edited, wrong-page, duplicate and invalid rules."""
from pathlib import Path
import copy,json,re,sys
H=Path(__file__).resolve().parent
text=(H.parents[2]/'教材整理/実装/build-textbook-book.py' if '--integrated' in sys.argv else H/'layout-candidate/build-textbook-book.py').read_text();function=text[text.index('def apply_extras('):text.index('def read_practice(')]
rule=json.loads((H/'layout-candidate/annotation-compatibility.json').read_text())[0]
def apply(blocks,pid='M1-P147',patch=None):
 saved=copy.deepcopy(rule)
 if patch:saved.update(patch)
 ns={'re':re,'extras':{'synthetic':{'annotationCompatibility':[saved]}}};exec(compile(function,'actual-candidate-apply-extras','exec'),ns)
 page={'pid':pid,'blocks':copy.deepcopy(blocks)};ns['apply_extras']('synthetic',page);return page
positive=apply([rule['block']]);assert positive['blocks'][0]['annotationAnchor']==rule['anchor']
edited=copy.deepcopy(rule['block']);edited['x']='different source content';assert 'annotationAnchor' not in apply([edited])['blocks'][0]
assert 'annotationAnchor' not in apply([rule['block']],pid='M1-P148')['blocks'][0]
assert all('annotationAnchor' not in b for b in apply([rule['block'],rule['block']])['blocks'])
try:apply([rule['block']],patch={'anchor':'invalid'})
except ValueError:pass
else:raise AssertionError('invalid compatibility key must reject')
print('5 source anchor cases passed: exact match only; edited block, wrong page, duplicate and invalid key cannot rebind notes')
