# coding: utf-8
"""Claude原稿を変更せず、出典区分を保ったローカル確認用表示を生成する。"""
from pathlib import Path
import re, html, json, hashlib
ROOT=Path(__file__).resolve().parent
CATALOG=json.loads((ROOT/'制作台帳.json').read_text())
SELECTED={}
for slot in CATALOG['imageSlots']:
    if slot['selected']:
        chosen=next(c for c in slot['candidates'] if c['id']==slot['selected'])
        assert hashlib.sha256((ROOT/chosen['file']).read_bytes()).hexdigest()==chosen['sha256']
        SELECTED[slot['id']]=chosen

def inline(text):
    text=html.escape(text)
    text=re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',text)
    return re.sub(r'`(.*?)`',r'<code>\1</code>',text)

def render(text):
    out=[]; listing=False; table=False
    for line in text.splitlines():
        line=line.strip()
        if listing and not line.startswith('- '): out.append('</ul>'); listing=False
        if table and not line.startswith('|'): out.append('</tbody></table></div>'); table=False
        if not line or line=='---':continue
        d=re.fullmatch(r'<details><summary>(.*?)</summary>(.*?)</details>',line)
        if d:out.append('<details><summary>'+inline(d[1])+'</summary><p>'+inline(d[2])+'</p></details>');continue
        if line.startswith('|'):
            if re.fullmatch(r'[| :\-]+',line):continue
            if not table:out.append('<div class="table-scroll"><table><tbody>');table=True
            out.append('<tr>'+''.join('<td>'+inline(c.strip())+'</td>' for c in line.strip('|').split('|'))+'</tr>');continue
        if line.startswith('- '):
            if not listing:out.append('<ul>');listing=True
            out.append('<li>'+inline(line[2:])+'</li>');continue
        h=re.match(r'^(#{1,6}) (.*)',line)
        if h:out.append('<h3>'+inline(h[2])+'</h3>');continue
        if line.startswith('［図 ') or line.startswith('［絵 '):
            slotid=re.search(r'M1-C\d+-(?:S\d+-(?:FIG\d+|INTRO|APPLY)|OPEN-SCENE)',line)
            chosen=SELECTED.get(slotid.group()) if slotid else None
            if chosen:
                url=html.escape(chosen['file'],quote=True)
                is_diagram=chosen['file'].endswith('.svg')
                image_class='selected-diagram' if is_diagram else 'selected-scene'
                caption=line.split('：',1)[-1].rstrip('］') if '：' in line else '章の導入場面'
                out.append('<figure><div class="diagram-scroll"><img class="'+image_class+'" src="'+url+'" alt="'+html.escape(caption,quote=True)+'"></div><figcaption>'+inline(caption)+'</figcaption><a class="diagram-open" href="'+url+'" target="_blank" rel="noopener">図を大きく見る</a></figure>')
            else:out.append('<aside class="unready">'+inline(line)+'<br>画像候補は未生成・未選定。条件を変えず制作する。</aside>')
            continue
        out.append('<p>'+inline(line)+'</p>')
    if listing:out.append('</ul>')
    if table:out.append('</tbody></table></div>')
    return '\n'.join(out)

rows=[];articles=[];nav=[]
def unit_order(path):
    match=re.fullmatch(r'M1-C(\d+)-(OPEN|REVIEW|S\d+)',path.name)
    if not match:return (999,999,path.name)
    role=match[2]
    return (int(match[1]),0 if role=='OPEN' else 999 if role=='REVIEW' else int(role[1:]),path.name)
