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
        wins: Number(saved.wins) || 0, plays: Number(saved.plays) || 0, completed: saved.completed || {}, gameStats: saved.gameStats || {} };
    } catch (_) { progress = { score: 0, wins: 0, plays: 0, completed: {}, gameStats: {} }; }
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
    const wins = Number(progress.gameStats?.[game.id]?.wins || 0);
    const mastery = wins >= 10 ? 'Mastered' : wins >= 5 ? 'Expert' : wins >= 3 ? 'Skilled' : wins >= 1 ? 'Familiar' : 'New';
    return `<button type="button" class="arcade-card" data-launch="${game.id}" aria-label="Play ${game.title}">
      <span class="arcade-icon">${icon(game.icon)}</span>
      <span class="arcade-card-copy"><strong>${game.title}</strong><small>${game.objective}</small></span>
      <span class="game-meta"><em>${game.level}</em><em>${game.time}</em><em>${mastery}</em><em>${best ? `${best} pts best` : 'New'}</em></span>
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
    const streakNode = $('workspaceStreak');
    if (scoreNode) scoreNode.textContent = progress.score;
    const daily = window.Store ? Store.getDailyData() : { streak: 0, completed: {}, history: [] };
    if (streakNode) streakNode.textContent = daily.streak || 0;
    if (!progressNode) return;
    const stats = window.Store ? Store.getStats() : { categoryAnswered: {}, categoryCorrect: {}, sessions: [], mistakes: [] };
    const categories = ['logic','memory','math','attention'];
    const labels = { logic:'Logic', memory:'Memory', math:'Math', attention:'Focus' };
    const accuracy = categories.map(c => { const n=stats.categoryAnswered?.[c]||0; return n ? Math.round((stats.categoryCorrect?.[c]||0)/n*100) : 0; });
    const weakestIndex = accuracy.indexOf(Math.min(...accuracy));
    const weakest = categories[weakestIndex];
    const totalWins = Object.keys(progress.completed).length;
    const completion = catalog.length ? Math.round((totalWins / catalog.length) * 100) : 0;
    const level = window.Store ? Store.levelInfo() : { level:1, xp:0, current:0 };
    const plan = window.Store ? Store.getPlan() : null;
    const masteryCounts = { New:0, Familiar:0, Skilled:0, Expert:0, Mastered:0 };
    catalog.forEach(g => { const wins=Number(progress.gameStats?.[g.id]?.wins||0); const m=wins>=10?'Mastered':wins>=5?'Expert':wins>=3?'Skilled':wins>=1?'Familiar':'New'; masteryCounts[m]++; });
    progressNode.innerHTML = `<div class="progress-dashboard">
      <section class="progress-hero-card"><div><span class="eyebrow">Your training profile</span><strong class="progress-big">Level ${level.level}</strong><p>${level.xp} XP · ${progress.plays} arcade plays · ${stats.totalGames||0} classic sessions</p></div><div class="profile-ring"><strong>${daily.streak||0}</strong><span>day streak</span></div></section>
      <section class="progress-grid">
        <article><span class="eyebrow">Weakest area</span><h3>${labels[weakest]}</h3><p>${accuracy[weakestIndex]}% accuracy</p><button class="sec-btn" data-progress-action="weakness">Train this area</button></article>
        <article><span class="eyebrow">Arcade completion</span><h3>${completion}%</h3><p>${totalWins} of ${catalog.length} games completed</p><div class="progress-bar"><i style="width:${completion}%"></i></div></article>
        <article><span class="eyebrow">Current plan</span><h3>${plan ? labels[plan.category] || 'Mixed' : 'Not started'}</h3><p>${plan ? `${plan.rounds || 10} rounds · ${plan.completedSessions || 0} sessions` : 'Build one from your weakest area.'}</p><button class="sec-btn" data-progress-action="plan">${plan ? 'Train plan' : 'Build plan'}</button></article>
      </section>
      <section class="mastery-section"><div class="section-heading"><div><span class="eyebrow">Game mastery</span><h2>Know what you have mastered.</h2></div></div><div class="mastery-grid">${Object.entries(masteryCounts).map(([k,v])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('')}</div></section>
      <section class="profile-section"><div class="section-heading"><div><span class="eyebrow">Performance profile</span><h2>Your training signals</h2></div></div><div class="profile-bars">${categories.map((c,i)=>`<div class="profile-row"><span>${labels[c]}</span><div class="profile-track"><i style="width:${accuracy[i]}%"></i></div><b>${accuracy[i]}%</b></div>`).join('')}</div></section>
      <section class="challenge-section"><div class="section-heading"><div><span class="eyebrow">Challenge board</span><h2>Keep the loop going.</h2></div></div><div class="challenge-grid"><article><strong>Daily streak</strong><span>${daily.streak||0} days</span><small>${Object.keys(daily.completed||{}).length ? 'Come back tomorrow to extend it.' : 'Complete today to start.'}</small></article><article><strong>Next milestone</strong><span>${Math.max(0,1000-(level.current||0))} XP</span><small>Reach the next level.</small></article><article><strong>Mistakes to review</strong><span>${(stats.mistakes||[]).length}</span><small>Practice weak spots instead of repeating easy wins.</small></article></div></section>
      <div class="workspace-metrics"><span><b>${progress.plays}</b> arcade plays</span><span><b>${totalWins}</b> games completed</span><span><b>${progress.score}</b> arcade points</span></div>
    </div>`;
    progressNode.querySelectorAll('[data-progress-action]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.progressAction === 'plan') document.getElementById('planBtn')?.click();
      else document.getElementById('planBtn')?.click();
    }));
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
    if (page === 'daily') renderDailyPage();
    if (page === 'home' || page === 'train') renderWorkspaceHome();
  }

  function renderDailyPage() {
    const d=window.Store?Store.getDailyData():{streak:0,completed:{},history:[]};
    const today=window.Store?Store.todayKey():new Date().toISOString().slice(0,10);
    const date=$('workspaceDailyDate'), best=$('workspaceDailyBest'), streak=$('workspaceDailyStreak'), runs=$('workspaceDailyRuns'), btn=$('workspaceDailyStart');
    if(date) date.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    if(best) best.textContent=d.completed?.[today] ?? '—'; if(streak) streak.textContent=d.streak||0; if(runs) runs.textContent=Object.keys(d.completed||{}).length;
    if(btn){btn.disabled=!!d.completed?.[today];btn.textContent=btn.disabled?'Completed today':"Start today's challenge →";}
  }
  function renderWorkspaceHome() {
    const stats=window.Store?Store.getStats():{categoryAnswered:{},categoryCorrect:{},totalGames:0}; const cats=['logic','memory','math','attention']; const labels={logic:'Logic',memory:'Memory',math:'Math',attention:'Focus'};
    const weakest=cats.reduce((a,b)=>((stats.categoryCorrect?.[a]||0)/(stats.categoryAnswered?.[a]||1))<=((stats.categoryCorrect?.[b]||0)/(stats.categoryAnswered?.[b]||1))?a:b,cats[0]); const n=stats.categoryAnswered?.[weakest]||0; const pct=n?Math.round((stats.categoryCorrect?.[weakest]||0)/n*100):0;
    const title=$('workspaceRecommendationTitle'),text=$('workspaceRecommendationText'),status=$('workspaceStatusText'),bar=$('workspaceStatusBar'),count=$('workspaceGameCount');
    if(title) title.textContent=n?`${labels[weakest]} needs attention`:'Your first training profile'; if(text) text.textContent=n?`Your ${labels[weakest].toLowerCase()} accuracy is ${pct}%. Build a focused plan around it.`:'Complete a few sessions and 42 Brain will turn your results into a useful training profile.';
    if(status) status.textContent=n?`${stats.totalGames||0} sessions recorded · your profile is adapting to your performance.`:'No performance data yet. Your profile starts after your first session.'; if(bar) bar.style.width=`${Math.min(100,(stats.totalGames||0)*10)}%`; if(count) count.textContent=catalog.length;
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
        progress.gameStats[currentId] = progress.gameStats[currentId] || { plays: 0, wins: 0 };
        progress.gameStats[currentId].plays += 1;
        if (success) {
          progress.gameStats[currentId].wins += 1;
          progress.score += 10;
          progress.completed[currentId] = true;
          const arcadeWins = Object.values(progress.gameStats).reduce((sum, item) => sum + Number(item.wins || 0), 0);
          if (window.Store) {
            if (arcadeWins >= 1) Store.unlockAchievement('arcade_first');
            if (arcadeWins >= 10) Store.unlockAchievement('arcade_10');
            if (arcadeWins >= 25) Store.unlockAchievement('arcade_25');
            const mastered = Object.values(progress.gameStats).filter(item => Number(item.wins || 0) >= 10).length;
            if (mastered >= 1) Store.unlockAchievement('mastery_first');
            if (mastered >= 5) Store.unlockAchievement('mastery_five');
            const lanes = new Set(catalog.filter(g => progress.completed[g.id]).map(g => g.lane));
            if (['memory','focus','speed','strategy','math','technical','lab'].every(l => lanes.has(l))) Store.unlockAchievement('full_spectrum');
          }
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
    $('workspaceRecommendationBtn')?.addEventListener('click', () => document.getElementById('planBtn')?.click());
    $('workspaceDailyStart')?.addEventListener('click', () => document.getElementById('dailyBtn')?.click());
    $('workspacePlan')?.addEventListener('click', () => document.getElementById('planBtn')?.click());
    $('workspaceExam')?.addEventListener('click', () => document.getElementById('examBtn')?.click());
    $('workspaceBack').addEventListener('click', showSplash);
    $('workspaceClassic').addEventListener('click', showSplash);
    $('arcadeHelp').addEventListener('click', () => $('arcadeHelpPanel').classList.toggle('hidden'));
    $('workspaceReset').addEventListener('click', () => {
      progress = { score: 0, wins: 0, plays: 0, completed: {}, gameStats: {} };
      localStorage.removeItem(progressKey);
      localStorage.removeItem('42brain-arcade-score');
      progress.gameStats = {};
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
