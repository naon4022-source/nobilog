"""Prepare immutable speech requests only. No network, keys, audio or video writes."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FIXED = Path('教材整理/Claude_Codex共有/数学全体制作/メディア/制作ソース/音声共有/Marin固定_20261014')
EXPECTED = {
    '固定設定.json': '89be865ac8853447381a0635caf366627ff8a381e5c98dc2da5e34bc84726384',
    '採用見本.mp3': 'a91ecbdac037b5d3b4dc2ff71f350485cbf5385ef3e6e06e868e90999c99baea',
    '差し替え分担台帳.json': '5a587d3257febb14e9534ede50f9bf5a939e57be9108d5ffb1968e3ce0b27668',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def order(job):
    match = re.fullmatch(r'M1-C([1-7])-(OPEN|S([1-9])|REVIEW)-V(?:\d+|P)', job['id'])
    if match:
        return (int(match[1]), 0 if match[2] == 'OPEN' else 99 if match[2] == 'REVIEW' else int(match[3]), job['id'])
    return (8 if job['id'].startswith('M1-PLAZA-') else 9, 0, job['id'])


def build(root=ROOT):
    folder = root / FIXED
    for name, expected in EXPECTED.items():
        if digest((folder / name).read_bytes()) != expected:
            raise ValueError('approved fixed file changed: ' + name)
    settings = json.loads((folder / '固定設定.json').read_text())
    ledger = json.loads((folder / '差し替え分担台帳.json').read_text())
    if settings['voice'] != 'marin' or settings['generationModelAdvertised'] != 'gpt-4o-mini-tts' or settings['speedOverride'] is not None:
        raise ValueError('unapproved speech settings')
    jobs = ledger['jobs']
    if len(jobs) != 94 or len({x['id'] for x in jobs}) != 94 or sum(x['owner'] == 'Codex' for x in jobs) != 75 or sum(x['owner'] == 'Claude' for x in jobs) != 19:
        raise ValueError('unexpected assignment ledger')
    requests = {}
    videos = []
    for job in sorted((x for x in jobs if x['owner'] == 'Codex'), key=order):
        path = (root / job['script']).resolve()
        if not path.is_relative_to(root.resolve()) or path.suffix != '.json':
            raise ValueError('invalid script path')
        raw = path.read_bytes()
        if digest(raw) != job['scriptSha256']:
            raise ValueError('approved script changed: ' + job['id'])
        script = json.loads(raw)
        if script.get('id', job['id']) != job['id'] or not isinstance(script.get('steps'), list) or len(script['steps']) != job['steps']:
            raise ValueError('invalid script: ' + job['id'])
        steps = []
        for i, step in enumerate(script['steps']):
            text = step.get('yomi', step.get('say'))
            caption = step.get('cap', step.get('say'))
            # This local production cap is deliberately small; never truncate text.
            if not isinstance(text, str) or not text.strip() or len(text) > 1000 or not isinstance(caption, str) or not caption.strip():
                raise ValueError('invalid or oversized speech step')
            body = {'model': settings['generationModelAdvertised'], 'voice': settings['voice'], 'instructions': settings['instructions'], 'input': text, 'response_format': 'wav'}
            key = digest(encoded(body))
            requests.setdefault(key, body)
            steps.append({'index': i, 'requestSha256': key, 'caption': caption, 'hold': step.get('hold', 0)})
        videos.append({'id': job['id'], 'owner': 'Codex', 'script': job['script'], 'scriptSha256': job['scriptSha256'], 'originalVideoSha256': job['originalVideoSha256'], 'candidateOutput': job['candidateOutput'], 'steps': steps})
    return {'version': 1, 'status': '音声生成前・通信なし・旧動画を保持', 'fixedFiles': dict(EXPECTED), 'modelSnapshot': settings['exactDemoModelSnapshot'], 'postProcessing': settings['postProcessing'], 'fps': 30, 'dailyGlobalTrialCalls': 10, 'monthlyEstimatedLimitYen': 800, 'videos': videos, 'requests': requests, 'stepCount': sum(len(v['steps']) for v in videos), 'uniqueRequestCount': len(requests), 'apiCalls': 0}


if __name__ == '__main__':
    result = build()
    target = ROOT / FIXED / '音声生成ジョブ_20261016.json'
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if target.exists() and target.read_text() != content:
        raise SystemExit('Existing job plan differs; no overwrite performed.')
    if not target.exists():
        target.write_text(content)
    print(json.dumps({k: result[k] for k in ('stepCount', 'uniqueRequestCount', 'apiCalls')}))
