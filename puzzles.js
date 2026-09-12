/**
 * puzzles.js – Complete puzzle generator for 42 Brain Trainer
 * Types: Logic · Memory · Reaction · Attention · MentalMath · OddOneOut
 */
'use strict';

/* ── UTILITIES ──────────────────────────────────────────────────────── */
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => [...arr].sort(() => Math.random() - .5);
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* Seeded RNG for daily challenge */
function seededRng(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const COLORS = [
  { name:'Red',    hex:'#ef4444' }, { name:'Blue',   hex:'#3b82f6' },
  { name:'Green',  hex:'#22c55e' }, { name:'Yellow', hex:'#eab308' },
  { name:'Purple', hex:'#a855f7' }, { name:'Orange', hex:'#f97316' },
  { name:'Teal',   hex:'#14b8a6' }, { name:'Pink',   hex:'#ec4899' },
  { name:'Indigo', hex:'#6366f1' }, { name:'Lime',   hex:'#84cc16' },
  { name:'Cyan',   hex:'#06b6d4' }, { name:'Rose',   hex:'#fb7185' },
];

const SHAPES   = ['●','■','▲','★','♦','⬟','⬡','⬖','◆','☆','▶','⬠'];
const EMOJIS   = ['🍎','🍋','🍇','🍓','🍑','🥝','🍊','🍉','🫐','🍒','🥑','🍍','🫑','🌽','🥦'];
const ANIMALS  = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷'];
const LETTERS  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

/* ── HELPERS ─────────────────────────────────────────────────────── */
function genNumericOptions(answer, difficulty) {
  const opts = new Set([answer]);
  const range = Math.max(6, Math.abs(answer) * 0.35 + difficulty * 4);
  let attempts = 0;
  while (opts.size < 4 && attempts++ < 40) {
    const delta = rand(-Math.ceil(range), Math.ceil(range));
    if (delta !== 0) opts.add(answer + delta);
  }
  return shuffle([...opts]).map(String);
}

/* ── LOGIC: NUMBER SEQUENCES ─────────────────────────────────────── */

function genArithmetic(d) {
  const step  = pick([...Array(5+d).keys()].map(i=>i+2)) * (Math.random()<.4?-1:1);
  const start = rand(1, 20 + d * 6);
  const len   = 3 + Math.min(d, 3);
  const seq   = Array.from({ length: len+1 }, (_,i) => start + step*i);
  const bidx  = rand(len-2, len);
  const ans   = seq[bidx];
  return {
    type:'logic', subtype:'arithmetic',
    instruction: '🔢 What is the missing number in the sequence?',
    hint: `The numbers change by the same amount each step. Step = ${step}`,
    display: { sequence: seq.map((v,i)=>i===bidx?null:v), blankIdx: bidx },
    answer: String(ans), options: genNumericOptions(ans, d), renderFn:'renderSequence',
  };
}

function genGeometric(d) {
  const ratio = pick([2,3,4].slice(0,1+d));
  const start = rand(1,6);
  const len   = 3 + Math.min(d,2);
  const seq   = Array.from({ length:len+1 }, (_,i)=>start*Math.pow(ratio,i));
  if (seq.some(v=>v>10000)) return genArithmetic(d);
  const bidx  = rand(len-1,len);
  const ans   = seq[bidx];
  return {
    type:'logic', subtype:'geometric',
    instruction: '📈 Each number is multiplied by the same factor. Find the missing term.',
    hint: `Multiply each term by ${ratio} to get the next.`,
    display: { sequence: seq.map((v,i)=>i===bidx?null:v), blankIdx:bidx },
    answer: String(ans), options: genNumericOptions(ans, d), renderFn:'renderSequence',
  };
}

function genFibonacci(d) {
  const a = rand(1,4), b = rand(1,5);
  const seq = [a,b];
  const len = 4 + Math.min(d,2);
  for (let i=2;i<len+1;i++) seq.push(seq[i-1]+seq[i-2]);
  const bidx = rand(len-2, len);
  const ans  = seq[bidx];
  return {
    type:'logic', subtype:'fibonacci',
    instruction: '🌀 Each term = sum of the two before it. Find the missing number.',
    hint: 'Add the two previous numbers to get the next one.',
    display: { sequence: seq.map((v,i)=>i===bidx?null:v), blankIdx:bidx },
    answer: String(ans), options: genNumericOptions(ans,d), renderFn:'renderSequence',
  };
}

function genPrimes(d) {
  const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
  const start  = rand(0, Math.min(d*2, 8));
  const len    = 4 + Math.min(d,2);
  const seq    = primes.slice(start, start+len+1);
  if (seq.length < len+1) return genArithmetic(d);
  const bidx   = rand(len-2, len);
  const ans    = seq[bidx];
  return {
    type:'logic', subtype:'primes',
    instruction: '🔑 These are prime numbers! What is missing?',
    hint: 'A prime number is only divisible by 1 and itself.',
    display: { sequence: seq.map((v,i)=>i===bidx?null:v), blankIdx:bidx },
    answer: String(ans), options: genNumericOptions(ans,d), renderFn:'renderSequence',
  };
}

function genSquares(d) {
  const start = rand(1, 3+d);
  const len   = 4 + Math.min(d,2);
  const seq   = Array.from({length:len+1},(_,i)=>Math.pow(start+i,2));
  const bidx  = rand(len-2,len);
  const ans   = seq[bidx];
  return {
    type:'logic', subtype:'squares',
    instruction: '⬜ These are perfect squares. Find the missing one!',
    hint: 'Each term is a whole number squared: 1,4,9,16,25...',
    display: { sequence: seq.map((v,i)=>i===bidx?null:v), blankIdx:bidx },
    answer: String(ans), options: genNumericOptions(ans,d), renderFn:'renderSequence',
  };
}

/* ── LOGIC: PATTERNS ─────────────────────────────────────────────── */

function genShapeMatrix(d) {
  const palette = shuffle(SHAPES).slice(0, 3+Math.min(d,2));
  const rows=3, cols=3, grid=[];
  for (let r=0;r<rows;r++) { grid.push([]); for (let c=0;c<cols;c++) grid[r].push(palette[(r+c)%palette.length]); }
  const br=rand(1,rows-1), bc=rand(1,cols-1), ans=grid[br][bc];
  grid[br][bc]=null;
  const decoys = SHAPES.filter(s=>!palette.includes(s));
  const opts   = shuffle([ans,...shuffle([...palette,...decoys]).filter(s=>s!==ans).slice(0,3)]);
  return {
    type:'logic', subtype:'shape_matrix',
    instruction: '🔲 Find the symbol that completes the pattern grid.',
    hint: 'Each row and column follows a repeating pattern.',
    display: { grid, rows, cols, blankR:br, blankC:bc },
    answer:ans, options:opts, renderFn:'renderShapeMatrix',
  };
}

function genOddOneOut(d) {
  const types = [
    () => { // Shape odd one out
      const n = 4+Math.min(d,2), maj=pick(SHAPES);
      let odd=pick(SHAPES); while(odd===maj) odd=pick(SHAPES);
      const items=Array(n-1).fill(maj); const oi=rand(0,n-1); items.splice(oi,0,odd);
      return { items, labels:'ABCDEF'.slice(0,n).split(''), oi, category:'shapes' };
    },
    () => { // Number odd one out (even vs odd, or multiples)
      const n=4+Math.min(d,1); const rule=pick(['even','odd','multiple3','multiple5']);
      const match = rule==='even'?[2,4,6,8,10,12]:rule==='odd'?[1,3,5,7,9,11]:rule==='multiple3'?[3,6,9,12,15]:[5,10,15,20,25];
      const nomatch = rule==='even'?[1,3,5,7]:rule==='odd'?[2,4,6,8]:rule==='multiple3'?[4,7,10,13]:[4,7,9,11];
      const items=shuffle(match).slice(0,n-1); const oi=rand(0,n-1); items.splice(oi,0,pick(nomatch));
      return { items, labels:'ABCDEF'.slice(0,n).split(''), oi, category:'numbers', ruleHint:rule };
    },
    () => { // Emoji odd one out
      const pool=shuffle(EMOJIS), n=4+Math.min(d,2), maj=pool[0];
      const items=Array(n-1).fill(maj); const oi=rand(0,n-1); items.splice(oi,0,pool[1]);
      return { items, labels:'ABCDEF'.slice(0,n).split(''), oi, category:'emoji' };
    },
  ];
  const { items, labels, oi, ruleHint } = pick(types)();
  return {
    type:'logic', subtype:'odd_one_out',
    instruction: '🔍 Which one does NOT belong? Click its letter.',
    hint: ruleHint ? `Look for numbers that follow the pattern: ${ruleHint}` : "Find the one that's different from all others.",
    display: { items, labels },
    answer: labels[oi], options: labels, renderFn:'renderOddOneOut',
  };
}

function genFindTheRule(d) {
  const rules = [
    { label:'×2',   fn:n=>n*2   }, { label:'×3',   fn:n=>n*3   },
    { label:'+10',  fn:n=>n+10  }, { label:'n²',   fn:n=>n*n   },
    { label:'−5',   fn:n=>n-5   }, { label:'×2+1', fn:n=>n*2+1 },
    { label:'+n',   fn:n=>n+n+1 }, { label:'÷2+3', fn:n=>Math.floor(n/2)+3 },
  ].slice(0,2+d);
  const rule=pick(rules), np=2+Math.min(d,2);
  const pairs=Array.from({length:np},()=>{ const n=rand(2,12); return {in:n,out:rule.fn(n)}; });
  const testIn=rand(2,15), ans=String(rule.fn(testIn));
  return {
    type:'logic', subtype:'find_rule',
    instruction: `📐 Every pair follows the same rule. Apply it to: ${testIn} → ?`,
    hint: `Try applying the rule "${rule.label}" to each input.`,
    display: { pairs, testIn },
    answer: ans, options: genNumericOptions(Number(ans),d), renderFn:'renderFindRule',
  };
}

function genDeductionPuzzle(d) {
  // Simple "what am I?" deduction with clues
  const subjects = [
    { answer:'7',     clues:["I'm odd","I'm less than 10","I'm greater than 5","I'm prime"] },
    { answer:'12',    clues:["I'm even","I'm divisible by 3","I'm divisible by 4","I'm less than 20"] },
    { answer:'25',    clues:["I'm a perfect square","I'm odd","I'm between 20 and 30","5×5=?"] },
    { answer:'36',    clues:["I'm a perfect square","I'm even","6×6=?","I'm between 30 and 40"] },
    { answer:'100',   clues:["I end in two zeros","10×10=?","I'm divisible by 25","I'm 10 squared"] },
    { answer:'16',    clues:["I'm 2 to the power of 4","I'm a perfect square","I'm even","I'm between 10 and 20"] },
    { answer:'Prime', clues:["I'm only divisible by 1 and myself","Numbers 2,3,5,7 are examples of me","Not composite","Not 1"] },
  ];
  const sub  = pick(subjects);
  const shown = Math.min(2+d, sub.clues.length);
  const clues = sub.clues.slice(0,shown);
  const isNum = !isNaN(Number(sub.answer));
  const wrongOpts = isNum
    ? genNumericOptions(Number(sub.answer), d)
    : ['Composite','Even','Prime','Odd'];
  const opts = isNum ? wrongOpts : shuffle(['Prime','Composite','Even','Odd']);
  return {
    type:'logic', subtype:'deduction',
    instruction: '🕵️ Use the clues to figure out what number / term I am!',
    hint: clues[0],
    display: { clues },
    answer: sub.answer, options: opts.includes(sub.answer)?opts:[...opts.slice(0,3),sub.answer].sort(()=>Math.random()-.5),
    renderFn:'renderDeduction',
  };
}

/* ── MENTAL MATH ─────────────────────────────────────────────────── */

function genMentalMath(d) {
  const opPool = [
    () => { const a=rand(10+d*12,50+d*30),b=rand(5+d*5,30+d*20); return {a,b,op:'+',ans:a+b}; },
    () => { const a=rand(20+d*10,100+d*40),b=rand(5+d*5,Math.ceil(a*.7)); return {a,b,op:'−',ans:a-b}; },
    () => { const a=rand(2,6+d*3),b=rand(2,6+d*3); return {a,b,op:'×',ans:a*b}; },
    () => { const b=rand(2,5+d*2),ans=rand(2,9+d*4); return {a:b*ans,b,op:'÷',ans}; },
    () => { const a=rand(2,8+d*2); return {a,b:2,op:'²',ans:a*a,eq:`${a}²`}; },
  ].slice(0, 2+d);
  const { a, b, op, ans, eq } = pick(opPool)();
  return {
    type:'math', subtype:'mental_math',
    instruction: '🧮 Solve as fast as you can!',
    hint: `Break it down: ${a} ${op} ${b}. Try rounding first.`,
    display: { equation: eq || `${a} ${op} ${b}`, a, b, op },
    answer: String(ans), options: genNumericOptions(ans, d), renderFn:'renderMentalMath',
  };
}

function genMathSequence(d) {
  // Fill-in-the-blank with arithmetic expression
  const exprs = [
    { eq:`__ + ${rand(3,12)} = ${rand(15,40)}`, fn:(e,r)=>r-e },
    { eq:`${rand(5,20)} × __ = ${rand(12,60)}`, fn:(a,res)=>res/a, check:(a,res)=>res%a===0 },
  ];
  const a  = rand(3,8+d*3);
  const b  = rand(2, 5+d*2);
  const res= a * b;
  const ans= a; // find a: __ × b = res
  return {
    type:'math', subtype:'math_sequence',
    instruction: `🔢 Find the missing number: __ × ${b} = ${res}`,
    hint: `Divide ${res} by ${b}.`,
    display: { equation:`__ × ${b} = ${res}` },
    answer: String(ans), options: genNumericOptions(ans,d), renderFn:'renderMentalMath',
  };
}

/* ── MEMORY CHALLENGES ──────────────────────────────────────────── */

function genMemoryNumbers(d) {
  const len = 3+d, seq=Array.from({length:len},()=>rand(1,9+d*8));
  const idx = rand(0,len-1);
  return {
    type:'memory', subtype:'mem_numbers',
    instruction:`💡 What was number at position ${idx+1}?`,
    hint:'Try grouping the numbers into pairs to remember them.',
    display:{ seq, askIdx:idx }, answer:String(seq[idx]),
    options:genNumericOptions(seq[idx],d), renderFn:'renderMemNumbers',
    flashDuration:Math.max(1500,3800-d*500),
  };
}

function genMemoryColors(d) {
  const len = 3+Math.min(d,4), pool=shuffle(COLORS), seq=pool.slice(0,len);
  const idx = rand(0,len-1), ans=seq[idx].name;
  const dec = COLORS.filter(c=>c.name!==ans);
  const optC= shuffle([seq[idx],...shuffle(dec).slice(0,3)]);
  return {
    type:'memory', subtype:'mem_colors',
    instruction:`🎨 What color was at position ${idx+1}?`,
    hint:'Assign a word or image to each color to help remember.',
    display:{ seq, askIdx:idx }, answer:ans,
    options:optC.map(c=>c.name), optionColors:optC,
    renderFn:'renderMemColors', flashDuration:Math.max(1200,3200-d*400),
  };
}

function genMemoryPositions(d) {
  const gs = 3+Math.min(d,1), nLit=2+Math.min(d,4), total=gs*gs;
  const lit = shuffle([...Array(total).keys()]).slice(0,nLit);
  const idx = Math.random()<.5 ? pick(lit) : pick([...Array(total).keys()].filter(i=>!lit.includes(i)));
  const ans = lit.includes(idx)?'Yes':'No';
  return {
    type:'memory', subtype:'mem_positions',
    instruction:`📍 Was cell ${idx+1} highlighted?`,
    hint:'Focus on the highlighted cells only — ignore the rest.',
    display:{ gridSize:gs, litIdxs:lit, askIdx:idx }, answer:ans,
    options:['Yes','No'], renderFn:'renderMemPositions',
    flashDuration:Math.max(1500,3000-d*300),
  };
}

function genMemoryOrder(d) {
  const len = 3+Math.min(d,3), seq=Array.from({length:len},()=>rand(1,20));
  return {
    type:'memory', subtype:'mem_order',
    instruction:'📋 Type all numbers you saw, separated by commas.',
    hint:`There were ${len} numbers. Type them in the exact order.`,
    display:{ seq }, answer:seq.join(','),
    options:null, renderFn:'renderMemOrder',
    flashDuration:Math.max(2000,4500-d*500), textInput:true,
  };
}

function genMemoryLetters(d) {
  const len = 3+Math.min(d,3);
  const seq = Array.from({length:len},()=>pick(LETTERS));
  const idx = rand(0,len-1);
  const allL= shuffle(LETTERS).slice(0,4);
  if (!allL.includes(seq[idx])) allL[0]=seq[idx];
  const opts= shuffle(allL);
  return {
    type:'memory', subtype:'mem_letters',
    instruction:`🔤 What letter was in position ${idx+1}?`,
    hint:'Try spelling a word with the letters to remember them.',
    display:{ seq, askIdx:idx }, answer:seq[idx],
    options:opts, renderFn:'renderMemLetters',
    flashDuration:Math.max(1500,3200-d*400),
  };
}

/* ── REACTION TIME ─────────────────────────────────────────────── */

function genReactionTime(d) {
  const delay = rand(1200+d*100, 3500-d*200);
  const colors = [
    { bg:'#22c55e',label:'GREEN', type:'go'   },
    { bg:'#ef4444',label:'RED',   type:'stop' },
    { bg:'#f59e0b',label:'AMBER', type:'wait' },
  ];
  const signals = Math.random()<.8
    ? [{ ...colors[0], react:true }]
    : [{ ...pick(colors.slice(1)), react:false }];

  return {
    type:'reaction', subtype:'reaction_time',
    instruction:'⚡ Click the button ONLY when it turns GREEN! Ignore other colors.',
    hint:'Keep your hand near the button and watch for green.',
    display:{ delay, signal:signals[0] }, answer:'reacted',
    options:null, renderFn:'renderReactionTime',
    flashDuration:0,
  };
}

/* ── ATTENTION / FOCUS ──────────────────────────────────────────── */

function genAttentionFocus(d) {
  const pools   = [EMOJIS, ANIMALS, SHAPES];
  const pool    = pick(pools);
  const shuffled= shuffle([...pool]);
  const target  = shuffled[0];
  const cols    = 4+Math.min(d,2), rows=4+Math.min(d,1), total=cols*rows;
  const tCount  = 2+Math.min(d,4);
  const items   = [];
  for (let i=0;i<total;i++) items.push(i<tCount ? target : shuffled[1+(i%(shuffled.length-1))]);
  return {
    type:'attention', subtype:'attention_focus',
    instruction:`🎯 Find and click ALL "${target}" hidden in the grid!`,
    hint:`There are exactly ${tCount} of them. Take your time to scan.`,
    display:{ items:shuffle(items), target, targetCount:tCount, cols },
    answer:String(tCount), options:null, renderFn:'renderAttentionFocus',
    flashDuration:0,
  };
}

function genVisualSearch(d) {
  // Find the letter among similar-looking letters
  const letterGroups = ['O0QD','Il1|','mn','bd','pq','UV','rn','cl','h n'];
  const group   = pick(letterGroups.filter(g=>g.length>=3)).split('');
  const target  = group[0];
  const total   = 16+Math.min(d,3)*4;
  const tCount  = 1+Math.min(d,2);
  const items   = [];
  for (let i=0;i<total;i++) items.push(i<tCount ? target : group[1+(i%(group.length-1))]);
  return {
    type:'attention', subtype:'visual_search',
    instruction:`🔎 Find the "${target}" hidden among look-alikes!`,
    hint:`Look for the letter "${target}" — it's easy to miss!`,
    display:{ items:shuffle(items), target, targetCount:tCount, cols:Math.ceil(Math.sqrt(total)) },
    answer:String(tCount), options:null, renderFn:'renderAttentionFocus',
    flashDuration:0,
  };
}

/* ── CUSTOM PUZZLES ─────────────────────────────────────────────── */

function genCustomPuzzle() {
  const customs = Store.getCustomPuzzles();
  if (!customs.length) return genArithmetic(1);
  const c = pick(customs);
  return {
    type: c.type || 'logic', subtype:'custom',
    instruction: c.instruction || '🧩 Answer the question below:',
    hint: c.hint || 'Think carefully!',
    display:{ question: c.question || c.instruction, custom:true },
    answer: String(c.answer),
    options: c.options ? shuffle(c.options.map(String)) : genNumericOptions(Number(c.answer),1),
    renderFn:'renderCustom',
  };
}

/* ── MOTIVATIONAL + HUMOUR ─────────────────────────────────────── */
const MOTIVATION = [
  '💪 Your neurons thank you.',
  '🧠 Big brain energy detected.',
  '😤 That\'s what I call focus!',
  '🚀 42 would be proud.',
  '⚡ Electric performance!',
  '🎓 Professor Brain, is that you?',
  '🔥 You\'re absolutely on fire!',
  '🤯 Mind = blown (in a good way).',
  '🐢 Slow and steady? Nah, you\'re fast.',
  '🌟 Straight to the leaderboard.',
  '🎯 Precise. Clinical. Brilliant.',
  '🦾 Practically a supercomputer.',
];

const ENCOURAGEMENT = [
  '💡 Shake it off — next one!',
  '🙃 Even Einstein got things wrong.',
  '📈 Every wrong answer = 1% smarter.',
  '🎮 This is training, not the exam — yet.',
  '🧩 Puzzles are supposed to be hard!',
  '☕ Maybe more coffee?',
  '🤖 Error 404: correct answer not found (by you, today).',
  '🔁 Try, fail, learn, repeat.',
];

window.PuzzleQuotes = { random: () => pick(MOTIVATION), wrong: () => pick(ENCOURAGEMENT) };

/* ── EXPORT ─────────────────────────────────────────────────────── */

window.PuzzleEngine = {

  _logicGens:  [genArithmetic, genGeometric, genFibonacci, genPrimes, genSquares, genShapeMatrix, genOddOneOut, genFindTheRule, genDeductionPuzzle],
  _memGens:    [genMemoryNumbers, genMemoryColors, genMemoryPositions, genMemoryOrder, genMemoryLetters],
  _mathGens:   [genMentalMath, genMathSequence],
  _reactGens:  [genReactionTime],
  _attnGens:   [genAttentionFocus, genVisualSearch],

  generate(round, diffSetting, totalRounds, forcedType, seededRandom) {
    const rng  = seededRandom || Math.random.bind(Math);
    const base = { easy:0, normal:1, hard:2 }[diffSetting] ?? 1;
    const d    = clamp(base + Math.floor(round / Math.max(1, totalRounds/3)), base, base+3);

    // Weight each category based on round progression
    if (forcedType === 'custom') return genCustomPuzzle();

    let category;
    if (forcedType && forcedType !== 'all') {
      category = forcedType;
    } else {
      // Dynamic weighting
      const rval = rng();
      const memW  = clamp(0.18 + round * 0.025, 0.18, 0.40);
      const mathW = clamp(0.12 + round * 0.015, 0.12, 0.28);
      const reactW= 0.12;
      const attnW = 0.10;
      if (rval < memW)             category = 'memory';
      else if (rval < memW+mathW)  category = 'math';
      else if (rval < memW+mathW+reactW) category = 'reaction';
      else if (rval < memW+mathW+reactW+attnW) category = 'attention';
      else                         category = 'logic';
    }

    const genMap = {
      logic:'_logicGens', memory:'_memGens', math:'_mathGens',
      reaction:'_reactGens', attention:'_attnGens',
    };
    const gens = this[genMap[category] || '_logicGens'];
    return pick(gens)(d);
  },

  generateDaily(round, totalRounds) {
    const seed     = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,'')) + round * 997;
    const srng     = seededRng(seed);
    const diffMap  = ['easy','normal','normal','hard'];
    const diffIdx  = Math.floor(round / Math.max(1, totalRounds/4));
    return this.generate(round, diffMap[clamp(diffIdx,0,3)], totalRounds, null, srng);
  },
};
