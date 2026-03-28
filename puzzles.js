/**
 * puzzles.js – Puzzle generators for the 42 Brain trainer
 * All generators return: { type, instruction, display, answer, options, renderFn }
 */

'use strict';

/* ── UTILITIES ──────────────────────────────────────────────────── */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rand(0, arr.length - 1)];
const shuffle = arr => [...arr].sort(() => Math.random() - .5);

const COLORS = [
  { name: 'Red',    hex: '#ef4444' },
  { name: 'Blue',   hex: '#3b82f6' },
  { name: 'Green',  hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Teal',   hex: '#14b8a6' },
  { name: 'Pink',   hex: '#ec4899' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Lime',   hex: '#84cc16' },
];

const SHAPES = ['●', '■', '▲', '★', '♦', '⬟', '⬡', '⬖', '⬗', '◆', '☆', '▶'];
const EMOJIS = ['🍎','🍋','🍇','🍓','🍑','🥝','🍊','🍉','🫐','🍒'];

/* ── SEQUENCE PUZZLES ────────────────────────────────────────────── */

/** Arithmetic sequence */
function genArithmetic(difficulty) {
  const d = difficulty;
  const step = pick([...Array(5+d).keys()].map(i => i + 2)) * (Math.random() < 0.4 ? -1 : 1);
  const start = rand(1, 20 + d * 5);
  const len = 3 + Math.min(d, 3);
  const seq = Array.from({ length: len + 1 }, (_, i) => start + step * i);
  const blankIdx = rand(len - 2, len);
  const answer = seq[blankIdx];
  const display = seq.map((v, i) => i === blankIdx ? null : v);
  const opts = genNumericOptions(answer, d);
  return {
    type: 'logic',
    subtype: 'arithmetic',
    instruction: 'What number comes next? Find the missing term.',
    display: { sequence: display, blankIdx },
    answer: String(answer),
    options: opts,
    renderFn: 'renderSequence',
  };
}

/** Geometric sequence */
function genGeometric(difficulty) {
  const d = difficulty;
  const ratio = pick([2, 3, 4, 5].slice(0, 2 + d));
  const start = rand(1, 8);
  const len = 3 + Math.min(d, 2);
  const seq = Array.from({ length: len + 1 }, (_, i) => start * Math.pow(ratio, i));
  if (seq.some(v => v > 10000)) return genArithmetic(difficulty);
  const blankIdx = rand(len - 1, len);
  const answer = seq[blankIdx];
  const display = seq.map((v, i) => i === blankIdx ? null : v);
  const opts = genNumericOptions(answer, d);
  return {
    type: 'logic',
    subtype: 'geometric',
    instruction: 'Identify the geometric pattern – find the missing number.',
    display: { sequence: display, blankIdx },
    answer: String(answer),
    options: opts,
    renderFn: 'renderSequence',
  };
}

/** Fibonacci-like sequence */
function genFibonacci(difficulty) {
  const a = rand(1, 4);
  const b = rand(1, 5);
  const seq = [a, b];
  const len = 4 + Math.min(difficulty, 2);
  for (let i = 2; i < len + 1; i++) seq.push(seq[i-1] + seq[i-2]);
  const blankIdx = rand(len - 2, len);
  const answer = seq[blankIdx];
  const display = seq.map((v, i) => i === blankIdx ? null : v);
  const opts = genNumericOptions(answer, difficulty);
  return {
    type: 'logic',
    subtype: 'fibonacci',
    instruction: 'Each number is the sum of the two before it. Find the missing number.',
    display: { sequence: display, blankIdx },
    answer: String(answer),
    options: opts,
    renderFn: 'renderSequence',
  };
}

function genNumericOptions(answer, difficulty) {
  const opts = new Set([answer]);
  const range = Math.max(5, Math.abs(answer) * 0.4 + difficulty * 3);
  while (opts.size < 4) {
    const delta = rand(-Math.ceil(range), Math.ceil(range));
    if (delta !== 0) opts.add(answer + delta);
  }
  return shuffle([...opts]).map(String);
}

/* ── PATTERN RECOGNITION ─────────────────────────────────────────── */

/** Shape matrix – 3×3 with one missing */
function genShapeMatrix(difficulty) {
  const d = difficulty;
  const palette = shuffle(SHAPES).slice(0, 3 + Math.min(d, 3));
  // Build a 3×3 Latin square pattern
  const rows = 3, cols = 3;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push(palette[(r + c) % palette.length]);
    }
  }
  const blankR = rand(1, rows - 1);
  const blankC = rand(1, cols - 1);
  const answer = grid[blankR][blankC];
  grid[blankR][blankC] = null;

  // Generate distractors from palette + extras
  const decoys = SHAPES.filter(s => !palette.includes(s));
  const opts = shuffle([answer, ...shuffle([...palette, ...decoys]).filter(s => s !== answer).slice(0, 3)]);
  return {
    type: 'logic',
    subtype: 'shape_matrix',
    instruction: 'Find the missing symbol that completes the pattern.',
    display: { grid, rows, cols, blankR, blankC },
    answer,
    options: opts,
    renderFn: 'renderShapeMatrix',
  };
}

