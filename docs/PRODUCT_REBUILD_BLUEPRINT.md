# 42 Brain — Product Rebuild & Experience Blueprint

Status: proposed product direction for the existing feature branch. This is a planning document, not a claim that proposed screens or game systems have already been implemented.

## 1. The product we are building

42 Brain is a polished, cross-platform cognitive game and practice product. People come to play compelling games; practice is organised around skills such as memory, attention, reasoning, patterns, processing speed, maths and strategy; progress and rewards give their play continuity.

It must not feel like a generic puzzle template, a dashboard wrapped around a game list, or an ad-reward app.

**Product promise:** Serious games. Purposeful practice. Progress you can understand.

We can measure performance within our games and show changes over time. We must not claim guaranteed IQ increases, clinical assessment, diagnosis or general cognitive improvement without appropriate evidence.

## 2. Product quality bar

Every feature should pass these questions:
- Is it fun before rewards are considered?
- Is the rule clear within a few seconds?
- Does the game offer meaningful decisions rather than only repeated taps?
- Does challenge increase fairly and give the player a reason to master it?
- Does feedback explain what happened?
- Does it work on a low-to-mid-range Android phone and a desktop browser?
- Can a user play without an account, a network connection, an ad or a purchase?
- Is the interface cohesive, accessible and responsive?
- Can we test its scoring and progression?
- Does the feature earn its place in the product, or is it just another metric/card?

No quantity target should force us to ship dozens of shallow games. Prefer a smaller set of distinctive, deeply polished games and expand after quality testing.

## 3. Brand and visual system

### Direction

Create a distinctive, contemporary, premium identity: focused, intelligent, warm and playful when gameplay calls for it. Avoid generic AI gradients, excessive glassmorphism, walls of tiny cards, overused neon cyber styling and gamification clutter.

### Visual principles

- A dark ink/charcoal foundation balanced with warm light surfaces for reading and selected game boards.
- One signature accent used with discipline; reserve success, error and focus colours for their meanings.
- Strong typographic hierarchy: expressive display type for moments of identity, highly legible interface type for controls and data.
- Generous spacing, consistent alignment, clear page rhythm and restrained borders.
- Purposeful motion with short, responsive transitions; respect reduced-motion preferences.
- Custom-designed game pieces and interaction states. Each game may have its own visual world inside the shared design system.
- No emoji as a substitute for finished icons or illustration.
- Use a real token system for colour, type, spacing, radii, elevation, motion, focus and breakpoints.
- Establish logo, wordmark, app icon, favicons, store assets and social-preview art together so the brand stays consistent.

The palette and logo should be validated in actual screens and at small icon sizes before being frozen. Do not lock in colours based only on a moodboard.

### Design system deliverables

1. Brand rationale and logo/app-icon directions.
2. Colour and typography tokens with light/dark surface rules.
3. Buttons, segmented controls, tabs, cards, dialogs, tooltips, toasts, progress indicators and form components.
4. Game-board primitives: targets, tiles, grids, timers, input states, hints, lives, round progress and result states.
5. Interaction specs for hover, focus, pressed, disabled, correct, incorrect, loading and offline states.
6. Accessibility checks for contrast, target size, keyboard access, screen-reader labels and reduced motion.
7. Responsive specifications for small phones, large phones, tablets, laptop and wide desktop.

## 4. Information architecture

### Public website
- Landing: clear product promise, one primary play CTA, featured games, how training works, privacy and FAQ.
- Game catalogue: categories, search, filters for skill/duration/difficulty and curated collections.
- Individual game overview: objective, controls, estimated duration, skills practised and play CTA.
- About / methodology: explain what in-game measures mean and what they do not prove.
- Account / privacy / help pages.

Do not turn the landing page into a marketing wall or a long dashboard. A visitor should be able to start playing quickly.

