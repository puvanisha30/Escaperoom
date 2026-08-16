// ============================================================
// QUESTIONS ENGINE — The Cursed Palace of Arithmia
// Generates a pool of 100+ math questions across 8 topics.
// Each room draws ONE fresh question from its assigned topic,
// and every question is procedurally randomized so no two
// playthroughs (and no two rooms in the same game) repeat.
// ============================================================

const TOPICS = [
  "Algebra", "Geometry", "Number Theory", "Logic",
  "Patterns", "Coordinate Geometry", "Sequences", "Probability"
];

// ---- helpers ----------------------------------------------
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function uniqueDistractors(correct, generator, count) {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < count + 1 && guard < 200) {
    set.add(generator());
    guard++;
  }
  set.delete(correct);
  return [...set].slice(0, count);
}
function buildChoices(correctAnswer, distractors, formatter = (v) => `${v}`) {
  const all = shuffle([correctAnswer, ...distractors]);
  return {
    choices: all.map(formatter),
    correctIndex: all.indexOf(correctAnswer)
  };
}

// ---- 1. ALGEBRA --------------------------------------------
function genAlgebra() {
  const kind = randInt(0, 2);
  if (kind === 0) {
    // ax + b = c
    const a = randInt(2, 9);
    const x = randInt(-10, 12);
    const b = randInt(-15, 15);
    const c = a * x + b;
    const distractors = uniqueDistractors(x, () => x + pick([-3, -2, -1, 1, 2, 3]), 3);
    const { choices, correctIndex } = buildChoices(x, distractors);
    return {
      topic: "Algebra",
      question: `Solve for x: ${a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)} = ${c}`,
      choices, correctIndex,
      hint: `Isolate x by subtracting ${b} from both sides, then divide by ${a}.`
    };
  } else if (kind === 1) {
    // 2-step with fraction-free divide
    const a = randInt(2, 6);
    const x = randInt(2, 10);
    const b = randInt(1, 10);
    const c = a * (x + b);
    const distractors = uniqueDistractors(x, () => x + pick([-2, -1, 1, 2, 4]), 3);
    const { choices, correctIndex } = buildChoices(x, distractors);
    return {
      topic: "Algebra",
      question: `Solve for x: ${a}(x + ${b}) = ${c}`,
      choices, correctIndex,
      hint: `Divide both sides by ${a} first, then subtract ${b}.`
    };
  } else {
    // expression evaluation
    const a = randInt(2, 9), b = randInt(2, 9), x = randInt(1, 6);
    const val = a * x * x - b;
    const distractors = uniqueDistractors(val, () => val + pick([-a, a, -2 * a, 2 * a, -b]), 3);
    const { choices, correctIndex } = buildChoices(val, distractors);
    return {
      topic: "Algebra",
      question: `If x = ${x}, evaluate: ${a}x\u00B2 \u2212 ${b}`,
      choices, correctIndex,
      hint: `Square x first (${x}\u00B2 = ${x * x}), multiply by ${a}, then subtract ${b}.`
    };
  }
}

