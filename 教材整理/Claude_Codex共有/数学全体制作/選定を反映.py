# coding: utf-8
"""Claudeの採用記録を、候補の実体と照合して表示用台帳へ反映する。"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
path = ROOT / '制作台帳.json'
catalog = json.loads(path.read_text())
slots = {s['id']: s for s in catalog['imageSlots']}
applied, pending = [], []
for record in sorted((ROOT / '選定記録').glob('*.json')):
    choices = json.loads(record.read_text()).get('choices', [])
    adopted = [c for c in choices if c.get('decision') == '採用']
    assert len({c['slotId'] for c in adopted}) == len(adopted), record
    for choice in adopted:
        slot = slots.get(choice['slotId'])
        candidate = next((c for c in slot['candidates']
                          if c['id'] == choice['candidateId']), None) if slot else None
        # 記録が改訂名を使う場合も、実ファイル名が一致するものだけを扱う。
        if candidate is None and slot:
            matches = [c for c in slot['candidates'] if c.get('file')
                       and Path(c['file']).stem == choice['candidateId']]
            assert len(matches) <= 1, choice['candidateId']
            candidate = matches[0] if matches else None
        if candidate is None:
            pending.append(choice['candidateId'])
            continue
        assert choice.get('sourceContentChecked') is True, choice['candidateId']
        assert candidate['file'], choice['candidateId']
        digest = hashlib.sha256((ROOT / candidate['file']).read_bytes()).hexdigest()
        assert digest == candidate['sha256'], choice['candidateId']
        slot['selected'] = candidate['id']
        slot['selectionEvidence'] = {
            'file': str(record.relative_to(ROOT)),
            'candidateSha256': digest,
            'recordedCandidateId': choice['candidateId'],
            'choiceSha256': hashlib.sha256(json.dumps(
                choice, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
        }
        for item in slot['candidates']:
            item['status'] = 'Claude採用・表示へ反映' if item is candidate else 'Claude比較済み・不採用'
        applied.append(candidate['id'])
path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'反映': applied, '候補ID照合待ち': pending}, ensure_ascii=False))
