"""Build only the dedicated preview and include its actual Worker imports."""
from pathlib import Path
import hashlib
import importlib.util
import json
import re

ROOT = Path.cwd()
SOURCE = ROOT / 'cf-worker/src'
DEST = ROOT / 'preview/build'
IMPORT = re.compile(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"\n]+)['"]''')
PRESERVE = {'backend.mjs', 'web-push.js', 'problem-share.mjs', 'problem-pdf.mjs', 'admin-eiken-bank.json'}


def verify_math_media():
    proof = json.loads((ROOT / 'tools/candidates/textbook-ai-20261025/service-20261025/math-current-after-ui/completion.json').read_text())
    assert proof['videos'] == 75 and proof['plays'] == 300 and proof['viewports'] == 4
    for name, digest in proof['readerInputs'].items():
        assert Path(name).name == name
        assert hashlib.sha256((ROOT / 'site-assets' / name).read_bytes()).hexdigest() == digest, 'reviewed reader changed: ' + name
    manifest_bytes = (ROOT / proof['manifest']).read_bytes()
    assert hashlib.sha256(manifest_bytes).hexdigest() == proof['manifestSha256']
    manifest = json.loads(manifest_bytes)
    assert len(manifest['items']) == 75 and manifest['claude19Excluded'] is True
    for item in manifest['items']:
        assert re.fullmatch(r'/textbook-book-math1-[a-z0-9-]+\.mp4', item['src'])
        assert hashlib.sha256((ROOT / 'site-assets' / item['src'].lstrip('/')).read_bytes()).hexdigest() == item['sha256'], 'reviewed movie changed'


def gate_unfinished_coop():
    # The long cooperative story remains a V3 task. Gate only this release artifact.
    backend = DEST / 'backend.mjs'
    text = backend.read_text()
    branch = "    if(path.startsWith('/coop-story/')){\n      const {coopStoryRoute}=await import('./coop-story.mjs');\n      return scopedApiResponse(await coopStoryRoute(request,env,session,{json,requestJson,invalidBody,owner:await opaqueKey(session.token),snapshot:cloudSnapshotGet}),env);\n    }"
    assert text.count(branch) == 1, 'cooperative release boundary changed'
    backend.write_text(text.replace(branch, "    if(path.startsWith('/coop-story/'))return json({error:'not_available_in_preview'},404);"))
    page = DEST / 'assets/index.html'
    text = page.read_text()
    script = '<script src="/coop-story-entry.js" defer></script>'
    assert text.count(script) == 1, 'cooperative entry changed'
    page.write_text(text.replace(script, ''))
    ignore = DEST / 'assets/.assetsignore'
    previous = ignore.read_text() if ignore.exists() else ''
    ignore.write_text(previous + '\ncoop-story*\n')


def gate_paused_admin():
    # Keep the original admin modules intact: newspaper reading shares admin.js.
    backend = DEST / 'backend.mjs'
    text = backend.read_text()
    marker = "    if(path.startsWith('/coop-story/'))return json({error:'not_available_in_preview'},404);"
    assert text.count(marker) == 1
    backend.write_text(text.replace(marker, "    if(path.startsWith('/admin'))return json({error:'not_available_in_preview'},404);\n" + marker))
    entry = (ROOT / 'preview/src/index.mjs').read_text()
    for old, new in [("'../build/backend.mjs'", "'./backend.mjs'"), ("'../build/web-push.js'", "'./web-push.js'")]:
        assert entry.count(old) == 1
        entry = entry.replace(old, new)
    public = "            if(url.pathname==='/admin-nao')return await adminEntry(request,env);"
    assert entry.count(public) == 1
    entry = entry.replace(public, "            if(['/admin-nao','/preview-account-setup','/preview-plan-setup'].includes(url.pathname))return reply('not_available_in_preview',404);\n" + public)
    entry, count = re.subn(r'(?<!function )adminEntry\(request,env\)', 'unreleasedAdminEntry(request,env)', entry)
    assert count == 2
    assert entry.count('export default {') == 1
    entry = entry.replace('export default {', "function unreleasedAdminEntry(){return reply('not_available_in_preview',404);}\nexport default {")
    (DEST / 'verified-preview-entry.mjs').write_text(entry)
    page = DEST / 'assets/index.html'
    text = page.read_text()
    text, count = re.subn(r'<script\b[^>]*\bsrc="/admin-studio\.js"[^>]*></script>', '', text)
    assert count == 1 and 'src="/admin.js"' in text and 'href="/admin.css"' in text
    head = text.index('</head>')
    text = text[:head] + '<style>[onclick*="adminOpen"]{display:none!important}</style>' + text[head:]
    end = text.rindex('</body>')
    text = text[:end] + '<script id="preview-admin-disabled">window.adminOpen=function(){};</script>' + text[end:]
    page.write_text(text)
    with (DEST / 'assets/.assetsignore').open('a') as output:
        output.write('admin-studio.js\n')


def gate_unreviewed_videos():
    hidden = []
    for book in ['kokugo1', 'english1', 'science1', 'geography', 'history']:
        file = DEST / ('assets/textbook-book-' + book + '.json')
        data = json.loads(file.read_text())

        def visit(value):
            if isinstance(value, dict):
                if value.get('t') == 'media' and value.get('kind') == 'video' and value.get('src') and value.get('id') != 'G-C2-S1-VP':
                    source = value['src']
                    assert re.fullmatch(r'/textbook-book-[a-z0-9-]+\.(mp4|webm)', source), 'unexpected video source'
                    hidden.append({'book': book, 'id': value['id'], 'source': source})
                    value['src'] = None
                for child in value.values():
                    visit(child)
            elif isinstance(value, list):
                for child in value:
                    visit(child)

        visit(data)
        file.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    ignore = DEST / 'assets/.assetsignore'
    with ignore.open('a') as output:
        for item in hidden:
            stem = item['source'].rsplit('.', 1)[0].lstrip('/')
            output.write(stem + '.mp4\n' + stem + '.webm\n')
    return hidden


def worker_dependencies():
    pending = [DEST / 'backend.mjs']
    seen = set()
    copied = []
    while pending:
        module = pending.pop()
        if module in seen:
            continue
        seen.add(module)
        if module.suffix not in {'.js', '.mjs', '.cjs'}:
            continue
        for name in IMPORT.findall(module.read_text()):
            target = (module.parent / name).resolve()
            if not target.is_relative_to(DEST.resolve()):
                # Public authored JSON outside the Worker tree stays at its original path.
                if not target.is_relative_to((ROOT / 'site-assets').resolve()) or not target.is_file():
                    raise ValueError('Unexpected external module dependency')
                continue
            relative = target.relative_to(DEST.resolve())
            original = SOURCE / relative
            if relative.as_posix() not in PRESERVE:
                if not original.is_file() or original.suffix not in {'.js', '.mjs', '.cjs', '.json'}:
                    raise ValueError('Worker dependency is missing: ' + str(relative))
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(original.read_bytes())
                copied.append({'file': str(relative), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
            if not target.is_file():
                raise ValueError('Built dependency is missing: ' + str(relative))
            pending.append(target)
    return copied


def main():
    config = json.loads((ROOT / 'preview/wrangler.jsonc').read_text())
    assert config['name'] == 'nobilog-preview'
    verify_math_media()
    origin = config['vars']['APP_ORIGIN']
    spec = importlib.util.spec_from_file_location('nobi_preview_build', ROOT / 'preview/build.py')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.build(origin)
    gate_unfinished_coop()
    gate_paused_admin()
    hidden = gate_unreviewed_videos()
    copied = worker_dependencies()
    report = {'status': 'built; dry-run and deployment still required', 'worker': config['name'], 'origin': origin,
              'dependencies': copied, 'cooperativeV3HiddenAndServerBlocked': True,
              'pausedAdminEntryAndApiBlocked': True, 'sharedNewspaperModuleRetained': True,
              'unreviewedVideosHidden': hidden,
              'productionTouched': False, 'secretsRead': False}
    (ROOT / 'tools/releases/preview-verified-20261026/package.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('Dedicated preview prepared; all literal Worker imports included; no deployment performed.')


if __name__ == '__main__':
    main()
