"""Build an isolated preview without copying personal scores or qualifications."""
from pathlib import Path
import json, re, shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'preview' / 'build'

def replace_constant(text, name, value):
    matches = list(re.finditer(r'\bconst\s+' + re.escape(name) + r'\s*=\s*', text))
    if len(matches) != 1:
        raise ValueError('Constant replacement must be unique: ' + name)
    start = matches[0].end(); depth = 0; quote = None; escaped = False
    for end in range(start, len(text)):
        char = text[end]
        if quote:
            if escaped: escaped = False
            elif char == '\\': escaped = True
            elif char == quote: quote = None
            continue
        if char in "'\"`": quote = char
        elif char in '[{(': depth += 1
        elif char in ']})': depth -= 1
        elif char == ';' and depth == 0:
            return text[:start] + value + text[end:]
    raise ValueError('Constant terminator missing: ' + name)

def build(origin):
    if not re.fullmatch(r'https://nobilog-preview\.[a-z0-9-]+\.workers\.dev', origin):
        raise ValueError('Only the dedicated preview origin is accepted')
    DEST.mkdir(parents=True, exist_ok=True)
    assets = DEST / 'assets'; assets.mkdir(exist_ok=True)
    page = (ROOT / 'index.html').read_text()
    page = replace_constant(page, 'ST_DATA', '{}')
    page = replace_constant(page, 'M_REAL_QUAL', '{u1:[],u2:[]}')
    # 確認版だけの配布：なおの指示（2026-10-08）で確認版の u1 に1億円を1回だけ。本番の配布は持ちこまない。
    page = replace_constant(page, 'M_GRANTS', "[{id:'preview-20261008-100m',user:'u1',yen:100000000,msg:'確認版のテスト用に 1億円 を配りました'}]")
    page = replace_constant(page, 'M_RESETS', '[]')
    page = replace_constant(page, 'APP_USERS', '[{id:"u1",name:"Free 確認版",owner:true},{id:"u2",name:"確認版（相手）"},{id:"u3",name:"体験版",trial:true},{id:"p_mini",name:"Mini 確認版"},{id:"p_standard",name:"Standard 確認版"},{id:"p_pro",name:"Pro 確認版"},{id:"p_unlimit",name:"UNLIMIT 確認版"}]')
    live = "const SYNC_URL = 'https://nobilog-board.naon4022.workers.dev';"
    if page.count(live) != 1: raise ValueError('Sync replacement missing')
    page = page.replace(live, "const SYNC_URL = location.origin + '/api';")
    marker = 'async function authRestore() {'
    if page.count(marker) != 1: raise ValueError('Login replacement missing')
    page = page.replace(marker, marker + '''
        try {
            const response = await fetch('/api/auth/me', {cache:'no-store'});
            if(!response.ok) { location.replace('/preview-login'); return false; }
            const data = await response.json();
            recordStorage.setItem(AUTH_KEY, 'preview-cookie');
            await completeLogin(Object.assign({}, data.user, APP_USERS.find(x=>x.id===data.user.id)||{}));
            return true;
        } catch(e) { document.getElementById('login-err').textContent='確認版に接続できません。再読み込みしてください。'; return false; }
        /* The ordinary restore path below is unreachable in this build. */
''')
    page = page.replace('function showLogin() {', "function showLogin() { location.replace('/preview-login'); return;")
    page = page.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>', 1)
    page = page.replace('<body>', '<body><div style="padding:8px;text-align:center;background:#edf1f4;color:#34434e">確認版：ここでの記録は本番の成績と分けて保存されます。</div>', 1)
    (assets / 'index.html').write_text(page)
    for source in (ROOT / 'site-assets').iterdir():
        if source.is_file() and source.name not in {'sw.js','_headers'}: shutil.copyfile(source, assets / source.name)
    # 章ごとの確認版配信：今回の制作対象動画は、章全体の検証後にだけ表示する。
    release_file = ROOT / 'preview' / 'math-video-release.json'
    if release_file.exists():
        release = json.loads(release_file.read_text())
        ledger_file = ROOT / '教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/69本_制作進捗.json'
        items = json.loads(ledger_file.read_text())['items']
        allowed = set()
        for chapter in release['chapters']:
            if type(chapter) is not int or chapter not in range(1, 6): raise ValueError('Invalid preview chapter')
            chapter_items = [x for x in items if x['id'].startswith(f'M1-C{chapter}-')]
            if not chapter_items or any(x['state'] != '点検・本への反映済み' for x in chapter_items):
                raise ValueError('Unverified preview chapter')
            allowed.update(x['id'] for x in chapter_items)
        managed = {x['id'] for x in items}
        book_file = assets / 'textbook-book-math1.json'
        book = json.loads(book_file.read_text())
        def gate(value):
            if isinstance(value, dict):
                if value.get('t') == 'media' and value.get('id') in managed and value['id'] not in allowed:
                    value['src'] = None
                for child in value.values(): gate(child)
            elif isinstance(value, list):
                for child in value: gate(child)
        gate(book)
        book_file.write_text(json.dumps(book, ensure_ascii=False, separators=(',', ':')))
        ignored = ['.assetsignore']
        for video_id in sorted(managed - allowed):
            ignored.extend('textbook-book-math1-' + video_id.lower() + '.' + ext for ext in ('mp4', 'webm'))
        (assets / '.assetsignore').write_text('\n'.join(ignored) + '\n')
    shutil.copytree(ROOT / 'site-assets/vendor', assets / 'vendor', dirs_exist_ok=True)
    shutil.copyfile(ROOT / 'preview/sw.js', assets / 'sw.js')
    for name in ['terms.html','privacy.html']: shutil.copyfile(ROOT / name, assets / name)
    backend = (ROOT / 'cf-worker/src/index.js').read_text()
    backend = replace_constant(backend, 'SEPTEMBER_SCHOOL_RESULT', '{id:"preview",name:"確認版",s:{},c:"",source:"preview"}')
    (DEST / 'backend.mjs').write_text(backend)
    push=(ROOT / 'cf-worker/src/web-push.js').read_text().replace("const PUSH_ORIGIN = 'https://nobilog.pages.dev';",'const PUSH_ORIGIN = '+json.dumps(origin)+';')
    (DEST / 'web-push.js').write_text(push)
    share = (ROOT / 'cf-worker/src/problem-share.mjs').read_text().replace('../../site-assets/problem-pdf.mjs', './problem-pdf.mjs')
    (DEST / 'problem-share.mjs').write_text(share)
    shutil.copyfile(ROOT / 'site-assets/problem-pdf.mjs', DEST / 'problem-pdf.mjs')
    shutil.copyfile(ROOT / 'cf-worker/src/achievements.mjs', DEST / 'achievements.mjs')
    shutil.copyfile(ROOT / 'cf-worker/src/subscription-credits.mjs', DEST / 'subscription-credits.mjs')
    for name in ['textbook-annotations.mjs', 'textbook-ink.mjs', 'textbook-ink-format.cjs']:
        shutil.copyfile(ROOT / 'cf-worker/src' / name, DEST / name)
    for name in ['learning-time.mjs','learning-time-validate.cjs','learning-time-books.mjs','material-records.mjs','material-bank.mjs','material-engine.cjs','gemini-tutor.mjs','ai-trial-control.mjs','assignments.mjs','admin.mjs','admin-workspace.mjs','admin-monitor.mjs','admin-reports.mjs','admin-eiken.mjs','admin-eiken-bank.json','plans.mjs','learning-assistant.mjs','messages.mjs','learning-images.mjs','profile-photos.mjs']:
        shutil.copyfile(ROOT / 'cf-worker/src' / name, DEST / name)
    for name in ['openai-policy.mjs','openai-transport.mjs','openai-budget.mjs','openai-connection-status.mjs','openai-trial.mjs','openai-tutor-bridge.mjs','openai-receipts.mjs','openai-tutor-service.mjs','openai-tutor-route.mjs','openai-chat-content.mjs','openai-chat-context.mjs','openai-chat-route.mjs','openai-vision.mjs']:
        shutil.copyfile(ROOT / 'cf-worker/src' / name, DEST / name)
    shutil.copyfile(ROOT / 'site-assets/eiken-practice-bank.json', DEST / 'admin-eiken-bank.json')
    # Same implementation, but only dedicated bindings; no production IDs are copied.
    print('Preview built: production sync, fixed personal results, grants and resets removed')

if __name__ == '__main__':
    import sys
    build(sys.argv[1])
