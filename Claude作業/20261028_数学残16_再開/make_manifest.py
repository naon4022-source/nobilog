# このフォルダの全ファイルの SHA-256 を manifest.json に書く（Claude 2026-10-28）
import hashlib, json, pathlib
H = pathlib.Path(__file__).resolve().parent
files = sorted(p for p in H.rglob('*') if p.is_file() and p.name != 'manifest.json' and '__pycache__' not in p.parts)
m = {'folder': H.name, 'count': len(files), 'files': [{'path': str(p.relative_to(H)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size} for p in files]}
(H / 'manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'); print(len(files))
