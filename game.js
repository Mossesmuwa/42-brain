/**
 * game.js – Core engine for the 42 Brain trainer
 * Handles screens, timer, rendering, scoring, keyboard/mouse controls,
 * sound effects, persistent storage, achievements, hints, daily challenge, dark mode
 */

'use strict';

/* ── STATE ──────────────────────────────────────────────────────── */
const G = {
  totalRounds: 10,
  difficulty: 'normal',
  mode: 'training',      // training | daily
  round: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  results: [],
  puzzle: null,
  timerInterval: null,
  timeLeft: 0,
  maxTime: 15,
  answered: false,
  flashTimeout: null,
  dragSrc: null,
  hintUsed: false,
  // Attention puzzle state
  attnFound: 0,
  attnErrors: 0,
  // Reaction puzzle state
  reactionStart: 0,
  reactionTimes: [],
};

/* ── DOM REFS ────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const screens = {
  splash: $('splash'),
  game: $('gameScreen'),
  results: $('resultsScreen'),
  stats: $('statsPanel'),
};

const el = {
  startBtn:         $('startBtn'),
  dailyBtn:         $('dailyBtn'),
  themeToggle:      $('themeToggle'),
  statsBtn:         $('statsBtn'),
  closeStatsBtn:    $('closeStatsBtn'),
  hintBtn:          $('hintBtn'),
  hintBar:          $('hintBar'),
  hintText:         $('hintText'),
  exitGameBtn:      $('exitGameBtn'),
  roundNum:         $('roundNum'),
  totalRounds:      $('totalRounds'),
  typePill:         $('typePill'),
  scoreVal:         $('scoreVal'),
  streakBox:        $('streakBox'),
  streakVal:        $('streakVal'),
  timerBar:         $('timerBar'),
  timerNum:         $('timerNum'),
  flashOverlay:     $('flashOverlay'),
  flashContent:     $('flashContent'),
  flashBar:         $('flashBar'),
  puzzleInstruction:$('puzzleInstruction'),
  puzzleDisplay:    $('puzzleDisplay'),
  answerArea:       $('answerArea'),
  dragGrid:         $('dragGrid'),
  feedbackToast:    $('feedbackToast'),
  feedbackIcon:     $('feedbackIcon'),
  feedbackText:     $('feedbackText'),
  progressDots:     $('progressDots'),
  // Results
  resultEmoji:      $('resultEmoji'),
  resultTitle:      $('resultTitle'),
  resultQuote:      $('resultQuote'),
  finalScore:       $('finalScore'),
  finalCorrect:     $('finalCorrect'),
  finalAccuracy:    $('finalAccuracy'),
  finalStreak:      $('finalStreak'),
  roundTimeline:    $('roundTimeline'),
  achievementsUnlocked: $('achievementsUnlocked'),
  radarCanvas:      $('radarCanvas'),
  playAgainBtn:     $('playAgainBtn'),
  mainMenuBtn:      $('mainMenuBtn'),
  // Stats panel
  ltGames:          $('ltGames'),
  ltAccuracy:       $('ltAccuracy'),
  ltBestScore:      $('ltBestScore'),
  ltBestStreak:     $('ltBestStreak'),
  dailyStreak:      $('dailyStreak'),
  achievementsList: $('achievementsList'),
  scoresList:       $('scoresList'),
  exportDataBtn:    $('exportDataBtn'),
  clearDataBtn:     $('clearDataBtn'),
  // Achievement toast
  achievementToast: $('achievementToast'),
  achIcon:          $('achIcon'),
  achName:          $('achName'),
};

/* ── INIT ────────────────────────────────────────────────────────── */
(function init() {
  const settings = Store.getSettings();
  SoundFX.init(settings.volume, settings.sound);
  applyTheme(settings.theme);
  if (Store.completedToday()) el.dailyBtn.textContent = '✅ Daily Done';
})();

/* ── THEME ───────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  el.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

el.themeToggle.addEventListener('click', () => {
  SoundFX.click();
  const s = Store.getSettings();
  s.theme = s.theme === 'dark' ? 'light' : 'dark';
  Store.saveSettings(s);
  applyTheme(s.theme);
});

/* ── SCREEN SWITCHING ────────────────────────────────────────────── */
function showScreen(name) {
  Object.entries(screens).forEach(([k, v]) => {
    v.classList.toggle('active', k === name);
  });
}

/* ── DIFFICULTY BUTTONS (splash) ─────────────────────────────────── */
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    SoundFX.click();
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    G.difficulty = btn.dataset.diff;
  });
});

/* ── START ───────────────────────────────────────────────────────── */
el.startBtn.addEventListener('click', () => { G.mode = 'training'; startGame(); });
el.dailyBtn.addEventListener('click', () => {
  if (Store.completedToday()) return;
  G.mode = 'daily'; G.difficulty = 'normal'; startGame();
});