### Signed-in or guest player app
- **Today:** a concise suggested session, daily challenge, continue action and small progress summary.
- **Play:** all games, categories, search, saved/favourite games and curated collections.
- **Session:** focused full-screen play with minimal distraction.
- **Results:** score, task-specific performance, XP, personal best and a useful next step.
- **Progress:** trends over time, individual game records and practice history.
- **Rewards:** XP level, Sparks balance, achievements and cosmetics with clear earning/spending rules.
- **Profile:** optional account, sync status and player preferences.
- **Settings:** sound, haptics, reduced motion, contrast, text size, privacy, notifications and data controls.

Mobile navigation should remain simple—Today, Play, Progress and Profile—with Rewards integrated where it makes sense. Desktop can use a sidebar and wider content canvas. Do not duplicate every mobile tab into a row of desktop cards.

## 5. Game portfolio strategy

A game earns a place in 42 Brain by having a distinct core mechanic, good feedback, a fair difficulty curve, replayability and a clear testing strategy. Category labels alone do not make games meaningfully different.

### Portfolio pillars

| Pillar | The player practises | Design requirement |
|---|---|---|
| Memory | Recall, working-memory tasks and recognition | Information must change across rounds; mastery should require more than memorising one fixed sequence |
| Focus | Selective attention and distraction resistance | Clear targets, fair distractors and controlled difficulty |
| Logic | Deduction, constraints and multi-step reasoning | More than arithmetic dressed as logic; puzzles must have verified answers |
| Patterns | Rule discovery and sequence prediction | Multiple pattern families, with ambiguity checked before shipping |
| Speed | Fast, accurate responses to simple rules | Separate accuracy from speed; avoid rewarding random tapping |
| Maths | Mental calculation and number sense | Difficulty bands, varied operations and feedback for errors |
| Strategy | Planning, trade-offs and anticipating outcomes | Meaningful choices, visible consequences and replayable scenarios |
| Spatial thinking | Rotation, visualisation and arrangement | Touch-friendly interactions and clear visual feedback |

### Flagship game concepts

These are design directions to evaluate and prototype, not claims that the games are already implemented.

1. **Neural Sequence** — A sequence-recall game with varied patterns, increasingly complex rules, distinct challenge modes and optional no-pressure practice.
2. **Cipher Vault** — A deduction game with clue systems, carefully authored solutions, varied rule sets and multi-stage vaults.
3. **Logic Gauntlet** — A curated sequence of reasoning problems across different families, with explanations after the round and no ambiguous answers.
4. **Pattern Lab** — Players infer a hidden transformation or sequence rule and predict the next state; puzzle validation is mandatory.
5. **Focus Shift** — A selective-attention game in which target rules change at announced intervals, rewarding correct responses rather than frantic tapping.
6. **Spatial Forge** — Rotate, mirror or arrange shapes to satisfy a target. Controls must be designed for both touch and mouse/keyboard.
7. **Memory Matrix** — A spatial recall challenge with changing boards, progressive layouts and carefully balanced scoring.
8. **Numbercraft** — Number puzzles with multiple difficulty tiers and varied operations, not a ten-question arithmetic skin.
9. **Signal & Noise** — A visual or auditory signal-detection challenge with user-controlled sound and accessible non-audio alternatives.
10. **Daily Mix** — A short curated set of different mechanics. It should sample the library, not replace the depth of individual games.

### Existing catalogue audit

The current repo contains an existing game catalogue and games including Neural Sequence, Cipher Vault, Logic Gauntlet, Card Memory and Quick Math. Treat those as starting assets, not proof of finished quality.

Audit every existing game and classify it:
- Keep and polish.
- Redesign its mechanics.
- Merge with another game because it duplicates the same loop.
- Retire only after confirming it has no dependent routes, saved progress or external links.

For each game, document its rules, input model, difficulty curve, scoring, accessibility, replay loop, edge cases, analytics and tests. Do not delete or replace the existing catalogue blindly.

### Game quality gate

