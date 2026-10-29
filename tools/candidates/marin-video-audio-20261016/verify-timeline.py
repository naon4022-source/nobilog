"""Synthetic PCM only. No API, existing voice or video files."""
import hashlib
import json
import math
import struct
import tempfile
import unittest
import wave
from pathlib import Path
from timeline import build


class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cache = Path(self.temp.name)
        bodies = [{'input': 'synthetic' + str(i)} for i in range(2)]
        self.keys = [hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest() for body in bodies]
        self.receipts = {}
        self.requests = dict(zip(self.keys, bodies))
        for key in self.keys:
            path = self.cache / (key + '.wav')
            with wave.open(str(path), 'wb') as wav:
                wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                wav.writeframes(b''.join(struct.pack('<h', round(1000 * math.sin(i / 10))) for i in range(24000)))
            self.receipts[key] = {'state': 'complete', 'requestSha256': key, 'audioSha256': hashlib.sha256(path.read_bytes()).hexdigest()}
        self.video = {'id': 'M1-C1-S1-V01', 'owner': 'Codex', 'steps': [{'index': i, 'requestSha256': k, 'caption': 'Caption ' + str(i), 'hold': .2} for i, k in enumerate(self.keys)]}

    def run_build(self, **kwargs):
        return build(self.video, self.requests, self.receipts, self.cache, **kwargs)

    def test_timing_and_preserved_bytes(self):
        before = [p.read_bytes() for p in sorted(self.cache.iterdir())]
        out = self.run_build()
        self.assertEqual(out['timeline']['steps'][0], {'start': 0., 'speak': 1., 'end': 2.9, 'say': 'Caption 0', 'cap': 'Caption 0'})
        self.assertAlmostEqual(out['tracks'][1]['start'], 2.9)
        self.assertEqual(out['timeline']['total'], 6.3)
        self.assertEqual(out['fps'], 30)
        self.assertEqual(out['audioTransforms'], [])
        self.assertEqual(before, [p.read_bytes() for p in sorted(self.cache.iterdir())])

    def test_missing_or_unfinished_receipt(self):
        for status in ('pending', 'uncertain', 'failed', None):
            with self.subTest(status=status):
                self.receipts[self.keys[0]]['state'] = status
                with self.assertRaises(ValueError): self.run_build()

    def test_byte_change(self):
        (self.cache / (self.keys[0] + '.wav')).write_bytes(b'not a wave')
        with self.assertRaises(ValueError): self.run_build()

    def test_streaming_wave_sizes_preserve_audio(self):
        path = self.cache / (self.keys[0] + '.wav')
        raw = bytearray(path.read_bytes())
        raw[4:8] = b'\xff' * 4
        raw[40:44] = b'\xff' * 4
        path.write_bytes(raw)
        self.receipts[self.keys[0]]['audioSha256'] = hashlib.sha256(raw).hexdigest()
        self.assertEqual(self.run_build()['tracks'][0]['duration'], 1.)
        self.assertEqual(path.read_bytes(), raw)

    def test_truncated_and_silent_audio(self):
        path = self.cache / (self.keys[0] + '.wav')
        original = path.read_bytes()
        for raw in (original[:-2], original[:44] + bytes(len(original)-44)):
            path.write_bytes(raw)
            self.receipts[self.keys[0]]['audioSha256'] = hashlib.sha256(raw).hexdigest()
            with self.assertRaises(ValueError): self.run_build()

    def test_invalid_timing_and_other_owner(self):
        for value in (-1, float('nan'), float('inf'), True, 11):
            with self.subTest(value=value):
                with self.assertRaises(ValueError): self.run_build(head=value)
        self.video['owner'] = 'Claude'
        with self.assertRaises(ValueError): self.run_build()

    def test_short_audio_and_path(self):
        body = {'input': 'x' * 100}
        key = hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        self.requests[key] = body
        self.receipts[key] = {**self.receipts[self.keys[0]], 'requestSha256': key}
        (self.cache / (key + '.wav')).write_bytes((self.cache / (self.keys[0] + '.wav')).read_bytes())
        self.video['steps'][0]['requestSha256'] = key
        with self.assertRaisesRegex(ValueError, 'unexpectedly short'): self.run_build()
        self.video['steps'][0]['requestSha256'] = '../outside'
        with self.assertRaises(ValueError): self.run_build()

    def test_request_changes_do_not_reuse_audio(self):
        self.requests[self.keys[0]]['input'] = 'changed words'
        with self.assertRaisesRegex(ValueError, 'request changed'): self.run_build()


if __name__ == '__main__': unittest.main()
