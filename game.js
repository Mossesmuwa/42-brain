/**
 * game.js – Core engine for the 42 Brain trainer
 * Handles screens, timer, rendering, scoring, keyboard/mouse controls
 */

'use strict';

/* ── STATE ──────────────────────────────────────────────────────── */
const G = {
  totalRounds: 10,
  difficulty: 'normal',
  round: 0,           // 0-indexed
  score: 0,
  streak: 0,
  bestStreak: 0,
  results: [],        // { correct, timeout, points } per round
  puzzle: null,
  timerInterval: null,
  timeLeft: 0,
  maxTime: 15,
  answered: false,
  flashTimeout: null,
  dragSrc: null,
};

/* ── DOM REFS ────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const screens = {
  splash: $('splash'),
  game: $('gameScreen'),
  results: $('resultsScreen'),
};

const el = {
  startBtn:         $('startBtn'),
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
  finalScore:       $('finalScore'),
  finalCorrect:     $('finalCorrect'),
  finalAccuracy:    $('finalAccuracy'),
  finalStreak:      $('finalStreak'),
  roundTimeline:    $('roundTimeline'),
  radarCanvas:      $('radarCanvas'),
  playAgainBtn:     $('playAgainBtn'),
  mainMenuBtn:      $('mainMenuBtn'),
};

/* ── SCREEN SWITCHING ────────────────────────────────────────────── */
function showScreen(name) {
  Object.entries(screens).forEach(([k, v]) => {
    v.classList.toggle('active', k === name);
  });
}

/* ── DIFFICULTY BUTTONS (splash) ─────────────────────────────────── */
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    G.difficulty = btn.dataset.diff;
  });
});

/* ── START ───────────────────────────────────────────────────────── */
el.startBtn.addEventListener('click', startGame);

function startGame() {
  // Reset
  G.round = 0;
  G.score = 0;
  G.streak = 0;
  G.bestStreak = 0;
  G.results = [];

  // Set rounds / time by difficulty
  G.totalRounds = { easy: 8, normal: 10, hard: 12 }[G.difficulty];
  G.maxTime     = { easy: 20, normal: 15, hard: 10 }[G.difficulty];

  el.totalRounds.textContent = G.totalRounds;
  el.scoreVal.textContent = '0';
  el.streakVal.textContent = '0';

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
  // Mark next as current
  const next = $(`dot-${round + 1}`);
  if (next) next.classList.add('current');
}

/* ── ROUND FLOW ──────────────────────────────────────────────────── */
function nextRound() {
  if (G.round >= G.totalRounds) { showResults(); return; }

  G.answered = false;
  G.puzzle = PuzzleEngine.generate(G.round, G.difficulty, G.totalRounds);

  // Update HUD
  el.roundNum.textContent = G.round + 1;
  el.typePill.textContent = G.puzzle.type === 'memory' ? 'Memory' : 'Logic';
  el.typePill.style.background = G.puzzle.type === 'memory' ? 'var(--purple-light)' : 'var(--accent-light)';
  el.typePill.style.color = G.puzzle.type === 'memory' ? 'var(--purple)' : 'var(--accent)';
  el.typePill.style.borderColor = G.puzzle.type === 'memory' ? '#ddd6fe' : '#bfdbfe';

  // Hide drag grid, clear answer area
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
  // Show memorisation content
  el.flashContent.innerHTML = '';
  el['flashOverlay'].classList.remove('hidden');
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

  // Call appropriate renderer
  const renderers = {
    renderSequence, renderShapeMatrix, renderOddOneOut,
    renderFindRule, renderMemNumbers, renderMemColors,
    renderMemPositions, renderMemOrder,
  };
  renderers[p.renderFn]?.(p);
}

/* sequence renderer */
function renderSequence(p) {
  const { sequence, blankIdx } = p.display;
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

/* shape matrix renderer */
function renderShapeMatrix(p) {
  const { grid, rows, cols } = p.display;
  const table = document.createElement('div');
  table.className = 'shape-grid';
  table.style.gridTemplateColumns = `repeat(${cols}, 58px)`;
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const div = document.createElement('div');
      div.className = 'shape-cell' + (cell === null ? ' blank' : '');
      div.textContent = cell === null ? '?' : cell;
      table.appendChild(div);
    });
  });
  el.puzzleDisplay.appendChild(table);
  buildOptionButtons(p, 'cols-4');
}

