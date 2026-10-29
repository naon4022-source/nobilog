"""Hide the complete later-practice vowel answer in this diagram only; keep teaching sources intact."""
from pathlib import Path
import ast
import copy
import hashlib
import json
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DRAW = ROOT / '教材整理/Claude_Codex共有/教科図解'
sys.path.insert(0, str(DRAW))
from hints import dq

sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
relative = Path('教材整理/Claude_Codex共有/国語全体制作/原稿/u02.py')
source = HERE / 'output' / relative
before_sha = sha(source)
tree = ast.parse(source.read_text())
unit = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'UNIT' for t in n.targets))
lesson = unit['lessons'][4]
answers = [(q, a) for q, a in lesson['p'] if '母音' in q]
assert len(answers) == 1
question, answer = answers[0]
assert answer == 'あ・い・う・え・お'
presented = copy.deepcopy(lesson)
old = presented['keys'][1][1][0]
assert old.count(answer) == 1
presented['keys'][1][1][0] = old.replace(answer, '（？）')
assert presented['q'] == lesson['q'] and presented['p'] == lesson['p'] and presented['ex'] == lesson['ex']
folder = HERE / 'figures/answer-mask-v2'
folder.mkdir()
output = folder / 'K1-C2-S5-DQ.svg'
output.write_text(dq('K1-C2-S5', presented))
assert answer not in output.read_text()
assert sha(source) == before_sha
result = {'status': 'diagram-only complete-answer masking candidate; layout/visual pending', 'id': 'K1-C2-S5-DQ',
          'sourceFile': source.relative_to(ROOT).as_posix(), 'sourceSha256': before_sha,
          'question': question, 'answerPreservedInSource': answer, 'displayReplacement': '（？）',
          'displayPath': ['keys', 1, 1, 0], 'beforeDisplay': old, 'afterDisplay': presented['keys'][1][1][0],
          'previousFigure': 'figures/candidate/K1-C2-S5-DQ.svg', 'previousSha256': sha(HERE / 'figures/candidate/K1-C2-S5-DQ.svg'),
          'candidate': output.relative_to(ROOT).as_posix(), 'sha256': sha(output),
          'scope': 'Private render-only lesson copy. Real author/book questions/answers/values and other7 candidates unchanged; no main writes.'}
(folder / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Masked only the later-practice vowel answer list; author/questions/answers preserved; main unchanged')