function startGame() {
  SoundFX.click();
  G.round = 0;
  G.score = 0;
  G.streak = 0;
  G.bestStreak = 0;
  G.results = [];
  G.reactionTimes = [];
  G.hintUsed = false;

  G.totalRounds = G.mode === 'daily' ? 10 : { easy: 8, normal: 10, hard: 12 }[G.difficulty];
  G.maxTime     = { easy: 20, normal: 15, hard: 10 }[G.difficulty];

  el.totalRounds.textContent = G.totalRounds;
  el.scoreVal.textContent = '0';
  el.streakVal.textContent = '0';
  el.hintBar.classList.add('hidden');

  buildProgressDots();
  showScreen('game');
  nextRound();
}

/* ── PROGRESS DOTS ───────────────────────────────────────────────── */
function buildProgressDots() {
  el.progressDots.innerHTML = '';
  for (let i = 0; i < G.totalRounds; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' current' : '');
    d.id = `dot-${i}`;
    el.progressDots.appendChild(d);
  }
}

function markDot(round, result) {
  const d = $(`dot-${round}`);
  if (!d) return;
  d.classList.remove('current');
  d.classList.add(result);
  const next = $(`dot-${round + 1}`);
  if (next) next.classList.add('current');
}

/* ── HINT SYSTEM ─────────────────────────────────────────────────── */
el.hintBtn.addEventListener('click', () => {
  if (!G.puzzle || G.answered) return;
  SoundFX.click();
  G.hintUsed = true;
  el.hintBar.classList.remove('hidden');
  el.hintText.textContent = G.puzzle.hint || 'Think carefully!';
});

/* ── QUIT SESSION ────────────────────────────────────────────────── */
el.exitGameBtn.addEventListener('click', () => {
  SoundFX.click();
  if (confirm('Quit the current session? Your progress will be lost.')) {
    stopTimer();
    clearTimeout(G.flashTimeout);
    showScreen('splash');
  }
});

/* ── ROUND FLOW ──────────────────────────────────────────────────── */
function nextRound() {
  if (G.round >= G.totalRounds) { showResults(); return; }

  G.answered = false;
  G.hintUsed = false;
  G.attnFound = 0;
  G.attnErrors = 0;
  el.hintBar.classList.add('hidden');

  if (G.mode === 'daily') {
    G.puzzle = PuzzleEngine.generateDaily(G.round, G.totalRounds);
  } else {
    G.puzzle = PuzzleEngine.generate(G.round, G.difficulty, G.totalRounds);
  }

  // Update HUD
  el.roundNum.textContent = G.round + 1;
  const typeMap = { memory: 'Memory', logic: 'Logic', math: 'Math', reaction: 'Reaction', attention: 'Focus' };
  const colorMap = {
    memory:    { bg: 'var(--purple-light)', fg: 'var(--purple)', bc: '#ddd6fe' },
    logic:     { bg: 'var(--accent-light)', fg: 'var(--accent)', bc: '#bfdbfe' },
    math:      { bg: 'var(--yellow-light)', fg: 'var(--yellow)', bc: '#fde68a' },
    reaction:  { bg: 'var(--green-light)',  fg: 'var(--green)',  bc: '#bbf7d0' },
    attention: { bg: 'var(--orange-light)', fg: 'var(--orange)', bc: '#fed7aa' },
  };
  const type = G.puzzle.type;
  el.typePill.textContent = typeMap[type] || 'Logic';
  const c = colorMap[type] || colorMap.logic;
  el.typePill.style.background = c.bg;
  el.typePill.style.color = c.fg;
  el.typePill.style.borderColor = c.bc;

  // Clear areas
  el.dragGrid.classList.add('hidden');
  el.answerArea.innerHTML = '';
  el.puzzleDisplay.innerHTML = '';

  if (G.puzzle.type === 'memory') {
    showFlash();
  } else {
    renderPuzzle();
    startTimer();
  }
}

/* ── FLASH MEMORY PHASE ──────────────────────────────────────────── */
function showFlash() {
  el.flashContent.innerHTML = '';
  el.flashOverlay.classList.remove('hidden');
  renderFlashContent();

  const duration = G.puzzle.flashDuration ?? 2500;
  let startTime = null;

  function animateFlashBar(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    const pct = Math.max(0, 1 - elapsed / duration);
    el.flashBar.style.width = (pct * 100) + '%';
    el.flashBar.style.transition = 'none';
    if (elapsed < duration) requestAnimationFrame(animateFlashBar);
  }
  requestAnimationFrame(animateFlashBar);

  G.flashTimeout = setTimeout(() => {
    el.flashOverlay.classList.add('hidden');
    renderPuzzle();
    startTimer();
  }, duration);
}

