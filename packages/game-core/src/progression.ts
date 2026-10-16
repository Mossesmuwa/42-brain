import type { ProgressionAward, SessionResult } from "./types";

/**
 * XP thresholds grow gradually. Level 1 starts at zero XP; reaching 100 XP
 * unlocks level 2. Thresholds are cumulative and never subtract earned XP.
 */
export function totalXpForLevel(level: number): number {
  const target = Math.max(1, Math.floor(level));
  let total = 0;
  for (let current = 1; current < target; current += 1) {
    total += xpRequiredForLevel(current);
  }
  return total;
}

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(100 * Math.pow(safeLevel, 1.25));
}

export function levelForXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let level = 1;
  let remaining = safeXp;

  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  return level;
}

export function progressionForXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  totalXp: number;
} {
  const totalXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = levelForXp(totalXp);
  return {
    level,
    xpIntoLevel: totalXp - totalXpForLevel(level),
    xpForNextLevel: xpRequiredForLevel(level),
    totalXp,
  };
}

/**
 * Client-side preview only. Production rewards must be recalculated by a
 * trusted server function after validating the submitted session.
 *
 * The award rewards completion and correct answers, with a small accuracy
 * bonus. A session with no questions or no completion awards no XP.
 */
export function previewSessionXp(result: SessionResult): number {
  if (!result.completed || result.totalQuestions <= 0) return 0;

  const total = Math.max(0, Math.floor(result.totalQuestions));
  const correct = Math.min(total, Math.max(0, Math.floor(result.correctAnswers)));
  const score = Math.max(0, Math.floor(Number.isFinite(result.score) ? result.score : 0));
  const accuracy = correct / total;

  const completionXp = 8;
  const answerXp = correct * 5;
  const accuracyBonus = accuracy >= 0.9 ? 15 : accuracy >= 0.75 ? 8 : 0;
  const scoreBonus = Math.min(30, Math.floor(score / 100));

  return Math.min(100, completionXp + answerXp + accuracyBonus + scoreBonus);
}

export function buildProgressionAward(
  currentTotalXp: number,
  result: SessionResult,
): ProgressionAward {
  const before = progressionForXp(currentTotalXp);
  const xp = previewSessionXp(result);
  const after = progressionForXp(before.totalXp + xp);
  const accuracyPercent = result.totalQuestions > 0
    ? Math.round(
        (Math.min(result.totalQuestions, Math.max(0, result.correctAnswers)) /
          result.totalQuestions) * 100,
      )
    : 0;

  return {
    xp,
    accuracyPercent,
    levelBefore: before.level,
    levelAfter: after.level,
    levelsGained: after.level - before.level,
    xpIntoLevel: after.xpIntoLevel,
    xpForNextLevel: after.xpForNextLevel,
  };
}