for unit in sorted((ROOT/'Claude原稿').glob('M1-*'),key=unit_order):
    src=unit/'本文.md'
    if not src.exists():continue
    text=src.read_text();sections=re.split(r'(?m)^## ',text)[1:];total=0
    for s in sections:
        heading,_,body=s.partition('\n');chunks=re.split(r'(?m)^### ',body);lead=chunks[0].strip();parts=[]
        if lead:parts.append((heading,lead))
        for chunk in chunks[1:]:
            title,_,content=chunk.partition('\n');parts.append((title,content.strip()))
        # Put a standalone figure with its first explanation, preserving all authored words.
        if len(parts)>1 and all(not line.strip() or line.strip().startswith(('［図 ','［絵 ')) for line in parts[0][1].splitlines()):
            first=parts.pop(0)
            parts[0]=(parts[0][0],first[1]+'\n\n'+parts[0][1])
        # Keep practice with the previous authored explanation, not a page full of questions.
        merged=[]
        for title,content in parts:
            if title.startswith('やってみよう') and merged:
                merged[-1]=(merged[-1][0],merged[-1][1]+'\n\n### '+title+'\n'+content)
            else:merged.append((title,content))
        for title,content in merged:
            if not content.strip():continue
            total+=1;key=unit.name+'-reading-'+str(total)
            nav.append('<a href="#'+key+'">'+inline(unit.name+' '+title)+'</a>')
            articles.append('<article id="'+key+'"><p class="source">'+inline(unit.name+'／原稿区分 '+heading)+'<br>正式なページ割当は未確定（原稿の提案を表示）</p><h2>'+inline(title)+'</h2>'+render(content)+'</article>')
    rows.append({'unitId':unit.name,'source':'Claude原稿/'+unit.name+'/本文.md','sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'readingCards':total,'status':'原稿の表示確認用・教材内容の独立点検前','pageIds':'原稿の割当提案を表示。正式割当は未確定'})
css="""*{box-sizing:border-box}html{font:18px/1.85 system-ui,-apple-system,"Hiragino Sans",sans-serif;color:#25372e;background:#f4f7f4}body{margin:0}main{max-width:1440px;margin:auto;padding:24px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:24px}header{grid-column:1/-1}header,article,nav{background:white;border:1px solid #d5dfd6;border-radius:16px;padding:24px}article{margin-bottom:24px;scroll-margin-top:20px}.content{min-width:0}aside.sidebar{position:sticky;top:16px;align-self:start}nav{padding:12px;max-height:85dvh;overflow:auto}nav a{display:block;min-height:44px;padding:8px;color:#265c3d;font-size:15px;overflow-wrap:anywhere}.source{font-size:14px;color:#59685d}p,li,td,h2,h3{overflow-wrap:anywhere}h2{font-size:24px}h3{font-size:21px}details{border:1px solid #d5dfd6;padding:12px;margin:16px 0;border-radius:10px}summary{min-height:44px;cursor:pointer}a:focus-visible,summary:focus-visible{outline:3px solid #af7720;outline-offset:3px}.unready{border:1px dashed #7b897f;background:#fafafa;padding:16px;font-size:15px}.table-scroll{overflow-x:auto}.diagram-scroll{overflow-x:auto;max-width:100%}.selected-diagram{display:block;width:100%;min-width:600px;max-width:1000px;height:auto}.selected-scene{display:block;width:100%;max-width:900px;height:auto;margin:auto}figure{margin:18px 0}figcaption{font-size:14px;color:#59685d}.diagram-open{display:inline-flex;align-items:center;min-height:44px}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #ddd}article ul{padding-left:24px}@media(max-width:999px){main{grid-template-columns:minmax(0,1fr);padding:18px}aside.sidebar{position:static}nav{max-height:28dvh}}@media(max-width:500px){html{font-size:17px}main{padding:10px}article,header{padding:16px}}@media print{html{color:black;background:white;font-size:12pt}main{display:block;padding:0}.sidebar{display:none}article,header{border-color:black}h2,h3{break-after:avoid}.table-scroll{overflow:visible}.selected-diagram{min-width:0;filter:grayscale(1)}.selected-scene{filter:grayscale(1)}.diagram-open{display:none}}"""
output='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中1数学・Claude原稿の確認用表示</title><style>'+css+'</style><main><header><h1>中1数学：説明を小さく区切って読む</h1><p>Claudeの原稿をそのまま表示した確認用資料。アプリへ公開していません。解答・ヒントは押すまで閉じています。採用済みの図を表示し、その他の図は準備中としています。</p></header><aside class="sidebar"><details open><summary>節と説明の目次</summary><nav>'+''.join(nav)+'</nav></details></aside><div class="content">'+''.join(articles)+'</div></main></html>'
(ROOT/'原稿を読む.html').write_text(output)
(ROOT/'原稿表示台帳.json').write_text(json.dumps({'units':rows,'readingCards':sum(r['readingCards'] for r in rows),'verification':'表示構造のみ。内容正確性と旧ページID対応は未確認'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(rows,ensure_ascii=False))
