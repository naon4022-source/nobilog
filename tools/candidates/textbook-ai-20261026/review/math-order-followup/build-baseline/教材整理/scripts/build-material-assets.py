"""Package reviewed question banks, without distributing raw source photographs."""
from pathlib import Path
import json, shutil
ROOT=Path(__file__).resolve().parents[2]
materials=ROOT/'教材整理'
sources=json.loads((materials/'教材照合台帳.json').read_text())
units=[json.loads(p.read_text()) for p in sorted((materials/'確認済み').glob('*.json'))]
units=[u for u in units if u.get('status')=='ready' and u.get('subject')!='保健体育']
# 既存ドリルの並びを維持し、ワークも種類別に独立して収録する。
units.sort(key=lambda u:(u['mode']!='drill',u['subject'],u['grade'],min(q['source']['page'] for q in u['questions']),u['id']))
ids={q['source']['id'] for u in units for q in u['questions']+u['tests']}
registry=[{k:s[k] for k in ['id','file','sha256','mode','subject','grade','pages','verified']} for s in sources if s['id'] in ids]
for name in ['material-engine.js','material-ui.js','material-ui.css']:
    shutil.copyfile(materials/'実装'/name,ROOT/'site-assets'/name)
(ROOT/'site-assets/material-bank.json').write_text(json.dumps({'units':units,'sources':registry},ensure_ascii=False,separators=(',',':'))+'\n')
shutil.copyfile(materials/'実装/material-engine.js',ROOT/'cf-worker/src/material-engine.cjs')
(ROOT/'cf-worker/src/material-bank.mjs').write_text('export default '+json.dumps({'units':units,'sources':registry},ensure_ascii=False,separators=(',',':'))+';\n')
print(f'Material package: {len(units)} reviewed units, {len(registry)} source references; no source photographs')