Every flagship game must have:
- A 5–15 second tutorial or immediately understandable first round.
- A meaningful core loop and a reason to replay.
- At least three carefully designed difficulty bands.
- Multiple content seeds or authored content sets where appropriate.
- Scoring that rewards correct play and does not incentivise exploitative input.
- Pause/restart/exit behaviour that matches the game.
- Useful completion and failure states; failure should teach or encourage a retry without shaming.
- Sound/haptics that can be disabled and visual feedback that does not rely on sound or colour alone.
- Tests for rules, scoring, timer boundaries, invalid input, interruption, restart and duplicate completion.
- Performance testing on modest hardware.

A timer, points multiplier and streak animation cannot substitute for game depth.

## 6. Shared game engine and session contract

Keep rules independent from interface code. The same deterministic game logic should be reusable by web and Android where practical; each platform gets a native-feeling renderer and input layer.

A game definition should describe:
- Stable ID and version.
- Categories and task-specific skill tags.
- Objective, instructions and input types.
- Typical duration and difficulty settings.
- Content generator or validated authored content.
- Scoring contract and measurable outcomes.
- Accessibility alternatives.
- Rules and test fixtures.

Session lifecycle: ready → playing ↔ paused → completed or abandoned.

A session should record game ID/version, start/end timestamps, score, eligible task measures, difficulty, completion state and a unique session/event ID. Never treat arbitrary client-supplied XP as authoritative.

## 7. Progression and rewards

Keep three concepts separate:
- **XP:** practice progression and levels; never earned by watching ads.
- **Sparks:** optional soft currency for cosmetics; earned through play and optionally rewarded ads.
- **Skill records:** task performance such as accuracy and response time; never purchasable or inflated by rewards.

Initial test economy from the companion monetization plan: daily goal 10 Sparks, daily challenge 5 Sparks, optional rewarded ad 5 Sparks, capped at three completed ads per day. These are hypotheses to test, not final commitments.

Reward systems must be idempotent and auditable. Use an append-only ledger, server-side verification and transaction-safe updates. No paid competitive advantage, cash-out, misleading reward claims or punitive streak loss.

## 8. Advertising and trust

- Rewarded ads are optional and shown at natural stopping points.
- Never interrupt a live game or gate results, XP, essential training or progress.
- Clearly state the reward before the user opts in.
- Confirm completion through the ad provider's supported verification flow and issue a reward once only.
- Show a graceful failure state if an ad is unavailable or verification fails.
- Establish intended audience, age handling, consent and applicable app-store/ad-network policies before enabling an SDK. If children may use the product, apply the appropriate child-directed and families requirements.
- Do not target ads based on cognitive weaknesses, game performance or sensitive inferred traits.
- Track satisfaction, retention and complaints alongside revenue. Remove formats that undermine trust.

## 9. Web and Android strategy

### Web
Keep the existing web app playable during the redesign. First establish automated smoke tests and baseline screenshots. Refactor in small slices, preserving working game IDs, routes and saved data. Upgrade the global shell and catalogue, then move game-by-game.

### Android
Build a real Expo + React Native application rather than relying on a WebView wrapper. Design touch-first layouts, Android back behaviour, safe areas, haptics, offline storage, accessibility and app lifecycle from the beginning. Reuse game rules and progression contracts, not necessarily web UI components.

### Shared services
- TypeScript game core and catalogue.
- Local-first session/progress repository.
- Supabase Auth/Postgres and strict RLS for accounts/cloud sync.
- Edge Functions for trusted session finalization, XP, achievement and reward grants.
- An idempotent rewards ledger and offline sync queue.
- Analytics that minimise personal data.
- Versioned migrations and documented environment variables; no secrets in client code.

## 10. Core data model additions

Use the existing migration as a starting point and verify its actual schema before adding migrations. The target model should support:
- profiles and preferences;
- game catalogue/version metadata;
- sessions and session task measures;
- per-game/per-skill progress aggregates;
- daily challenge definitions and completions;
- achievement definitions and player achievements;
- XP reward events;
- Sparks ledger grants/spends;
- optional ad reward verification references with no sensitive ad payload beyond what is needed;
- sync cursors or pending-event identifiers where required.