/** Odd one out – shapes */
function genOddOneOut(difficulty) {
  const d = difficulty;
  const numItems = 4 + Math.min(d, 2);
  // Pick a majority shape and one odd
  const majority = pick(SHAPES);
  let odd = pick(SHAPES);
  while (odd === majority) odd = pick(SHAPES);
  const items = Array(numItems - 1).fill(majority);
  const oddIdx = rand(0, numItems - 1);
  items.splice(oddIdx, 0, odd);
  const opts = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numItems);
  return {
    type: 'logic',
    subtype: 'odd_one_out',
    instruction: 'Which symbol does NOT belong? Click its label.',
    display: { items, labels: opts },
    answer: opts[oddIdx],
    options: opts,
    renderFn: 'renderOddOneOut',
  };
}

/** Find the rule – number pairs */
function genFindTheRule(difficulty) {
  const d = difficulty;
  const rules = [
    { label: '×2', fn: n => n * 2 },
    { label: '×3', fn: n => n * 3 },
    { label: '+10', fn: n => n + 10 },
    { label: '²', fn: n => n * n },
    { label: '−5', fn: n => n - 5 },
    { label: '×2+1', fn: n => n * 2 + 1 },
  ].slice(0, 2 + d);
  const rule = pick(rules);
  const numPairs = 2 + Math.min(d, 2);
  const pairs = Array.from({ length: numPairs }, () => { const n = rand(2, 12); return { in: n, out: rule.fn(n) }; });
  const testIn = rand(2, 15);
  const answer = String(rule.fn(testIn));
  // Build option pool
  const opts = genNumericOptions(Number(answer), d);
  return {
    type: 'logic',
    subtype: 'find_rule',
    instruction: `Each pair follows a rule: Input → Output. Apply it to ${testIn}.`,
    display: { pairs, testIn },
    answer,
    options: opts,
    renderFn: 'renderFindRule',
  };
}

/* ── MEMORY CHALLENGES ───────────────────────────────────────────── */

/** Number sequence memory */
function genMemoryNumbers(difficulty) {
  const d = difficulty;
  const len = 3 + d;
  const seq = Array.from({ length: len }, () => rand(1, 9 + d * 10));
  // Ask for a specific position
  const askIdx = rand(0, len - 1);
  const answer = String(seq[askIdx]);
  const opts = genNumericOptions(Number(answer), d);
  return {
    type: 'memory',
    subtype: 'mem_numbers',
    instruction: `What was the number at position ${askIdx + 1}?`,
    display: { seq, askIdx },
    answer,
    options: opts,
    renderFn: 'renderMemNumbers',
    flashDuration: Math.max(1500, 3500 - d * 500),
  };
}

