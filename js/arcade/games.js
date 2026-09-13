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
  const resetMessage = ctx => { ctx.message.textContent = ''; ctx.message.className = 'game-message'; delete ctx.message.dataset.done; };

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


  function choiceGame(ctx, instruction, options, answer, successText, failText = 'Not quite. Reset and try again.') {
    ctx.board.innerHTML = `<p class="game-instruction">${instruction}</p><div class="choice-column">${options.map((o, i) => `<button type="button" data-choice="${i}">${o}</button>`).join('')}</div>`;
    ctx.board.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      const ok = Number(button.dataset.choice) === answer;
      ctx.finish(ok, ok ? successText : failText);
    }));
  }

  function numberRecall(ctx) {
    const length = 5 + Math.floor(Math.random() * 3);
    const sequence = range(length).map(() => Math.floor(Math.random() * 10));
    ctx.board.innerHTML = `<div class="recall-sequence" aria-live="polite">${sequence.join(' ')}</div><button id="hideRecall" class="cta-btn" type="button">Hide number</button><input id="recallInput" class="code-input" inputmode="numeric" maxlength="${length}" placeholder="${'•'.repeat(length)}" disabled><button id="recallSubmit" class="sec-btn" type="button" disabled>Check</button><p class="game-instruction">Memorise the digits, hide them, then enter them in order.</p>`;
    const input=ctx.board.querySelector('#recallInput'), submit=ctx.board.querySelector('#recallSubmit');
    ctx.board.querySelector('#hideRecall').addEventListener('click', () => {
      ctx.board.querySelector('.recall-sequence').textContent='? ? ? ? ?';
      input.disabled=false; submit.disabled=false; input.focus();
    });
    submit.addEventListener('click', () => ctx.finish(input.value === sequence.join(''), input.value === sequence.join('') ? 'Perfect recall.' : `The sequence was ${sequence.join('')}.`));
    input.addEventListener('keydown', e => { if(e.key==='Enter') submit.click(); });
  }

  function cardMemory(ctx) {
    const symbols=['▲','●','■','◆'];
    const cards=shuffled([...symbols,...symbols]); let first=null, locked=false, matches=0;
    ctx.board.innerHTML=`<p class="game-instruction">Find all matching pairs.</p><div class="memory-cards">${cards.map((_,i)=>`<button type="button" data-card="${i}" aria-label="Hidden card ${i+1}">?</button>`).join('')}</div>`;
    const buttons=[...ctx.board.querySelectorAll('[data-card]')];
    buttons.forEach((b,i)=>b.addEventListener('click',()=>{
      if(locked||ctx.isDone()||b.classList.contains('matched')||b===first)return;
      b.textContent=cards[i]; b.classList.add('revealed');
      if(first===null){first=b;return;}
      const j=Number(first.dataset.card);
      if(cards[j]===cards[i]){first.classList.add('matched');b.classList.add('matched');matches++;first=null;if(matches===symbols.length)ctx.finish(true,'All pairs found.');}
      else {locked=true;ctx.later(()=>{first.textContent='?';b.textContent='?';first.classList.remove('revealed');b.classList.remove('revealed');first=null;locked=false;},650);}
    }));
  }

  function delayedRecall(ctx) {
    const target=pick(['triangle','circle','square','diamond']);
    ctx.board.innerHTML=`<p class="game-instruction">Remember the target, then complete a quick classification.</p><div class="delay-target">${target}</div><button id="delayStart" class="cta-btn" type="button">Hide & start</button><div id="delayTask" class="choice-column hidden"></div>`;
    ctx.board.querySelector('#delayStart').addEventListener('click',()=>{
      ctx.board.querySelector('.delay-target').textContent='Hidden'; ctx.board.querySelector('#delayStart').disabled=true;
      const vals=['triangle','circle','square','diamond'];
      ctx.later(()=>{ctx.board.querySelector('#delayTask').classList.remove('hidden');ctx.board.querySelector('#delayTask').innerHTML=vals.map((v,i)=>`<button type="button" data-v="${v}">${v}</button>`).join('');ctx.board.querySelectorAll('[data-v]').forEach(b=>b.addEventListener('click',()=>ctx.finish(b.dataset.v===target,b.dataset.v===target?'Delayed recall correct.':'Target missed.')))},900);
    });
  }

  function dualMemory(ctx) {
    const symbols=['▲','●','■','◆']; const symbol=pick(symbols), pos=Math.floor(Math.random()*9);
    ctx.board.innerHTML=`<p class="game-instruction">Remember the symbol and its position.</p>${gridMarkup(3,'dual-grid',{[pos]:symbol})}<button id="hideDual" class="cta-btn" type="button">Hide</button><div id="dualChoices" class="choice-column hidden"></div>`;
    ctx.board.querySelector('#hideDual').addEventListener('click',()=>{ctx.board.querySelectorAll('[data-cell]').forEach(c=>c.textContent='');ctx.board.querySelector('#dualChoices').classList.remove('hidden');ctx.board.querySelector('#dualChoices').innerHTML=`${symbols.map(v=>`<button type="button" data-symbol="${v}">${v}</button>`).join('')}<p class="game-instruction">Now choose the remembered symbol, then position.</p>${range(9).map(i=>`<button type="button" data-pos="${i}">Position ${i+1}</button>`).join('')}`;let pickedSymbol=null;ctx.board.querySelectorAll('[data-symbol]').forEach(b=>b.onclick=()=>{pickedSymbol=b.dataset.symbol;ctx.board.querySelectorAll('[data-symbol]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');});ctx.board.querySelectorAll('[data-pos]').forEach(b=>b.onclick=()=>ctx.finish(pickedSymbol===symbol&&Number(b.dataset.pos)===pos,pickedSymbol===symbol&&Number(b.dataset.pos)===pos?'Symbol and position recalled.':'One part of the memory was wrong.'));});
  }

  function goNoGo(ctx) {
    let round=0, hits=0; const total=8;
    ctx.board.innerHTML=`<div class="gonogo-signal" id="goSignal">WAIT</div><button id="goBtn" class="cta-btn" type="button">Respond</button><p class="game-instruction">Press Respond only when the signal says GO. ${total} trials.</p>`;
    const signal=ctx.board.querySelector('#goSignal'), btn=ctx.board.querySelector('#goBtn');
    const next=()=>{if(round>=total){ctx.finish(hits>=6,`You responded correctly on ${hits}/${total} trials.`);return;}round++;const go=Math.random()>.35;signal.textContent=go?'GO':'NO-GO';signal.dataset.go=go?'true':'false';ctx.later(()=>{if(!ctx.isDone()&&signal.dataset.go==='false'){signal.textContent='WAIT';next();}},850);};
    btn.addEventListener('click',()=>{if(ctx.isDone())return;if(signal.dataset.go==='true'){hits++;signal.textContent='HIT';}else{ctx.finish(false,'Response inhibition missed. Reset and try again.');return;}ctx.later(next,280);});next();
  }

  function changeDetection(ctx) {
    const size=4, changed=Math.floor(Math.random()*16); const a=range(16).map(i=>pick(['●','■','▲','◆'])); const b=a.slice(); let next=b[changed]; while(next===a[changed]) next=pick(['●','■','▲','◆']); b[changed]=next;
    ctx.board.innerHTML=`<p class="game-instruction">Study the first grid. Then find the changed cell.</p><div class="change-grid">${a.map(v=>`<span>${v}</span>`).join('')}</div><button id="showSecond" class="cta-btn" type="button">Show changed version</button><div id="changeChoices" class="change-grid hidden">${b.map((v,i)=>`<button type="button" data-i="${i}">${v}</button>`).join('')}</div>`;
    ctx.board.querySelector('#showSecond').onclick=()=>{ctx.board.querySelector('.change-grid').classList.add('hidden');ctx.board.querySelector('#changeChoices').classList.remove('hidden');ctx.board.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>ctx.finish(Number(x.dataset.i)===changed,Number(x.dataset.i)===changed?'Change detected.':'Wrong cell.'));};
  }

  function peripheral(ctx) {
    const side=pick(['LEFT','RIGHT']); ctx.board.innerHTML=`<div class="peripheral-center">+</div><p class="game-instruction">Keep your eyes on the center. A signal will appear briefly at the edge.</p><button id="peripheralStart" class="cta-btn">Start</button><div id="peripheralChoices" class="choice-column hidden"></div>`;
    ctx.board.querySelector('#peripheralStart').onclick=()=>{ctx.board.querySelector('#peripheralStart').disabled=true;ctx.later(()=>{ctx.board.querySelector('.peripheral-center').textContent=side;ctx.later(()=>{ctx.board.querySelector('.peripheral-center').textContent='+';const c=ctx.board.querySelector('#peripheralChoices');c.classList.remove('hidden');c.innerHTML=['LEFT','RIGHT'].map(v=>`<button type="button" data-v="${v}">${v}</button>`).join('');c.querySelectorAll('button').forEach(b=>b.onclick=()=>ctx.finish(b.dataset.v===side,b.dataset.v===side?'Peripheral signal caught.':'Wrong side.'));},260);},650);};
  }

  function movingTarget(ctx) {
    let target=pick(range(12)); let step=0; ctx.board.innerHTML=`<p class="game-instruction">Watch the target move. Select its final position after the field freezes.</p><div class="moving-field">${range(12).map(i=>`<button type="button" data-i="${i}">·</button>`).join('')}</div><button id="freezeTarget" class="cta-btn">Freeze field</button>`;
    const buttons=[...ctx.board.querySelectorAll('[data-i]')]; let timer;
    const move=()=>{buttons.forEach(b=>b.classList.remove('moving-target'));target=(target+pick([-1,1,3,-3])+12)%12;buttons[target].classList.add('moving-target');step++;if(step<7)timer=ctx.later(move,260);};
    move();ctx.board.querySelector('#freezeTarget').onclick=()=>{clearTimeout(timer);buttons.forEach(b=>b.classList.remove('moving-target'));buttons.forEach(b=>b.onclick=()=>ctx.finish(Number(b.dataset.i)===target,Number(b.dataset.i)===target?'Target tracked.':'Lost the target.'));};
  }

  function reactionLab(ctx) {
    let ready=false, start=0;ctx.board.innerHTML=`<div class="reaction-light" id="reactionLight">WAIT</div><button id="reactionButton" class="cta-btn">Wait for GO</button><p class="game-instruction">Press as soon as the signal changes to GO.</p>`;
    const light=ctx.board.querySelector('#reactionLight'),btn=ctx.board.querySelector('#reactionButton');const delay=900+Math.random()*1800;
    ctx.later(()=>{ready=true;start=performance.now();light.textContent='GO';btn.textContent='RESPOND';},delay);
    btn.onclick=()=>{if(!ready){ctx.finish(false,'Too early. Reset and wait for GO.');return;}const ms=Math.round(performance.now()-start);ctx.finish(true,`Reaction recorded: ${ms} ms.`);};
  }

  function quickMath(ctx) { const a=3+Math.floor(Math.random()*12),b=2+Math.floor(Math.random()*9),op=pick(['+','−','×']);const ans=op==='+'?a+b:op==='−'?a-b:a*b;const opts=shuffled([ans,ans+pick([-3,-2,2,3]),ans+pick([-5,4]),ans+pick([-7,6])]);choiceGame(ctx,`Solve: <strong>${a} ${op} ${b} = ?</strong>`,opts,opts.indexOf(ans),'Correct calculation.'); }
  function rapidCompare(ctx) { const a=10+Math.floor(Math.random()*90),b=10+Math.floor(Math.random()*90);const opts=['LEFT','RIGHT'];choiceGame(ctx,`${a} or ${b}: which value is larger?`,opts,a>b?0:1,'Fast comparison.'); }
  function visualSearch(ctx) { const target=pick(['◆','●','▲']);const values=range(20).map(()=>pick(['◇','○','△','■']));const pos=Math.floor(Math.random()*values.length);values[pos]=target;ctx.board.innerHTML=`<p class="game-instruction">Find the only <strong>${target}</strong>.</p><div class="target-field">${values.map((v,i)=>`<button type="button" data-i="${i}">${v}</button>`).join('')}</div>`;ctx.board.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>ctx.finish(Number(b.dataset.i)===pos,Number(b.dataset.i)===pos?'Match found.':'Wrong symbol.')); }
  function binaryLogic(ctx) { const n=5+Math.floor(Math.random()*26),bin=n.toString(2),opts=shuffled([n,n+1,n-1,n+4]);choiceGame(ctx,`What decimal number is <strong>${bin}<sub>2</sub></strong>?`,opts,opts.indexOf(n),'Binary converted correctly.'); }
  function sortLab(ctx) { choiceGame(ctx,'You have nearly sorted data and need a stable result. Which choice is the best fit?',['Bubble sort','Insertion sort','Random shuffle','Linear search'],1,'Insertion sort is a strong fit for nearly sorted data.'); }
  function outputPredictor(ctx) { const a=2+Math.floor(Math.random()*5),b=3+Math.floor(Math.random()*4),ans=(a+b)*2;const opts=shuffled([ans,ans-2,ans+2,a+b]);choiceGame(ctx,`Algorithm: <code>x = ${a}; x = x + ${b}; x = x * 2</code><br>What is the final x?`,opts,opts.indexOf(ans),'Output predicted.'); }
  function graphTraversal(ctx) { choiceGame(ctx,'Starting at A, which node is reached after the shortest route A → B → D?',['C','D','E','F'],1,'Shortest traversal chosen.'); }
  function stackQueue(ctx) { choiceGame(ctx,'A stack contains [A, B, C] with C on top. What does POP return?',['A','B','C','Nothing'],2,'Correct: C is on top.'); }
  function recursionTrace(ctx) { const n=3+Math.floor(Math.random()*3),ans=n<=1?1:n*(n-1);const opts=shuffled([ans,ans+1,ans-1,n]);choiceGame(ctx,`A function returns n × (n − 1). If n = ${n}, what is returned?`,opts,opts.indexOf(ans),'Trace complete.'); }
  function matrixLogic(ctx) { choiceGame(ctx,'Each row increases by 2: 2, 4, 6 · 4, 6, 8 · 6, 8, ?',['8','9','10','12'],2,'Matrix rule found.'); }
  function truthTable(ctx) { choiceGame(ctx,'If A is true and B is false, which statement is true?',['A AND B','A OR B','NOT A','B'],1,'Truth condition satisfied.'); }
  function deductionGrid(ctx) { choiceGame(ctx,'Ava is earlier than Bo. Cy is later than Bo. Who is first?',['Ava','Bo','Cy','Cannot know'],0,'All clues agree: Ava is first.'); }
  function conditionalLogic(ctx) { choiceGame(ctx,'Rule: IF temperature > 30 THEN fan = ON. Temperature is 34. What is the state?',['OFF','ON','UNKNOWN','ERROR'],1,'Condition applied correctly.'); }
  function missingOperator(ctx) { choiceGame(ctx,'Complete: 8 ? 4 = 32',['+','−','×','÷'],2,'Operator found.'); }
  function debugAlgorithm(ctx) { choiceGame(ctx,'Which line breaks a loop that should count 1 → 5?',['i = 1','while i <= 5','print(i)','i = i - 1'],3,'Bug located.'); }

  function routePlanner(ctx) { const blocked=new Set([5,6,10]);ctx.board.innerHTML=`<p class="game-instruction">Reach EXIT using adjacent cells. Avoid blocked cells.</p>${gridMarkup(4,'route-planner',{15:'EXIT'})}`;const cells=ctx.board.querySelectorAll('[data-cell]');blocked.forEach(i=>cells[i].classList.add('blocked'));let pos=0;cells[0].classList.add('player');bindCells(ctx.board,(i)=>{if(blocked.has(i))return;if(!adjacent(pos,i,4))return;pos=i;cells.forEach(c=>c.classList.remove('player'));cells[pos].classList.add('player');if(pos===15)ctx.finish(true,'Route completed safely.');});}
  function priorityQueue(ctx) { choiceGame(ctx,'Which task should go first?',['Write a nice-to-have note due next month','Fix a production outage affecting users','Refactor a harmless comment','Organise old screenshots'],1,'Highest-impact urgent work comes first.'); }
  function scheduleBuilder(ctx) { choiceGame(ctx,'A task takes 2 hours and must happen before its dependent review. Which slot is valid?',['09:00–11:00','11:00–13:00','13:00–15:00','15:00–17:00'],0,'Dependency respected.'); }
  function riskReward(ctx) { choiceGame(ctx,'You have a risk budget of 5. Which plan stays inside it while maximising reward?',['Reward 8 / Risk 7','Reward 6 / Risk 5','Reward 5 / Risk 6','Reward 4 / Risk 8'],1,'Best reward within the risk budget.'); }

  function render(id, ctx) {
    resetMessage(ctx);
    if (id === 'grid' || id === 'maze' || id === 'pointer') return movementGame(ctx, id === 'pointer' ? 'maze' : id);
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
    if (id === 'routeplan') return routePlanner(ctx);
    if (id === 'priority') return priorityQueue(ctx);
    if (id === 'schedule') return scheduleBuilder(ctx);
    if (id === 'risk') return riskReward(ctx);
    if (id === 'numberrecall') return numberRecall(ctx);
    if (id === 'cardmemory') return cardMemory(ctx);
    if (id === 'delayed') return delayedRecall(ctx);
    if (id === 'dual') return dualMemory(ctx);
    if (id === 'gonogo') return goNoGo(ctx);
    if (id === 'changes') return changeDetection(ctx);
    if (id === 'peripheral') return peripheral(ctx);
    if (id === 'moving') return movingTarget(ctx);
    if (id === 'reaction') return reactionLab(ctx);
    if (id === 'quickmath') return quickMath(ctx);
    if (id === 'compare') return rapidCompare(ctx);
    if (id === 'visualsearch') return visualSearch(ctx);
    if (id === 'binary') return binaryLogic(ctx);
    if (id === 'sort') return sortLab(ctx);
    if (id === 'output') return outputPredictor(ctx);
    if (id === 'graph') return graphTraversal(ctx);
    if (id === 'stack') return stackQueue(ctx);
    if (id === 'recursion') return recursionTrace(ctx);
    if (id === 'matrix') return matrixLogic(ctx);
    if (id === 'truth') return truthTable(ctx);
    if (id === 'deduction') return deductionGrid(ctx);
    if (id === 'conditional') return conditionalLogic(ctx);
    if (id === 'operator') return missingOperator(ctx);
    if (id === 'debug') return debugAlgorithm(ctx);
    ctx.board.innerHTML = '<p>That game is not available yet. Choose another challenge.</p>';
  }

  window.ArcadeGames = { render };
}());
