from pathlib import Path
import os,subprocess,tempfile,hashlib
H=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='nobi-worker-baseline-') as tmp:
 r=subprocess.run(['node',os.environ['NOBI_WRANGLER_CLI'],'init','--from-dash','nobilog-board','--no-delegate-c3'],cwd=tmp,capture_output=True,text=True)
 if r.returncode:raise SystemExit('最新公開Workerの取得を確認できないため停止。公開していません。')
 p=Path(tmp)/'nobilog-board/src/index.js';before=H/'baseline/cf-worker/src/index.js'
 if not p.exists() or p.read_bytes()!=before.read_bytes():raise SystemExit('公開Workerが土台から変わったため停止。上書きしません。')
print('Current published Worker exactly matches reviewed baseline; no data or secrets read')
