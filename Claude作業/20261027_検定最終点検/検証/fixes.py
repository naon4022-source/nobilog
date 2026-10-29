# 採点の受けつけ方だけを直す候補（Claude 2026-10-27）。問題文・正答の中身・数値・解説は変えない。
import json, shutil, hashlib, pathlib
H = pathlib.Path(__file__).resolve().parent.parent
log = []
def add(q, *vals):
    acc = q['answer']['accepted']
    for v in vals:
        if v not in acc: acc.append(v); log.append((q['id'], '受けつける答えを追加', v))
def setk(q, k, v, why):
    q['answer'][k] = v; log.append((q['id'], f'answer.{k}={v}', why))
U = {}
for k in ['kanken-4', 'suken-3', 'suken-4', 'suken-5', 'rika-5']:
    U[k] = json.loads((H / '原本写し' / f'kentei-{k}.json').read_text(encoding='utf-8'))
Q = {q['id']: q for u in U.values() for q in u['questions']}
# F1 「となり合うことがあるか」に「いいえ」「なし」などの答え方
add(Q['kentei-suken-5-47'], 'いいえ', 'なし', 'となりあわない', '隣り合わない', 'ないです')
# F2 「x = -4」「(3, 2)」の空白・読点ちがいを受けつける（compact：空白を無視して比べる）
for i in ['suken-5-17', 'suken-5-18', 'suken-5-28', 'suken-5-43', 'suken-5-44', 'suken-4-18', 'suken-4-19', 'suken-4-20', 'suken-3-14', 'suken-3-15']:
    setk(Q['kentei-' + i], 'compact', True, '空白を入れた書き方（x = -4 など）を同じとみなす')
add(Q['kentei-suken-5-43'], '(3、2)', '3,2', '3、2')
add(Q['kentei-suken-5-44'], '(4、-5)', '4,-5', '4、-5')
# F3 合同条件の答え方
add(Q['kentei-suken-4-39'], '合同です', '合同だ', '2つの三角形は合同', '2つの三角形は合同である', '2つの三角形は合同になる')
# F4 「正しいか」に「誤り」「まちがい」
add(Q['kentei-suken-4-47'], '誤り', 'あやまり', 'まちがい', '間違い', '正しくありません')
# F5 変域の不等号 ≤（≦と同じ意味の字）
add(Q['kentei-suken-4-28'], '-2≤y≤8', '−2≤y≤8')
add(Q['kentei-suken-3-18'], '0≤y≤9')
add(Q['kentei-suken-3-29'], '-9≤y≤0', '−9≤y≤0')
# F6 等式の変形：2 − 2x/5 など同じ式の別の正しい形を受けつける（×・÷を使った形は今までどおり「惜しい」）
setk(Q['kentei-suken-4-24'], 'form', 'nosign', '「右辺だけ」の答えは (10−2x)/5 と 2−2x/5 のどちらも正しい')
out = H / '候補'
for k, u in U.items():
    (out / f'kentei-{k}.json').write_text(json.dumps(u, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
(H / '指摘と修正候補.tsv').write_text('id\t変更\t内容・理由\n' + ''.join(f'{a}\t{b}\t{c}\n' for a, b, c in log), encoding='utf-8')
print(len(log), '件の変更')
