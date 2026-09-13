/* Arcade game renderers. Each renderer owns one small game and reports a
   terminal result through ctx.finish(success, message). */
'use strict';

(function () {
  const range = n => Array.from({ length: n }, (_, i) => i);
  const shuffled = values => values.slice().sort(() => Math.random() - 0.5);
  const adjacent = (a, b, size) => Math.abs(a - b) === size ||
    (Math.abs(a - b) === 1 && Math.floor(a / size) === Math.floor(b / size));
  const pick = values => values[Math.floor(Math.random() * values.length)];
  const gridMarkup = (size, className, labels = {}) => `
    <div class="play-grid ${className}" style="--size:${size}" role="grid">
      ${range(size * size).map(i => `<button type="button" data-cell="${i}" aria-label="Cell ${i + 1}">${labels[i] || ''}</button>`).join('')}
    </div>`;
  const memoryGrid = (size, sequence, className) => gridMarkup(size, className,
    Object.fromEntries(sequence.map(i => [i, '<span aria-hidden="true">◆</span>'])));
  const bindCells = (root, callback) => root.querySelectorAll('[data-cell]').forEach(cell => {
    cell.addEventListener('click', () => callback(Number(cell.dataset.cell), cell));
  });
  const resetMessage = ctx => { ctx.message.textContent = ''; ctx.message.className = 'game-message'; };

  function pathFrom(start, size, length) {
    const result = [start];
    while (result.length < length) {
      const current = result[result.length - 1];
      const neighbours = range(size * size).filter(i => adjacent(current, i, size) && !result.includes(i));
      if (!neighbours.length) return pathFrom(Math.floor(Math.random() * size * size), size, length);
      result.push(pick(neighbours));
    }
    return result;
  }

  function movementGame(ctx, id) {
    const size = id === 'grid' ? 5 : 4;
    const finishCell = size * size - 1;
    const checkpoints = [0, 1, 5, 9, 10, 14, 15];
    let position = 0;
    let checkpoint = 1;
    ctx.board.innerHTML = gridMarkup(size, `play-${id}`, { [finishCell]: '<span>EXIT</span>' });
    ctx.board.insertAdjacentHTML('beforeend', `<p class="game-instruction">${id === 'maze'
      ? 'Move from the start through each green checkpoint in order.'
      : 'Start at the blue square and reach the EXIT.'}</p>`);
    const cells = ctx.board.querySelectorAll('[data-cell]');
    cells[0].classList.add('player');
    cells[finishCell].classList.add('goal');
    if (id === 'maze') checkpoints.forEach(i => cells[i].classList.add('checkpoint'));

    const move = next => {
      if (ctx.isDone() || !adjacent(position, next, size)) return;
      position = next;
      cells.forEach(cell => cell.classList.remove('player'));
      cells[position].classList.add('player');
      if (id === 'grid' && position === finishCell) ctx.finish(true, 'Exit reached — route complete.');
      if (id === 'maze') {
        if (position !== checkpoints[checkpoint]) {
          ctx.finish(false, 'Checkpoint missed. Reset and follow the green route in order.');
        } else {
          cells[position].classList.add('visited');
          checkpoint += 1;
          if (checkpoint === checkpoints.length) ctx.finish(true, 'Every checkpoint reached — maze mastered.');
        }
      }
    };
    bindCells(ctx.board, move);
    ctx.board.tabIndex = 0;
    ctx.board.addEventListener('keydown', event => {
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: size, ArrowUp: -size }[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      const next = position + delta;
      if (next >= 0 && next < size * size) move(next);
    });
    ctx.board.focus();
  }

  function balance(ctx) {
    const weights = [1, 2, 3, 1, 2, 3];
    let index = 0, left = 0, right = 0;
    ctx.board.innerHTML = `<div class="balance-readout"><strong>Weight <span id="balanceCurrent">${weights[0]}</span></strong><span id="balanceTotals">Left 0 · Right 0</span></div>
      <div class="balance-beam" aria-label="Balance preview"><span id="beam">⚖</span></div>
      <div class="weight-row"><button type="button" data-side="left">Place left</button><button type="button" data-side="right">Place right</button></div>
      <p class="game-instruction">Six weights must be placed. The totals must match exactly.</p>`;
    const current = ctx.board.querySelector('#balanceCurrent');
    const totals = ctx.board.querySelector('#balanceTotals');
    const beam = ctx.board.querySelector('#beam');
    ctx.board.querySelectorAll('[data-side]').forEach(button => button.addEventListener('click', () => {
      if (ctx.isDone()) return;
      if (button.dataset.side === 'left') left += weights[index]; else right += weights[index];
      index += 1;
      totals.textContent = `Left ${left} · Right ${right}`;
      beam.style.transform = `rotate(${Math.max(-18, Math.min(18, (right - left) * 3))}deg)`;
      if (index === weights.length) ctx.finish(left === right,
        left === right ? 'Beam level — excellent allocation.' : 'The beam is tilted. Reset and try a new placement.');
      else current.textContent = weights[index];
    }));
  }

  function codeBreaker(ctx) {
    const first = pick([0, 2, 4, 6, 8]);
    let middle = Math.floor(Math.random() * 10);
    while (middle === first) middle = Math.floor(Math.random() * 10);
    let last = Math.floor(Math.random() * 10);
    while (last === first || last === middle) last = Math.floor(Math.random() * 10);
    const secret = `${first}${middle}${last}`;
    ctx.board.innerHTML = `<div class="code-clues"><strong>Clues</strong><ul><li>Three unique digits.</li><li>The first digit is <b>${first}</b>.</li><li>The last digit is <b>${last}</b>.</li><li>All digits add up to <b>${first + middle + last}</b>.</li></ul></div>
      <label class="sr-only" for="codeInput">Three digit code</label><input id="codeInput" class="code-input" inputmode="numeric" autocomplete="off" maxlength="3" pattern="[0-9]{3}" placeholder="Enter code">
      <button id="codeSubmit" type="button" class="cta-btn">Unlock</button>`;
    const submit = () => {
      const value = ctx.board.querySelector('#codeInput').value;
      ctx.finish(value === secret, value === secret ? 'Access granted — code cracked.' : 'Access denied. Reset to try another code.');
    };
    ctx.board.querySelector('#codeSubmit').addEventListener('click', submit);
    ctx.board.querySelector('#codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    ctx.board.querySelector('#codeInput').focus();
  }

  function orderedButtons(ctx, values, message, success) {
    let next = 0;
    ctx.board.innerHTML = `<div class="choice-row">${shuffled(values).map(value =>
      `<button type="button" data-value="${value}">${value}</button>`).join('')}</div><p class="game-instruction">${message}</p>`;
    ctx.board.querySelectorAll('[data-value]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.value !== values[next]) {
        ctx.finish(false, 'That was out of order. Reset and try again.');
        return;
      }
      button.disabled = true;
      button.classList.add('selected');
      next += 1;
      if (next === values.length) ctx.finish(true, success);
    }));
  }

  function memoryPattern(ctx, id) {
    const size = 4;
    const length = id === 'trace' ? 5 : 4;
    const sequence = id === 'route' ? pathFrom(0, size, 5) : shuffled(range(size * size)).slice(0, length);
    let hidden = false, picked = [];
    ctx.board.innerHTML = memoryGrid(size, sequence, `memory-grid ${id}`);
    ctx.board.insertAdjacentHTML('beforeend', `<button id="hideMemory" type="button" class="sec-btn">Hide ${id === 'trace' ? 'sequence' : id === 'route' ? 'route' : 'pattern'}</button>
      <p class="game-instruction">${id === 'trace' ? 'Click the cells in the same order.' : id === 'route' ? 'Each step must touch the previous cell.' : 'Select every highlighted cell.'}</p>`);
    const cells = ctx.board.querySelectorAll('[data-cell]');
    const hide = () => {
      if (hidden) return;
      hidden = true;
      cells.forEach(cell => { cell.classList.remove('lit'); cell.textContent = ''; });
      ctx.board.querySelector('#hideMemory').disabled = true;
      cells[0].focus();
    };
    cells.forEach(cell => cell.classList.add('lit'));
    ctx.board.querySelector('#hideMemory').addEventListener('click', hide);
    bindCells(ctx.board, (cellIndex, cell) => {
      if (!hidden || ctx.isDone() || picked.includes(cellIndex)) return;
      const expected = sequence[picked.length];
      if (id === 'trace' && cellIndex !== expected) {
        ctx.finish(false, 'Sequence broken. Reset and watch the pattern again.');
        return;
      }
      if (id === 'route' && picked.length && !adjacent(cellIndex, picked[picked.length - 1], size)) {
        ctx.finish(false, 'That step is not connected to the route.');
        return;
      }
      picked.push(cellIndex);
      cell.classList.add('picked');
      const complete = id === 'trace' ? picked.length === sequence.length :
        id === 'route' ? picked.length === sequence.length && picked.every((v, i) => v === sequence[i]) :
          picked.length === sequence.length && sequence.every(v => picked.includes(v));
      if (complete) ctx.finish(true, id === 'route' ? 'Route recreated perfectly.' : 'Pattern recalled perfectly.');
    });
  }

  function soundRecall(ctx) {
    const sequence = shuffled([0, 1, 2, 3]).slice(0, 3);
    let started = false, playing = false, answer = [];
    ctx.board.innerHTML = `<button id="playTones" type="button" class="cta-btn">▶ Play tones</button>
      <div class="tone-row" aria-label="Tone choices">${range(4).map(i => `<button type="button" data-tone="${i}" disabled>${i + 1}</button>`).join('')}</div>
      <p class="game-instruction">Listen once, then repeat the tones in order.</p>`;
    const play = () => {
      if (started || ctx.isDone()) return;
      started = true; playing = true;
      ctx.board.querySelector('#playTones').disabled = true;
      sequence.forEach((tone, index) => ctx.later(() => ctx.tone(260 + tone * 90), index * 360));
      ctx.later(() => {
        playing = false;
        ctx.board.querySelectorAll('[data-tone]').forEach(button => { button.disabled = false; });
        ctx.board.querySelector('[data-tone="0"]').focus();
      }, sequence.length * 360);
    };
    ctx.board.querySelector('#playTones').addEventListener('click', play);
    ctx.board.querySelectorAll('[data-tone]').forEach(button => button.addEventListener('click', () => {
      if (!started || playing || ctx.isDone()) return;
      const value = Number(button.dataset.tone);
      answer.push(value);
      button.classList.add('selected');
      if (value !== sequence[answer.length - 1]) ctx.finish(false, 'Tone order missed. Reset and listen again.');
      else if (answer.length === sequence.length) ctx.finish(true, 'Tone sequence matched.');
    }));
  }

  function selectableSet(ctx, id) {
    const isFilter = id === 'filter';
    const values = isFilter ? ['blue', 'red', 'blue', 'yellow', 'blue', 'red'] : ['▲', '●', '▲', '●', '▲', '●'];
    const target = isFilter ? 'blue' : '▲';
    ctx.board.innerHTML = `<p class="rule-banner">Select ${isFilter ? 'blue circles only' : 'triangles only'}.</p><div class="shape-row">${shuffled(values).map(value =>
      `<button type="button" class="${isFilter ? value : value === '▲' ? 'triangle' : 'circle'}" data-good="${value === target}">${value}</button>`).join('')}</div>`;
    ctx.board.querySelectorAll('.shape-row button').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.good !== 'true') ctx.finish(false, 'Distractor selected. Reset and filter the signal again.');
      else {
        button.disabled = true;
        if (!ctx.board.querySelector('[data-good="true"]:not(:disabled)')) ctx.finish(true, 'Signal filtered — every target selected.');
      }
    }));
  }

  function targetScan(ctx) {
    const target = Math.floor(Math.random() * 24);
    ctx.board.innerHTML = `<p class="rule-banner">Find the solid diamond.</p><div class="target-field">${range(24).map(i =>
      `<button type="button" class="${i === target ? 'true-target' : ''}" aria-label="${i === target ? 'Solid diamond target' : 'Outline diamond decoy'}">${i === target ? '◆' : '◇'}</button>`).join('')}</div>`;
    ctx.board.querySelectorAll('.target-field button').forEach(button => button.addEventListener('click', () =>
      ctx.finish(button.classList.contains('true-target'),
        button.classList.contains('true-target') ? 'Target acquired.' : 'Decoy selected — reset and scan again.')));
  }

  function resource(ctx) {
    ctx.board.innerHTML = `<p class="game-instruction">Allocate all 10 units. Production needs at least 6 and quality needs at least 3.</p>
      <label class="allocation-label" for="prod">Production <output id="prodValue">6</output></label>
      <input id="prod" type="range" min="0" max="10" value="6"><output id="alloc">Production 6 · Quality 4</output>
      <button id="allocDone" type="button" class="cta-btn">Commit plan</button>`;
    const slider = ctx.board.querySelector('#prod');
    const update = () => {
      const production = Number(slider.value);
      ctx.board.querySelector('#prodValue').textContent = production;
      ctx.board.querySelector('#alloc').textContent = `Production ${production} · Quality ${10 - production}`;
    };
    slider.addEventListener('input', update);
    ctx.board.querySelector('#allocDone').addEventListener('click', () => {
      const production = Number(slider.value), quality = 10 - production;
      ctx.finish(production >= 6 && quality >= 3,
        production >= 6 && quality >= 3 ? 'Plan approved — both goals are covered.' : 'One project goal is underfunded. Reset and rebalance.');
    });
  }

  function detective(ctx) {
    const suspects = [
      ['Ava', 'red coat · seen at 9 · owns a key'],
      ['Bo', 'blue coat · seen at 9 · owns a key'],
      ['Cy', 'red coat · seen at 8 · owns a key']
    ];
    ctx.board.innerHTML = `<p class="game-instruction">Clues: the suspect wore red, was seen at 9, and owns a key.</p><div class="suspects">${
      suspects.map((suspect, i) => `<button type="button" data-suspect="${i}"><strong>${suspect[0]}</strong><small>${suspect[1]}</small></button>`).join('')}</div>`;
    ctx.board.querySelectorAll('[data-suspect]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.suspect === '0';
      ctx.finish(correct, correct ? 'Case solved — every clue fits.' : 'That suspect contradicts a clue.');
    }));
  }

  function algorithm(ctx) {
    const answers = ['Linear search · O(n)', 'Binary search · O(log n)', 'Bubble sort · O(n²)'];
    ctx.board.innerHTML = `<p class="game-instruction">For 1,000 sorted records, which option is fastest?</p><div class="choice-column">${
      answers.map((answer, i) => `<button type="button" data-answer="${i}">${answer}</button>`).join('')}</div>`;
    ctx.board.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.answer === '1';
      ctx.finish(correct, correct ? 'Benchmark won — logarithmic search is the best fit.' : 'Not the fastest option for sorted data.');
    }));
  }

  function bugHunter(ctx) {
    const bugs = new Set([0, 7, 14]);
    ctx.board.innerHTML = `<p class="game-instruction">Squash all three bugs. Stars are safe helpers.</p><div class="bug-field">${
      range(20).map(i => `<button type="button" class="${bugs.has(i) ? 'bug' : 'helper'}" aria-label="${bugs.has(i) ? 'Bug' : 'Helpful star'}">${bugs.has(i) ? '🐛' : '★'}</button>`).join('')}</div>`;
    ctx.board.querySelectorAll('.bug-field button').forEach((button, i) => button.addEventListener('click', () => {
      if (!bugs.has(i)) {
        ctx.finish(false, 'Helpful star selected — reset and try again.');
        return;
      }
      button.disabled = true;
      bugs.delete(i);
      if (!bugs.size) ctx.finish(true, 'All bugs squashed.');
    }));
  }

  function render(id, ctx) {
    resetMessage(ctx);
    if (id === 'grid' || id === 'maze') return movementGame(ctx, id);
    if (id === 'balance') return balance(ctx);
    if (id === 'code') return codeBreaker(ctx);
    if (id === 'circuit') return orderedButtons(ctx, [1, 2, 3, 4], 'Activate the nodes in numerical order.', 'Circuit powered.');
    if (id === 'tower') return orderedButtons(ctx, ['Foundation', 'Frame', 'Roof', 'Antenna'], 'Foundation → Frame → Roof → Antenna.', 'Tower complete.');
    if (id === 'composer') return orderedButtons(ctx, ['A', 'B', 'C', 'D'], 'Select the tiles alphabetically.', 'Sequence composed.');
    if (id === 'network') return orderedButtons(ctx, [1, 2, 3, 4], 'Connect nodes from 1 to 4.', 'Network connected.');
    if (id === 'mirror' || id === 'route' || id === 'trace') return memoryPattern(ctx, id);
    if (id === 'sound') return soundRecall(ctx);
    if (id === 'rule' || id === 'filter') return selectableSet(ctx, id);
    if (id === 'target') return targetScan(ctx);
    if (id === 'resource') return resource(ctx);
    if (id === 'detective') return detective(ctx);
    if (id === 'algorithm') return algorithm(ctx);
    if (id === 'bug') return bugHunter(ctx);
    ctx.board.innerHTML = '<p>That game is not available yet. Choose another challenge.</p>';
  }

  window.ArcadeGames = { render };
}());
