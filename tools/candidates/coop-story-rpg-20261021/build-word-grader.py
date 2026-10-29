"""Copy the existing pure word grader, without browser state or authored edits."""
from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent
R=H.parents[2]
source=R/'site-assets/eiken-vocab.js'
raw=source.read_text()
start='// ---- 判定 ----\n'
end='// ---- 1か月（日本時間） ----'
assert raw.count(start)==1 and raw.count(end)==1
body=raw.split(start,1)[1].split(end,1)[0]
module='// Generated from the existing pure grader. Run build-word-grader.py to update.\n'+body+'\nexport {normJa,normEn,judgeJa,judgeEn};\n'
(H/'word-grader.mjs').write_text(module)
digest=lambda data:hashlib.sha256(data).hexdigest()
(H/'word-grader-source.json').write_text(json.dumps({
 'source':'site-assets/eiken-vocab.js','sourceSha256':digest(source.read_bytes()),
 'pureBodySha256':digest(body.encode()),'moduleSha256':digest(module.encode()),
 'authoredAnswersChanged':False,'browserStateImported':False,
 'verified':False
},ensure_ascii=False,indent=2)+'\n')