Enforce ownership with RLS and test two separate users. Clients cannot write arbitrary balances or award themselves XP. Do not store raw sensitive profiling data that the product does not need.

## 11. Product delivery plan

### Phase 0 — Audit and design foundation
- Inspect all repository files, current routes, game catalogue, persistence and mobile-related setup.
- Run the app and tests where tooling permits; document what actually works and what fails.
- Capture baseline screenshots at phone, tablet and desktop widths.
- Map every current game and identify duplicated mechanics, broken interactions and low-quality UI.
- Finalise product architecture, information architecture, design tokens and game quality rubric.
- No destructive rewrites until dependencies are understood.

**Exit gate:** documented baseline, current feature inventory, design system direction and prioritised issue list.

### Phase 1 — Rebuild the shell
- Create the design system and responsive navigation.
- Redesign landing, Today, Play/library, results and progress structures.
- Ensure keyboard, touch, loading, empty, error and offline states are specified.
- Preserve current play paths during migration.

**Exit gate:** the app feels coherent and polished even before every game has been rebuilt.

### Phase 2 — Flagship game prototypes
- Select three diverse mechanics rather than three variations of one game.
- Prototype the actual interactions and test with real users.
- Tune difficulty, round length, feedback and replayability.
- Add unit and browser interaction tests.

**Exit gate:** testers can understand, enjoy and replay the games without relying on rewards.

### Phase 3 — Quality and content pipeline
- Upgrade the rest of the catalogue against the same quality bar.
- Create validated puzzle content, difficulty curves and anti-ambiguity tests.
- Add sound and motion polish, performance optimisation and accessibility checks.

**Exit gate:** each shipped game passes the game quality gate.

### Phase 4 — Progression and offline reliability
- Add XP, levels, challenges, achievements, progress history and local-first saving.
- Test interruption, duplicate events, offline play and restart behaviour.

**Exit gate:** progress remains consistent and useful without requiring an account.

### Phase 5 — Cloud and Android
- Implement auth, RLS, server-side reward validation and sync.
- Build the Expo Android app with a platform-specific interface.
- Test app backgrounding, poor network, device rotation where supported and account recovery.

**Exit gate:** cloud rewards are tamper-resistant and Android gameplay is not a website in a wrapper.

### Phase 6 — Monetization experiment
- Introduce Sparks and cosmetics.
- Add optional rewarded ads after policy and age-handling review.
- Measure reward fairness, retention, satisfaction and revenue together.

**Exit gate:** monetization does not reduce core usability, trust or training completion.

## 12. Measurement and testing

Measure:
- first-game start and completion;
- time to understand a game;
- repeat play without reward prompts;
- completion and early-exit rates per game and difficulty;
- personal-best and progress-screen use;
- day-1/day-7/day-30 return rates;
- accessibility issues, crash rate and performance on low-end devices;
- offline session retention and successful sync;
- reward duplication/verification failures;
- ad opt-in, complaints, retention impact and revenue.

Use a combination of automated tests, moderated usability sessions and real-device testing. Do not infer cognitive benefits from engagement metrics alone.

## 13. First execution checklist

1. Verify the current branch and PR state; keep main untouched.
2. Inventory current files and catalogue IDs.
3. Run syntax checks, existing tests and app build; record actual results.
4. Inspect current screens at multiple breakpoints and list specific defects.
5. Create design tokens and a reusable shell before individually styling every screen.
6. Choose three flagship games based on distinct mechanics and testability.
7. Implement one complete game loop end-to-end, including instructions, play, results and saving.
8. Review on a real mobile viewport and desktop before migrating the next game.
9. Keep the reward economy and ads behind feature flags until server validation and policy checks are complete.

## Definition of done

42 Brain is ready for a public launch only when a new user can find and understand a game quickly, enjoy a fair and polished session, see honest and useful results, build progress without ads or purchases, and trust that their progress and privacy are handled correctly on both web and Android.
