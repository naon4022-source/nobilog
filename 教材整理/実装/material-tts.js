(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.NobiMaterialTTS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function available(api) {
    return !!(api && typeof api.speak === 'function' && typeof api.cancel === 'function');
  }

  function voices(api, lang) {
    if (!api || typeof api.getVoices !== 'function') return [];
    var wanted = String(lang || 'en-US').toLowerCase();
    return api.getVoices().filter(function (voice) {
      return !wanted || String(voice.lang || '').toLowerCase().indexOf(wanted.slice(0, 2)) === 0;
    });
  }

  function pickVoice(list, preferred) {
    if (!preferred) return list[0] || null;
    var key = String(preferred).toLowerCase();
    return list.find(function (voice) {
      return String(voice.name || '').toLowerCase() === key;
    }) || list[0] || null;
  }

  function speak(text, options, api) {
    options = options || {};
    api = api || (typeof window !== 'undefined' ? window.speechSynthesis : null);
    if (!available(api)) return { ok: false, reason: 'unsupported' };
    var value = String(text == null ? '' : text).trim();
    if (!value) return { ok: false, reason: 'empty' };
    api.cancel();
    var Utterance = (typeof window !== 'undefined' && window.SpeechSynthesisUtterance) ||
      (typeof globalThis !== 'undefined' && globalThis.SpeechSynthesisUtterance);
    if (typeof Utterance !== 'function') return { ok: false, reason: 'unsupported' };
    var utterance = new Utterance(value);
    utterance.lang = options.lang || 'en-US';
    utterance.rate = Math.max(0.5, Math.min(1.2, Number(options.rate || 0.85)));
    utterance.pitch = Math.max(0.5, Math.min(1.5, Number(options.pitch || 1)));
    var selected = pickVoice(voices(api, utterance.lang), options.voiceName);
    if (selected) utterance.voice = selected;
    api.speak(utterance);
    return { ok: true, lang: utterance.lang, voice: selected ? selected.name : '' };
  }

  function stop(api) {
    api = api || (typeof window !== 'undefined' ? window.speechSynthesis : null);
    if (!api || typeof api.cancel !== 'function') return false;
    api.cancel();
    return true;
  }

  return { available: available, voices: voices, speak: speak, stop: stop };
}));
