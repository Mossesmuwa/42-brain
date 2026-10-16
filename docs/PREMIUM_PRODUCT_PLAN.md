# 42 Brain — Premium Product & Engineering Plan

## Product goal

Turn 42 Brain from a strong offline browser prototype into a polished brain-training platform with a reliable game library, meaningful progression, accounts, cloud sync, and an Android app. Keep the current offline web experience working while the new architecture is introduced incrementally.

## Recommended stack

- **Application language:** TypeScript. It adds safer game contracts and is shared well across web and mobile.
- **Android:** Expo + React Native + Expo Router. Build an actual Android app, not only a website wrapped in a WebView.
- **Web:** preserve the existing Vanilla JS PWA during the transition; later move screens to React where doing so brings clear value.
- **Backend:** Supabase Auth + PostgreSQL + Row Level Security (RLS), with Edge Functions for trusted session finalization and reward calculation.
- **Game logic:** framework-independent TypeScript package shared by web and Android. UI renderers remain platform-specific.
- **Offline-first:** games must remain playable without a network. Store pending session summaries locally and sync when a user signs in or connectivity returns.
- **Testing:** unit tests for scoring, progression, game rules and reward eligibility; integration tests for auth/RLS; end-to-end smoke tests for critical play flows.

## Product structure

### Player-facing areas
1. **Today** — daily training plan, continue button, daily challenge and a small progress snapshot.
2. **Game Library** — filter by skill: Memory, Logic, Patterns, Focus, Speed, Maths, Strategy and Technical Thinking.
3. **Game session** — focused full-screen play; clear objective, controls, pause/restart where appropriate, accessible feedback and no distracting UI.
4. **Results** — score, accuracy, time, XP earned, personal best, one useful insight and a retry/next-game action.
5. **Progress** — skill-by-skill accuracy, recent history, best scores and improvement over time.
6. **Achievements** — skill milestones and exploration rewards, with criteria displayed clearly.
7. **Profile** — account, display name, settings, data export and account deletion path.
8. **Settings** — sound, reduced motion, contrast, text size, privacy and offline/sync status.

### Progression rules
- XP rewards practice and completion; skill performance remains a separate metric.
- XP must be bounded per session and calculated by trusted server code once cloud rewards are enabled.
- Levels are cumulative and transparent. Do not make users lose XP or levels.
- Streaks should be forgiving: no loss of earned rewards for taking breaks.
- Achievements must have explicit criteria and be awarded idempotently (the same achievement cannot be granted repeatedly).
- Cosmetics may be unlocked with earned rewards later; never sell score advantages.
- Do not launch global leaderboards until scores have meaningful server-side validation and anti-abuse controls.

## Architecture / folder plan

Keep the current root app stable during the migration.

    42-brain/
      apps/
        android/                 # Expo + React Native application
        web/                     # later home for the existing PWA
      packages/
        game-core/               # TypeScript rules, score contracts, progression
        game-content/            # game catalogue, prompts and difficulty definitions
        design-system/           # shared tokens and documented UI principles
      supabase/
        migrations/              # versioned SQL schema and RLS policies
        functions/
          finalize-session/      # validate results, calculate XP, unlock rewards
      docs/
        PREMIUM_PRODUCT_PLAN.md
      index.html                 # existing PWA retained during migration
      game.js / puzzles.js / js/ # existing implementation retained until parity is tested

Do not move the existing large scripts in one risky operation. First define contracts, then extract one game at a time and prove the old web app still works.

## Data model

- **profiles**: public display name and avatar reference, keyed to Supabase Auth user.
- **game_sessions**: immutable personal session history with game ID, category, score, correct/total answers, duration, and completion timestamp.
- **player_game_progress**: per-user/per-game aggregate: attempts, best score, best accuracy and last played time.
- **achievement_definitions**: catalogue of achievement criteria, seeded by migrations.
- **player_achievements**: one row per user and achievement; unique constraint prevents duplicate awards.
- **daily_challenges** and **daily_challenge_completions**: dated challenge definitions and completion history.
- **reward_events** (later): append-only ledger for XP/cosmetic grants, written only by trusted backend code.

All user-owned rows must use RLS. A client-side Supabase key is not a secret; never ship a service-role key in the app. Do not accept client-provided XP as authoritative. Use an Edge Function to validate a session and award rewards, and rate-limit repeated submissions.

## Delivery plan

### Phase 1 — Foundation
- Establish TypeScript game contracts and deterministic progression utilities.
- Add the initial PostgreSQL schema and restrictive RLS.
- Write a migration and local setup guide.
- Keep main untouched; use a feature branch and pull request.

### Phase 2 — Game library and modular game engine
- Build typed catalogue metadata: ID, category, objective, duration, difficulty curve, input type and scoring contract.
- Create a common session lifecycle: ready → playing → paused (optional) → completed/abandoned.
- Move one existing game into the shared core at a time; add tests before migrating each next game.

### Phase 3 — Android MVP
- Expo app shell, onboarding, guest mode, sign-up/sign-in, home, library, session, results, profile and progress.
- Use responsive touch-first controls and accessibility settings.
- Offline play first; sign-in and cloud sync are optional until available.

### Phase 4 — Cloud progression
- Session finalization Edge Function; server-computed XP and achievements.
- Safe sync, retry handling, duplicate-session protection and account recovery.
- Verify RLS using two test accounts before launch.

### Phase 5 — Premium polish
- Motion and sound settings, haptics on Android, refined transitions, loading/empty/error states.
- Daily challenges, adaptive practice and skill insights.
- Optional subscription only after core retention and value are validated; free play must remain useful.

## Acceptance criteria

- Existing PWA opens and plays all current games before and after each migration.
- Every game has a stable ID, explicit rules, deterministic scoring where possible, and a tested result contract.
- A guest can play offline without an account.
- A signed-in user can sync their own progress across devices.
- User A cannot read or mutate User B's private profile, sessions, or progress.
- Client code cannot directly grant trusted XP or achievements.
- App handles failed sync without losing locally completed sessions.
- Android release can be built from documented commands and environment variables.