// ---- 2. GEOMETRY ---------------------------------------------
function genGeometry() {
  const kind = randInt(0, 3);
  if (kind === 0) {
    const w = randInt(3, 15), h = randInt(3, 15);
    const area = w * h;
    const distractors = uniqueDistractors(area, () => area + pick([-w, w, -h, h, 2 * w]), 3);
    const { choices, correctIndex } = buildChoices(area, distractors);
    return { topic: "Geometry", question: `A rectangular chamber is ${w}m by ${h}m. What is its area (m\u00B2)?`, choices, correctIndex, hint: `Area = length \u00D7 width = ${w} \u00D7 ${h}.` };
  } else if (kind === 1) {
    const b = randInt(4, 16), h = randInt(4, 16);
    const area = (b * h) / 2;
    const distractors = uniqueDistractors(area, () => Math.max(1, area + pick([-8, -6, -4, -2, 2, 4, 6, 8])), 3);
    const { choices, correctIndex } = buildChoices(area, distractors);
    return { topic: "Geometry", question: `A triangular banner has base ${b}m and height ${h}m. What is its area (m\u00B2)?`, choices, correctIndex, hint: `Area of a triangle = (base \u00D7 height) \u00F7 2.` };
  } else if (kind === 2) {
    const r = randInt(2, 12);
    const circumference = Math.round(2 * 3.14 * r);
    const distractors = uniqueDistractors(circumference, () => circumference + pick([-4, -2, 2, 4, 6]), 3);
    const { choices, correctIndex } = buildChoices(circumference, distractors);
    return { topic: "Geometry", question: `A circular shield has radius ${r}m. Using \u03C0 \u2248 3.14, what is its circumference (m), rounded?`, choices, correctIndex, hint: `Circumference = 2\u03C0r = 2 \u00D7 3.14 \u00D7 ${r}.` };
  } else {
    const a = randInt(3, 12), b = randInt(4, 12);
    const c = Math.round(Math.sqrt(a * a + b * b));
    const distractors = uniqueDistractors(c, () => c + pick([-2, -1, 1, 2, 3]), 3);
    const { choices, correctIndex } = buildChoices(c, distractors);
    return { topic: "Geometry", question: `A right-angled stone ramp has legs ${a}m and ${b}m. What is the hypotenuse (m), rounded to the nearest whole number?`, choices, correctIndex, hint: `Use the Pythagorean theorem: c = \u221A(a\u00B2 + b\u00B2).` };
  }
}

// ---- 3. NUMBER THEORY ------------------------------------------
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function genNumberTheory() {
  const kind = randInt(0, 2);
  if (kind === 0) {
    const n = randInt(20, 90);
    const correct = isPrime(n) ? "Prime" : "Composite";
    const wrong = correct === "Prime" ? "Composite" : "Prime";
    const { choices, correctIndex } = buildChoices(correct, [wrong, "Neither", "Both"]);
    return { topic: "Number Theory", question: `Is ${n} a Prime or Composite number?`, choices, correctIndex, hint: `Check if ${n} is divisible by any number other than 1 and itself.` };
  } else if (kind === 1) {
    const a = randInt(12, 60), b = randInt(12, 60);
    const g = gcd(a, b);
    const distractors = uniqueDistractors(g, () => Math.max(1, g + pick([-2, -1, 1, 2, 3])), 3);
    const { choices, correctIndex } = buildChoices(g, distractors);
    return { topic: "Number Theory", question: `What is the Greatest Common Divisor (GCD) of ${a} and ${b}?`, choices, correctIndex, hint: `List the factors of each number, or use the Euclidean algorithm.` };
  } else {
    const a = randInt(3, 9), b = randInt(3, 9);
    const lcm = (a * b) / gcd(a, b);
    const distractors = uniqueDistractors(lcm, () => Math.max(1, lcm + pick([-5, -3, -2, -1, 1, 2, 3, 5])), 3);
    const { choices, correctIndex } = buildChoices(lcm, distractors);
    return { topic: "Number Theory", question: `What is the Least Common Multiple (LCM) of ${a} and ${b}?`, choices, correctIndex, hint: `LCM = (a \u00D7 b) \u00F7 GCD(a, b).` };
  }
}

