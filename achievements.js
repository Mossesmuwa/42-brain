/**
 * achievements.js – Achievement definitions and checker
 */
'use strict';

const ACHIEVEMENTS = [
  { id: 'first_win',       name: 'First Steps',            desc: 'Complete your very first session',                    icon: '🎯', tier: 'bronze' },
  { id: 'perfect_round',   name: 'Perfectionist',          desc: 'Score 100% accuracy in any session',                  icon: '💯', tier: 'gold'   },
  { id: 'memory_master',   name: 'Memory Master',          desc: '5 memory puzzles correct in a row',                   icon: '🧠', tier: 'silver' },
  { id: 'speed_demon',     name: 'Speed Demon',            desc: 'Average reaction time under 400ms',                   icon: '⚡', tier: 'gold'   },
  { id: 'pattern_pro',     name: 'Pattern Pro',            desc: '5 logic puzzles correct in a row',                    icon: '🔮', tier: 'silver' },
  { id: 'math_whiz',       name: 'Math Whiz',              desc: '5 mental math puzzles correct in a row',              icon: '🔢', tier: 'silver' },
  { id: 'streak_5',        name: 'On Fire!',               desc: 'Achieve a streak of 5',                               icon: '🔥', tier: 'bronze' },
  { id: 'streak_10',       name: 'Unstoppable',            desc: 'Achieve a streak of 10',                              icon: '🌟', tier: 'gold'   },
  { id: 'hard_mode',       name: 'Glutton for Punishment', desc: 'Finish a session on Hard difficulty',                 icon: '💀', tier: 'silver' },
  { id: 'daily_1',         name: 'Daily Devotee',          desc: 'Complete your first daily challenge',                 icon: '📅', tier: 'bronze' },
  { id: 'daily_3',         name: 'Consistent',             desc: '3-day daily challenge streak',                        icon: '📆', tier: 'silver' },
  { id: 'daily_7',         name: 'Weekly Warrior',         desc: '7-day daily challenge streak',                        icon: '🏅', tier: 'gold'   },
  { id: 'reaction_king',   name: 'Reaction King',          desc: 'Single reaction time under 250ms',                    icon: '👑', tier: 'gold'   },
  { id: 'veteran',         name: 'Veteran',                desc: 'Complete 10 game sessions',                           icon: '🎖️', tier: 'gold'   },
  { id: 'night_owl',       name: 'Night Owl',              desc: 'Play between midnight and 4am',                       icon: '🦉', tier: 'bronze' },
  { id: 'early_bird',      name: 'Early Bird',             desc: 'Play before 7am',                                     icon: '🐦', tier: 'bronze' },
  { id: 'attention_ace',   name: 'Eagle Eye',              desc: 'Find all targets in an attention puzzle without error',icon: '🦅', tier: 'silver' },
  { id: 'custom_warrior',  name: 'Custom Warrior',         desc: 'Complete a custom-mode session',                      icon: '⚙️', tier: 'bronze' },
];

const AchievementSystem = {
  /* Check a finished session and return array of newly unlocked achievement defs */
  check(sessionData, G) {
    const newly = [];
    const stats = Store.getStats();
    const hour  = new Date().getHours();

    const _try = id => { if (Store.unlockAchievement(id)) { const d = ACHIEVEMENTS.find(a => a.id === id); if (d) newly.push(d); } };

    if (stats.totalGames >= 1)                                               _try('first_win');
    if (sessionData.accuracy === 100)                                        _try('perfect_round');
    if ((sessionData.memoryStreak  || 0) >= 5)                               _try('memory_master');
    if ((sessionData.logicStreak   || 0) >= 5)                               _try('pattern_pro');
    if ((sessionData.mathStreak    || 0) >= 5)                               _try('math_whiz');
    if (sessionData.avgReaction    && sessionData.avgReaction  < 400)        _try('speed_demon');
    if (sessionData.bestReaction   && sessionData.bestReaction < 250)        _try('reaction_king');
    if ((sessionData.bestStreak    || 0) >= 5)                               _try('streak_5');
    if ((sessionData.bestStreak    || 0) >= 10)                              _try('streak_10');
    if (G.difficulty === 'hard'    && (sessionData.total || 0) >= 5)         _try('hard_mode');
    if (stats.totalGames           >= 10)                                    _try('veteran');
    if (hour >= 0  && hour < 4)                                              _try('night_owl');
    if (hour >= 5  && hour < 7)                                              _try('early_bird');
    if (sessionData.attentionAce)                                            _try('attention_ace');
    if (G.mode === 'custom')                                                 _try('custom_warrior');

    return newly;
  },

  checkDaily(streak) {
    const newly = [];
    const _try = id => { if (Store.unlockAchievement(id)) { const d = ACHIEVEMENTS.find(a => a.id === id); if (d) newly.push(d); } };
    if (streak >= 1) _try('daily_1');
    if (streak >= 3) _try('daily_3');
    if (streak >= 7) _try('daily_7');
    return newly;
  },

  getAll() {
    const unlocked = Store.getAchievements();
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!unlocked[a.id], unlockedAt: unlocked[a.id]?.at }));
  },
};
