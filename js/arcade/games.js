/* 42 Brain's curated game engine.
 * Only games listed in js/arcade/catalog.js are implemented here.
 * Add a game only when it brings a distinct mechanic and tested interactions.
 */
'use strict';

(function () {
  const range = n => Array.from({ length: n }, (_, i) => i);
  const shuffled = values => values.slice().sort(() => Math.random() - 0.5);
  const pick = values => values[Math.floor(Math.random() * values.length)];

  function numberRecall(ctx) {
    const length = 5 + Math.floor(Math.random() * 3);
    const sequence = range(length).map(() => Math.floor(Math.random() * 10));
    ctx.board.innerHTML = `
      <p class="game-instruction">Memorise the sequence. Hide it when you're ready, then enter it exactly.</p>
      <div class="recall-sequence" aria-live="polite">${sequence.join(' ')}</div>
      <button id="hideRecall" class="cta-btn" type="button">Hide sequence</button>
      <label class="game-instruction" for="recallInput">Your answer</label>
      <input id="recallInput" class="code-input" inputmode="numeric" autocomplete="off" maxlength="${length}" placeholder="${'•'.repeat(length)}" disabled>
      <button id="recallSubmit" class="sec-btn" type="button" disabled>Check sequence</button>`;
    const display = ctx.board.querySelector('.recall-sequence');
    const input = ctx.board.querySelector('#recallInput');
    const submit = ctx.board.querySelector('#recallSubmit');
    ctx.board.querySelector('#hideRecall').addEventListener('click', event => {
      display.textContent = '• '.repeat(length).trim();
      event.currentTarget.disabled = true;
      input.disabled = false;
      submit.disabled = false;
      input.focus();
    });
    const check = () => {
      if (input.disabled || !input.value.trim()) return;
      const correct = input.value.trim() === sequence.join('');
      ctx.finish(correct, correct ? 'Exact sequence recalled.' : `The sequence was ${sequence.join('')}.`);
    };
    submit.addEventListener('click', check);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') check(); });
  }

  function cardMemory(ctx) {
    const symbols = ['▲', '●', '■', '◆', '✚', '⬟'];
    const cards = shuffled([...symbols, ...symbols]);
    let first = null;
    let locked = false;
    let matches = 0;
    let turns = 0;
    ctx.board.innerHTML = `
      <div class="game-status-row"><span>Pairs found <strong id="pairCount">0 / ${symbols.length}</strong></span><span>Turns <strong id="turnCount">0</strong></span></div>
      <p class="game-instruction">Reveal two cards per turn. Remember positions and match all six pairs.</p>
      <div class="memory-cards memory-cards-large">${cards.map((_, i) => `<button type="button" data-card="${i}" aria-label="Hidden card ${i + 1}">?</button>`).join('')}</div>`;
    const buttons = [...ctx.board.querySelectorAll('[data-card]')];
    const turnCount = ctx.board.querySelector('#turnCount');
    const pairCount = ctx.board.querySelector('#pairCount');
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      if (locked || ctx.isDone() || button.classList.contains('matched') || button === first) return;
      button.textContent = cards[index];
      button.classList.add('revealed');
      button.setAttribute('aria-label', `Card ${index + 1}: ${cards[index]}`);
      if (!first) {
        first = button;
        return;
      }
      turns += 1;
      turnCount.textContent = String(turns);
      const firstIndex = Number(first.dataset.card);
      if (cards[firstIndex] === cards[index]) {
        first.classList.add('matched');
        button.classList.add('matched');
        first.disabled = true;
        button.disabled = true;
        matches += 1;
        pairCount.textContent = `${matches} / ${symbols.length}`;
        first = null;
        if (matches === symbols.length) ctx.finish(true, `All pairs found in ${turns} turns.`);
        return;
      }
      locked = true;
      const previous = first;
      ctx.later(() => {
        previous.textContent = '?';
        button.textContent = '?';
        previous.classList.remove('revealed');
        button.classList.remove('revealed');
        previous.setAttribute('aria-label', `Hidden card ${Number(previous.dataset.card) + 1}`);
        button.setAttribute('aria-label', `Hidden card ${index + 1}`);
        first = null;
        locked = false;
      }, 700);
    }));
  }

  function changeDetection(ctx) {
    const symbols = ['●', '■', '▲', '◆', '✚', '⬟'];
    const first = range(16).map(() => pick(symbols));
    const changed = Math.floor(Math.random() * first.length);
    const second = first.slice();
    const alternatives = symbols.filter(symbol => symbol !== first[changed]);
    second[changed] = pick(alternatives);
    ctx.board.innerHTML = `
      <p class="game-instruction">Study the first display. When ready, reveal the second and identify the changed position.</p>
      <div class="change-grid change-grid-study" aria-label="First display">${first.map(symbol => `<span>${symbol}</span>`).join('')}</div>
      <button id="showSecond" class="cta-btn" type="button">Reveal second display</button>
      <div id="changeChoices" class="change-grid hidden" aria-label="Second display">${second.map((symbol, index) => `<button type="button" data-cell="${index}" aria-label="Position ${index + 1}">${symbol}</button>`).join('')}</div>`;
    ctx.board.querySelector('#showSecond').addEventListener('click', event => {
      ctx.board.querySelector('.change-grid-study').classList.add('hidden');
      const choices = ctx.board.querySelector('#changeChoices');
      choices.classList.remove('hidden');
      event.currentTarget.disabled = true;
      choices.querySelectorAll('[data-cell]').forEach(button => button.addEventListener('click', () => {
        const correct = Number(button.dataset.cell) === changed;
        ctx.finish(correct, correct ? 'Change detected.' : `The changed position was ${changed + 1}.`);
      }));
    });
  }

  function goNoGo(ctx) {
    const total = 10;
    let trial = 0;
    let hits = 0;
    let misses = 0;
    let falseAlarms = 0;
    let active = false;
    let shouldRespond = false;
    let advanceTimer = null;
    ctx.board.innerHTML = `
      <div class="gonogo-signal" id="goSignal" aria-live="polite">READY</div>
      <button id="goBtn" class="cta-btn" type="button" disabled>Respond to GO</button>
      <p class="game-instruction">Tap only when the green GO signal appears. Do nothing for NO-GO. ${total} trials.</p>
      <p class="game-instruction" id="goProgress">Trial 0 / ${total} · Correct 0</p>`;
    const signal = ctx.board.querySelector('#goSignal');
    const button = ctx.board.querySelector('#goBtn');
    const progress = ctx.board.querySelector('#goProgress');
    function finishTrial() {
      active = false;
      button.disabled = true;
      if (shouldRespond && !signal.dataset.responded) misses += 1;
      trial += 1;
      progress.textContent = `Trial ${trial} / ${total} · Correct ${hits} · Misses ${misses} · False alarms ${falseAlarms}`;
      if (trial >= total) {
        const score = hits / total;
        ctx.finish(score >= 0.7 && falseAlarms <= 1,
          `Correct responses: ${hits}; missed targets: ${misses}; false alarms: ${falseAlarms}.`);
        return;
      }
      advanceTimer = ctx.later(nextTrial, 380);
    }
    function nextTrial() {
      if (ctx.isDone()) return;
      shouldRespond = Math.random() < 0.65;
      active = true;
      signal.textContent = shouldRespond ? 'GO' : 'NO-GO';
      signal.dataset.responded = '';
      signal.dataset.go = shouldRespond ? 'true' : 'false';
      signal.classList.toggle('signal-go', shouldRespond);
      signal.classList.toggle('signal-nogo', !shouldRespond);
      button.disabled = false;
      advanceTimer = ctx.later(finishTrial, 1050);
    }
    button.addEventListener('click', () => {
      if (!active || ctx.isDone()) return;
      if (signal.dataset.responded) return;
      if (!shouldRespond) {
        falseAlarms += 1;
        signal.dataset.responded = 'false-alarm';
      } else if (signal.dataset.responded !== 'true') {
        hits += 1;
        signal.dataset.responded = 'true';
        signal.textContent = 'RECORDED';
        button.disabled = true;
      }
    });
    advanceTimer = ctx.later(nextTrial, 500);
  }

  function movingTarget(ctx) {
    const cols = 4;
    const rows = 3;
    let target = pick(range(cols * rows));
    let step = 0;
    let timer = null;
    let frozen = false;
    ctx.board.innerHTML = `
      <p class="game-instruction">Track the marked target as it moves. Select its final location after the board freezes.</p>
      <div class="moving-field" role="group" aria-label="Target tracking board">${range(cols * rows).map(i => `<button type="button" data-cell="${i}" aria-label="Position ${i + 1}">·</button>`).join('')}</div>
      <p class="game-instruction" id="trackingStatus" aria-live="polite">Watch the target.</p>
      <button id="freezeTarget" class="sec-btn" type="button" disabled>Choose final position</button>`;
    const buttons = [...ctx.board.querySelectorAll('[data-cell]')];
    const status = ctx.board.querySelector('#trackingStatus');
    const freeze = ctx.board.querySelector('#freezeTarget');
    function move() {
      if (ctx.isDone() || frozen) return;
      buttons.forEach(button => button.classList.remove('moving-target'));
      const candidates = range(cols * rows).filter(index => {
        const rowDistance = Math.abs(Math.floor(index / cols) - Math.floor(target / cols));
        const colDistance = Math.abs((index % cols) - (target % cols));
        return rowDistance + colDistance === 1;
      });
      target = pick(candidates);
      buttons[target].classList.add('moving-target');
      step += 1;
      status.textContent = `Movement ${step} of 7`;
      if (step < 7) timer = ctx.later(move, 430);
      else {
        timer = ctx.later(() => {
          buttons.forEach(button => button.classList.remove('moving-target'));
          status.textContent = 'Board frozen. Select the target position.';
          freeze.disabled = false;
          frozen = true;
        }, 500);
      }
    }
    move();
    freeze.addEventListener('click', () => {
      if (!frozen || ctx.isDone()) return;
      freeze.disabled = true;
      buttons.forEach(button => button.addEventListener('click', () => {
        const correct = Number(button.dataset.cell) === target;
        ctx.finish(correct, correct ? 'Target tracked accurately.' : 'That was not the final target position.');
      }, { once: true }));
    });
  }

  function reactionLab(ctx) {
    let ready = false;
    let start = 0;
    let completed = false;
    ctx.board.innerHTML = `
      <div class="reaction-light" id="reactionLight" aria-live="polite">WAIT</div>
      <button id="reactionButton" class="cta-btn" type="button">Wait for signal</button>
      <p class="game-instruction">Wait for the signal to turn green, then respond as quickly as you can. An early response restarts the attempt.</p>`;
    const light = ctx.board.querySelector('#reactionLight');
    const button = ctx.board.querySelector('#reactionButton');
    const delay = 1100 + Math.random() * 2200;
    ctx.later(() => {
      if (ctx.isDone()) return;
      ready = true;
      start = performance.now();
      light.textContent = 'GO';
      light.classList.add('signal-go');
      button.textContent = 'RESPOND';
    }, delay);
    button.addEventListener('click', () => {
      if (ctx.isDone() || completed) return;
      if (!ready) {
        completed = true;
        ctx.finish(false, 'Too early. Wait for the signal before responding.');
        return;
      }
      completed = true;
      const ms = Math.round(performance.now() - start);
      ctx.finish(true, `Response time: ${ms} ms.`);
    });
  }

  function render(id, ctx) {
    if (id === 'numberrecall') return numberRecall(ctx);
    if (id === 'cardmemory') return cardMemory(ctx);
    if (id === 'changes') return changeDetection(ctx);
    if (id === 'gonogo') return goNoGo(ctx);
    if (id === 'moving') return movingTarget(ctx);
    if (id === 'reaction') return reactionLab(ctx);
    ctx.board.innerHTML = '<p>This exercise is not part of the current curated library.</p>';
  }

  window.ArcadeGames = { render };
}());
