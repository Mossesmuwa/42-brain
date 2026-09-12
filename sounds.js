/**
 * sounds.js – Offline sound effects via Web Audio API
 * No external files required — all sounds synthesized in-browser
 */
'use strict';

const SoundFX = {
  _ctx: null,
  _vol: 0.4,
  _on: true,

  init(vol = 0.4, on = true) {
    this._vol = vol;
    this._on  = on;
    try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  },

  enable(v)  { this._on  = v; },
  volume(v)  { this._vol = v; },

  _resume() { if (this._ctx?.state === 'suspended') this._ctx.resume(); },

  _tone(freq, type, dur, vol, delay = 0, detune = 0) {
    if (!this._on || !this._ctx) return;
    this._resume();
    try {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain); gain.connect(this._ctx.destination);
      osc.type    = type;
      osc.frequency.setValueAtTime(freq, this._ctx.currentTime + delay);
      if (detune) osc.detune.setValueAtTime(detune, this._ctx.currentTime + delay);
      gain.gain.setValueAtTime(vol * this._vol, this._ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + delay + dur);
      osc.start(this._ctx.currentTime + delay);
      osc.stop (this._ctx.currentTime + delay + dur);
    } catch {}
  },

  correct()     { this._tone(523,'sine',.12,.6); this._tone(659,'sine',.18,.6,.1); this._tone(784,'sine',.28,.5,.2); },
  wrong()       { this._tone(220,'sawtooth',.18,.5); this._tone(185,'sawtooth',.26,.4,.15); },
  timeout()     { this._tone(330,'triangle',.15,.4); this._tone(220,'triangle',.28,.4,.15); },
  tick()        { this._tone(800,'sine',.04,.12); },
  warning()     { this._tone(440,'square',.09,.3); },
  click()       { this._tone(600,'sine',.04,.18); },
  reaction()    { this._tone(880,'sine',.15,.7); },
  found()       { this._tone(660,'sine',.1,.5); this._tone(880,'sine',.15,.4,.08); },
  achievement() { [523,659,784,1047].forEach((f,i)=> this._tone(f,'sine',.25,.5,i*.09)); },
  complete()    { [523,659,784,880,1047,1319].forEach((f,i)=> this._tone(f,'sine',.3,.45,i*.1)); },
};