function renderFlashContent() {
  const p = G.puzzle;
  const fc = el.flashContent;
  fc.innerHTML = '';

  if (p.subtype === 'mem_numbers' || p.subtype === 'mem_order') {
    p.display.seq.forEach(n => {
      const tile = document.createElement('div');
      tile.className = 'mem-tile';
      tile.textContent = n;
      fc.appendChild(tile);
    });
  } else if (p.subtype === 'mem_letters') {
    p.display.seq.forEach(l => {
      const tile = document.createElement('div');
      tile.className = 'mem-tile letter-tile';
      tile.textContent = l;
      fc.appendChild(tile);
    });
  } else if (p.subtype === 'mem_colors') {
    p.display.seq.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = c.hex;
      fc.appendChild(swatch);
    });
  } else if (p.subtype === 'mem_positions') {
    const { gridSize, litIdxs } = p.display;
    const grid = document.createElement('div');
    grid.className = 'pos-grid';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 52px)`;
    for (let i = 0; i < gridSize * gridSize; i++) {
      const cell = document.createElement('div');
      cell.className = 'pos-cell' + (litIdxs.includes(i) ? ' lit' : '');
      cell.textContent = litIdxs.includes(i) ? '★' : '';
      grid.appendChild(cell);
    }
    fc.appendChild(grid);
  }
}

/* ── RENDER PUZZLE ───────────────────────────────────────────────── */
function renderPuzzle() {
  const p = G.puzzle;
  el.puzzleInstruction.textContent = p.instruction;
  el.puzzleDisplay.innerHTML = '';
  el.answerArea.innerHTML = '';

  const renderers = {
    renderSequence, renderShapeMatrix, renderOddOneOut,
    renderFindRule, renderMemNumbers, renderMemColors,
    renderMemPositions, renderMemOrder, renderMemLetters,
    renderDeduction, renderMentalMath, renderReactionTime,
    renderAttentionFocus, renderCustom,
  };
  const fn = renderers[p.renderFn];
  if (fn) fn(p);
  else buildOptionButtons(p, 'cols-4'); // fallback
}

/* ── SEQUENCE RENDERER ───────────────────────────────────────────── */
function renderSequence(p) {
  const { sequence } = p.display;
  sequence.forEach((v, i) => {
    if (i > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '→';
      el.puzzleDisplay.appendChild(arrow);
    }
    const box = document.createElement('div');
    box.className = 'seq-num' + (v === null ? ' blank' : '');
    box.textContent = v === null ? '?' : v;
    el.puzzleDisplay.appendChild(box);
  });
  buildOptionButtons(p, 'cols-4');
}

/* ── SHAPE MATRIX RENDERER ───────────────────────────────────────── */
function renderShapeMatrix(p) {
  const { grid, cols } = p.display;
  const table = document.createElement('div');
  table.className = 'shape-grid';
  table.style.gridTemplateColumns = `repeat(${cols}, 58px)`;
  grid.forEach(row => {
    row.forEach(cell => {
      const div = document.createElement('div');
      div.className = 'shape-cell' + (cell === null ? ' blank' : '');
      div.textContent = cell === null ? '?' : cell;
      table.appendChild(div);
    });
  });
  el.puzzleDisplay.appendChild(table);
  buildOptionButtons(p, 'cols-4');
}

/* ── ODD ONE OUT RENDERER ────────────────────────────────────────── */
function renderOddOneOut(p) {
  const { items, labels } = p.display;
  const row = document.createElement('div');
  row.className = 'ooo-row';
  items.forEach((shape, i) => {
    const box = document.createElement('div');
    box.className = 'ooo-item';
    const sym = document.createElement('div');
    sym.className = 'shape-cell';
    sym.textContent = shape;
    const lbl = document.createElement('span');
    lbl.className = 'ooo-label';
    lbl.textContent = labels[i];
    box.appendChild(sym);
    box.appendChild(lbl);
    row.appendChild(box);
  });
  el.puzzleDisplay.appendChild(row);
  buildOptionButtons(p, labels.length <= 4 ? 'cols-4' : 'cols-3');
}

/* ── FIND THE RULE RENDERER ──────────────────────────────────────── */
function renderFindRule(p) {
  const { pairs, testIn } = p.display;
  const table = document.createElement('div');
  table.className = 'rule-table';
  pairs.forEach(pair => {
    const row = document.createElement('div');
    row.className = 'rule-row';
    row.innerHTML = `<div class="seq-num">${pair.in}</div><span class="arrow">→</span><div class="seq-num">${pair.out}</div>`;
    table.appendChild(row);
  });
  const testRow = document.createElement('div');
  testRow.className = 'rule-row rule-test';
  testRow.innerHTML = `<div class="seq-num">${testIn}</div><span class="arrow">→</span><div class="seq-num blank">?</div>`;
  table.appendChild(testRow);
  el.puzzleDisplay.appendChild(table);
  buildOptionButtons(p, 'cols-4');
}

/* ── DEDUCTION RENDERER ──────────────────────────────────────────── */
function renderDeduction(p) {
  const { clues } = p.display;
  const list = document.createElement('div');
  list.className = 'clue-list';
  clues.forEach((clue, i) => {
    const item = document.createElement('div');
    item.className = 'clue-item';
    item.innerHTML = `<span class="clue-num">${i + 1}</span><span class="clue-text">${clue}</span>`;
    list.appendChild(item);
  });
  el.puzzleDisplay.appendChild(list);
  buildOptionButtons(p, 'cols-4');
}

/* ── MENTAL MATH RENDERER ────────────────────────────────────────── */
function renderMentalMath(p) {
  const eq = document.createElement('div');
  eq.className = 'math-equation';
  eq.textContent = p.display.equation;
  el.puzzleDisplay.appendChild(eq);
  buildOptionButtons(p, 'cols-4');
}

/* ── MEMORY: NUMBERS ─────────────────────────────────────────────── */
function renderMemNumbers(p) {
  const { askIdx, seq } = p.display;
  const row = document.createElement('div');
  row.className = 'mem-row';
  for (let i = 0; i < seq.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'seq-num' + (i === askIdx ? ' blank' : '');
    tile.style.opacity = i === askIdx ? '1' : '0.35';
    tile.textContent = i === askIdx ? '?' : '•';
    row.appendChild(tile);
  }
  el.puzzleDisplay.appendChild(row);
  buildOptionButtons(p, 'cols-4');
}

/* ── MEMORY: LETTERS ─────────────────────────────────────────────── */
function renderMemLetters(p) {
  const { askIdx, seq } = p.display;
  const row = document.createElement('div');
  row.className = 'mem-row';
  for (let i = 0; i < seq.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'seq-num' + (i === askIdx ? ' blank' : '');
    tile.style.opacity = i === askIdx ? '1' : '0.35';
    tile.textContent = i === askIdx ? '?' : '•';
    row.appendChild(tile);
  }
  el.puzzleDisplay.appendChild(row);
  buildOptionButtons(p, 'cols-4');
}

/* ── MEMORY: COLORS ──────────────────────────────────────────────── */
function renderMemColors(p) {
  const { askIdx, seq } = p.display;
  const row = document.createElement('div');
  row.className = 'mem-row';
  for (let i = 0; i < seq.length; i++) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    if (i !== askIdx) {
      swatch.style.background = 'var(--surface2)';
      swatch.style.border = '2px dashed var(--border)';
    } else {
      swatch.style.background = 'var(--accent-light)';
      swatch.style.border = '2px dashed var(--accent)';
      swatch.style.display = 'flex';
      swatch.style.alignItems = 'center';
      swatch.style.justifyContent = 'center';
      swatch.style.fontSize = '1.5rem';
      swatch.textContent = '?';
    }
    row.appendChild(swatch);
  }
  el.puzzleDisplay.appendChild(row);

  const colorRow = document.createElement('div');
  colorRow.className = 'color-opt-row';
  p.optionColors.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-opt-btn';
    btn.style.background = c.hex;
    btn.dataset.value = c.name;
    btn.title = c.name;
    btn.addEventListener('click', () => handleAnswer(c.name, btn));
    colorRow.appendChild(btn);
  });
  el.answerArea.appendChild(colorRow);
}

/* ── MEMORY: POSITIONS ───────────────────────────────────────────── */
function renderMemPositions(p) {
  const { gridSize, askIdx } = p.display;
  const grid = document.createElement('div');
  grid.className = 'pos-grid';
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 52px)`;
  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'pos-cell' + (i === askIdx ? ' lit' : '');
    cell.textContent = i + 1;
    cell.style.fontSize = '.8rem';
    cell.style.fontWeight = '700';
    cell.style.color = i === askIdx ? '#fff' : 'var(--text3)';
    grid.appendChild(cell);
  }
  el.puzzleDisplay.appendChild(grid);
  buildOptionButtons(p, 'cols-2');
}