/** Color sequence memory */
function genMemoryColors(difficulty) {
  const d = difficulty;
  const len = 3 + Math.min(d, 4);
  const pool = shuffle(COLORS).slice(0, len + 2);
  const seq = pool.slice(0, len);
  const askIdx = rand(0, len - 1);
  const answer = seq[askIdx].name;
  // Option colors: correct + decoys
  const decoys = COLORS.filter(c => c.name !== answer);
  const optColors = shuffle([seq[askIdx], ...shuffle(decoys).slice(0, 3)]);
  return {
    type: 'memory',
    subtype: 'mem_colors',
    instruction: `What color was at position ${askIdx + 1}?`,
    display: { seq, askIdx },
    answer,
    options: optColors.map(c => c.name),
    optionColors: optColors,
    renderFn: 'renderMemColors',
    flashDuration: Math.max(1200, 3000 - d * 400),
  };
}

/** Position memory – highlight cells in a grid */
function genMemoryPositions(difficulty) {
  const d = difficulty;
  const gridSize = 3 + Math.min(d, 1); // 3×3 or 4×4
  const numLit = 2 + Math.min(d, 4);
  const total = gridSize * gridSize;
  const litIdxs = shuffle([...Array(total).keys()]).slice(0, numLit);

  // Ask: was cell X lit?
  const askIdx = Math.random() < 0.5 ? pick(litIdxs) : pick([...Array(total).keys()].filter(i => !litIdxs.includes(i)));
  const answer = litIdxs.includes(askIdx) ? 'Yes' : 'No';
  return {
    type: 'memory',
    subtype: 'mem_positions',
    instruction: `Was position ${askIdx + 1} highlighted?`,
    display: { gridSize, litIdxs, askIdx },
    answer,
    options: ['Yes', 'No'],
    renderFn: 'renderMemPositions',
    flashDuration: Math.max(1500, 3000 - d * 300),
  };
}

/** Sequence order recall – rearrange tiles */
function genMemoryOrder(difficulty) {
  const d = difficulty;
  const len = 3 + Math.min(d, 3);
  const seq = Array.from({ length: len }, () => rand(1, 20));
  // Ask user the full sequence, allow text input
  const answer = seq.join(',');
  return {
    type: 'memory',
    subtype: 'mem_order',
    instruction: 'Type the numbers you saw, separated by commas (e.g. 4,7,2).',
    display: { seq },
    answer,
    options: null, // text input
    renderFn: 'renderMemOrder',
    flashDuration: Math.max(2000, 4000 - d * 400),
    textInput: true,
  };
}

/* ── EXPORT ──────────────────────────────────────────────────────── */

window.PuzzleEngine = {
  /**
   * Generate a puzzle for the given round (0-indexed) and difficulty setting.
   * Difficulty: 'easy'=0, 'normal'=1, 'hard'=2
   */
  generate(round, diffSetting, totalRounds) {
    const diffBase = { easy: 0, normal: 1, hard: 2 }[diffSetting] ?? 1;
    // Scale difficulty 0→(diffBase+2) over totalRounds rounds
    const difficulty = Math.min(diffBase + Math.floor(round / (totalRounds / 3)), diffBase + 3);

    // Weighted pool: more memory as rounds progress
    const memWeight = Math.min(0.5, 0.2 + round * 0.03);

    const logicGenerators = [
      genArithmetic,
      genGeometric,
      genFibonacci,
      genShapeMatrix,
      genOddOneOut,
      genFindTheRule,
    ];
    const memoryGenerators = [
      genMemoryNumbers,
      genMemoryColors,
      genMemoryPositions,
      genMemoryOrder,
    ];

    const useMemory = Math.random() < memWeight;
    const gen = pick(useMemory ? memoryGenerators : logicGenerators);
    return gen(difficulty);
  },
};
