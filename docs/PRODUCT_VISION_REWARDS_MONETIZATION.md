# 42 Brain — Product Vision, Rewards Economy & Monetization

## 1. Product definition

42 Brain is a playful cognitive-practice platform. It helps people practise task-specific skills—memory, attention, processing speed, reasoning, patterns, maths and strategy—through polished games, short training sessions and feedback over time.

**Product promise:** Play with purpose. See your progress. Build a practice habit.

The product is not a random mini-game dump, an ad-watching app, or a clinical brain assessment. Scores describe performance inside a game; progress insights should be framed as practice trends, not proof of higher IQ or guaranteed real-world cognitive gains.

## 2. Product principles

1. **Fun first, purposeful always.** Every game needs understandable rules, responsive controls, a satisfying loop, a fair difficulty curve and a reason to replay.
2. **Practice should fit real life.** Most sessions should take 2–8 minutes. A user should be able to finish a useful session and leave.
3. **Progress must mean something.** Show accuracy, consistency, personal bests, difficulty reached and trends—not only a large score.
4. **Reward effort, not endless time.** XP rewards healthy practice and completion. Never require long sessions to protect a streak or earn basic progress.
5. **Monetization stays optional.** A person can train and progress without watching ads, buying anything or creating an account.
6. **Accessible by default.** Support phone, tablet and desktop; touch, keyboard and mouse; reduced motion, readable contrast, sound controls and clear instructions.
7. **Honest claims.** Describe what the games measure. Do not promise IQ increases, treatment, diagnosis or guaranteed cognitive benefits without appropriate evidence.
8. **Privacy by design.** Collect only what is needed, provide clear consent and controls, and comply with applicable app-store, ad-network and privacy rules. Do not build behavioural ad profiles from sensitive cognitive-performance data.

## 3. Core product loop

1. Open **Today** and see a recommended 3–5 minute session.
2. Choose a training focus or start the daily challenge.
3. Play a polished game with clear instructions and adaptive difficulty.
4. See a concise result: score, accuracy, time, personal best, XP and one useful observation.
5. Get one suggested next step based on recent task performance.
6. Earn progress toward a level, achievement or cosmetic unlock.
7. Leave when finished. A natural stopping point is a product feature, not a failure.

## 4. Main areas of the app

### Today
- Continue training / Start today's session.
- Daily challenge with a clear goal.
- Recommended focus based on recent in-game performance, with an explanation of why it is suggested.
- Small progress snapshot: practice minutes, sessions completed, current goal.
- Optional reward card, never a blocking ad modal.

### Game Library
- Categories: Memory, Focus, Speed, Logic, Patterns, Maths, Strategy and Technical Thinking.
- Search and filters for skill, duration and difficulty.
- Each game card explains the skill being practised, typical session length and controls.
- Preserve the existing game catalogue; improve the games in modules rather than replacing the library wholesale.

### Game Workspace
- One clear objective and unobstructed play area.
- Ready → playing → paused (where appropriate) → completed/abandoned lifecycle.
- Reliable restart, exit confirmation and accessible controls.
- No interstitial ads during a live round or before the result is shown.

### Results
- Score and task-specific measures such as accuracy, response time or number of attempts.
- XP earned, personal best and relevant achievement progress.
- One evidence-based observation, e.g. “You were more accurate on the final two rounds.”
- Retry, next recommended game, or return to Today.
- Separate the game score, training XP and spendable currency so they cannot be confused.

### Progress
- Trends per game and per skill category, with sample size and date range.
- Personal bests and consistency.
- Clear explanations that short-term variation is normal.
- No diagnostic labels or unsupported claims about intelligence.

### Challenges & Achievements
- Daily challenge, weekly themed challenge, personal goals and exploration milestones.
- Achievements have transparent criteria and are granted once.
- Optional friend/group challenges can come later; public leaderboards wait until scores are validated and anti-cheat controls exist.

### Profile & Settings
- Guest play; optional account for cloud backup and cross-device sync.
- Sound, haptics, reduced motion, contrast, text size, privacy and notification settings.
- Sync status, data export and account deletion.
- Notifications are opt-in, useful and limited.

## 5. Three separate reward concepts

Never combine these into one balance.

### A. Training XP — earned through play
Purpose: levels and long-term progression.