/* ── MEMORY: ORDER (text input) ──────────────────────────────────── */
function renderMemOrder(p) {
  const row = document.createElement('div');
  row.className = 'mem-row';
  p.display.seq.forEach(() => {
    const tile = document.createElement('div');
    tile.className = 'seq-num blank';
    tile.textContent = '?';
    row.appendChild(tile);
  });
  el.puzzleDisplay.appendChild(row);
  buildTextInput();
}

/* ── REACTION TIME RENDERER ──────────────────────────────────────── */
function renderReactionTime(p) {
  const { delay, signal } = p.display;
  const wrap = document.createElement('div');
  wrap.className = 'reaction-wrap';

  const circle = document.createElement('div');
  circle.className = 'reaction-circle waiting';
  circle.innerHTML = '<span class="reaction-label">Wait…</span>';
  wrap.appendChild(circle);
  el.puzzleDisplay.appendChild(wrap);

  // No option buttons — user clicks the circle
  const statusP = document.createElement('p');
  statusP.className = 'reaction-status';
  statusP.textContent = 'Wait for the signal…';
  el.answerArea.appendChild(statusP);

  let fired = false;
  let tooEarly = false;

  circle.addEventListener('click', () => {
    if (G.answered) return;
    if (!fired) {
      // Clicked too early
      tooEarly = true;
      circle.className = 'reaction-circle fail';
      circle.innerHTML = '<span class="reaction-label">Too early!</span>';
      statusP.textContent = 'You clicked before the signal!';
      SoundFX.wrong();
      handleAnswer('too_early', null);
      return;
    }
    // Correct reaction
    const rt = Date.now() - G.reactionStart;
    G.reactionTimes.push(rt);
    circle.innerHTML = `<span class="reaction-label">${rt}ms</span>`;
    circle.className = 'reaction-circle success';
    statusP.textContent = `${rt}ms — ${rt < 300 ? 'Lightning!' : rt < 500 ? 'Good!' : 'Try faster!'}`;
    SoundFX.reaction();
    handleAnswer('reacted', null);
  });

  // Fire the signal after delay
  setTimeout(() => {
    if (tooEarly || G.answered) return;
    fired = true;
    G.reactionStart = Date.now();
    circle.className = `reaction-circle go`;
    circle.style.background = signal.bg;
    circle.innerHTML = `<span class="reaction-label">CLICK!</span>`;
    statusP.textContent = signal.type === 'go' ? 'CLICK NOW!' : `DON'T click — it's ${signal.label}!`;

    if (signal.type !== 'go') {
      // Trick: user should NOT click. Auto-advance after 2s
      setTimeout(() => {
        if (G.answered) return;
        handleAnswer('reacted', null); // correct = didn't click non-green
      }, 2000);
    }
  }, delay);
}

