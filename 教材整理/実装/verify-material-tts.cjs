const assert = require('node:assert/strict');
const tts = require('./material-tts.js');
let spoken = null; let cancelled = 0;
function Utterance(text) { this.text = text; }
const api = {
  getVoices: () => [{ name: 'English Test', lang: 'en-US' }, { name: '日本語', lang: 'ja-JP' }],
  cancel: () => { cancelled += 1; },
  speak: (value) => { spoken = value; }
};
globalThis.SpeechSynthesisUtterance = Utterance;
assert.equal(tts.available(api), true);
assert.deepEqual(tts.voices(api, 'en-US').map(v => v.name), ['English Test']);
assert.equal(tts.speak('Read this question.', { voiceName: 'English Test' }, api).ok, true);
assert.equal(spoken.text, 'Read this question.');
assert.equal(spoken.lang, 'en-US');
assert.equal(spoken.rate, 0.85);
assert.equal(tts.speak('   ', {}, api).reason, 'empty');
assert.equal(tts.speak('x', {}, null).reason, 'unsupported');
assert.equal(tts.stop(api), true);
assert.equal(cancelled, 2);
console.log('material-tts: 8 checks passed');