- Award XP for completing eligible training sessions and daily goals.
- Small performance bonuses may exist, but completion and learning effort should matter more than being naturally fast or already skilled.
- Use diminishing returns for repeatedly submitting the same trivial session.
- XP is not purchasable and is never granted for watching an ad.
- XP and level never decrease. Missing a day never removes earned progress.
- Calculate authoritative XP on a trusted backend once cloud rewards are enabled.

### B. Sparks — optional soft currency
Purpose: cosmetic customisation and small convenience rewards.

Possible uses:
- Unlock themes, board styles, avatars/frames, sound packs and profile decorations.
- Unlock non-essential visual celebrations.
- In practice mode only, optionally buy a hint or a retry; never sell a competitive advantage or distort recorded performance.
- Keep a useful selection of cosmetics earnable through ordinary play.

Sparks are not cash, have no cash-out value, cannot be transferred between users and should not be represented as a financial investment.

### C. Skill records — performance data, not currency
Purpose: honest feedback and personal history.

- Accuracy, time, best score, attempts, difficulty and trends.
- Do not sell, multiply or inflate these metrics with ads.
- Never let an ad view change a leaderboard score or a cognitive-performance record.

## 6. How users earn Sparks

Starting economy proposal; tune with real usage data, not assumptions:

- Complete a daily training goal: **10 Sparks**, once per day.
- Complete the daily challenge: **5 Sparks**, once per day.
- Earn selected exploration achievements: one-time grants, with clearly displayed amounts.
- Optional rewarded ad: **5 Sparks per completed ad**, with a maximum of **3 rewarded ads per day** at launch.
- No currency for failed/unfinished ad views; explain the outcome and do not repeatedly prompt the user.
- Prevent duplicate grants using a server-validated reward ledger and unique event IDs.

These are starting values for testing, not permanent promises. Set cosmetic prices only after estimating how quickly an ordinary active user earns Sparks. Users should be able to unlock a modest cosmetic through regular play without ads.

## 7. Advertising strategy

### Rewarded ads
- Explicitly opt-in: a button says exactly what the user receives, e.g. “Watch an ad for 5 Sparks.”
- Show only at a natural break, such as the results screen, Today page or reward shop.
- The user must be able to decline and continue using the app normally.
- Reward only after the ad network confirms a completed eligible view through a trusted server-side verification flow where supported.
- Apply a per-account and device abuse policy carefully; avoid penalising households that share a device.
- Enforce daily caps server-side and make reward events idempotent.
- If no ad is available or verification fails, show a calm message and do not silently consume the offer.
- Never make users watch an ad to claim XP, preserve a streak, continue a game, see their result or access essential training.

### Ads we should not launch with
- No forced interstitials between every round.
- No ads during gameplay.
- No fake close buttons, misleading reward claims, countdown pressure or accidental-click layouts.
- No ad that blocks access to results or makes the free product deliberately frustrating.
- No behavioural targeting based on skill weaknesses, performance history or sensitive personal data.

### Audience and compliance gate
Before enabling an ad SDK, establish the target age group and launch markets, review current Google Play and ad-network policies, consent requirements, age-appropriate ad handling and local privacy obligations. If the product is intended for children or may be used by children, apply the relevant child-directed/families requirements and use only suitable ad configurations. Do not assume one ad setup is compliant everywhere.

## 8. Economy safeguards

- XP, Sparks, skill records and any future premium entitlement have separate schemas and APIs.
- All grants/spends go through an append-only reward ledger; never trust a balance submitted by the client.
- Use integer amounts, unique event IDs, transaction-safe balance changes and audit metadata.
- Daily limits use server time and a defined timezone policy.
- Validate eligible session duration, game ID, version, event uniqueness and plausible outcomes before awarding XP.
- Client-side balance display is a cache, not authority.
- No paid random loot boxes, gambling-like mechanics, purchasable competitive power or cash-out.
- Make earned currency sources, spending and any expiry policy clear. Prefer no expiry for earned Sparks.
- Add internal dashboards for ad completion rate, reward failures, invalid events, economy inflation and user complaints.

## 9. Healthy engagement—not addiction mechanics

- Daily goals should be achievable in a few minutes.
- Streaks are optional and forgiving; breaks do not erase XP or levels.
- Avoid shame copy such as “You failed your streak” and pressure-based push notifications.
- Let users disable reminders and set quiet hours.
- No infinite scroll; make stopping points obvious.
- Give users a weekly summary that helps them understand their practice, not a demand to spend more time.
- Optimise for repeat value and user satisfaction, not maximum session length or maximum ad impressions.

## 10. Recommended launch and monetization phases