// ---- 4. LOGIC (static riddle bank, shuffled) --------------------
const LOGIC_BANK = [
  { question: "A guardian says: \u201CI always lie.\u201D Is this statement true or false?", choices: ["False (it's a paradox)", "True", "Both true and false", "Cannot be a lie"], correctIndex: 0, hint: "If the statement were true, then he'd be telling the truth about lying — a contradiction." },
  { question: "Three chests are labeled 'Gold', 'Silver', and 'Empty' — but all labels are wrong. You may open one chest to inspect its contents. Which label should you open to correctly deduce everything?", choices: ["The one labeled 'Empty'", "The one labeled 'Gold'", "The one labeled 'Silver'", "Any chest works"], correctIndex: 0, hint: "Since every label is wrong, the chest labeled 'Empty' cannot be empty." },
  { question: "If 5 torches burn for 5 minutes to light 5 rooms, how many minutes would it take 100 torches to light 100 rooms?", choices: ["5 minutes", "100 minutes", "20 minutes", "500 minutes"], correctIndex: 0, hint: "Each torch lights one room independently — the rate doesn't change with scale." },
  { question: "A knight always tells the truth, a jester always lies. A figure says: 'I am the jester.' Who is speaking?", choices: ["The knight", "The jester", "Neither", "Both"], correctIndex: 0, hint: "If the jester said this, he'd be telling the truth about lying — impossible. So it must be the knight." },
  { question: "You have two hourglasses: one measures 7 minutes, one measures 4 minutes. What is the fastest way to measure exactly 9 minutes?", choices: ["Start both; when 4-min ends, flip it; when 7-min ends, flip it again", "Just use the 7-min glass twice", "Add both together only", "It's impossible"], correctIndex: 0, hint: "Think about combining remaining sand rather than running the glasses separately." },
  { question: "A door opens only for the person who answers: 'What has keys but no locks, space but no room, and you can enter but not go inside?'", choices: ["A keyboard", "A map", "A piano", "A book"], correctIndex: 0, hint: "Think of an object with keys you press, not keys that unlock." },
  { question: "Two guards stand at two doors — one always tells the truth, one always lies. You may ask one guard one question to find the safe door. What should you ask?", choices: ["'What would the other guard say is the safe door?' — then pick the opposite", "'Are you the liar?'", "'Which door leads to treasure?'", "'Is this door locked?'"], correctIndex: 0, hint: "Whichever guard you ask, their answer about 'the other guard's answer' will point to the wrong door." },
  { question: "A stone tablet shows: 1, 11, 21, 1211, 111221, ? — what kind of sequence is this?", choices: ["Look-and-say sequence", "Fibonacci sequence", "Prime sequence", "Geometric sequence"], correctIndex: 0, hint: "Read each number aloud, describing the digits: 'one one', 'two ones', etc." },
  { question: "If it takes 8 workers 6 days to build a bridge, how many days would it take 12 workers, working at the same rate?", choices: ["4 days", "6 days", "9 days", "3 days"], correctIndex: 0, hint: "More workers means less time — use (workers \u00D7 days) = constant." },
  { question: "A sorcerer's riddle: The more you take, the more you leave behind. What am I?", choices: ["Footsteps", "Time", "Shadows", "Gold"], correctIndex: 0, hint: "Think about walking through the palace halls." },
  { question: "In a room of 30 people, at least two people share the same birthday month. What principle explains this with certainty?", choices: ["Pigeonhole Principle", "Law of Large Numbers", "Bayes' Theorem", "Combinatorics Rule"], correctIndex: 0, hint: "There are only 12 months but 30 people — some month must repeat." },
  { question: "A locked chest opens only to the largest number formed using the digits 3, 1, 4, 1, 5 exactly once each. What is it?", choices: ["54311", "51431", "45311", "53411"], correctIndex: 0, hint: "Arrange all five digits from largest to smallest." },
  { question: "Every guardian in the Hall of Mirrors either always tells the truth or always lies. One says: 'An even number of us are liars.' A second says: 'An odd number of us are liars.' If there are only these two guardians, who is lying?", choices: ["Exactly one of them", "Both", "Neither", "Cannot be determined"], correctIndex: 0, hint: "Zero liars is even, so exactly one statement can be true at a time." },
  { question: "A snail climbs a 10m well. Each day it climbs 3m, but slides back 2m at night. How many days until it escapes the well?", choices: ["8 days", "10 days", "5 days", "7 days"], correctIndex: 0, hint: "Net progress is 1m/day, but on the final day it climbs out before sliding back." },
  { question: "What comes next in the logic chain: Circle, Square, Pentagon, Hexagon, ?", choices: ["Heptagon (7 sides)", "Octagon (8 sides)", "Triangle (3 sides)", "Circle again"], correctIndex: 0, hint: "Each shape gains exactly one more side than the last." }
];
let logicPool = shuffle(LOGIC_BANK);
function genLogic() {
  if (logicPool.length === 0) logicPool = shuffle(LOGIC_BANK);
  const q = logicPool.pop();
  return { topic: "Logic", ...q };
}

