# 🧠 42 Brain — Logic & Memory Trainer

> *I was just trying to survive the 42 piscine. Then I got carried away. You're welcome.*

[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No frameworks were harmed](https://img.shields.io/badge/Frameworks-0-green?style=flat-square)](.)
[![Runs offline](https://img.shields.io/badge/Works-Offline-blue?style=flat-square)](.)
[![42 School](https://img.shields.io/badge/Inspired%20by-42%20School-black?style=flat-square)](https://42.fr)

---

## 🎯 What is this?

So, I was preparing for the **42 School** admission process — specifically the dreaded logic and memory tests that make you feel like your brain is being run through a blender on turbo mode.

I couldn't find a good offline practice tool that actually *felt* like the real thing. So I built one. In one sitting. With too much coffee.

**42 Brain** is a fast-paced, browser-based game that trains:
- 🔢 **Number sequences** — arithmetic, geometric, Fibonacci-style
- 🔷 **Pattern recognition** — symbol matrices, odd-one-out, find-the-rule
- 🧩 **Deduction puzzles** — figure out the rule from input→output pairs
- 🧠 **Memory challenges** — flash recall for numbers, colors, and grid positions

It runs **100% offline**, needs **zero installation**, and opens straight from a file.

It also includes a premium Game Lab with focused workouts for sequences, memory,
mental math, reaction speed, visual attention, and a 42-question exam simulation.
Progress is saved locally with XP, levels, category accuracy, mistake review,
custom sessions, daily challenges, achievements, two-player mode, and shareable
results.

---

## 🚀 Getting Started

### Option 1 — Just open it (seriously, that's it)

```bash
git clone https://github.com/Mossesmuwa/42-brain.git
cd 42-brain
# Now open index.html in your browser
```

Double-click `index.html`. Done. No npm. No node_modules black hole. No `pip install`. No Docker. Just a file.

### Option 2 — If you like doing things the "proper" way

```bash
# Clone the repo
git clone https://github.com/Mossesmuwa/42-brain.git
cd 42-brain

# Serve it locally (optional, any static server works)
python -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000` in your browser.

---

## 🕹️ How to Play

1. **Pick your difficulty** — Easy (training wheels), Normal (the real deal), Hard (you enjoy pain)
2. **Hit "Start Training →"** — you get 10 rounds (12 on Hard, because masochism)
3. **Answer before the timer runs out** — each round has 10–20 seconds depending on difficulty
4. **Click** an option or **press 1–4** on your keyboard to answer fast
5. **For text puzzles** — type your answer and press **Enter**
6. **Survive.** Check your results. Repeat until your brain works properly.

### Scoring

| Event | Points |
|-------|--------|
| Correct answer | 100 + time bonus (up to +50) |
| 3+ answer streak | 2× multiplier 🔥 |
| Wrong / timeout | 0 pts, streak reset |

---

## 🧩 Puzzle Types

| Type | Category | Description |
|------|----------|-------------|
| Arithmetic Sequence | Logic | `2 → 5 → 8 → ?` Find the next number |
| Geometric Sequence | Logic | `3 → 6 → 12 → ?` Find the ratio |
| Fibonacci-like | Logic | Each = sum of the two before it |
| Shape Matrix | Logic | 3×3 symbol grid — fill the missing cell |
| Odd One Out | Logic | Spot the symbol that doesn't belong |
| Find the Rule | Logic | Input → Output pairs, apply to a new input |
| Number Flash | Memory | See a sequence briefly, recall a specific position |
| Color Flash | Memory | Colors flash, remember which was at position N |
| Position Grid | Memory | Cells highlight briefly — was this one lit? |
| Sequence Order | Memory | See all numbers, type them back in order |

Difficulty scales across rounds — early rounds are gentle, later rounds will test you properly.

---

## 📁 Project Structure

```
42-brain/
├── index.html      # The whole game shell (splash, game, results screens)
├── style.css       # Minimalistic UI — clean, fast, no distractions
├── puzzles.js      # All puzzle generators with difficulty scaling
├── game.js         # Core engine: timer, scoring, rendering, input handling
├── manifest.webmanifest # Installable app metadata
├── service-worker.js # Offline app shell caching
└── README.md       # This file (the one you're reading, hi 👋)
```

No build step. No config files. No 47 layers of abstraction. Just four files and a dream.

---

## 🖼️ Screenshots

> *Disclaimer: actual performance during your 42 exam may vary. Results not guaranteed. Side effects include sudden urge to stare at number sequences during commutes.*

**Splash Screen** — pick your poison:

The game opens with a clean splash screen where you select Easy / Normal / Hard and dive in.

**In-game** — Fibonacci puzzle, Round 1:
- Clear instruction text
- Arrow-linked number boxes with one missing (`?`)
- 4 multiple-choice options
- Countdown timer in the top-right
- Score + streak tracker
- Progress dots at the bottom

**Memory Round** — position recall:
- A grid of cells flashes highlighted positions briefly
- Then: "Was position 10 highlighted?" — Yes or No

**Results Screen:**
- Final score, accuracy %, best streak
- Color-coded round-by-round timeline (🟢 correct / 🔴 wrong / 🟠 timeout)
- Radar chart across Logic, Memory, Speed, Streak, Accuracy axes

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` `2` `3` `4` | Select multiple-choice answer |
| `Enter` | Submit typed answer |

That's it. Two shortcuts. Minimalism is a virtue.

---

## 🛠️ Tech Stack

- **HTML5** — structure
- **CSS3** — styling (vanilla, no frameworks, no regrets)
- **JavaScript (ES6+)** — game logic (also vanilla, also no regrets)
- **Canvas API** — radar chart on results screen
- **Google Fonts** — Inter + JetBrains Mono (loaded from CDN; works offline once cached)

> **Offline note:** On first load, fonts need an internet connection. After that, they're cached and work offline. All game logic is 100% local forever.

---

## 🤝 Contributing

Found a bug? Got a cool puzzle idea? Want to add drag-and-drop tile ordering?

1. Fork it
2. Create your branch: `git checkout -b feature/your-cool-idea`
3. Commit: `git commit -m "Add something cool"`
4. Push: `git push origin feature/your-cool-idea`
5. Open a Pull Request

Please keep the "no build step" philosophy intact. This stays simple on purpose.

---

## 📜 License

MIT — do whatever you want with it. If it helps you get into 42, buy yourself a coffee and celebrate. You earned it. ☕

---

## 💬 Final Words

The 42 piscine is genuinely one of the most intense coding experiences out there, and the selection process doesn't make it easier. If this tool helps even one person prepare better, sharpen their pattern recognition, or just waste 20 minutes in a productive way — then the coffee was worth it.

Good luck. Train hard. Think fast.

*— Someone who stared at too many number sequences*

---

<p align="center">Made with 🧠 and too much ☕ | No frameworks were hurt in the making of this project</p>