### Phase 1 — Make the core fun
- Preserve the current web/PWA and its game catalogue.
- Polish game mechanics, instructions, difficulty, sound/motion options, session lifecycle and results.
- Add a consistent score contract and game-level tests.
- Validate that a new player understands each game without external explanation.
- No ads or spendable currency required yet.

### Phase 2 — Meaningful progression
- Add guest-first onboarding, Today, training goals, XP, levels, achievements and progress history.
- Keep progress usable offline.
- Add local reward ledger abstractions and sync-safe event IDs.
- Run usability tests to learn whether people enjoy the loop and understand results.

### Phase 3 — Accounts and trusted cloud
- Supabase Auth/Postgres with RLS and offline-to-cloud sync.
- Server-side session finalization and XP calculation.
- Test duplicate submissions, offline conflicts, account switching and cross-user isolation.
- Do not launch cloud rewards until RLS and server validation are tested.

### Phase 4 — Sparks and cosmetics
- Introduce a small, understandable cosmetic shop.
- Grant Sparks through daily goals, challenges and one-time achievements.
- Measure earn/spend balance and whether rewards feel fair.
- Avoid pay-to-win and avoid making training performance depend on currency.

### Phase 5 — Rewarded ads experiment
- Integrate a suitable ad network only after policy, consent and age-handling review.
- Start with optional rewarded ads, the 3/day cap and 5-Spark reward as a test.
- Compare retention, satisfaction, ad opt-in, complaints and revenue per active user.
- Roll back if ads reduce training completion, trust or retention.
- Consider an ad-free paid tier only if users demonstrate demand; the core training experience remains useful for free.

### Phase 6 — Android release and broader growth
- Expo + React Native app, native touch controls, haptics and reliable offline play.
- Store-compliant privacy disclosures, crash reporting, support and account deletion.
- Consider social challenges and verified leaderboards after integrity checks.
- Expand only after the core experience is stable on phone, tablet and desktop.

## 11. Metrics that matter

### Product value
- First-session completion rate.
- Percentage of new users who understand the result screen.
- Training sessions per active user per week.
- Voluntary return rate at 1, 7 and 30 days.
- User-rated enjoyment and perceived usefulness.
- Progress history viewed and daily goals completed.

### Game quality
- Game start-to-finish rate.
- Restart rate and early exits by game.
- Difficulty abandonment points.
- Crashes, input errors and load time by device class.

### Monetization quality
- Rewarded-ad opt-in and successful completion rate.
- Reward verification failures and duplicate attempts.
- Sparks earned versus spent and time to first cosmetic.
- Revenue per active user, considered alongside retention and satisfaction.
- Ad complaints, consent withdrawal and accidental-click reports.

Do not optimise one monetization metric in isolation. Revenue is only healthy if users continue to find the app valuable.

## 12. Architecture implications

Keep the existing game catalogue and current web experience working while building toward the planned TypeScript + Expo + Supabase architecture.

Suggested additions:
- `packages/game-core`: deterministic game rules, session contracts and scoring.
- `packages/game-content`: catalogue metadata, instructions and difficulty definitions.
- `packages/progression`: XP formulas, levels, achievements and daily goals.
- `packages/rewards`: currency definitions, ledger event types and reward policies.
- `apps/android`: Expo + React Native client.
- `supabase/migrations`: profiles, sessions, progress, challenges, reward ledger and RLS.
- `supabase/functions/finalize-session`: validate game results and award XP.
- `supabase/functions/claim-reward`: idempotent daily/achievement reward grants.
- `supabase/functions/verify-ad-reward`: validate rewarded-ad completion with server-side verification where supported.
- `docs/PRIVACY_AND_ADS.md`: consent, age-handling, retention, disclosure and rollout checklist.

Never ship a Supabase service-role key or ad-verification secret in the app. The client may request an action, but the backend validates and records the reward.

## 13. Definition of a successful first public version

A user can:
- Open 42 Brain and play without creating an account.
- Find a suitable game quickly and understand the rules.
- Complete a short training session and receive a clear, honest result.
- See meaningful progress over time and earn XP without ads.
- Earn and spend Sparks on optional cosmetics.
- Decline ads without losing access to training or results.
- Use the app on mobile and desktop, including offline where supported.
- Trust that progress is not lost, rewards are not duplicated and personal data is handled responsibly.

**Decision:** Build a genuinely good brain-training game first; progression second; currency third; optional rewarded ads fourth. Do not make ads the product. The product is the value people return for.
