/* 42 Brain curated game catalogue.
 * Only distinct, genuinely interactive cognitive exercises belong here.
 * Expand this list only when a game has its own mechanic, feedback loop,
 * difficulty progression and a tested mobile interaction model.
 */
'use strict';

window.ArcadeCatalog = [
  {
    id: 'cardmemory',
    title: 'Pair Recall',
    lane: 'memory',
    icon: 'brain',
    objective: 'Find matching pairs while remembering where each symbol was hidden.',
    controls: 'Reveal two cards per turn. Match every pair to complete the board.',
    level: 'Adaptive',
    time: '2–4 min'
  },
  {
    id: 'numberrecall',
    title: 'Number Span',
    lane: 'memory',
    icon: 'book',
    objective: 'Hold a changing number sequence in working memory and reproduce it.',
    controls: 'Study the sequence, wait for it to hide, then enter the digits in order.',
    level: 'Progressive',
    time: '1–3 min'
  },
  {
    id: 'changes',
    title: 'Change Detection',
    lane: 'focus',
    icon: 'target',
    objective: 'Compare two visual displays and identify the element that changed.',
    controls: 'Study the first display, then select the changed position in the second.',
    level: 'Progressive',
    time: '1–2 min'
  },
  {
    id: 'gonogo',
    title: 'Signal Control',
    lane: 'focus',
    icon: 'target',
    objective: 'Respond to target signals while withholding responses to distractors.',
    controls: 'Respond only when the target rule is satisfied. Accuracy matters more than rushing.',
    level: 'Progressive',
    time: '1–2 min'
  },
  {
    id: 'moving',
    title: 'Target Tracking',
    lane: 'focus',
    icon: 'target',
    objective: 'Keep track of one target as it moves among similar objects.',
    controls: 'Follow the target through the movement, then select its final position.',
    level: 'Progressive',
    time: '1–2 min'
  },
  {
    id: 'reaction',
    title: 'Reaction Lab',
    lane: 'speed',
    icon: 'timer',
    objective: 'Measure response consistency when a visual signal changes.',
    controls: 'Wait for the signal, then respond as soon as it changes. Early responses do not count.',
    level: 'Measured',
    time: '1 min'
  }
];
