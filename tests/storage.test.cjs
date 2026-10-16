const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeStore() {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; }
  };
  const context = vm.createContext({ localStorage, Date, Math, JSON, Object, Array, String, Number, Blob, URL, document: {} });
  vm.runInContext(fs.readFileSync('storage.js', 'utf8'), context, { filename: 'storage.js' });
  return { Store: vm.runInContext('Store', context), localStorage, values };
}

test('daily key follows the device local calendar date', () => {
  const { Store } = makeStore();
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  assert.equal(Store.todayKey(), `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
});

test('daily completion increments only for the previous local calendar day', () => {
  const { Store } = makeStore();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pad = n => String(n).padStart(2, '0');
  const key = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
  Store.set('daily', { lastDate: key, streak: 4, completed: {} });
  assert.equal(Store.markDailyComplete(90), 5);
  assert.equal(Store.completedToday(), true);
});

test('backup import restores arcade, custom puzzles and score tables', () => {
  const { Store } = makeStore();
  const payload = {
    settings: { theme: 'dark' },
    stats: { totalGames: 3, mistakes: [], sessions: [] },
    highScores: { all: [{ score: 99 }], daily: [{ score: 20 }] },
    arcade: { score: 12, wins: 2, plays: 4, completed: {}, gameStats: {} },
    customPuzzles: [{ id: 'custom-1' }],
    plan: { category: 'logic', rounds: 8 }
  };
  assert.equal(Store.validateImport(payload), true);
  Store.importData(payload);
  assert.equal(Store.getHighScores('all')[0].score, 99);
  assert.equal(Store.getArcadeProgress().score, 12);
  assert.equal(Store.getCustomPuzzles()[0].id, 'custom-1');
  assert.equal(Store.getPlan().rounds, 8);
});

test('invalid backup payloads are rejected', () => {
  const { Store } = makeStore();
  assert.equal(Store.validateImport({ stats: {}, settings: {} }), true);
  assert.equal(Store.validateImport({ stats: [] }), false);
});
