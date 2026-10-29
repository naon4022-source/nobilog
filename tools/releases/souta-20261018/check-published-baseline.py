from pathlib import Path
import subprocess
root = Path(__file__).resolve().parent
for p in sorted((root / 'baseline/pages').iterdir()):
    if p.name == '_headers':
        continue
    url = 'https://nobilog.pages.dev/' + ('' if p.name == 'index.html' else p.name)
    result = subprocess.run(['curl','--fail','--silent','--show-error','--location','--proto-redir','=https','--max-redirs','5','--max-time','30',url],capture_output=True)
    if result.returncode or result.stdout != p.read_bytes():
        raise SystemExit('公開版の土台が変わったため中止: '+p.name)
print('公開中の静的ファイルは全点、変更元と一致')
