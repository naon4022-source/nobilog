"""Offline timeline from verified PCM WAVs; no synthesis, conversion or source writes."""
import hashlib
import json
import math
import struct
from pathlib import Path


def seconds(value, label, maximum=10):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not 0 <= value <= maximum:
        raise ValueError('invalid timing: ' + label)
    return value


def inspect_wav(path, expected_sha):
    path = Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 20 * 1024 * 1024:
        raise ValueError('invalid cached audio')
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected_sha:
        raise ValueError('audio checksum changed')
    # Speech responses may retain the streaming RIFF/data size sentinel. Read
    # the actual bounded bytes, without editing the waveform or trusting it as
    # billions of PCM frames (the standard wave module's interpretation).
    if len(raw) < 44 or raw[:4] != b'RIFF' or raw[8:12] != b'WAVE' or struct.unpack_from('<I', raw, 4)[0] not in (len(raw) - 8, 0xffffffff):
        raise ValueError('invalid RIFF audio')
    pos, fmt, data, chunks = 12, None, None, 0
    while pos + 8 <= len(raw):
        chunks += 1
        if chunks > 128: raise ValueError('too many WAV chunks')
        tag, size = raw[pos:pos+4], struct.unpack_from('<I', raw, pos+4)[0]
        start = pos + 8
        if tag == b'data' and size == 0xffffffff: size = len(raw) - start
        end = start + size
        if end > len(raw): raise ValueError('truncated WAV chunk')
        if tag == b'fmt ':
            if fmt is not None or size < 16: raise ValueError('invalid WAV format chunk')
            fmt = struct.unpack_from('<HHIIHH', raw, start)
        elif tag == b'data':
            if data is not None: raise ValueError('duplicate WAV data')
            data = raw[start:end]
        pos = end + size % 2
    if pos != len(raw) or fmt is None or data is None:
        raise ValueError('incomplete WAV')
    codec, channels, rate, byte_rate, align, bits = fmt
    if codec != 1 or bits != 16 or channels not in (1, 2) or not 8000 <= rate <= 96000 or align != channels * 2 or byte_rate != rate * align:
        raise ValueError('unsupported PCM audio')
    if not data or len(data) % align or not any(value for (value,) in struct.iter_unpack('<h', data)):
        raise ValueError('empty, silent or truncated audio')
    duration = len(data) / byte_rate
    if not .1 <= duration <= 180:
        raise ValueError('invalid audio duration')
    return duration


def build(video, requests, receipts, cache, *, head=1.0, gap=.7, tail=1.5):
    """Receipts must be confirmed persisted speech results, keyed by request SHA.

    A receipt has state=complete, audioSha256 and requestSha256. This helper
    verifies bytes, not provenance: production must supply the trusted journal.
    """
    head, gap, tail = (seconds(v, name) for v, name in ((head, 'head'), (gap, 'gap'), (tail, 'tail')))
    if video.get('owner') != 'Codex' or not video.get('steps'):
        raise ValueError('not a Codex video')
    cache = Path(cache).resolve()
    time = head
    timeline, tracks = [], []
    for i, step in enumerate(video['steps']):
        key = step['requestSha256']
        if len(key) != 64 or any(c not in '0123456789abcdef' for c in key) or step['index'] != i:
            raise ValueError('invalid speech request identity')
        request, receipt = requests[key], receipts.get(key, {})
        request_bytes = json.dumps(request, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
        if hashlib.sha256(request_bytes).hexdigest() != key:
            raise ValueError('speech request changed')
        if receipt.get('state') != 'complete' or receipt.get('requestSha256') != key or not isinstance(receipt.get('audioSha256'), str):
            raise ValueError('speech result not completed')
        caption = step['caption']
        if not isinstance(caption, str) or not caption.strip():
            raise ValueError('missing caption')
        path = cache / (key + '.wav')
        duration = inspect_wav(path, receipt['audioSha256'])
        # Retain the existing engine's guard against the earlier zero-second speech incident.
        if duration < .25 * max(1, len(request['input']) / 8):
            raise ValueError('speech unexpectedly short')
        end = time + duration + gap + seconds(step.get('hold', 0), 'hold')
        timeline.append({'start': 0.0 if i == 0 else round(time, 3), 'speak': round(duration, 3), 'end': round(end, 3), 'say': caption, 'cap': caption})
        tracks.append({'file': str(path), 'sha256': receipt['audioSha256'], 'requestSha256': key, 'start': time, 'duration': duration})
        time = end
    return {'timeline': {'total': round(time + tail, 3), 'head': head, 'steps': timeline, 'credit': ''}, 'tracks': tracks, 'fps': 30, 'audioTransforms': [], 'sourceVideo': video['id']}
