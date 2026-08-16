// ============================================================
// GAME ENGINE — The Cursed Palace of Arithmia
// ============================================================

const DIFFICULTY_TIMERS = { easy: 90, normal: 60, hard: 40 };
const SAVE_KEY = "arithmia_save_v1";
const LEADERBOARD_KEY = "arithmia_leaderboard_v1";
const SETTINGS_KEY = "arithmia_settings_v1";

const Achievements = {
  MATH_GENIUS:   { key: "MATH_GENIUS",   name: "Math Genius",    icon: "🧠", desc: "Finish with a score of 1200 or higher." },
  ESCAPE_MASTER: { key: "ESCAPE_MASTER", name: "Escape Master",  icon: "🏆", desc: "Escape the Cursed Palace." },
  NO_HINT_HERO:  { key: "NO_HINT_HERO",  name: "No Hint Hero",   icon: "🚫💡", desc: "Complete the palace without using a single hint." },
  PERFECT_SOLVER:{ key: "PERFECT_SOLVER",name: "Perfect Solver", icon: "✨", desc: "Never lose a heart or skip a question." },
  SPEED_RUNNER:  { key: "SPEED_RUNNER",  name: "Speed Runner",   icon: "⚡", desc: "Escape in under 15 minutes." },
  LOGIC_KING:    { key: "LOGIC_KING",    name: "Logic King",     icon: "👑", desc: "Answer every Logic trial correctly on the first try." },
  TREASURE_HUNTER:{key: "TREASURE_HUNTER",name:"Treasure Hunter",icon: "💰", desc: "Collect all 12 unique relics." }
};

function freshState() {
  return {
    roomIndex: 0,
    score: 1000,
    hearts: 3,
    hintsUsedTotal: 0,
    heartsLostTotal: 0,
    skipsUsedTotal: 0,
    logicCorrectFirstTry: true,
    inventory: [], // list of {name, icon}
    relics: 0,
    xp: 0,
    coins: 0,
    achievements: [],
    usedQuestionTexts: [],
    elapsedSeconds: 0,
    difficulty: "normal",
    startedAt: Date.now()
  };
}

const Game = {
  state: freshState(),
  currentQuestion: null,
  roomStartTime: 0,
  roomTimerId: null,
  roomTimeRemaining: 0,
  globalTimerId: null,
  hintUsedThisRoom: false,
  usedSet: new Set(),

  init() {
    this.loadSettings();
  },

  // ---------------- persistence ----------------
  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { music: 0.5, sfx: 0.7, difficulty: "normal", graphics: "high", fullscreen: false };
  },
  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  },
  save() {
    const s = { ...this.state, usedQuestionTexts: [...this.usedSet] };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  },
  loadSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    this.state = s;
    this.usedSet = new Set(s.usedQuestionTexts || []);
    return true;
  },
  clearSave() {
    localStorage.removeItem(SAVE_KEY);
  },

  getLeaderboard() {
    try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || []; } catch (e) { return []; }
  },
  addToLeaderboard(entry) {
    const board = this.getLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)));
  },

  // ---------------- new game ----------------
  newGame(difficulty) {
    this.state = freshState();
    this.state.difficulty = difficulty || "normal";
    this.usedSet = new Set();
    this.clearSave();
  },

  currentRoom() {
    return window.PalaceRooms[this.state.roomIndex];
  },

  totalRooms() {
    return window.PalaceRooms.length;
  },

  // ---------------- room lifecycle ----------------
  beginRoom() {
    this.hintUsedThisRoom = false;
    this.currentQuestion = window.PalaceQuestions.generateQuestion(this.currentRoom().topic, this.usedSet);
    this.roomTimeRemaining = DIFFICULTY_TIMERS[this.state.difficulty] || 60;
    this.roomStartTime = Date.now();
  },

  answer(choiceIndex) {
    const correct = choiceIndex === this.currentQuestion.correctIndex;
    const elapsed = (Date.now() - this.roomStartTime) / 1000;
    if (correct) {
      this.state.score += 50;
      if (elapsed <= 10) this.state.score += 20; // fast answer bonus
      this.state.xp += 25;
      this.state.coins += 15;
      if (this.currentQuestion.topic === "Logic") {
        // first-try correctness already true unless flagged otherwise
      }
      return { correct: true, fastBonus: elapsed <= 10 };
    } else {
      this.state.score -= 20;
      this.state.hearts -= 1;
      this.state.heartsLostTotal += 1;
      if (this.currentQuestion.topic === "Logic") this.state.logicCorrectFirstTry = false;
      return { correct: false, heartsLeft: this.state.hearts };
    }
  },

  useHint() {
    if (this.hintUsedThisRoom) return null;
    this.hintUsedThisRoom = true;
    this.state.score -= 75;
    this.state.hintsUsedTotal += 1;
    return this.currentQuestion.hint;
  },

  skipRoom() {
    this.state.score -= 100;
    this.state.skipsUsedTotal += 1;
  },

  restartRoomAfterFail() {
    this.state.hearts = 3;
    this.currentQuestion = window.PalaceQuestions.generateQuestion(this.currentRoom().topic, this.usedSet);
    this.roomStartTime = Date.now();
    this.roomTimeRemaining = DIFFICULTY_TIMERS[this.state.difficulty] || 60;
  },

  completeRoomAndAdvance() {
    const room = this.currentRoom();
    this.state.relics += 1;
    if (room.item) this.state.inventory.push({ name: room.item, icon: this.itemIcon(room.item) });
    this.state.hearts = 3;
    this.state.roomIndex += 1;
    this.save();
    return this.state.roomIndex >= this.totalRooms();
  },

  itemIcon(name) {
    const map = {
      "Bronze Key": "🗝️", "Silver Key": "🔑", "Golden Key": "🔑",
      "Sword": "⚔️", "Shield": "🛡️", "Crystal": "🔮", "Magic Scroll": "📜",
      "Royal Ring": "💍", "Ancient Coin": "🪙", "Compass": "🧭",
      "Dragon Scale": "🐉", "Magic Gem": "💎", "Final Crown Piece": "👑"
    };
    return map[name] || "✨";
  },

  // ---------------- achievements ----------------
  computeAchievements() {
    const s = this.state;
    const earned = [];
    if (s.score >= 1200) earned.push(Achievements.MATH_GENIUS);
    earned.push(Achievements.ESCAPE_MASTER);
    if (s.hintsUsedTotal === 0) earned.push(Achievements.NO_HINT_HERO);
    if (s.heartsLostTotal === 0 && s.skipsUsedTotal === 0) earned.push(Achievements.PERFECT_SOLVER);
    if (s.elapsedSeconds < 900) earned.push(Achievements.SPEED_RUNNER);
    if (s.logicCorrectFirstTry) earned.push(Achievements.LOGIC_KING);
    const uniqueItems = new Set(s.inventory.map(i => i.name).filter(n => n !== "Final Crown Piece"));
    if (uniqueItems.size >= 12) earned.push(Achievements.TREASURE_HUNTER);
    s.achievements = earned.map(a => a.key);
    return earned;
  },

  formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
};

window.Game = Game;
window.Achievements = Achievements;
