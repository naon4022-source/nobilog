"""Validate later reviewed edits before using historical predecessor evidence."""
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as E

H=Path(__file__).resolve().parent
R=H.parents[2]
S=R/'教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース'
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()


def before_zoom_file(relative):
    current=R/relative
    row=next((r for r in load(H/'zoom-exact-edits.json')['files'] if r['file']==relative),None)
    if row is None:
        return current
    previous=R/row['beforeFile']
    assert sha(previous)==row['beforeSha256']
    text=previous.read_text()
    last=len(text)+1
    for edit in reversed(row['edits']):
        a,b=edit['start'],edit['end']
        assert 0<=a<=b<last
        assert text[a:b]==edit['before']
        text=text[:a]+edit['after']+text[b:]
        last=a
    assert text.encode()==current.read_bytes(),relative+': unreviewed change outside exact zoom delta'
    assert sha(current)==row['afterSha256']
    return previous


def semantic(root):
    texts,shapes=[],[]
    def walk(n):
        if 'data-stacked-fraction' in n.attrib:
            texts.append(n.attrib['data-stacked-fraction'])
            return
        tag=n.tag.rsplit('}',1)[-1]
        if tag=='text':
            texts.append(''.join(n.itertext()))
            return
        if tag in {'path','line','rect','circle','ellipse','polygon','polyline'}:
            shapes.append((tag,sorted(n.attrib.items())))
        for child in n:walk(child)
    walk(root)
    return texts,shapes


def reviewed_svg_digest(ident, reviewed_sha, final):
    """Accept only the exact visually reviewed font-metrics successor."""
    if sha(final)==reviewed_sha:
        return final
    directory=H/'font-metrics-repair-20261024'
    receipt=load(directory/'integration.json')
    assert sha(directory/'manifest.json')==receipt['reviewManifestSha256']
    assert sha(directory/'visual-review.json')==receipt['visualReviewSha256']
    row=next(x for x in receipt['items'] if x['id']==ident)
    assert row['kind']=='integrated' and row['beforeSha256']==reviewed_sha
    registry=load(S/row['registry']/'manifest.json')['items'][ident]
    current=S/row['registry']/registry['file']
    assert final.resolve() in {current.resolve(),(R/row['target']).resolve(),(R/row['copy']).resolve()}
    assert sha(current)==sha(R/row['target'])==sha(R/row['copy'])==sha(R/row['candidate'])==row['afterSha256']
    assert registry['afterSha256']==row['afterSha256']
    visual=load(directory/'visual-review.json')
    review=next(x for x in visual['items'] if x['id']==ident)
    assert review['beforeSha256']==reviewed_sha and review['svgSha256']==row['afterSha256']
    assert sha(R/review['screenshot'])==review['screenshotSha256']
    assert sha(R/visual['automaticAudit'])==visual['automaticAuditSha256']
    audit=load(R/visual['automaticAudit'])
    audited=next(x for x in audit['results'] if x['id']==ident)
    assert audited['sha256']==row['afterSha256'] and not any(g['issues'] for g in audited['groups'])
    previous=R/row['beforeFile']
    assert sha(previous)==sha(R/row['copyBeforeFile'])==reviewed_sha
    assert semantic(E.parse(previous).getroot())==semantic(E.parse(current).getroot())
    return previous


def svg_predecessor(path,expected_sha):
    path=path.resolve()
    if sha(path)==expected_sha:
        return path
    repair=H/'font-metrics-repair-20261024/integration.json'
    if repair.exists():
        for row in load(repair)['items']:
            if row['kind']=='integrated' and row['beforeSha256']==expected_sha and path in {(R/row['target']).resolve(),(R/row['copy']).resolve()}:
                return reviewed_svg_digest(row['id'],expected_sha,path)
    for registry,backup,review_name in [
        ('縦分数_20261023','before-fraction-integration','fraction-visual-review.json'),
        ('縦分数_2章_20261023','before-chapter2-fraction-integration','chapter2-fraction-visual-review.json'),
        ('縦分数_4章_20261024','before-chapter4-fraction-integration','chapter4-fraction-visual-review.json'),
        ('縦分数_5章_20261024','font-metrics-repair-20261024/previous','chapter5-fraction-visual-review.json'),
        ('縦分数_6章_20261025','before-chapter6-fraction-integration','chapter6-fraction-visual-review.json'),
        ('縦分数_巻末_20261025','before-appendix-fraction-integration','appendix-fraction-visual-review.json'),
    ]:
        directory=S/registry
        rows=load(directory/'manifest.json')['items']
        for ident,row in rows.items():
            if path not in [(R/row['target']).resolve(),(R/row['copy']).resolve()]:continue
            assert row['beforeSha256']==expected_sha
            final=directory/row['file']
            assert sha(final)==sha(R/row['target'])==sha(R/row['copy'])==row['afterSha256']
            review=load(H/review_name)
            if registry=='縦分数_4章_20261024':
                item=next(x for x in review['reviews'] if x['id']==ident)
                assert sha(reviewed_svg_digest(ident,item['candidateSha256'],final))==item['candidateSha256']
                assert sha(R/item['screenshot'])==item['screenshotSha256']
            else:
                item=next(x for x in review['items'] if x['id']==ident)
                assert sha(reviewed_svg_digest(ident,item['svgSha256'],final))==item['svgSha256']
            original=H/backup/path.relative_to(R)
            assert sha(original)==expected_sha
            assert semantic(E.parse(original).getroot())==semantic(E.parse(final).getroot()),ident+': changed original text/shapes'
            return original
    raise AssertionError(str(path)+': no reviewed successor chain for expected '+expected_sha)


def logical_book_predecessor(path):
    """Verify the user-approved one-sentence delta before checking older layouts."""
    path=Path(path).resolve()
    receipt_path=H/'prime-domain-20261024/receipt.json'
    if not receipt_path.exists() or path!=(R/'site-assets/textbook-book-math1.json').resolve():
        return path
    receipt=load(receipt_path)
    assert receipt['approval']=='User explicitly approved this explanation only'
    for row in receipt['files']:
        previous,current=R/row['beforeFile'],R/row['file']
        assert sha(previous)==row['beforeSha256'] and sha(current)==row['afterSha256']
        text=previous.read_text()
        assert text.count(receipt['before'])==1
        assert text.replace(receipt['before'],receipt['after']).encode()==current.read_bytes()
    row=next(r for r in receipt['files'] if (R/r['file']).resolve()==path)
    return R/row['beforeFile']
