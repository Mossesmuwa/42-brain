/**
 * sounds.js - Offline premium sound cues via the Web Audio API.
 * No external files are required, so the app remains private and offline.
 */
'use strict';

const SoundFX = {
  _ctx: null,
  _master: null,
  _vol: 0.5,
  _on: true,

  init(vol = 0.5, on = true) {
    this._vol = Math.max(0, Math.min(1, Number(vol) || 0));
    this._on = on;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this._ctx = new AudioCtor();
      this._master = this._ctx.createGain();
      this._master.gain.value = this._vol;
      this._master.connect(this._ctx.destination);
    } catch {
      this._ctx = null;
      this._master = null;
    }
  },

  enable(value) { this._on = Boolean(value); },

  volume(value) {
    this._vol = Math.max(0, Math.min(1, Number(value) || 0));
    if (this._master) this._master.gain.setTargetAtTime(this._vol, this._ctx.currentTime, 0.02);
  },

  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  },

  _tone({ freq = 440, type = 'sine', duration = 0.12, level = 0.2, delay = 0, detune = 0 } = {}) {
    if (!this._on || !this._ctx || !this._master) return;
    this._resume();
    const start = this._ctx.currentTime + delay;
    const end = start + duration;
    const attack = Math.min(0.025, duration * 0.25);
    const release = Math.min(0.08, duration * 0.4);
    const oscillator = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, start);
    if (detune) oscillator.detune.setValueAtTime(detune, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.002, level), start + attack);
    gain.gain.setValueAtTime(Math.max(0.002, level), Math.max(start + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.connect(gain);
    gain.connect(this._master);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  },

  click() {
    this._tone({ freq: 520, duration: 0.055, level: 0.12 });
    this._tone({ freq: 780, duration: 0.045, level: 0.06, delay: 0.025 });
  },

  correct() {
    this._tone({ freq: 523.25, type: 'sine', duration: 0.16, level: 0.2 });
    this._tone({ freq: 659.25, type: 'sine', duration: 0.2, level: 0.18, delay: 0.07 });
    this._tone({ freq: 783.99, type: 'sine', duration: 0.28, level: 0.16, delay: 0.14 });
  },

  wrong() {
    this._tone({ freq: 246.94, type: 'triangle', duration: 0.16, level: 0.16 });
    this._tone({ freq: 196, type: 'triangle', duration: 0.22, level: 0.12, delay: 0.09 });
  },

  timeout() {
    this._tone({ freq: 349.23, type: 'triangle', duration: 0.14, level: 0.14 });
    this._tone({ freq: 261.63, type: 'triangle', duration: 0.25, level: 0.12, delay: 0.11 });
  },

  tick() { this._tone({ freq: 740, duration: 0.035, level: 0.07 }); },
  warning() {
    this._tone({ freq: 440, type: 'triangle', duration: 0.08, level: 0.12 });
    this._tone({ freq: 554.37, type: 'triangle', duration: 0.08, level: 0.1, delay: 0.1 });
  },

  reaction() {
    this._tone({ freq: 659.25, duration: 0.1, level: 0.18 });
    this._tone({ freq: 987.77, duration: 0.18, level: 0.15, delay: 0.06 });
  },

  found() {
    this._tone({ freq: 587.33, duration: 0.1, level: 0.14 });
    this._tone({ freq: 880, duration: 0.15, level: 0.12, delay: 0.06 });
  },

  turn() {
    this._tone({ freq: 392, type: 'triangle', duration: 0.12, level: 0.13 });
    this._tone({ freq: 587.33, type: 'triangle', duration: 0.18, level: 0.14, delay: 0.08 });
  },

  achievement() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this._tone({ freq, duration: 0.22, level: 0.14, delay: index * 0.08 });
    });
  },

  complete() {
    [392, 493.88, 587.33, 783.99, 987.77].forEach((freq, index) => {
      this._tone({ freq, duration: 0.28, level: 0.14, delay: index * 0.1 });
    });
  },
};