/* ── ATTENTION / FOCUS RENDERER ──────────────────────────────────── */
function renderAttentionFocus(p) {
  const { items, target, targetCount, cols } = p.display;
  const grid = document.createElement('div');
  grid.className = 'attn-grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, 48px)`;

  const counter = document.createElement('p');
  counter.className = 'attn-counter';
  counter.textContent = `Found: 0 / ${targetCount}`;
  el.answerArea.appendChild(counter);

  items.forEach((item, i) => {
    const cell = document.createElement('button');
    cell.className = 'attn-cell';
    cell.textContent = item;
    cell.dataset.idx = i;
    cell.addEventListener('click', () => {
      if (G.answered || cell.disabled) return;
      cell.disabled = true;
      if (item === target) {
        G.attnFound++;
        cell.classList.add('found');
        SoundFX.found();
        counter.textContent = `Found: ${G.attnFound} / ${targetCount}`;
        if (G.attnFound >= targetCount) {
          handleAnswer(String(targetCount), null);
        }
      } else {
        G.attnErrors++;
        cell.classList.add('wrong-cell');
        SoundFX.wrong();
      }
    });
    grid.appendChild(cell);
  });

  el.puzzleDisplay.appendChild(grid);
}

/* ── CUSTOM PUZZLE RENDERER ──────────────────────────────────────── */
function renderCustom(p) {
  const qEl = document.createElement('div');
  qEl.className = 'custom-question';
  qEl.textContent = p.display.question || p.instruction;
  el.puzzleDisplay.appendChild(qEl);
  buildOptionButtons(p, 'cols-4');
}

/* ── BUILD UI COMPONENTS ─────────────────────────────────────────── */
function buildOptionButtons(p, colsClass) {
  if (!p.options) return;
  const grid = document.createElement('div');
  grid.className = `opt-grid ${colsClass}`;
  p.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.dataset.value = String(opt);
    btn.addEventListener('click', () => { SoundFX.click(); handleAnswer(opt, btn); });
    grid.appendChild(btn);
  });
  el.answerArea.appendChild(grid);

  if (p.options.length <= 4) {
    const hint = document.createElement('p');
    hint.className = 'kb-hint';
    hint.textContent = 'Press 1–' + p.options.length + ' or click';
    el.answerArea.appendChild(hint);
  }
}

function buildTextInput() {
  const wrap = document.createElement('div');
  wrap.className = 'text-input-wrap';
  const input = document.createElement('input');
  input.className = 'txt-input';
  input.type = 'text';
  input.placeholder = 'e.g. 4, 7, 2 …';
  input.id = 'txtAnswerInput';
  input.autocomplete = 'off';
  const btn = document.createElement('button');
  btn.className = 'submit-btn';
  btn.textContent = 'Submit ↵';
  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (val) handleAnswer(normaliseOrderAnswer(val), btn);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (val) handleAnswer(normaliseOrderAnswer(val), btn);
    }
  });
  wrap.appendChild(input);
  wrap.appendChild(btn);
  el.answerArea.appendChild(wrap);
  setTimeout(() => input.focus(), 100);
}

function normaliseOrderAnswer(raw) {
  return raw.replace(/\s+/g, '').split(',').join(',');
}

