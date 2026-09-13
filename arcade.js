/* Workspace and arcade shell. Game rules live in js/arcade/games.js. */
'use strict';

(function () {
  const $ = id => document.getElementById(id);
  const catalog = window.ArcadeCatalog || [];
  const progressKey = '42brain-arcade-progress';
  let progress;
  let currentId = null;
  let modal = null;
  let modalTimers = [];
  let previousFocus = null;

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) || '{}');
      progress = { score: Number(saved.score) || Number(localStorage.getItem('42brain-arcade-score')) || 0,
        wins: Number(saved.wins) || 0, plays: Number(saved.plays) || 0, completed: saved.completed || {} };
    } catch (_) { progress = { score: 0, wins: 0, plays: 0, completed: {} }; }
    progress.wins = Object.keys(progress.completed).length || progress.wins;
  }

  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    localStorage.setItem('42brain-arcade-score', String(progress.score));
  }

  function icon(name) {
    return `<svg class="ui-icon" aria-hidden="true"><use href="ui-icons.svg#${name || 'brain'}"></use></svg>`;
  }

  function gameCard(game) {
    const best = Number(localStorage.getItem(`42brain-best-${game.id}`) || 0);
    return `<button type="button" class="arcade-card" data-launch="${game.id}" aria-label="Play ${game.title}">
      <span class="arcade-icon">${icon(game.icon)}</span>
      <span class="arcade-card-copy"><strong>${game.title}</strong><small>${game.objective}</small></span>
      <span class="game-meta"><em>${game.level}</em><em>${game.time}</em><em>${best ? `${best} pts best` : 'New'}</em></span>
      <span class="arcade-card-action">View objective ${icon('arrow')}</span>
    </button>`;
  }

  function renderCards(container, filter) {
    if (!container) return;
    container.innerHTML = catalog.filter(game => !filter || game.lane === filter).map(gameCard).join('');
    container.querySelectorAll('[data-launch]').forEach(button =>
      button.addEventListener('click', () => openGame(button.dataset.launch)));
  }

  function renderProgress() {
    const progressNode = $('workspaceProgress');
    const scoreNode = $('workspaceScore');
    if (scoreNode) scoreNode.textContent = progress.score;
    if (!progressNode) return;
    const completion = catalog.length ? Math.round((progress.wins / catalog.length) * 100) : 0;
    progressNode.innerHTML = `<div class="progress-overview">
      <div><span class="eyebrow">Arcade score</span><strong class="progress-big">${progress.score}</strong><p>${progress.wins} of ${catalog.length} challenges completed</p></div>
      <div class="progress-ring" style="--progress:${completion * 3.6}deg"><strong>${completion}%</strong><span>catalogue</span></div>
    </div>
    <div class="progress-bar" aria-label="${completion}% of arcade games completed"><i style="width:${completion}%"></i></div>
    <div class="workspace-metrics"><span><b>${progress.plays}</b> plays</span><span><b>${progress.wins}</b> wins</span><span><b>${progress.score}</b> points</span></div>`;
  }

  function setPage(page) {
    document.querySelectorAll('[data-workspace-page]').forEach(section =>
      section.classList.toggle('active', section.dataset.workspacePage === page));
    document.querySelectorAll('.workspace-nav [data-page]').forEach(button => {
      const active = button.dataset.page === page;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    const activeButton = document.querySelector(`.workspace-nav [data-page="${page}"]`);
    const crumb = $('workspaceBreadcrumb');
    if (crumb && activeButton) crumb.querySelector('strong').textContent = activeButton.textContent.trim();
    if (page === 'progress') renderProgress();
  }

  function showWorkspace(page = 'home') {
    $('splash').classList.remove('active');
    $('workspace').classList.add('active');
    setPage(page);
  }

  function showSplash() {
    $('workspace').classList.remove('active');
    $('splash').classList.add('active');
  }

  function bestFor(id) { return Number(localStorage.getItem(`42brain-best-${id}`) || 0); }

  function openGame(id) {
    const game = catalog.find(item => item.id === id);
    if (!game || !window.ArcadeGames) return;
    currentId = id;
    previousFocus = document.activeElement;
    modalTimers.forEach(clearTimeout);
    modalTimers = [];
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'arcadeModal';
      modal.className = 'arcade-modal';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `<div class="arcade-dialog" role="dialog" aria-modal="true" aria-labelledby="arcadeTitle" aria-describedby="arcadeObjective">
      <header class="arcade-dialog-header"><div><span class="eyebrow">Arcade / ${game.lane}</span><h2 id="arcadeTitle">${game.title}</h2></div>
        <button type="button" class="icon-btn" id="closeArcade" aria-label="Close game">${icon('close')}</button></header>
      <div class="arcade-objective"><strong id="arcadeObjective">Objective</strong><p>${game.objective}</p><small>${game.controls}</small></div>
      <div class="game-status"><span>Best score <b id="arcadeBest">${bestFor(id)} pts</b></span><span id="arcadeRunStatus">Ready</span></div>
      <div id="gameBoard" class="game-board"></div>
      <div id="gameMessage" class="game-message" role="status" aria-live="polite"></div>
      <div class="game-actions"><button type="button" class="sec-btn" id="resetArcade">Reset puzzle</button><button type="button" class="cta-btn" id="newArcade">New puzzle</button></div>
    </div>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    $('closeArcade').addEventListener('click', closeGame);
    $('resetArcade').addEventListener('click', () => renderCurrent());
    $('newArcade').addEventListener('click', () => renderCurrent());
    modal.addEventListener('keydown', trapFocus);
    modal.addEventListener('click', event => { if (event.target === modal) closeGame(); });
    renderCurrent();
    $('closeArcade').focus();
  }

  function trapFocus(event) {
    if (event.key === 'Escape') { event.preventDefault(); closeGame(); return; }
    if (event.key !== 'Tab' || !modal) return;
    const focusable = [...modal.querySelectorAll('button:not(:disabled), input, [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function closeGame() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalTimers.forEach(clearTimeout);
    modalTimers = [];
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }

  function renderCurrent() {
    if (!currentId || !modal) return;
    modalTimers.forEach(clearTimeout);
    modalTimers = [];
    const board = $('gameBoard');
    const message = $('gameMessage');
    const status = $('arcadeRunStatus');
    const context = {
      board, message,
      later(callback, delay) { const timer = setTimeout(callback, delay); modalTimers.push(timer); return timer; },
      tone(frequency) {
        try {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) return;
          const audio = new Audio(), oscillator = audio.createOscillator();
          oscillator.frequency.value = frequency; oscillator.connect(audio.destination);
          oscillator.start(); oscillator.stop(audio.currentTime + 0.15);
        } catch (_) { /* Audio is optional in offline and restricted browsers. */ }
      },
      isDone: () => message.dataset.done === 'true',
      finish(success, text) {
        if (message.dataset.done === 'true') return;
        message.dataset.done = 'true';
        message.className = `game-message ${success ? 'success' : 'failure'}`;
        message.textContent = text;
        status.textContent = success ? 'Completed' : 'Try again';
        progress.plays += 1;
        if (success) {
          progress.score += 10;
          progress.completed[currentId] = true;
          progress.wins = Object.keys(progress.completed).length;
          const best = Math.max(10, bestFor(currentId));
          localStorage.setItem(`42brain-best-${currentId}`, String(best));
          $('arcadeBest').textContent = `${best} pts`;
        }
        saveProgress();
      }
    };
    window.ArcadeGames.render(currentId, context);
    status.textContent = 'In progress';
  }

  function bindWorkspace() {
    document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', event => {
      const page = event.currentTarget.dataset.page;
      if (!page) return;
      event.preventDefault();
      showWorkspace(page);
    }));
    $('workspaceLaunch').addEventListener('click', () => showWorkspace('home'));
    $('workspaceBack').addEventListener('click', showSplash);
    $('workspaceClassic').addEventListener('click', showSplash);
    $('arcadeHelp').addEventListener('click', () => $('arcadeHelpPanel').classList.toggle('hidden'));
    $('workspaceReset').addEventListener('click', () => {
      progress = { score: 0, wins: 0, plays: 0, completed: {} };
      localStorage.removeItem(progressKey);
      localStorage.removeItem('42brain-arcade-score');
      catalog.forEach(game => localStorage.removeItem(`42brain-best-${game.id}`));
      renderProgress();
      document.querySelectorAll('.game-catalog').forEach(node => renderCards(node, node.dataset.filter));
    });
    const settings = window.Store ? Store.getSettings() : { theme: 'light', sound: true, reducedMotion: false };
    $('workspaceTheme').value = settings.theme;
    $('workspaceTheme').addEventListener('change', event => {
      document.body.classList.toggle('dark', event.target.value === 'dark');
      if (window.Store) { const next = Store.getSettings(); next.theme = event.target.value; Store.saveSettings(next); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    document.querySelectorAll('.game-catalog').forEach(node => renderCards(node, node.dataset.filter));
    bindWorkspace();
    renderProgress();
  });
}());
