/** Framework-independent contracts shared by the web and Android game clients. */

export type GameCategory =
  | "memory"
  | "logic"
  | "patterns"
  | "focus"
  | "speed"
  | "maths"
  | "strategy"
  | "technical";

export type Difficulty = "starter" | "focused" | "advanced" | "expert";

export type SessionStatus = "ready" | "playing" | "paused" | "completed" | "abandoned";

export interface GameDefinition {
  /** Stable, lowercase identifier. Never use a translated title as an ID. */
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  difficulty: Difficulty;
  estimatedDurationSeconds: number;
  /** Version scoring rules so historical results remain interpretable after game updates. */
  rulesVersion: number;
  tags: readonly string[];
}

export interface SessionResult {
  gameId: string;
  rulesVersion: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationMs: number;
  completed: boolean;
  finishedAt: string;
}

export interface ProgressionAward {
  xp: number;
  accuracyPercent: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/** A session submitted by a client is a claim until validated by trusted backend code. */
export interface SessionSubmission extends SessionResult {
  clientSessionId: string;
  startedAt: string;
}