/* ── ANSWER HANDLING ─────────────────────────────────────────────── */
function handleAnswer(value, clickedBtn) {
  if (G.answered) return;
  G.answered = true;
  stopTimer();

  const correct = checkAnswer(value);
  const hintPenalty = G.hintUsed ? 0.5 : 1;
  const timeBonus = Math.round((G.timeLeft / G.maxTime) * 50);
  const multiplier = G.streak + 1 > 3 ? 2 : 1;
  const pts = correct ? Math.round((100 + timeBonus) * multiplier * hintPenalty) : 0;

  if (correct) {
    G.score += pts;
    G.streak++;
    G.bestStreak = Math.max(G.bestStreak, G.streak);
    SoundFX.correct();
  } else {
    G.streak = 0;
    SoundFX.wrong();
  }

  G.results.push({
    correct,
    timeout: false,
    pts,
    value,
    answer: G.puzzle.answer,
    type: G.puzzle.type,
    subtype: G.puzzle.subtype,
    attnErrors: G.attnErrors,
  });

  updateHUD();
  if (clickedBtn) highlightButtons(correct, value, clickedBtn);
  showFeedback(correct ? 'correct' : 'wrong', correct, pts);
  markDot(G.round, correct ? 'correct' : 'wrong');

  G.round++;
  setTimeout(nextRound, 1400);
}

function checkAnswer(value) {
  const p = G.puzzle;
  const v = String(value).trim().toLowerCase();
  const a = String(p.answer).trim().toLowerCase();
  if (p.subtype === 'mem_order') {
    const vArr = v.replace(/\s/g, '').split(',').map(Number);
    const aArr = a.replace(/\s/g, '').split(',').map(Number);
    return JSON.stringify(vArr) === JSON.stringify(aArr);
  }
  if (p.subtype === 'reaction_time') {
    // "reacted" is correct for go signal, "too_early" is wrong
    if (p.display.signal.type === 'go') return v === 'reacted';
    return v !== 'too_early'; // for non-go: NOT clicking is correct
  }
  return v === a;
}

function highlightButtons(correct, chosenValue, clickedBtn) {
  const allBtns = el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    const val = btn.dataset.value;
    if (String(val).toLowerCase() === String(G.puzzle.answer).toLowerCase()) btn.classList.add('correct');
    else if (btn === clickedBtn && !correct) btn.classList.add('wrong');
  });
}

/* ── FEEDBACK TOAST ──────────────────────────────────────────────── */
function showFeedback(type, correct, pts) {
  el.feedbackToast.className = 'feedback-toast ' + type + '-fb';
  if (type === 'correct') {
    el.feedbackIcon.textContent = '✓';
    el.feedbackText.textContent = `Correct! +${pts}`;
  } else if (type === 'wrong') {
    el.feedbackIcon.textContent = '✗';
    el.feedbackText.textContent = `Wrong. Answer: ${G.puzzle.answer}`;
  } else {
    el.feedbackIcon.textContent = '⏱';
    el.feedbackText.textContent = 'Time\'s up!';
  }
  el.feedbackToast.classList.remove('hidden');
  setTimeout(() => el.feedbackToast.classList.add('hidden'), 1300);
}

/* ── TIMER ───────────────────────────────────────────────────────── */
function startTimer() {
  G.timeLeft = G.maxTime;
  updateTimerUI(1);
  G.timerInterval = setInterval(() => {
    G.timeLeft = Math.max(0, G.timeLeft - 0.1);
    const pct = G.timeLeft / G.maxTime;
    updateTimerUI(pct);
    if (pct < 0.35 && Math.ceil(G.timeLeft) <= 5 && Math.ceil(G.timeLeft) !== Math.ceil(G.timeLeft + 0.1)) {
      SoundFX.warning();
    }
    if (G.timeLeft <= 0) {
      clearInterval(G.timerInterval);
      onTimeout();
    }
  }, 100);
}

function stopTimer() {
  clearInterval(G.timerInterval);
}

function updateTimerUI(pct) {
  el.timerBar.style.width = (pct * 100) + '%';
  el.timerNum.textContent = Math.ceil(G.timeLeft);
  const warn = pct < 0.35;
  el.timerBar.classList.toggle('warn', warn);
  el.timerNum.classList.toggle('warn', warn);
}

function onTimeout() {
  if (G.answered) return;
  G.answered = true;
  G.streak = 0;
  G.results.push({ correct: false, timeout: true, pts: 0, value: null, answer: G.puzzle.answer, type: G.puzzle.type, subtype: G.puzzle.subtype });

  el.answerArea.querySelectorAll('button, input').forEach(b => b.disabled = true);
  el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn').forEach(btn => {
    if (String(btn.dataset.value).toLowerCase() === String(G.puzzle.answer).toLowerCase()) btn.classList.add('correct');
  });

  SoundFX.timeout();
  updateHUD();
  showFeedback('timeout', false, 0);
  markDot(G.round, 'timeout');
  G.round++;
  setTimeout(nextRound, 1400);
}