/* odd one out renderer */
function renderOddOneOut(p) {
  const { items, labels } = p.display;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;';
  items.forEach((shape, i) => {
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    const sym = document.createElement('div');
    sym.className = 'shape-cell';
    sym.textContent = shape;
    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:.75rem;font-weight:700;color:var(--text3);';
    lbl.textContent = labels[i];
    box.appendChild(sym);
    box.appendChild(lbl);
    row.appendChild(box);
  });
  el.puzzleDisplay.appendChild(row);
  buildOptionButtons(p, labels.length <= 4 ? 'cols-4' : 'cols-3');
}

/* find the rule renderer */
function renderFindRule(p) {
  const { pairs, testIn } = p.display;
  const table = document.createElement('div');
  table.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:center;';
  pairs.forEach(pair => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;';
    row.innerHTML = `<div class="seq-num">${pair.in}</div><span class="arrow">→</span><div class="seq-num">${pair.out}</div>`;
    table.appendChild(row);
  });
  // Test row
  const testRow = document.createElement('div');
  testRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:6px;border-top:2px dashed var(--border);padding-top:10px;';
  testRow.innerHTML = `<div class="seq-num">${testIn}</div><span class="arrow">→</span><div class="seq-num blank">?</div>`;
  table.appendChild(testRow);
  el.puzzleDisplay.appendChild(table);
  buildOptionButtons(p, 'cols-4');
}

/* memory: numbers */
function renderMemNumbers(p) {
  const { askIdx } = p.display;
  // Show blank tiles with number of placeholder tiles
  const seqLen = p.display.seq.length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';
  for (let i = 0; i < seqLen; i++) {
    const tile = document.createElement('div');
    tile.className = 'seq-num' + (i === askIdx ? ' blank' : '');
    tile.style.opacity = i === askIdx ? '1' : '0.35';
    tile.textContent = i === askIdx ? '?' : '•';
    row.appendChild(tile);
  }
  el.puzzleDisplay.appendChild(row);
  buildOptionButtons(p, 'cols-4');
}

/* memory: colors */
function renderMemColors(p) {
  const { askIdx } = p.display;
  const seqLen = p.display.seq.length;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';
  for (let i = 0; i < seqLen; i++) {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (i !== askIdx ? ' hidden-swatch' : '');
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

  // Render color option buttons
  const colorRow = document.createElement('div');
  colorRow.className = 'color-opt-row';
  p.optionColors.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-opt-btn';
    btn.style.background = c.hex;
    btn.dataset.value = c.name;
    btn.title = c.name;
    btn.addEventListener('click', () => handleAnswer(c.name, btn));
    el.answerArea.appendChild(colorRow); // will be appended below
    colorRow.appendChild(btn);
  });
  el.answerArea.appendChild(colorRow);
}

