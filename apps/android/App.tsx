import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

type Screen = 'home' | 'train' | 'progress' | 'settings' | 'game' | 'result';
type GameMode = 'logic' | 'math' | 'memory' | 'focus' | 'daily';
type Question = { title: string; detail: string; options: string[]; answer: string };

type Stats = { sessions: number; totalScore: number; bestScore: number; dailyDone: boolean };

const C = {
  bg: '#0B0D14', panel: '#141824', panel2: '#1B2030', border: '#292F42',
  text: '#F5F6FC', muted: '#A1A9BD', faint: '#717B92',
  accent: '#A99CFF', accentDark: '#27223F', mint: '#61E6D0',
  good: '#65D6A7', bad: '#FF8B98',
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function prepareDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON sessions(created_at);
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

function randomFor(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeQuestion(mode: GameMode, round: number, seed: number): Question {
  const random = randomFor(seed + (round + 1) * 7919);
  const shuffled = (values: string[]) => values.map(value => ({ value, sort: random() })).sort((a, b) => a.sort - b.sort).map(item => item.value);
  if (mode === 'math') {
    const a = 8 + Math.floor(random() * 24) + round;
    const b = 3 + Math.floor(random() * 16);
    const answer = String(a + b);
    return { title: 'Quick calculation', detail: `${a} + ${b} = ?`, answer, options: shuffled([answer, String(a + b + 2), String(a + b - 3), String(a + b + 7)]) };
  }
  if (mode === 'memory') {
    const digits = Array.from({ length: 4 }, () => String(1 + Math.floor(random() * 9)));
    const answer = digits.join(' · ');
    const wrong = digits.map((digit, i) => String((Number(digit) % 9) + 1)).join(' · ');
    const reversed = [...digits].reverse().join(' · ');
    const shifted = [...digits.slice(1), digits[0]].join(' · ');
    return { title: 'Remember the sequence', detail: answer, answer, options: shuffled([answer, wrong, reversed, shifted]) };
  }
  if (mode === 'focus') {
    return { title: 'Spot the different one', detail: 'Choose the symbol that does not match the others.', answer: '◆', options: shuffled(['●', '●', '◆', '●']) };
  }
  const step = 2 + Math.floor(random() * 5);
  const start = 1 + Math.floor(random() * 9);
  const answer = String(start + step * 4);
  return {
    title: 'Complete the pattern',
    detail: `${start}   ${start + step}   ${start + step * 2}   ${start + step * 3}   ?`,
    answer,
    options: shuffled([answer, String(Number(answer) + step), String(Number(answer) - 1), String(Number(answer) + 3)]),
  };
}

function AppShell() {
  const db = useSQLiteContext();
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<GameMode>('logic');
  const [seed, setSeed] = useState(Date.now());
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [memoryHidden, setMemoryHidden] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats>({ sessions: 0, totalScore: 0, bestScore: 0, dailyDone: false });

  const question = useMemo(() => makeQuestion(mode, round, seed), [mode, round, seed]);

  const refreshStats = useCallback(async () => {
    const aggregate = await db.getFirstAsync<{ sessions: number; totalScore: number; bestScore: number }>(
      'SELECT COUNT(*) AS sessions, COALESCE(SUM(score), 0) AS totalScore, COALESCE(MAX(score), 0) AS bestScore FROM sessions'
    );
    const today = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM sessions WHERE mode = ?', `daily-${todayKey()}`
    );
    setStats({
      sessions: aggregate?.sessions ?? 0,
      totalScore: aggregate?.totalScore ?? 0,
      bestScore: aggregate?.bestScore ?? 0,
      dailyDone: (today?.count ?? 0) > 0,
    });
  }, [db]);

  useEffect(() => { void refreshStats(); }, [refreshStats, screen]);

  const startGame = (nextMode: GameMode) => {
    const daySeed = Number(todayKey().replaceAll('-', ''));
    setMode(nextMode);
    setSeed(nextMode === 'daily' ? daySeed : Date.now());
    setRound(0);
    setScore(0);
    setCorrect(0);
    setMemoryHidden(false);
    setLastAnswerCorrect(null);
    setScreen('game');
  };

  const answer = async (choice: string) => {
    const isCorrect = choice === question.answer;
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextScore = score + (isCorrect ? 100 : 0);
    setLastAnswerCorrect(isCorrect);
    setCorrect(nextCorrect);
    setScore(nextScore);

    if (round >= 4) {
      const storedMode = mode === 'daily' ? `daily-${todayKey()}` : mode;
      await db.runAsync(
        'INSERT INTO sessions (mode, score, correct, total, created_at) VALUES (?, ?, ?, ?, ?)',
        storedMode, nextScore, nextCorrect, 5, new Date().toISOString()
      );
      setScreen('result');
      await refreshStats();
      return;
    }
    setRound(value => value + 1);
    setMemoryHidden(false);
  };

  const modeTitle = mode === 'daily' ? 'Daily challenge' : ({
    logic: 'Logic studio', math: 'Quick math', memory: 'Memory studio', focus: 'Focus arena',
  } as Record<GameMode, string>)[mode];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.app}>
        <View style={styles.topbar}>
          <Pressable style={styles.brand} onPress={() => setScreen('home')} accessibilityRole="button" accessibilityLabel="42 Brain home">
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>42</Text></View>
            <View><Text style={styles.brandName}>42 Brain</Text><Text style={styles.brandSub}>THINK WITH INTENTION</Text></View>
          </Pressable>
          <View style={styles.localBadge}><View style={styles.onlineDot} /><Text style={styles.localBadgeText}>ON DEVICE</Text></View>
        </View>

        {screen === 'home' && (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>YOUR DAILY SPACE</Text>
            <Text style={styles.heroTitle}>A sharper mind,{"\n"}one session at a time.</Text>
            <Text style={styles.body}>Small, thoughtful challenges for logic, memory, focus and mental maths. Your progress stays on this device.</Text>
            <View style={styles.dailyCard}>
              <View style={styles.dailyCardTop}><Text style={styles.cardEyebrow}>TODAY'S FEATURE</Text><Text style={styles.dailyTag}>{stats.dailyDone ? 'COMPLETED' : '5 QUESTIONS'}</Text></View>
              <Text style={styles.cardTitle}>The Daily Mix</Text>
              <Text style={styles.bodySmall}>{stats.dailyDone ? 'You have completed today’s set. Replay any lane whenever you want.' : 'A short logic set made for today. No account, no internet, no pressure.'}</Text>
              <Action label={stats.dailyDone ? 'Replay daily challenge' : 'Start daily challenge'} onPress={() => startGame('daily')} />
            </View>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Your training</Text><Text style={styles.sectionNote}>PICK A LANE</Text></View>
            <View style={styles.laneGrid}>
              <Lane title="Logic studio" detail="Patterns & deduction" mark="∴" onPress={() => startGame('logic')} />
              <Lane title="Memory studio" detail="Hold & recall" mark="▦" onPress={() => startGame('memory')} />
              <Lane title="Focus arena" detail="Spot the signal" mark="◎" onPress={() => startGame('focus')} />
              <Lane title="Quick math" detail="Clear calculations" mark="＋" onPress={() => startGame('math')} />
            </View>
            <View style={styles.statsRow}>
              <Metric value={String(stats.sessions)} label="SESSIONS" />
              <Metric value={String(stats.bestScore)} label="BEST SCORE" />
              <Metric value={String(stats.totalScore)} label="TOTAL POINTS" />
            </View>
          </ScrollView>
        )}

        {screen === 'train' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>CHOOSE YOUR FOCUS</Text><Text style={styles.pageTitle}>Training library</Text>
            <Text style={styles.body}>Four focused lanes, one simple goal: think clearly and learn from each run.</Text>
            <View style={styles.trainList}>
              <Lane title="Logic studio" detail="Find patterns and infer what comes next." mark="∴" onPress={() => startGame('logic')} />
              <Lane title="Memory studio" detail="Encode a sequence, then recall it." mark="▦" onPress={() => startGame('memory')} />
              <Lane title="Focus arena" detail="Pick the one symbol that differs." mark="◎" onPress={() => startGame('focus')} />
              <Lane title="Quick math" detail="Solve short mental calculations." mark="＋" onPress={() => startGame('math')} />
            </View>
          </ScrollView>
        )}

        {screen === 'progress' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>YOUR PERSONAL RECORD</Text><Text style={styles.pageTitle}>Progress, not pressure.</Text>
            <Text style={styles.body}>A private record of your practice on this device. Breaks do not erase your progress.</Text>
            <View style={styles.progressFeature}><Text style={styles.cardEyebrow}>TOTAL POINTS</Text><Text style={styles.progressNumber}>{stats.totalScore.toLocaleString()}</Text><Text style={styles.bodySmall}>Earn points by answering correctly. There are no penalties for taking a break.</Text></View>
            <View style={styles.statsGrid}>
              <Metric value={String(stats.sessions)} label="SESSIONS" />
              <Metric value={String(stats.bestScore)} label="PERSONAL BEST" />
              <Metric value={stats.dailyDone ? 'Done' : 'Ready'} label="TODAY" />
            </View>
            <Action label="Train a lane" onPress={() => setScreen('train')} secondary />
          </ScrollView>
        )}

        {screen === 'settings' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>YOUR ENVIRONMENT</Text><Text style={styles.pageTitle}>Settings</Text>
            <View style={styles.settingsPanel}>
              <Text style={styles.cardTitle}>Private by default</Text>
              <Text style={styles.bodySmall}>Sessions and scores are stored in an on-device SQLite database. This build does not require an account or send progress to a server.</Text>
              <View style={styles.settingsDivider} />
              <Text style={styles.settingLabel}>STORAGE</Text><Text style={styles.settingValue}>SQLite · On device</Text>
              <Text style={styles.settingLabel}>NETWORK</Text><Text style={styles.settingValue}>Not required for training</Text>
              <Text style={styles.settingLabel}>BACKUP</Text><Text style={styles.bodySmall}>Backup and restore for the Android database is planned before a public release. Keep the web backup and Android data separate for now.</Text>
            </View>
          </ScrollView>
        )}

        {screen === 'game' && (
          <ScrollView contentContainerStyle={styles.gameContent}>
            <Pressable onPress={() => setScreen('train')} style={styles.backLink}><Text style={styles.backLinkText}>‹  Training library</Text></Pressable>
            <View style={styles.gameMeta}><Text style={styles.eyebrow}>{modeTitle.toUpperCase()}</Text><Text style={styles.roundLabel}>ROUND {round + 1} / 5</Text></View>
            <View style={styles.questionCard}>
              <View style={styles.questionProgress}><View style={[styles.questionProgressFill, { width: `${((round + 1) / 5) * 100}%` }]} /></View>
              <Text style={styles.questionTitle}>{question.title}</Text>
              {mode === 'memory' && !memoryHidden ? (
                <>
                  <Text style={styles.memorySequence}>{question.detail}</Text>
                  <Text style={styles.bodySmall}>Take a moment to memorise the sequence.</Text>
                  <Action label="Hide sequence & answer" onPress={() => setMemoryHidden(true)} />
                </>
              ) : (
                <>
                  <Text style={styles.questionDetail}>{mode === 'memory' ? 'Choose the sequence you saw.' : question.detail}</Text>
                  <View style={styles.options}>
                    {question.options.map((option, index) => (
                      <Pressable key={`${round}-${index}-${option}`} style={styles.option} onPress={() => void answer(option)} accessibilityRole="button">
                        <Text style={styles.optionIndex}>{String.fromCharCode(65 + index)}</Text><Text style={styles.optionText}>{option}</Text><Text style={styles.optionArrow}>↗</Text>
                      </Pressable>
                    ))}
                  </View>
                  {lastAnswerCorrect !== null && <Text style={[styles.feedback, { color: lastAnswerCorrect ? C.good : C.bad }]}>{lastAnswerCorrect ? 'Correct. Keep going.' : 'Not quite. Keep learning from the next one.'}</Text>}
                </>
              )}
            </View>
            <Text style={styles.sessionScore}>{score} <Text style={styles.sessionScoreLabel}>POINTS</Text></Text>
          </ScrollView>
        )}

        {screen === 'result' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>SESSION COMPLETE</Text><Text style={styles.heroTitle}>Good work.</Text>
            <Text style={styles.body}>You finished five rounds of {modeTitle.toLowerCase()}. Every session gives you another point of reference.</Text>
            <View style={styles.resultCard}><Text style={styles.cardEyebrow}>YOUR SCORE</Text><Text style={styles.resultScore}>{score}</Text><Text style={styles.bodySmall}>{correct} of 5 correct · {Math.round((correct / 5) * 100)}% accuracy</Text></View>
            <Action label="Play another session" onPress={() => startGame(mode)} />
            <Action label="Back to home" onPress={() => setScreen('home')} secondary />
          </ScrollView>
        )}

        {screen !== 'game' && screen !== 'result' && (
          <View style={styles.tabbar}>
            <Tab label="Home" mark="⌂" active={screen === 'home'} onPress={() => setScreen('home')} />
            <Tab label="Train" mark="◈" active={screen === 'train'} onPress={() => setScreen('train')} />
            <Tab label="Progress" mark="↗" active={screen === 'progress'} onPress={() => setScreen('progress')} />
            <Tab label="Settings" mark="⚙" active={screen === 'settings'} onPress={() => setScreen('settings')} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={[styles.action, secondary && styles.actionSecondary]}><Text style={[styles.actionText, secondary && styles.actionSecondaryText]}>{label}</Text><Text style={[styles.actionArrow, secondary && styles.actionSecondaryText]}>↗</Text></Pressable>;
}
function Lane({ title, detail, mark, onPress }: { title: string; detail: string; mark: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={styles.lane}><View style={styles.laneMark}><Text style={styles.laneMarkText}>{mark}</Text></View><View style={styles.laneCopy}><Text style={styles.laneTitle}>{title}</Text><Text style={styles.laneDetail}>{detail}</Text></View><Text style={styles.laneArrow}>↗</Text></Pressable>;
}
function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}
function Tab({ label, mark, active, onPress }: { label: string; mark: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.tab}><Text style={[styles.tabMark, active && styles.tabActive]}>{mark}</Text><Text style={[styles.tabLabel, active && styles.tabActive]}>{label}</Text></Pressable>;
}

export default function App() {
  return <SQLiteProvider databaseName="42brain.db" onInit={prepareDatabase}><AppShell /></SQLiteProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  app: { flex: 1, backgroundColor: C.bg },
  topbar: { minHeight: 76, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.accentDark, borderWidth: 1, borderColor: '#514A7B', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.accent, fontWeight: '900', fontSize: 17, letterSpacing: -1 },
  brandName: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: -.5 },
  brandSub: { color: C.faint, fontSize: 8, fontWeight: '800', letterSpacing: 1.3, marginTop: 3 },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#152A2B', borderWidth: 1, borderColor: '#254648' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.mint },
  localBadgeText: { color: C.mint, fontSize: 9, fontWeight: '800', letterSpacing: .8 },
  content: { padding: 22, paddingBottom: 40, gap: 16 },
  gameContent: { padding: 20, paddingBottom: 40, gap: 18 },
  eyebrow: { color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { color: C.text, fontSize: 38, fontWeight: '800', letterSpacing: -1.8, lineHeight: 42 },
  pageTitle: { color: C.text, fontSize: 31, fontWeight: '800', letterSpacing: -1.2 },
  body: { color: C.muted, fontSize: 14, lineHeight: 22 },
  bodySmall: { color: C.muted, fontSize: 12, lineHeight: 19 },
  dailyCard: { padding: 20, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 12, marginTop: 6 },
  dailyCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  dailyTag: { color: C.mint, fontSize: 9, fontWeight: '800', letterSpacing: .7 },
  cardTitle: { color: C.text, fontSize: 23, fontWeight: '800', letterSpacing: -.6 },
  action: { minHeight: 50, paddingHorizontal: 15, borderRadius: 13, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  actionText: { color: '#11121A', fontWeight: '800', fontSize: 13 },
  actionArrow: { color: '#11121A', fontWeight: '900', fontSize: 17 },
  actionSecondary: { backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border },
  actionSecondaryText: { color: C.text },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10 },
  sectionTitle: { color: C.text, fontSize: 19, fontWeight: '800', letterSpacing: -.4 },
  sectionNote: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  laneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lane: { width: '100%', minHeight: 76, padding: 14, borderRadius: 16, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  laneMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.panel2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  laneMarkText: { color: C.accent, fontSize: 22, fontWeight: '700' },
  laneCopy: { flex: 1, gap: 4 },
  laneTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  laneDetail: { color: C.muted, fontSize: 11, lineHeight: 16 },
  laneArrow: { color: C.faint, fontSize: 18 },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 2 },
  metric: { flex: 1, minWidth: 0, padding: 14, borderRadius: 15, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 7 },
  metricValue: { color: C.text, fontSize: 21, fontWeight: '800', letterSpacing: -.8 },
  metricLabel: { color: C.faint, fontSize: 8, fontWeight: '800', letterSpacing: .8 },
  trainList: { gap: 10, marginTop: 10 },
  progressFeature: { padding: 23, borderRadius: 20, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 10 },
  progressNumber: { color: C.accent, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  statsGrid: { flexDirection: 'row', gap: 9 },
  settingsPanel: { padding: 20, borderRadius: 20, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 12 },
  settingsDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  settingLabel: { color: C.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginTop: 6 },
  settingValue: { color: C.text, fontSize: 13, fontWeight: '700' },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg, paddingTop: 9, paddingBottom: 5, paddingHorizontal: 5 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48 },
  tabMark: { color: C.faint, fontSize: 19, lineHeight: 21 },
  tabLabel: { color: C.faint, fontSize: 9, fontWeight: '700' },
  tabActive: { color: C.accent },
  backLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  backLinkText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  gameMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundLabel: { color: C.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  questionCard: { padding: 20, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 16 },
  questionProgress: { height: 4, borderRadius: 3, backgroundColor: C.panel2, overflow: 'hidden' },
  questionProgressFill: { height: 4, borderRadius: 3, backgroundColor: C.accent },
  questionTitle: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -.5 },
  questionDetail: { color: C.text, fontSize: 25, fontWeight: '700', lineHeight: 35, textAlign: 'center', paddingVertical: 18 },
  memorySequence: { color: C.mint, fontSize: 22, fontWeight: '800', textAlign: 'center', paddingVertical: 18, letterSpacing: 1 },
  options: { gap: 9 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderRadius: 13, backgroundColor: C.panel2, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13 },
  optionIndex: { color: C.faint, fontSize: 10, fontWeight: '800', width: 18 },
  optionText: { color: C.text, fontSize: 15, fontWeight: '700', flex: 1 },
  optionArrow: { color: C.faint, fontSize: 15 },
  feedback: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  sessionScore: { color: C.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sessionScoreLabel: { color: C.faint, fontSize: 9, letterSpacing: 1.3 },
  resultCard: { padding: 24, borderRadius: 22, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, gap: 9 },
  resultScore: { color: C.accent, fontSize: 62, fontWeight: '900', letterSpacing: -3 },
});
