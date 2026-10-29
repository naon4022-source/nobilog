# coding: utf-8
from pathlib import Path
import json,html
b=Path(__file__).resolve().parent
m=json.loads((b/'制作台帳.json').read_text())
candidates=[c for s in m['imageSlots'] for c in s['candidates'] if c['file']]
def e(x):return html.escape(str(x),quote=True)
head='''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中1数学 画像候補</title><style>body{margin:0;background:#f5f6f8;color:#233042;font:16px/1.7 system-ui}main{max-width:1200px;margin:auto;padding:20px}h1{font-size:26px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;background:white;border:1px solid #d6dce4;border-radius:12px;overflow:hidden}img{width:100%;aspect-ratio:3/2;object-fit:contain;background:white}figcaption{padding:12px;font-size:14px}.state{color:#596578}section{margin:32px 0}.placeholder{padding:18px;background:#e9edf1;border-radius:8px}a{color:#175ca4}code{overflow-wrap:anywhere}summary{cursor:pointer;padding:12px} @media(max-width:760px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:12px}h1{font-size:22px}}@media(max-width:360px){.grid{grid-template-columns:1fr}}@media print{body{background:white}img{filter:grayscale(1)}figure{break-inside:avoid}details{display:none}}</style><main><h1>中1数学 画像候補</h1>'''
parts=[head,f'<p>生成済み {len(candidates)} / 計画 {m["candidateCount"]}候補。採用は選定記録と各候補の状態で確認してください。4候補は見せ方の比較で、数値条件を変えるものではありません。</p><p><a href="README.md">説明</a> ・ <a href="Claudeへ送る指示.md">Claudeへの指示</a></p>']
for s in m['imageSlots']:
 ready=[c for c in s['candidates'] if c['file']]
 if not ready:continue
 parts.append(f'<section><h2>{e(s["id"])}</h2><p>{e(s["brief"])}</p><div class="grid">')
 for c in s['candidates']:
  parts.append('<figure>')
  if c['file']:parts.append(f'<a href="{e(c["file"])}"><img loading="lazy" src="{e(c["file"])}" alt="{e(s["brief"]+"・"+c["direction"])}"></a>')
  else:parts.append('<div class="placeholder">未生成</div>')
  parts.append(f'<figcaption><strong>{e(c["id"])}</strong><br>{e(c["direction"])}<br><span class="state">{e(c["status"])}</span></figcaption></figure>')
 parts.append('</div></section>')
parts.append('<details><summary>未生成の配置を見る（仕様待ちを含む）</summary>')
for s in m['imageSlots']:
 if not any(c['file'] for c in s['candidates']):parts.append(f'<p><code>{e(s["id"])}</code>：{e(s["brief"])}</p>')
parts.append('</details><p>原本ページと内容の照合・選定はClaudeが行います。教材全文の完成・公開を示す一覧ではありません。</p></main></html>')
(b/'候補を見る.html').write_text('\n'.join(parts))
print(f'生成済み候補{len(candidates)}、未生成{m["candidateCount"]-len(candidates)}。一覧を更新。')
