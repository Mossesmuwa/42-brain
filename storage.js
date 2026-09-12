/**
 * storage.js – Persistent data layer using localStorage
 * Handles scores, settings, achievements, stats, daily progress
 */
'use strict';

const Store = {
  P: '_42brain_',
  VERSION: 2,

  get(key, def = null) {
    try {
      const raw = localStorage.getItem(this.P + key);
      return raw !== null ? JSON.parse(raw) : def;
    } catch { return def; }
  },

  set(key, val) {
    try { localStorage.setItem(this.P + key, JSON.stringify(val)); } catch {}
  },

  /* ── SETTINGS ── */
  defaultSettings() {
    return { theme: 'dark', sound: true, volume: 0.5, hints: true, showTimer: true, animations: true, reducedMotion: false, largeText: false, highContrast: false, colorblind: false, screenReader: false };
  },
  getSettings()   { return { ...this.defaultSettings(), ...this.get('settings', {}) }; },
  saveSettings(s) { this.set('settings', s); },

  /* ── HIGH SCORES ── */
  getHighScores(mode = 'all') { return this.get('scores_' + mode, []); },

  saveScore(mode, entry) {
    const push = (m, e) => {
      const arr = this.getHighScores(m);
      arr.push(e);
      arr.sort((a, b) => b.score - a.score);
      this.set('scores_' + m, arr.slice(0, 10));
    };
    push(mode, entry);
    push('all', { ...entry, mode });
  },

  /* ── LIFETIME STATS ── */
  getStats() {
    const defaults = {
      totalGames: 0, totalCorrect: 0, totalAnswered: 0,
      totalReactionMs: 0, reactionCount: 0,
      bestStreak: 0, bestScore: 0,
      gamesPerType: {}, correctPerType: {}, categoryAnswered: {}, categoryCorrect: {},
      xp: 0, level: 1, mistakes: [], sessions: [], dailyHistory: {},
    };
    const saved = this.get('stats', {});
    return { ...defaults, ...saved, categoryAnswered: { ...defaults.categoryAnswered, ...(saved.categoryAnswered || {}) },
      categoryCorrect: { ...defaults.categoryCorrect, ...(saved.categoryCorrect || {}) },
      mistakes: saved.mistakes || [], sessions: saved.sessions || [], dailyHistory: saved.dailyHistory || {} };
  },

  updateStats(s) {
    const stats = this.getStats();
    stats.totalGames++;
    stats.totalCorrect  += s.correct  || 0;
    stats.totalAnswered += s.total    || 0;
    if (s.reactionMs)  { stats.totalReactionMs += s.reactionMs; stats.reactionCount++; }
    stats.bestStreak = Math.max(stats.bestStreak, s.bestStreak || 0);
    stats.bestScore  = Math.max(stats.bestScore,  s.score      || 0);
    const xp = Math.max(0, Math.round((s.score || 0) + (s.correct || 0) * 10));
    stats.xp = (stats.xp || 0) + xp;
    stats.level = 1 + Math.floor(stats.xp / 1000);
    (s.results || []).forEach(r => {
      const t = r.type || 'logic';
      stats.categoryAnswered[t] = (stats.categoryAnswered[t] || 0) + 1;
      if (r.correct) stats.categoryCorrect[t] = (stats.categoryCorrect[t] || 0) + 1;
      if (!r.correct && stats.mistakes.length < 200) stats.mistakes.unshift({ ...r, date: Date.now() });
    });
    stats.mistakes = stats.mistakes.slice(0, 200);
    stats.sessions = (stats.sessions || []).concat([{ date: Date.now(), score: s.score || 0, accuracy: s.accuracy || 0, mode: s.mode || 'training' }]).slice(-100);
    const day = this.todayKey();
    stats.dailyHistory[day] = (stats.dailyHistory[day] || 0) + 1;
    this.set('stats', stats);
    return stats;
  },

  /* ── ACHIEVEMENTS ── */
  getAchievements()     { return this.get('achievements', {}); },
  unlockAchievement(id) {
    const ach = this.getAchievements();
    if (!ach[id]) { ach[id] = { at: Date.now() }; this.set('achievements', ach); return true; }
    return false;
  },

  /* ── CUSTOM PUZZLES ── */
  getCustomPuzzles()      { return this.get('custom_puzzles', []); },
  saveCustomPuzzles(arr)  { this.set('custom_puzzles', arr); },

  /* ── DAILY CHALLENGE ── */
  getDailyData()  { return this.get('daily', { lastDate: null, streak: 0, completed: {} }); },
  todayKey()      { return new Date().toISOString().slice(0, 10); },
  completedToday(){ return this.getDailyData().lastDate === this.todayKey(); },

  markDailyComplete(score) {
    const data = this.getDailyData();
    const today = this.todayKey();
    const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.streak = (data.lastDate === yest) ? data.streak + 1 : 1;
    data.lastDate = today;
    data.completed[today] = score;
    data.history = data.history || [];
    data.history.unshift({ date: today, score, streak: data.streak });
    data.history = data.history.slice(0, 90);
    this.set('daily', data);
    return data.streak;
  },

  getProfile() { return this.get('profile', { name: 'Player', plan: null }); },
  saveProfile(profile) { this.set('profile', { ...this.getProfile(), ...profile }); },
  levelInfo() {
    const xp = this.getStats().xp || 0;
    const level = 1 + Math.floor(xp / 1000);
    return { xp, level, current: xp % 1000, next: 1000 };
  },
  getPlan() { return this.get('plan', null); },
  savePlan(plan) { this.set('plan', plan); },

  /* ── EXPORT ── */
  exportData() {
    const data = {
      exported: new Date().toISOString(),
      settings: this.getSettings(),
      stats: this.getStats(),
      achievements: this.getAchievements(),
      highScores: { all: this.getHighScores('all'), training: this.getHighScores('training'), test: this.getHighScores('test'), mixed: this.getHighScores('mixed'), daily: this.getHighScores('daily') },
      daily: this.getDailyData(), version: this.VERSION,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `42brain_${this.todayKey()}.json` });
    a.click();
    URL.revokeObjectURL(url);
  },

  backupData() {
    const payload = { backedUp: new Date().toISOString(), version: this.VERSION, settings: this.getSettings(), stats: this.getStats(), achievements: this.getAchievements(), daily: this.getDailyData(), profile: this.getProfile() };
    this.set('backup', payload);
    return payload;
  },
  importData(payload) {
    if (!this.validateImport(payload)) throw new Error('Invalid 42 Brain backup');
    this.backupData();
    ['settings','stats','achievements','daily','profile'].forEach(k => { if (payload[k] !== undefined) this.set(k, payload[k]); });
    return true;
  },
  validateImport(payload) {
    return !!(payload && typeof payload === 'object' && payload.stats && typeof payload.stats === 'object' &&
      payload.settings && typeof payload.settings === 'object' &&
      (!payload.stats.mistakes || Array.isArray(payload.stats.mistakes)) &&
      (!payload.stats.sessions || Array.isArray(payload.stats.sessions)));
  },
  markMistakeMastered(index) {
    const stats=this.getStats();
    if (stats.mistakes[index]) stats.mistakes.splice(index,1);
    this.set('stats',stats);
  },

  clearAll() {
    this.backupData();
    Object.keys(localStorage).filter(k => k.startsWith(this.P) && k !== this.P + 'backup').forEach(k => localStorage.removeItem(k));
  },
};

// Keep old installations usable while making future migrations explicit.
(function migrate() {
  const version = Store.get('version', 1);
  if (version < Store.VERSION) {
    const stats = Store.getStats();
    if (!stats.dailyHistory) stats.dailyHistory = {};
    Store.set('stats', stats);
    Store.set('version', Store.VERSION);
  }
})();