/* memory: positions */
function renderMemPositions(p) {
  const { gridSize, litIdxs, askIdx } = p.display;
  const grid = document.createElement('div');
  grid.className = 'pos-grid';
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 52px)`;
  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'pos-cell' + (i === askIdx ? ' lit' : '');
    cell.textContent = i === askIdx ? (i + 1) : (i + 1);
    cell.style.fontSize = '.8rem';
    cell.style.fontWeight = '700';
    cell.style.color = i === askIdx ? '#fff' : 'var(--text3)';
    grid.appendChild(cell);
  }
  el.puzzleDisplay.appendChild(grid);
  buildOptionButtons(p, 'cols-2');
}

/* memory: order recall (text input) */
function renderMemOrder(p) {
  // Show blank placeholders
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';
  p.display.seq.forEach(() => {
    const tile = document.createElement('div');
    tile.className = 'seq-num blank';
    tile.textContent = '?';
    row.appendChild(tile);
  });
  el.puzzleDisplay.appendChild(row);
  buildTextInput();
}

/* ── BUILD UI COMPONENTS ─────────────────────────────────────────── */
function buildOptionButtons(p, colsClass) {
  const grid = document.createElement('div');
  grid.className = `opt-grid ${colsClass}`;
  p.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.dataset.value = opt;
    btn.addEventListener('click', () => handleAnswer(opt, btn));
    grid.appendChild(btn);
  });
  el.answerArea.appendChild(grid);

  // Keyboard shortcut hints (1-4)
  if (p.options.length <= 4) {
    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:.72rem;color:var(--text3);text-align:center;margin-top:2px;';
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
  // Auto-focus after a brief delay
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
  const timeBonus = Math.round((G.timeLeft / G.maxTime) * 50);
  const pts = correct ? (100 + timeBonus) * (G.streak + 1 > 3 ? 2 : 1) : 0;

  // Update state
  if (correct) {
    G.score += pts;
    G.streak++;
    G.bestStreak = Math.max(G.bestStreak, G.streak);
  } else {
    G.streak = 0;
  }

  G.results.push({ correct, timeout: false, pts, value, answer: G.puzzle.answer });

  updateHUD();
  highlightButtons(correct, value, clickedBtn);
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
    // normalised comma-separated
    const vArr = v.replace(/\s/g,'').split(',').map(Number);
    const aArr = a.replace(/\s/g,'').split(',').map(Number);
    return JSON.stringify(vArr) === JSON.stringify(aArr);
  }
  return v === a;
}

function highlightButtons(correct, chosenValue, clickedBtn) {
  const allBtns = el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn');
  allBtns.forEach(btn => {
    btn.disabled = true;
    const val = btn.dataset.value;
    if (val === G.puzzle.answer) btn.classList.add('correct');
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
  G.results.push({ correct: false, timeout: true, pts: 0, value: null, answer: G.puzzle.answer });

  // Disable all buttons
  el.answerArea.querySelectorAll('button, input').forEach(b => b.disabled = true);
  // Highlight correct
  el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn').forEach(btn => {
    if (btn.dataset.value === G.puzzle.answer) btn.classList.add('correct');
  });

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

  // 1–4 shortcut for option buttons
  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= 4 && p.options) {
    const opts = el.answerArea.querySelectorAll('.opt-btn, .color-opt-btn');
    if (opts[num - 1]) opts[num - 1].click();
  }
});

/* ── RESULTS SCREEN ──────────────────────────────────────────────── */
function showResults() {
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
}

function drawRadar() {
  const canvas = el.radarCanvas;
  const ctx = canvas.getContext('2d');
  const cx = 140, cy = 140, r = 100;
  const axes = ['Logic', 'Memory', 'Speed', 'Streak', 'Accuracy'];
  const n = axes.length;

  // Compute scores per category
  const logicResults = G.results.filter((_, i) => G.puzzle); // fallback
  const memRounds = G.results.filter((r, i) => {
    // heuristic: every 3rd+ round tends to be memory
    return i % 3 === 2;
  });
  const correct = G.results.filter(r => r.correct).length;
  const accuracy = correct / G.totalRounds;
  const avgSpeed = G.results.reduce((s, r) => s + (r.pts > 100 ? 1 : 0.5), 0) / G.totalRounds;
  const streakScore = Math.min(G.bestStreak / 5, 1);
  const memScore = memRounds.filter(r => r.correct).length / Math.max(1, memRounds.length);

  const scores = [accuracy, memScore, avgSpeed, streakScore, accuracy * 0.9 + streakScore * 0.1];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid rings
  [0.25, 0.5, 0.75, 1].forEach(pct => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r * pct;
      const y = cy + Math.sin(angle) * r * pct;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,.07)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Axis lines
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = 'rgba(0,0,0,.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Data polygon
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

  // Dots
  scores.forEach((s, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r * s;
    const y = cy + Math.sin(angle) * r * s;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
  });

  // Labels
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillStyle = '#5a5f72';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  axes.forEach((label, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * (r + 22);
    const y = cy + Math.sin(angle) * (r + 22);
    ctx.fillText(label, x, y);
  });
}

/* ── RESULTS BUTTONS ─────────────────────────────────────────────── */
el.playAgainBtn.addEventListener('click', () => {
  showScreen('game');
  startGame();
});
el.mainMenuBtn.addEventListener('click', () => showScreen('splash'));