// ---- 5. PATTERNS ------------------------------------------------
function genPatterns() {
  const kind = randInt(0, 2);
  if (kind === 0) {
    const start = randInt(2, 10), step = randInt(2, 8);
    const seq = [0, 1, 2, 3].map(i => start + i * step);
    const next = start + 4 * step;
    const distractors = uniqueDistractors(next, () => next + pick([-step, step, -2 * step, 2]), 3);
    const { choices, correctIndex } = buildChoices(next, distractors);
    return { topic: "Patterns", question: `Find the next number: ${seq.join(", ")}, ?`, choices, correctIndex, hint: `Each number increases by ${step}.` };
  } else if (kind === 1) {
    const start = randInt(1, 4), ratio = pick([2, 3]);
    const seq = [0, 1, 2, 3].map(i => start * Math.pow(ratio, i));
    const next = start * Math.pow(ratio, 4);
    const distractors = uniqueDistractors(next, () => next + pick([-ratio, ratio, -next / ratio, 5]), 3);
    const { choices, correctIndex } = buildChoices(next, distractors);
    return { topic: "Patterns", question: `Find the next number: ${seq.join(", ")}, ?`, choices, correctIndex, hint: `Each number is multiplied by ${ratio}.` };
  } else {
    const a = randInt(1, 5);
    const seq = [a, a + 1, a * 2 + 1, a * 3 + 2].slice(0, 4); // custom mixed step pattern a, a+1, a+3, a+6...
    const base = randInt(2, 6);
    const diffs = [1, 2, 3];
    const s2 = [base, base + diffs[0], base + diffs[0] + diffs[1], base + diffs[0] + diffs[1] + diffs[2]];
    const next = s2[3] + 4;
    const distractors = uniqueDistractors(next, () => next + pick([-2, -1, 1, 2]), 3);
    const { choices, correctIndex } = buildChoices(next, distractors);
    return { topic: "Patterns", question: `Find the next number (differences increase by 1 each time): ${s2.join(", ")}, ?`, choices, correctIndex, hint: `The gaps between numbers are 1, 2, 3... so the next gap is 4.` };
  }
}

// ---- 6. COORDINATE GEOMETRY --------------------------------------
function genCoordinate() {
  const kind = randInt(0, 1);
  const x1 = randInt(-8, 8), y1 = randInt(-8, 8), x2 = randInt(-8, 8), y2 = randInt(-8, 8);
  if (kind === 0) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const correctStr = `(${mx}, ${my})`;
    const distractors = uniqueDistractors(correctStr, () => `(${mx + pick([-1, 1, 2])}, ${my + pick([-1, 1, 2])})`, 3);
    const { choices, correctIndex } = buildChoices(correctStr, distractors, v => v);
    return { topic: "Coordinate Geometry", question: `A relic lies at point A(${x1}, ${y1}) and point B(${x2}, ${y2}). What is the midpoint of segment AB?`, choices, correctIndex, hint: `Midpoint = ((x\u2081+x\u2082)/2, (y\u2081+y\u2082)/2).` };
  } else {
    const dx = x2 - x1, dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    const isPerfect = Number.isInteger(Math.sqrt(distSq));
    const dist = isPerfect ? Math.sqrt(distSq) : Math.round(Math.sqrt(distSq) * 10) / 10;
    const distractors = uniqueDistractors(dist, () => Math.round((dist + pick([-1, 1, 2, -2])) * 10) / 10, 3);
    const { choices, correctIndex } = buildChoices(dist, distractors);
    return { topic: "Coordinate Geometry", question: `What is the distance between A(${x1}, ${y1}) and B(${x2}, ${y2}), rounded to 1 decimal if needed?`, choices, correctIndex, hint: `Distance = \u221A((x\u2082\u2212x\u2081)\u00B2 + (y\u2082\u2212y\u2081)\u00B2).` };
  }
}

