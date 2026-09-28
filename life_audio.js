// Original, procedural effects: no recordings, external requests or audio assets.
(() => {
  'use strict';
  let key = 'action-savings:sound:v1', enabled = true, volume = 1;
  let context, master, generation = 0, lastSelection = -Infinity;
  const voices = new Set();
  const clamp = value => Math.max(0, Math.min(2, value));
  function configure(demo) {
    stop();
    key = demo ? 'action-savings:demo:sound:v1' : 'action-savings:sound:v1';
    enabled = true; volume = 1;
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (typeof saved?.enabled === 'boolean') enabled = saved.enabled;
      if (Number.isFinite(saved?.volume)) volume = clamp(saved.volume);
    } catch (_) { /* Storage restrictions must never block recording. */ }
    updateGain();
  }
  function updateGain() {
    if (master) master.gain.setTargetAtTime(enabled ? volume * .42 : 0, context.currentTime, .012);
  }
  function settings(on, level) {
    enabled = !!on;
    volume = Number.isFinite(level) ? clamp(level) : 1;
    if (!enabled || volume === 0) stop();
    updateGain();
    try { localStorage.setItem(key, JSON.stringify({enabled, volume})); } catch (_) {}
  }
  function prepare() {
    if (!enabled || volume === 0 || document.hidden) return;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio();
        master = context.createGain();
        master.gain.value = volume * .42;
        master.connect(context.destination);
      }
      if (context.state === 'suspended' || context.state === 'interrupted') {
        context.resume().catch(() => {});
      }
    } catch (_) { /* Unsupported audio is silent, not an application failure. */ }
  }
  function stop() {
    generation++;
    for (const voice of voices) {
      try { voice.stop(); voice.disconnect(); } catch (_) {}
    }
    voices.clear();
  }
  function track(source, gain) {
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
  }
  function tone(at, frequency, duration, strength = .16, end = frequency, type = 'sine') {
    const source = context.createOscillator(), gain = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(frequency, at);
    source.frequency.exponentialRampToValueAtTime(Math.max(25, end), at + duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(strength, at + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(gain); gain.connect(master); track(source, gain);
    source.start(at); source.stop(at + duration + .015);
  }
  function noise(at, duration, strength, frequency) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    // Fixed noise makes the ceramic texture reproducible for audio tests.
    let seed = 1949;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = seed / 2147483648 - 1;
    }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .7;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(strength, at + .004);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(filter); filter.connect(gain); gain.connect(master); track(source, gain);
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(at); source.stop(at + duration + .015);
  }
  function metal(at, base, strength = .2) {
    tone(at, base, .26, strength);
    tone(at, base * 2.71, .14, strength * .27);
    tone(at, base * 4.13, .07, strength * .1);
  }
  function render(name, at) {
    switch (name) {
      case 'deposit':
        metal(at, 1440, .3); tone(at + .07, 280, .13, .15, 170); break;
      case 'reaction0': // Ears: two light, warm ticks.
        tone(at, 730, .12, .13, 910); tone(at + .14, 930, .16, .12, 780); break;
      case 'reaction1': // Happy bounce.
        tone(at, 310, .24, .2, 660); tone(at + .2, 520, .15, .12, 760); break;
      case 'reaction2': // Contented head tilt.
        tone(at, 540, .34, .18, 420); tone(at + .035, 810, .28, .045, 630); break;
      case 'reaction3': // Tail wiggle.
        [620, 760, 620].forEach((f, i) => tone(at + i * .1, f, .12, .12, f * 1.12)); break;
      case 'reaction4': // Blink / nod.
        tone(at, 470, .15, .17, 390); tone(at + .18, 650, .18, .12, 540); break;
      case 'reaction5': // A small sign of the rare celebration to follow.
        [660, 830, 990].forEach((f, i) => tone(at + i * .11, f, .22, .13)); break;
      case 'rare': // 750 ms tremble, then the pig launches.
        for (let i = 0; i < 6; i++) tone(at + i * .115, 220 + i * 32, .08, .075, 190);
        tone(at + .75, 260, .45, .22, 1040);
        [880, 1100, 1320].forEach((f, i) => metal(at + 1.06 + i * .12, f, .1)); break;
      case 'open':
        noise(at, .17, .6, 1700); tone(at, 480, .16, .22, 170);
        [1300, 1760, 1490, 2020].forEach((f, i) => metal(at + .13 + i * .065, f, .17 - i * .02)); break;
      case 'select': metal(at, 1640, .13); break;
    }
  }
  function play(name) {
    if (!enabled || volume === 0 || document.hidden) return;
    if (!/^(deposit|reaction[0-5]|rare|open|select)$/.test(name)) return;
    const now = performance.now();
    if (name === 'select' && now - lastSelection < 70) return;
    if (name === 'select') lastSelection = now;
    prepare();
    if (!context) return;
    const current = generation;
    const begin = () => {
      if (current !== generation || !enabled || !volume || document.hidden || context.state !== 'running') return;
      try { render(name, context.currentTime + .008); } catch (_) { stop(); }
    };
    // Never replay a stale effect if a browser waits for a later gesture to resume.
    if (context.state === 'running') begin();
    else {
      try { context.resume().then(() => { if (performance.now() - now < 120) begin(); }).catch(() => {}); } catch (_) {}
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  window.actionSavingsAudio = {
    configure, prepare, play, stop, settings,
    get enabled() { return enabled; }, get volume() { return volume; }
  };
})();