/* ── HUD ─────────────────────────────────────────────────────────── */
function updateHUD() {
  el.scoreVal.textContent = G.score;
  el.streakVal.textContent = G.streak;
  if (G.streak >= 3) {
    el.streakBox.style.background = 'var(--orange-light)';
    el.streakBox.classList.add('bounce');
    setTimeout(() => el.streakBox.classList.remove('bounce'), 400);
  }
}

/* ── KEYBOARD INPUT ──────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (G.answered || !screens.game.classList.contains('active')) return;
  const p = G.puzzle;
  if (!p) return;
  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= 4 && p.options) {
    const opts = el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn');
    if (opts[num - 1]) opts[num - 1].click();
  }
});

/* ── RESULTS SCREEN ──────────────────────────────────────────────── */
function showResults() {
  SoundFX.complete();
  showScreen('results');

  const correct = G.results.filter(r => r.correct).length;
  const accuracy = Math.round((correct / G.totalRounds) * 100);

  // Emoji & title
  let emoji, title;
  if (accuracy >= 90) { emoji = '🏆'; title = 'Exceptional!'; }
  else if (accuracy >= 70) { emoji = '🎯'; title = 'Great Work!'; }
  else if (accuracy >= 50) { emoji = '💪'; title = 'Keep Training!'; }
  else { emoji = '🧠'; title = 'Practice Makes Perfect'; }

  el.resultEmoji.textContent = emoji;
  el.resultTitle.textContent = title;
  el.resultQuote.textContent = accuracy >= 50 ? PuzzleQuotes.random() : PuzzleQuotes.wrong();
  el.finalScore.textContent = G.score;
  el.finalCorrect.textContent = `${correct}/${G.totalRounds}`;
  el.finalAccuracy.textContent = accuracy + '%';
  el.finalStreak.textContent = G.bestStreak;

  // Round timeline
  el.roundTimeline.innerHTML = '';
  G.results.forEach((r, i) => {
    const item = document.createElement('div');
    item.className = 'rt-item ' + (r.correct ? 'correct' : r.timeout ? 'timeout' : 'wrong');
    item.textContent = i + 1;
    item.title = r.correct ? `Correct +${r.pts}` : (r.timeout ? 'Timeout' : `Wrong (${r.answer})`);
    el.roundTimeline.appendChild(item);
  });

  // Radar chart
  drawRadar();

  // ── SAVE TO STORAGE ──
  const sessionData = {
    score: G.score, correct, total: G.totalRounds,
    accuracy, bestStreak: G.bestStreak,
    avgReaction: G.reactionTimes.length ? Math.round(G.reactionTimes.reduce((a, b) => a + b, 0) / G.reactionTimes.length) : null,
    bestReaction: G.reactionTimes.length ? Math.min(...G.reactionTimes) : null,
    reactionMs: G.reactionTimes.reduce((a, b) => a + b, 0),
    memoryStreak: longestTypeStreak('memory'),
    logicStreak: longestTypeStreak('logic'),
    mathStreak: longestTypeStreak('math'),
    attentionAce: G.results.some(r => r.type === 'attention' && r.correct && (r.attnErrors || 0) === 0),
  };

  Store.saveScore(G.mode, {
    score: G.score, accuracy, correct, total: G.totalRounds,
    difficulty: G.difficulty, date: new Date().toISOString(),
  });
  Store.updateStats(sessionData);

  // Daily
  if (G.mode === 'daily') {
    const streak = Store.markDailyComplete(G.score);
    const dailyAch = AchievementSystem.checkDaily(streak);
    dailyAch.forEach(a => showAchievementToast(a));
  }

  // Achievements
  const newAch = AchievementSystem.check(sessionData, G);
  if (newAch.length) {
    el.achievementsUnlocked.classList.remove('hidden');
    el.achievementsUnlocked.innerHTML = '<p class="ach-section-title">🎉 Achievements Unlocked!</p>';
    newAch.forEach(a => {
      const badge = document.createElement('div');
      badge.className = 'ach-badge tier-' + a.tier;
      badge.innerHTML = `<span class="ach-badge-icon">${a.icon}</span><span class="ach-badge-name">${a.name}</span>`;
      el.achievementsUnlocked.appendChild(badge);
      showAchievementToast(a);
    });
  } else {
    el.achievementsUnlocked.classList.add('hidden');
  }
}

function longestTypeStreak(type) {
  let max = 0, cur = 0;
  G.results.forEach(r => {
    if (r.type === type && r.correct) { cur++; max = Math.max(max, cur); }
    else if (r.type === type) cur = 0;
  });
  return max;
}