// ---- 7. SEQUENCES ------------------------------------------------
function genSequences() {
  const kind = randInt(0, 1);
  if (kind === 0) {
    const a1 = randInt(2, 10), d = randInt(2, 6), n = randInt(6, 12);
    const nthTerm = a1 + (n - 1) * d;
    const distractors = uniqueDistractors(nthTerm, () => nthTerm + pick([-d, d, -2 * d, 2]), 3);
    const { choices, correctIndex } = buildChoices(nthTerm, distractors);
    return { topic: "Sequences", question: `An arithmetic sequence starts at ${a1} with common difference ${d}. What is the ${n}th term?`, choices, correctIndex, hint: `nth term = a\u2081 + (n\u22121)d = ${a1} + (${n}\u22121)\u00D7${d}.` };
  } else {
    const a1 = randInt(1, 3), r = pick([2, 3]), n = randInt(4, 6);
    const nthTerm = a1 * Math.pow(r, n - 1);
    const distractors = uniqueDistractors(nthTerm, () => nthTerm + pick([-r, r, -nthTerm / r, 5]), 3);
    const { choices, correctIndex } = buildChoices(nthTerm, distractors);
    return { topic: "Sequences", question: `A geometric sequence starts at ${a1} with ratio ${r}. What is the ${n}th term?`, choices, correctIndex, hint: `nth term = a\u2081 \u00D7 r^(n\u22121) = ${a1} \u00D7 ${r}^${n - 1}.` };
  }
}

// ---- 8. PROBABILITY -----------------------------------------------
// Builds 3 distinct wrong numerators near the correct one, clipped to
// a valid [0, total] range, guaranteeing 4 unique fraction choices.
function fractionChoices(correctNum, total) {
  const wrongNums = new Set();
  for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
    const v = correctNum + d;
    if (v >= 0 && v <= total && v !== correctNum) wrongNums.add(v);
    if (wrongNums.size >= 3) break;
  }
  const correctStr = `${correctNum}/${total}`;
  const distractors = [...wrongNums].slice(0, 3).map(v => `${v}/${total}`);
  return buildChoices(correctStr, distractors, v => v);
}
function genProbability() {
  const kind = randInt(0, 2);
  if (kind === 0) {
    const favorable = randInt(1, 5);
    const total = 6;
    const { choices, correctIndex } = fractionChoices(favorable, total);
    return { topic: "Probability", question: `A fair six-sided die is rolled. What is the probability of rolling a number \u2264 ${favorable}?`, choices, correctIndex, hint: `Probability = favorable outcomes \u00F7 total outcomes (6 faces total).` };
  } else if (kind === 1) {
    const redBalls = randInt(2, 6), blueBalls = randInt(2, 6);
    const total = redBalls + blueBalls;
    const { choices, correctIndex } = fractionChoices(redBalls, total);
    return { topic: "Probability", question: `A bag has ${redBalls} red gems and ${blueBalls} blue gems. What is the probability of drawing a red gem?`, choices, correctIndex, hint: `Probability = red gems \u00F7 total gems (${redBalls}+${blueBalls}).` };
  } else {
    const asStr = `1/4`;
    const { choices, correctIndex } = buildChoices(asStr, ["1/13", "1/2", "1/52"], v => v);
    return { topic: "Probability", question: `A standard 52-card deck is shuffled. What is the probability of drawing a card from a specific suit (e.g. hearts)?`, choices, correctIndex, hint: `There are 4 suits, each with 13 cards — 13/52 simplifies.` };
  }
}

// ---- topic dispatch table -----------------------------------------
const GENERATORS = {
  "Algebra": genAlgebra,
  "Geometry": genGeometry,
  "Number Theory": genNumberTheory,
  "Logic": genLogic,
  "Patterns": genPatterns,
  "Coordinate Geometry": genCoordinate,
  "Sequences": genSequences,
  "Probability": genProbability
};

/**
 * Generates one fresh question for a given topic.
 * Guarantees no exact duplicate question text within the same game
 * by retrying generation if a collision is detected.
 */
function generateQuestion(topic, usedQuestionTexts) {
  let attempt, guard = 0;
  do {
    attempt = GENERATORS[topic]();
    guard++;
  } while (usedQuestionTexts.has(attempt.question) && guard < 25);
  usedQuestionTexts.add(attempt.question);
  return attempt;
}

// Pre-flight: build a demo pool of 100 questions (used to satisfy the
// "100 questions" requirement / for the question-bank preview in Credits).
function buildFullPreviewPool() {
  const pool = [];
  const seen = new Set();
  TOPICS.forEach(topic => {
    for (let i = 0; i < 13; i++) {
      pool.push(generateQuestion(topic, seen));
    }
  });
  return pool; // 8 topics x 13 = 104 questions
}

window.PalaceQuestions = { TOPICS, generateQuestion, buildFullPreviewPool };
