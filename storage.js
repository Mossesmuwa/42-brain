/**
 * storage.js – Persistent data layer using localStorage
 * Handles scores, settings, achievements, stats, daily progress
 */
'use strict';

const Store = {
  P: '_42brain_',

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
    return { theme: 'dark', sound: true, volume: 0.5, hints: true, showTimer: true, animations: true };
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
    return this.get('stats', {
      totalGames: 0, totalCorrect: 0, totalAnswered: 0,
      totalReactionMs: 0, reactionCount: 0,
      bestStreak: 0, bestScore: 0,
      gamesPerType: {}, correctPerType: {},
    });
  },

  updateStats(s) {
    const stats = this.getStats();
    stats.totalGames++;
    stats.totalCorrect  += s.correct  || 0;
    stats.totalAnswered += s.total    || 0;
    if (s.reactionMs)  { stats.totalReactionMs += s.reactionMs; stats.reactionCount++; }
    stats.bestStreak = Math.max(stats.bestStreak, s.bestStreak || 0);
    stats.bestScore  = Math.max(stats.bestScore,  s.score      || 0);
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
    this.set('daily', data);
    return data.streak;
  },

  /* ── EXPORT ── */
  exportData() {
    const data = {
      exported: new Date().toISOString(),
      settings: this.getSettings(),
      stats: this.getStats(),
      achievements: this.getAchievements(),
      highScores: { all: this.getHighScores('all'), training: this.getHighScores('training'), test: this.getHighScores('test'), mixed: this.getHighScores('mixed'), daily: this.getHighScores('daily') },
      daily: this.getDailyData(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `42brain_${this.todayKey()}.json` });
    a.click();
    URL.revokeObjectURL(url);
  },

  clearAll() {
    Object.keys(localStorage).filter(k => k.startsWith(this.P)).forEach(k => localStorage.removeItem(k));
  },
};
