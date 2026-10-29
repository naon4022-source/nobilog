"""Prepare reviewable integration copies; never overwrite main files."""
from pathlib import Path
import hashlib,json
H=Path(__file__).resolve().parent;R=H.parents[2];O=H/'integration-candidate';O.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
receipts=[]
def stage(name,patch):
 p=R/name;before=p.read_bytes();after=patch(before.decode()).encode();target=O/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(after)
 receipts.append({'file':name,'beforeSha256':sha(before),'afterSha256':sha(after)})
def once(s,a,b):
 assert s.count(a)==1,a
 return s.replace(a,b,1)
def vocab(s):
 s=once(s,'function render(){','let sentencePractice=null;\nfunction stopSentencePractice(){sentencePractice?.dispose();sentencePractice=null;}\nfunction render(){\n stopSentencePractice();')
 anchor="f.append(ex,el('p','ev-exja',w.exJa),speakBtn(w.ex,'例文'));"
 s=once(s,anchor,anchor+"\n if(root.NobiSentenceShadowing){const practice=el('div','ev-sentence-shadow');f.append(practice);sentencePractice=root.NobiSentenceShadowing.mount(practice,{text:w.ex,speak,stopSpeaking:()=>root.speechSynthesis?.cancel()});}")
 return once(s,'Object.freeze({mount,_:', 'Object.freeze({mount,stopSentencePractice,_:')
def index(s):
 anchor='    <script src="/eiken-vocab.js"'
 assert s.count(anchor)==1
 s=s.replace(anchor,'    <script src="/sentence-shadowing.js" onerror="if(location.hostname===\'127.0.0.1\'||location.hostname===\'localhost\')this.src=\'/site-assets/sentence-shadowing.js\'" defer></script>\n'+anchor,1)
 s=once(s,'    function switchView(id) {','    function switchView(id) {\n        window.NobiEikenVocab?.stopSentencePractice?.();')
 return once(s,'    async function logoutUser() {','    async function logoutUser() {\n        window.NobiEikenVocab?.stopSentencePractice?.();')
stage('site-assets/eiken-vocab.js',vocab);stage('index.html',index)
p=O/'site-assets/sentence-shadowing.js';p.write_bytes((H/'sentence-shadowing.js').read_bytes())
receipts.append({'file':'site-assets/sentence-shadowing.js','beforeSha256':None,'afterSha256':sha(p.read_bytes())})
(O/'manifest.json').write_text(json.dumps({'status':'prepared; untested; not integrated','files':receipts},indent=2)+'\n')
print('Prepared three integration candidates; main files unchanged')
