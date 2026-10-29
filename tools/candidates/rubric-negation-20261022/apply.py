# 2026-10-22 Claude: rubric questions whose correct answer naturally contains a negation ("〜しない", "少なく") were refused
# only because of the negation check. Allow natural negation, and add reject/required terms so reversed meanings stay wrong.
# Only the answer field of these 28 questions changes. Before/after is written to corrections.json.
import json,hashlib,pathlib
R=pathlib.Path(__file__).resolve().parents[3];D=R/'教材整理/確認済み'
CHANGES={
 'workbook-science-1-kansatsu-11':{},
 'workbook-science-1-hana-64':{'reject':[['むき出しではない','むき出しでない','むきだしではない','むきだしでない','露出していない','むき出しになっていない','むきだしになっていない']]},
 'workbook-science-1-bunrui-31':{},
 'workbook-science-1-daichi-43':{},
 'workbook-science-1-chisou-17':{},
 'workbook-science-1-chisou-65':{'reject':[['片づけない','片付けない','かたづけない','もどさない','戻さない','きれいにしない']]},
 'workbook-science-1-taisekigan-22':{'required':[['ない','なく','ずに','にくい','あまり']]},
 'workbook-science-1-kaseki-38':{'reject':[['遠浅ではない','遠浅でない','浅くない','浅い海ではない','浅い海でない']]},
 'workbook-science-1-kubetsu-27':{},
 'workbook-science-1-kubetsu-62':{'reject':[['回さない','まわさない','回さず','まわさず']]},
 'workbook-science-1-kubetsu-68':{},
 'workbook-science-1-kitai-1':{'reject':[['あおがない','あおがず','扇がない','手を使わない']]},
 'workbook-science-1-kitai-10':{'reject':[['燃やさない','もやさない','燃やすはたらきはない','燃やすはたらきがない']]},
 'workbook-science-1-kitai-65':{'reject':[['消えない','きえない','消えず']]},
 'workbook-science-1-noudo-14':{'reject':[['小さくない','ちいさくない']]},
 'workbook-science-1-youkaido-15':{'reject':[['蒸発させない','加熱しない','じょうはつさせない']]},
 'workbook-science-1-joutai-20':{'reject':[['体積は変わらない','体積が変わらない','体積は変化しない','体積が小さく','体積は小さく']]},
 'workbook-science-1-joutai-27':{},
 'workbook-science-1-futten-11':{'reject':[['上がらない','上昇しない','あがらない','上がらず']]},
 'workbook-science-1-hansha-33':{'reject':[['反射しない','はんしゃしない','反射せず']]},
 'workbook-social-1-geo-kikou-55':{},
 'workbook-social-1-geo-seikatsu-43':{'reject':[['反射しない','はね返さない','反射せず']]},
 'workbook-social-1-hist-kamabunka-26':{},
 'workbook-social-1-geo-asia-45':{'reject':[['加盟していない','加盟していません']]},
 'workbook-social-1-hist-onin-18':{},
 'workbook-social-1-geo-oceania-46':{},
 'workbook-english-1-l4a-56':{},
 'workbook-english-1-l5-55':{},
}
log=[];touched={}
for f in sorted(D.glob('*.json')):
  u=json.loads(f.read_text(encoding='utf-8'));hit=False
  for q in [*u.get('questions',[]),*u.get('tests',[])]:
    if q['id'] not in CHANGES:continue
    a=q['answer'];assert a['kind']=='rubric' and not a.get('allowNegation'),q['id']
    before=json.loads(json.dumps(a));a['allowNegation']=True
    for k,v in CHANGES[q['id']].items():a[k]=(a.get(k) or [])+v
    log.append({'id':q['id'],'file':f.name,'before':before,'after':a});hit=True
  if hit:
    old=hashlib.sha256(f.read_bytes()).hexdigest();raw=f.read_text(encoding='utf-8');assert raw.rstrip('\n')==json.dumps(json.loads(raw),ensure_ascii=False,indent=1),f.name;f.write_text(json.dumps(u,ensure_ascii=False,indent=1)+('\n' if raw.endswith('\n') else ''),encoding='utf-8')
    touched[f.name]={'before':old,'after':hashlib.sha256(f.read_bytes()).hexdigest()}
assert len(log)==len(CHANGES),(len(log),len(CHANGES))
(pathlib.Path(__file__).parent/'corrections.json').write_text(json.dumps({'purpose':'natural negation in correct rubric answers (2026-10-22 Claude)','changes':log,'files':touched},ensure_ascii=False,indent=1),encoding='utf-8')
print('changed',len(log),'questions in',len(touched),'files')