/* ── ACHIEVEMENT TOAST ───────────────────────────────────────────── */
let achQueue = [], achShowing = false;
function showAchievementToast(ach) {
  achQueue.push(ach);
  if (!achShowing) drainAchQueue();
}
function drainAchQueue() {
  if (!achQueue.length) { achShowing = false; return; }
  achShowing = true;
  const a = achQueue.shift();
  SoundFX.achievement();
  el.achIcon.textContent = a.icon;
  el.achName.textContent = a.name;
  el.achievementToast.classList.remove('hidden');
  setTimeout(() => {
    el.achievementToast.classList.add('hidden');
    setTimeout(drainAchQueue, 300);
  }, 3000);
}

/* ── RADAR CHART ─────────────────────────────────────────────────── */
function drawRadar() {
  const canvas = el.radarCanvas;
  const ctx = canvas.getContext('2d');
  const cx = 140, cy = 140, r = 100;
  const axes = ['Logic', 'Memory', 'Speed', 'Streak', 'Accuracy'];
  const n = axes.length;

  const logicRounds = G.results.filter(r => r.type === 'logic');
  const memRounds = G.results.filter(r => r.type === 'memory');
  const correct = G.results.filter(r => r.correct).length;
  const accuracy = correct / G.totalRounds;
  const logicScore = logicRounds.length ? logicRounds.filter(r => r.correct).length / logicRounds.length : 0.5;
  const memScore = memRounds.length ? memRounds.filter(r => r.correct).length / memRounds.length : 0.5;
  const avgSpeed = G.results.reduce((s, r) => s + (r.pts > 100 ? 1 : 0.5), 0) / G.totalRounds;
  const streakScore = Math.min(G.bestStreak / 5, 1);

  const scores = [logicScore, memScore, avgSpeed, streakScore, accuracy];
  const isDark = document.body.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const axisColor = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';
  const labelColor = isDark ? '#9398ab' : '#5a5f72';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  [0.25, 0.5, 0.75, 1].forEach(pct => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r * pct;
      const y = cy + Math.sin(angle) * r * pct;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  scores.forEach((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * s;
    const y = cy + Math.sin(angle) * r * s;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(37,99,235,.18)';
  ctx.fill();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  scores.forEach((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * s;
    const y = cy + Math.sin(angle) * r * s;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
  });

  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillStyle = labelColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  axes.forEach((label, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * (r + 22);
    const y = cy + Math.sin(angle) * (r + 22);
    ctx.fillText(label, x, y);
  });
}

/* ── STATS PANEL ─────────────────────────────────────────────────── */
el.statsBtn.addEventListener('click', () => {
  SoundFX.click();
  populateStatsPanel();
  showScreen('stats');
});
el.closeStatsBtn.addEventListener('click', () => { SoundFX.click(); showScreen('splash'); });

document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    SoundFX.click();
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    $('tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)).classList.add('active');
  });
});

function populateStatsPanel() {
  const stats = Store.getStats();
  el.ltGames.textContent = stats.totalGames;
  el.ltAccuracy.textContent = stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) + '%' : '—';
  el.ltBestScore.textContent = stats.bestScore;
  el.ltBestStreak.textContent = stats.bestStreak;
  el.dailyStreak.textContent = Store.getDailyData().streak || 0;

  // Achievements
  const achs = AchievementSystem.getAll();
  el.achievementsList.innerHTML = '';
  achs.forEach(a => {
    const card = document.createElement('div');
    card.className = 'ach-card' + (a.unlocked ? ' unlocked' : ' locked') + ' tier-' + a.tier;
    card.innerHTML = `
      <span class="ach-card-icon">${a.unlocked ? a.icon : '🔒'}</span>
      <div class="ach-card-info">
        <span class="ach-card-name">${a.name}</span>
        <span class="ach-card-desc">${a.desc}</span>
      </div>`;
    el.achievementsList.appendChild(card);
  });

  // High Scores
  const scores = Store.getHighScores('all');
  el.scoresList.innerHTML = '';
  if (!scores.length) {
    el.scoresList.innerHTML = '<p class="no-data">No scores yet. Start playing!</p>';
    return;
  }
  scores.slice(0, 10).forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <span class="score-rank">#${i + 1}</span>
      <span class="score-pts">${s.score}</span>
      <span class="score-acc">${s.accuracy}%</span>
      <span class="score-date">${new Date(s.date).toLocaleDateString()}</span>`;
    el.scoresList.appendChild(row);
  });
}

el.exportDataBtn.addEventListener('click', () => Store.exportData());
el.clearDataBtn.addEventListener('click', () => {
  if (confirm('Delete all saved data? This cannot be undone.')) {
    Store.clearAll();
    populateStatsPanel();
  }
});

/* ── RESULTS BUTTONS ─────────────────────────────────────────────── */
el.playAgainBtn.addEventListener('click', () => {
  showScreen('game');
  startGame();
});
el.mainMenuBtn.addEventListener('click', () => showScreen('splash'));
