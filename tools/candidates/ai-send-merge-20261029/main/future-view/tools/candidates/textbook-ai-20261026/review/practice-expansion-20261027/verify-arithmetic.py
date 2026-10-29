import ast
import hashlib
import json
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
data = json.loads((HERE / 'data.json').read_text())


def calculate(node):
    if isinstance(node, ast.Expression):
        return calculate(node.body)
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return Fraction(str(node.value))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        value = calculate(node.operand)
        return -value if isinstance(node.op, ast.USub) else value
    if isinstance(node, ast.BinOp):
        a, b = calculate(node.left), calculate(node.right)
        if isinstance(node.op, ast.Add):
            return a + b
        if isinstance(node.op, ast.Sub):
            return a - b
        if isinstance(node.op, ast.Mult):
            return a * b
        if isinstance(node.op, ast.Div):
            return a / b
        if isinstance(node.op, ast.Pow) and b.denominator == 1 and abs(b) <= 12:
            return a ** int(b)
    raise ValueError('Unsupported arithmetic')


calculations = []
for question in data['questions']:
    check = question.get('numericCheck')
    if not check:
        continue
    actual = calculate(ast.parse(check['expression'], mode='eval'))
    assert actual == Fraction(check['expected']), (question['id'], str(actual))
    calculations.append({'id': question['id'], 'value': str(actual)})
assert len(calculations) == 27
for invalid in ['__import__("os")', 'a+1', '2**1000']:
    try:
        calculate(ast.parse(invalid, mode='eval'))
    except ValueError:
        pass
    else:
        raise AssertionError('Unsafe expression accepted')
source = json.loads((ROOT / 'site-assets/material-bank.json').read_text())
unit = next(u for u in source['units'] if u['id'] == 'drill-math-1-signedcalc')
question = next(q for q in unit['tests'] if q['id'] == 'drill-math-1-signedcalc-test-14')
assert question['prompt'] == '次の計算をしよう。\n−15 − (−10)'
assert calculate(ast.parse('-15-(-10)', mode='eval')) == Fraction(question['answer']['value'])
inputs = []
for path in [HERE / 'data.json', Path(__file__), ROOT / 'site-assets/material-bank.json']:
    inputs.append({'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
result = {'status': 'passed', 'checks': 31, 'calculations': calculations,
          'sourceBindingArithmetic': {'id': question['id'], 'value': '-5'}, 'inputs': inputs,
          'scope': 'Independent AST and exact Fraction arithmetic for all27 numericCheck fields, three unsafe syntax refusals and the new actual-test source. No eval, network or grading of learner data. Non-numeric reasoning and UI are separate.'}
(HERE / 'arithmetic-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('Independent arithmetic:27 candidate expressions,3 invalid syntax guards,1 source check passed.')
