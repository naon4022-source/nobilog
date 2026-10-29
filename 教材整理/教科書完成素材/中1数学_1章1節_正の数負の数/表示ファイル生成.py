# -*- coding: utf-8 -*-
from pathlib import Path
import re,html,shutil,json
root=Path(__file__).resolve().parents[3];src=root/'教材整理/Claude_Codex共有/中1_数学_正負の数';assets=root/'site-assets'
shutil.copy(str(Path(__file__).parent/'textbook-math1-intro.jpg'),assets/'textbook-math1-intro.jpg');shutil.copy(str(Path(__file__).parent/'textbook-math1-directions.jpg'),assets/'textbook-math1-directions.jpg')
figures={}
for i,p in enumerate(sorted((src/'図').glob('*.svg'))):
 name='textbook-math1-'+p.name.split('_')[0]+'.svg';shutil.copy(p,assets/name);figures[p.name]=name

def inline(t):
 t=html.escape(t);t=re.sub(r'\*\*(.*?)\*\*',r'<strong>\1</strong>',t);t=re.sub(r'`(.*?)`',r'<code>\1</code>',t);return t

def md(t):
 out=[];listing=None;table=False
 for line in t.splitlines():
  line=line.strip()
  kind='ul' if line.startswith('- ') else 'ol' if re.match(r'^\d+\. ',line) else None
  if kind!=listing and listing:out.append('</'+listing+'>');listing=None
  if table and not line.startswith('|'):out.append('</tbody></table>');table=False
  if not line or line=='---':continue
  if line.startswith('|'):
   if re.match(r'^\|[-| ]+\|$',line):continue
   cells=[inline(c.strip()) for c in line.strip('|').split('|')]
   if not table:out.append('<table><tbody>');table=True
   out.append('<tr>'+''.join('<td>'+c+'</td>' for c in cells)+'</tr>');continue
  if '〔図 ' in line:
   name=re.search(r'〔図 ([^〕]+)',line).group(1);remaining=re.sub(r'〔図 [^〕]+〕','',line).strip();out.append('<p>'+inline(remaining)+'</p>' if remaining else '');out.append('<img class="diagram" src="/'+figures[name]+'" alt="'+html.escape(name.split('_',1)[-1].replace('.svg',''))+'" loading="lazy">');continue
  if line.startswith('〔イラスト '):
   name='intro' if 'img-01' in line else 'directions';alt='冬の朝の屋外の温度計と冷凍庫' if name=='intro' else '左のコマは右へ、右のコマは左へ歩く。反対の向き。';out.append('<figure><img src="/textbook-math1-'+name+'.jpg" alt="'+alt+'" loading="lazy"><figcaption>'+alt+'</figcaption></figure>');continue
  if kind:
   if not listing:out.append('<'+kind+'>');listing=kind
   out.append('<li>'+inline(re.sub(r'^(?:- |\d+\. )','',line))+'</li>');continue
  h=re.match(r'^(#{1,6}) (.*)',line)
  if h:level=min(4,len(h[1])+1);out.append('<h'+str(level)+'>'+inline(h[2])+'</h'+str(level)+'>')
  else:out.append('<p>'+inline(line)+'</p>')
 if listing:out.append('</'+listing+'>')
 if table:out.append('</tbody></table>')
 return '\n'.join(out)
body=(src/'本文.md').read_text();body=body[body.index('## はじめに'):];parts=re.split(r'(?m)^## ',body);sections=[]
for i,part in enumerate(parts):
 if not part.strip():continue
 title,_,content=part.partition('\n');sections.append((f'lesson-{i}',title,md(content)))

