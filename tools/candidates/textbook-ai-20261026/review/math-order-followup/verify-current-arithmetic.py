"""Candidate-only arithmetic explanation audit; never writes runtime assets."""
from pathlib import Path
from fractions import Fraction
import ast, importlib.util, json, re, hashlib, random

HERE=Path(__file__).resolve().parent
source=Path('教材整理/実装/mathbank/expr.py')
spec=importlib.util.spec_from_file_location('candidate_expr',source)
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
checks=0
def check(value,message):
    global checks
    assert value,message
    checks+=1
def number(node):
    if isinstance(node,ast.Constant) and type(node.value) in (int,float):return Fraction(str(node.value))
    if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.USub,ast.UAdd)):
        value=number(node.operand);return -value if isinstance(node.op,ast.USub) else value
    if isinstance(node,ast.BinOp):
        a,b=number(node.left),number(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):return a/b
        if isinstance(node.op,ast.Pow) and b.denominator==1:return a**int(b)
    raise AssertionError('unsupported arithmetic syntax')
def independent(text):
    text=text.translate(str.maketrans({'−':'-','×':'*','÷':'/','[':'(',']':')','{':'(','}':')'}))
    text=re.sub('[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'**'+m[0].translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹','0123456789')),text)
    return number(ast.parse(text,mode='eval').body)

cases=[
 (e.Pow(e.Grp(e.C(e.L(2),'+',e.L(3))),2),['5²','25']),
 (e.Neg(e.Pow(e.Grp(e.C(e.L(2),'+',e.L(3))),2)),['−5²','−25']),
 (e.C(e.Pow(e.L(2),2),'+',e.Grp(e.C(e.L(3),'+',e.L(4)))),['2² + 7','4 + 7','11']),
 (e.Pow(e.Grp(e.C(e.L(-2),'+',e.L(-1))),2),['(−3)²','9'])
]
for expr,expected in cases:
    steps=e.steps(expr)
    check([re.sub(r'\s+','',s) for s in steps]==[re.sub(r'\s+','',s) for s in expected],'golden grouping/power sequence '+repr(steps))
    for step in steps:check(independent(step)==independent(e.show(expr)),'each displayed equality preserves value')
    check(len(steps)==len(set(steps)),'no stuck/repeated power step')

rng=random.Random(20261026)
for _ in range(100):
    a,b,c=[rng.randint(-8,8) for _ in range(3)]
    expr=e.C(e.Pow(e.Grp(e.C(e.L(a),'+',e.L(b))),2),'−',e.L(c))
    expected=Fraction((a+b)**2-c)
    check(independent(e.show(expr))==expected,'independent prompt value')
    steps=e.steps(expr)
    check(1<=len(steps)<=4,'bounded useful steps without stalled twelve passes')
    for step in steps:check(independent(step)==expected,'independently evaluated generated equality')
    check(independent(steps[-1])==expected,'final value preserved')

edits=json.loads((HERE/'source-edits.json').read_text())
for row in edits['files']:
    check(hashlib.sha256(Path(row['file']).read_bytes()).hexdigest()==row['candidateSha256'],'current main generator matches independently reviewed correction')
    check(hashlib.sha256(Path(row['candidateFile']).read_bytes()).hexdigest()==row['candidateSha256'],'candidate hash unchanged')
rows=json.loads((HERE/'explanation-candidates.json').read_text())
check(rows['count']==132 and len(rows['rows'])==132,'132 exact existing explanation candidates')
check(len({(q['unitId'],q['questionId']) for q in rows['rows']})==132,'no duplicated question edits')
for row in rows['rows']:
    check(row['after']==row['before'].replace('累乗 → かっこの中 → 乗除 → 加減','かっこの内側から、その中では累乗 → 乗除 → 加減（同じ順位は左から）'),'text-only explanation proposal; regeneration still required')

regenerated=json.loads((HERE/'regeneration-delta.json').read_text())
check(regenerated['questions']==325 and not regenerated['otherChanges'],'325 regenerated questions preserve all fields except explanations')
check(regenerated['explanationChanges']==132,'exact132 explanation changes in real generator output')
equations=0
for row in regenerated['changes']:
    expected=Fraction(row['answer']['value'])
    prompt=row['prompt'].rsplit('\n',1)[-1]
    quoted=re.fullmatch(r'Cさんは (.+) を計算して .+ と答えたが、まちがっていた。正しい答えを求めよう。',prompt)
    if quoted:prompt=quoted[1]
    check(independent(prompt)==expected,'independent original prompt agrees with unchanged official answer')
    match=re.search(r'計算の順序（.*?）にしたがうと、(.*?)。答え (.+)$',row['after'])
    check(bool(match),'every changed explanation has a verifiable equality chain')
    equations+=1
    for step in match[1].split(' ＝ '):check(independent(step)==expected,'regenerated equality agrees with independent arithmetic')
    check(independent(match[2])==expected,'regenerated final answer')
check(equations==132,'all132 equality explanations independently checked')

(HERE/'current-arithmetic-result.json').write_text(json.dumps({'status':'passed','checks':checks,'scope':'Current main generator. Four bracket/power golden sequences and100 deterministic expressions,132 regenerated equality explanations independently evaluated by separate Python AST/Fraction arithmetic. Exact325 regenerated question fields preserved except132 explanations; current main generator hashes match reviewed correction. Exact data preservation/browser/whole verified separately.'},ensure_ascii=False,indent=2)+'\n')
print(f'Current math order arithmetic: {checks} checks passed')