# Reorganize Claude's existing words into smaller reading pages; do not author new math.
reader_pages=[];topic_content={};topic_links={};group_html=[]
for group_id,group_title,content in sections:
 chunks=[];heads=list(re.finditer(r'<h4>(.*?)</h4>',content,re.S))
 if not heads:chunks=[(group_title,content)]
 else:
  leading=content[:heads[0].start()]
  if leading.strip():chunks.append((group_title,leading))
  for k,h in enumerate(heads):
   title=html.unescape(re.sub(r'<[^>]+>','',h[1]));fragment=content[h.end():heads[k+1].start() if k+1<len(heads) else len(content)]
   topic_content[title]=fragment
   levels=list(re.finditer(r'<p><strong>(基本|標準|応用)</strong>',fragment)) if title.startswith('例題') else []
   if levels:
    for j,l in enumerate(levels):chunks.append((title+'・'+l[1],fragment[l.start():levels[j+1].start() if j+1<len(levels) else len(fragment)]))
   else:chunks.append((title,fragment))
 cards=[]
 for i,(title,fragment) in enumerate(chunks):
  pid=f'{group_id}-page-{i+1}';topic_links.setdefault(title,pid);reader_pages.append((pid,title))
  # Keep mathematical SVG diagrams wide enough to read their labels; scene illustrations may sit beside the text.
  media=re.findall(r'<figure>.*?</figure>|<img\b[^>]*>',fragment,re.S)
  diagram=any('class="diagram"' in x for x in media)
  text=re.sub(r'<figure>.*?</figure>|<img\b[^>]*>','',fragment,flags=re.S)
  visual=''.join(media)
  for source in re.findall(r'src="([^"]+\.svg)"',visual):visual+=f'<a class="diagram-open" href="{html.escape(source,quote=True)}" target="_blank" rel="noopener">図を大きく見る</a>'
  inner=(f'<div class="page-content {"has-diagram" if diagram else "has-visual"}"><div class="visual-column">{visual}</div><div class="text-column">{text}</div></div>' if media else f'<div class="page-content"><div class="text-column">{fragment}</div></div>')
  cards.append(f'<article class="lesson lesson-page" id="{pid}" data-page-kind="explanation"><p class="page-label">{inline(group_title.split("　（")[0])} ／ {i+1}/{len(chunks)}</p><h3>{inline(title)}</h3>{inner}</article>')
 group_html.append(f'<section class="lesson-group" id="{group_id}"><h2 class="group-heading">{inline(group_title)}</h2>'+''.join(cards)+'</section>')
hint_prefix={1:'1-1',2:'1-1',3:'1-3',4:'1-4',5:'2-2',6:'2-2',7:'2-3',8:'3-2',9:'3-2',10:'3-3',11:'3-3',12:'3-4'}
def learning_guide(n):
 title=next(k for k in topic_content if k.startswith(hint_prefix[n]+'　'));fragment=topic_content[title]
 fragment=re.sub(r'<figure>.*?</figure>|<img\b[^>]*>','',fragment,flags=re.S)
 return f'<aside class="learning-guide" aria-label="この問題に関連する考え方"><h4>考え方を確認</h4>{fragment}<a href="#{topic_links[title]}">関連する説明へ戻る</a></aside>'

answers=(src/'解答.md').read_text();ans={int(n):md(t) for n,t in re.findall(r'(?ms)^### (\d+)　(.*?)(?=^### |\Z)',answers)}
qtext=(src/'確認問題.md').read_text();qs=re.findall(r'(?ms)^\*\*(\d+)\*\*　(.*?)(?=^\*\*\d+\*\*|\Z)',qtext)
labels={3:['（1）整数','（2）自然数'],4:['点A','点B']};questionhtml=[]
for n,t in qs:
 n=int(n);t=t.strip();t=t.replace('〔図 q4_数直線の読み取り.svg〕','')
 inputs=''.join(f'<label>{html.escape(label)}<input data-part="{j}" aria-label="問題{n} {html.escape(label)}" autocomplete="off" maxlength="200"></label>' for j,label in enumerate(labels.get(n,['自分の答え'])))
 image='<img class="diagram" src="/textbook-math1-q4.svg" alt="−3から3まで、1目盛り0.5の数直線。点Aと点Bの値を読み取る。" loading="lazy">' if n==4 else ''
 questionhtml.append(f'<section class="question" id="question-{n}"><h3>確認{n}</h3>{learning_guide(n)}{md(t)}{image}<form data-question="{n}">{inputs}<button type="submit">答えを確かめる</button><p role="status"></p></form><details><summary>答えと考え方</summary>{ans[n]}</details></section>')

toc=''.join('<a href="#'+pid+'">'+inline(title.split('　（')[0])+'</a>' for pid,title in reader_pages)
page='''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中1数学・正の数と負の数｜のびログ</title><link rel="stylesheet" href="/textbook-reader.css"><script src="/textbook-check.js" defer></script></head><body><main class="reader-shell"><header class="reader-header"><a href="/">← のびログへ戻る</a><p class="source">中1数学・1章1節／教科書p12〜23・ワークp2〜5</p><h1>0をこえて、数の世界を広げよう</h1><p>考え方を小さく区切って読み、例題の手順と確認問題で確かめよう。</p></header><aside class="reader-sidebar"><details class="toc-panel" open><summary>この節の目次</summary><nav aria-label="この節の目次">'''+toc+'''<a href="#practice">考え方付き確認問題12問</a></nav></details></aside><div class="reader-content">'''+''.join(group_html)+'''<section id="practice"><h2>考え方付き確認問題12問</h2><p>半角・全角の数字、−・-・－を使えます。分数は2/9のように入力。ここでの確認は成績に加算しません。画面を閉じると入力は消えます。</p>'''+''.join(questionhtml)+'''</section><footer><p>図と例題は独自制作。原資料の手書き回答は正解の根拠にしていません。</p><a href="#">↑ はじめへ</a></footer></div></main></body></html>'''
(assets/'textbook-positive-negative.html').write_text(page)
