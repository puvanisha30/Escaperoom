// ============================================================
// MAIN — UI orchestration for The Cursed Palace of Arithmia
// ============================================================

(function () {
  const $ = (sel) => document.querySelector(sel);
  const $all = (sel) => document.querySelectorAll(sel);

  const screens = {};
  $all(".screen").forEach(s => screens[s.id] = s);
  function showScreen(id) {
    $all(".screen").forEach(s => s.classList.remove("active"));
    screens[id].classList.add("active");
  }

  const audio = window.PalaceAudioEngine;
  let settings = Game.loadSettings();

  // particle fields
  const menuParticles = new ParticleField($("#menu-particles"));
  const roomParticles = new ParticleField($("#room-particles"));
  const victoryParticles = new ParticleField($("#victory-particles"));
  const globalFog = new ParticleField($("#global-fx"));
  globalFog.setMode("fog", 6);
  globalFog.start();

  function densityFor(mode) {
    const base = { dust: 50, fireflies: 35, embers: 40, fog: 10, snowRain: 60, leaves: 30 };
    const mult = settings.graphics === "low" ? 0.4 : 1;
    return Math.round((base[mode] || 30) * mult);
  }

  // ---------------- menu crown gem slots ----------------
  function renderCrownProgress(filled) {
    const el = $("#menu-crown");
    el.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const gem = document.createElement("div");
      gem.className = "gem-slot" + (i < filled ? " filled" : "");
      el.appendChild(gem);
    }
  }

  function refreshMenuState() {
    $("#btn-continue").style.opacity = Game.hasSave() ? "1" : "0.4";
    $("#btn-continue").disabled = !Game.hasSave();
    let filled = 0;
    if (Game.hasSave()) {
      try { filled = JSON.parse(localStorage.getItem("arithmia_save_v1")).relics || 0; } catch (e) {}
    }
    renderCrownProgress(filled);
  }

  // ---------------- init ----------------
  function ensureAudio() {
    if (!audio.started) {
      audio.init();
      audio.setMusicVolume(settings.music);
      audio.setSfxVolume(settings.sfx);
      audio.startAmbient();
    }
  }
  // Delegate on document so dynamically-created buttons (answer choices, etc.)
  // also trigger audio-context unlock + a soft click tick.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    ensureAudio();
    if (!btn.classList.contains("choice-btn")) audio.click();
  }, { capture: true });

  menuParticles.setMode("fireflies", 24);
  menuParticles.start();
  refreshMenuState();

  // ---------------- MENU BUTTONS ----------------
  $("#btn-start").addEventListener("click", () => showScreen("screen-difficulty"));
  $("#btn-continue").addEventListener("click", () => {
    if (!Game.hasSave()) return;
    Game.loadSave();
    startGameplayFromCurrentState();
  });
  $("#btn-leaderboard").addEventListener("click", () => { renderLeaderboard(); showScreen("screen-leaderboard"); });
  $("#btn-leaderboard-back").addEventListener("click", () => showScreen("screen-menu"));
  $("#btn-settings").addEventListener("click", () => { loadSettingsIntoUI(); showScreen("screen-settings"); });
  $("#btn-credits").addEventListener("click", () => { renderCredits(); showScreen("screen-credits"); });
  $("#btn-credits-back").addEventListener("click", () => showScreen("screen-menu"));
  $("#btn-exit").addEventListener("click", () => {
    $("#screen-menu .menu-content").innerHTML = `<h1 class="game-title">🏰 Farewell, Explorer</h1><p class="tagline">You may now close this tab. The palace will remember your progress.</p>`;
  });

  // ---------------- DIFFICULTY SCREEN ----------------
  let chosenDifficulty = "normal";
  $all(".diff-card").forEach(card => {
    card.addEventListener("click", () => {
      $all(".diff-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      chosenDifficulty = card.dataset.diff;
    });
  });
  $("#btn-diff-back").addEventListener("click", () => showScreen("screen-menu"));
  $("#btn-begin-adventure").addEventListener("click", () => {
    Game.newGame(chosenDifficulty);
    startGameplayFromCurrentState();
  });

  // ---------------- SETTINGS ----------------
  function loadSettingsIntoUI() {
    settings = Game.loadSettings();
    $("#set-music").value = settings.music;
    $("#set-sfx").value = settings.sfx;
    $("#set-difficulty").value = settings.difficulty;
    $("#set-graphics").value = settings.graphics;
  }
  $("#set-music").addEventListener("input", (e) => { settings.music = parseFloat(e.target.value); audio.setMusicVolume(settings.music); });
  $("#set-sfx").addEventListener("input", (e) => { settings.sfx = parseFloat(e.target.value); audio.setSfxVolume(settings.sfx); audio.click(); });
  $("#set-fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });
  $("#btn-settings-back").addEventListener("click", () => {
    settings.difficulty = $("#set-difficulty").value;
    settings.graphics = $("#set-graphics").value;
    Game.saveSettings(settings);
    showScreen("screen-menu");
  });

  // ---------------- LEADERBOARD ----------------
  function renderLeaderboard() {
    const board = Game.getLeaderboard();
    const body = $("#leaderboard-body");
    if (board.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="muted">No explorers have escaped yet. Be the first!</td></tr>`;
      return;
    }
    body.innerHTML = board.map((e, i) => `
      <tr><td>${i + 1}</td><td>${escapeHtml(e.name)}</td><td>${e.score}</td><td>${e.time}</td><td>${e.hints}</td></tr>
    `).join("");
  }
  function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  // ---------------- CREDITS ----------------
  function renderCredits() {
    const list = $("#credits-achievements");
    list.innerHTML = Object.values(Achievements).map(a => `
      <li><span class="ach-icon">${a.icon}</span><div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></li>
    `).join("");
  }

  // ============================================================
  // GAMEPLAY
  // ============================================================
  let globalTimerInterval = null;
  let roomTimerInterval = null;

  function startGameplayFromCurrentState() {
    ensureAudio();
    showScreen("screen-game");
    settings = Game.loadSettings();
    roomParticles.stop();
    startGlobalTimer();
    loadRoom();
  }

  function startGlobalTimer() {
    clearInterval(globalTimerInterval);
    globalTimerInterval = setInterval(() => {
      Game.state.elapsedSeconds += 1;
    }, 1000);
  }

  function loadRoom() {
    const room = Game.currentRoom();
    Game.beginRoom();

    // stage visuals
    const stage = $("#room-stage");
    stage.style.setProperty("--stage-c1", room.colors[0]);
    stage.style.setProperty("--stage-c2", room.colors[1]);
    $("#room-title").textContent = room.name;
    $("#room-title").style.color = room.colors[2];
    $("#guardian-el").textContent = room.guardian;
    $("#guardian-name").textContent = room.guardianName;

    roomParticles.setMode(room.particle, densityFor(room.particle));
    roomParticles.start();

    // reset door & chest
    const door = $("#door-el"); door.classList.remove("opening");
    const chestWrap = $("#chest-wrap"); chestWrap.classList.remove("visible");
    const chest = $("#chest-el"); chest.classList.remove("opened");
    $("#reward-popup").classList.remove("show");

    // HUD
    $("#hud-room-counter").textContent = `Room ${Game.state.roomIndex + 1} / ${Game.totalRooms()}`;
    updateScoreDisplay();
    updateHeartsDisplay();
    renderInventory();

    // puzzle
    renderPuzzle();

    // room timer
    startRoomTimer();

    audio.footstep();
  }

  function renderPuzzle() {
    const q = Game.currentQuestion;
    $("#puzzle-topic").textContent = q.topic;
    $("#puzzle-question").textContent = q.question;
    $("#hint-box").style.display = "none";
    $("#hint-box").textContent = "";
    $("#btn-hint").disabled = false;
    $("#btn-hint").classList.remove("disabled");
    const container = $("#choices-container");
    container.innerHTML = "";
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => handleAnswer(idx, btn));
      container.appendChild(btn);
    });
  }

  function startRoomTimer() {
    clearInterval(roomTimerInterval);
    updateTimerDisplay();
    roomTimerInterval = setInterval(() => {
      Game.roomTimeRemaining -= 1;
      updateTimerDisplay();
      if (Game.roomTimeRemaining <= 0) {
        clearInterval(roomTimerInterval);
        forceTimeoutAsWrong();
      }
    }, 1000);
  }
  function updateTimerDisplay() {
    const el = $("#hud-timer");
    el.textContent = `⏳ ${Game.roomTimeRemaining}`;
    el.classList.toggle("low-time", Game.roomTimeRemaining <= 10);
  }

  function forceTimeoutAsWrong() {
    $all(".choice-btn").forEach(b => b.classList.add("disabled"));
    const result = Game.answer(-1); // guaranteed wrong
    onWrongAnswer(result);
  }

  function handleAnswer(idx, btnEl) {
    clearInterval(roomTimerInterval);
    $all(".choice-btn").forEach(b => b.classList.add("disabled"));
    const q = Game.currentQuestion;
    const result = Game.answer(idx);
    if (result.correct) {
      btnEl.classList.add("correct");
      audio.correct();
      onCorrectAnswer(result);
    } else {
      btnEl.classList.add("wrong");
      const correctBtn = $all(".choice-btn")[q.correctIndex];
      if (correctBtn) correctBtn.classList.add("correct");
      audio.wrong();
      onWrongAnswer(result);
    }
    updateScoreDisplay();
  }

  function onCorrectAnswer(result) {
    setTimeout(() => {
      const door = $("#door-el");
      door.classList.add("opening");
      audio.doorCreak();
      setTimeout(() => {
        const chestWrap = $("#chest-wrap"); chestWrap.classList.add("visible");
        const chest = $("#chest-el"); chest.classList.add("opened");
        audio.chestOpen();
        const room = Game.currentRoom();
        const rewardText = room.item
          ? `+50 Score${result.fastBonus ? " · +20 Fast Bonus" : ""} · Relic Recovered · 🎁 ${room.item} Found!`
          : `+50 Score${result.fastBonus ? " · +20 Fast Bonus" : ""} · Relic Recovered!`;
        const popup = $("#reward-popup");
        popup.textContent = rewardText;
        popup.classList.add("show");
        updateScoreDisplay();
      }, 700);

      setTimeout(() => {
        const finished = Game.completeRoomAndAdvance();
        updateHeartsDisplay();
        if (finished) {
          endGameVictory();
        } else {
          loadRoom();
        }
      }, 2400);
    }, 300);
  }

  function onWrongAnswer(result) {
    audio.heartLost();
    $("#overlay-flash").classList.remove("flash");
    void $("#overlay-flash").offsetWidth; // restart animation
    $("#overlay-flash").classList.add("flash");
    updateHeartsDisplay();
    updateScoreDisplay();

    if (Game.state.hearts <= 0) {
      setTimeout(() => showRoomFail(), 500);
    } else {
      setTimeout(() => {
        // regenerate a fresh question for a retry within the same room
        Game.currentQuestion = window.PalaceQuestions.generateQuestion(Game.currentRoom().topic, Game.usedSet);
        Game.roomStartTime = Date.now();
        renderPuzzle();
        startRoomTimer();
      }, 1300);
    }
  }

  function showRoomFail() {
    clearInterval(roomTimerInterval);
    audio.gameOverJingle();
    $("#roomfail-stats").textContent = `The ${Game.currentRoom().guardianName} has bested you three times. Score: ${Game.state.score} — Catch your breath and try again.`;
    $("#overlay-roomfail").style.display = "flex";
  }
  $("#btn-roomfail-retry").addEventListener("click", () => {
    $("#overlay-roomfail").style.display = "none";
    Game.restartRoomAfterFail();
    updateHeartsDisplay();
    renderPuzzle();
    startRoomTimer();
  });

  function updateScoreDisplay() {
    const el = $("#hud-score");
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent = Game.state.score;
    el.classList.remove("bump-up", "bump-down");
    void el.offsetWidth;
    el.classList.add(Game.state.score >= prev ? "bump-up" : "bump-down");
  }
  function updateHeartsDisplay() {
    $("#hud-hearts").textContent = "❤️".repeat(Game.state.hearts) + "🖤".repeat(3 - Game.state.hearts);
  }

  // ---------------- room controls ----------------
  $("#btn-room-exit").addEventListener("click", () => {
    clearInterval(globalTimerInterval);
    clearInterval(roomTimerInterval);
    roomParticles.stop();
    refreshMenuState();
    showScreen("screen-menu");
  });

  // ---------------- inventory drawer ----------------
  function renderInventory() {
    const grid = $("#inventory-grid");
    grid.innerHTML = "";
    const total = 12; // unique named items (crown pieces tracked separately)
    const collected = Game.state.inventory;
    for (let i = 0; i < total; i++) {
      const item = collected[i];
      const slot = document.createElement("div");
      slot.className = "inv-slot" + (item ? " filled" : "");
      slot.innerHTML = item ? `${item.icon}<span class="inv-label">${item.name}</span>` : "❔";
      grid.appendChild(slot);
    }
  }
  $("#btn-inventory-toggle").addEventListener("click", () => $("#inventory-drawer").classList.toggle("open"));
  $("#btn-inventory-close").addEventListener("click", () => $("#inventory-drawer").classList.remove("open"));

  // ---------------- hint / skip ----------------
  $("#btn-hint").addEventListener("click", () => {
    const hint = Game.useHint();
    if (!hint) return;
    audio.hint();
    $("#hint-box").style.display = "block";
    $("#hint-box").textContent = `💡 ${hint}`;
    $("#btn-hint").disabled = true;
    $("#btn-hint").classList.add("disabled");
    updateScoreDisplay();
  });
  $("#btn-skip").addEventListener("click", () => {
    clearInterval(roomTimerInterval);
    Game.skipRoom();
    updateScoreDisplay();
    $all(".choice-btn").forEach(b => b.classList.add("disabled"));
    setTimeout(() => {
      const finished = Game.completeRoomAndAdvanceSkip ? Game.completeRoomAndAdvanceSkip() : advanceSkippedRoom();
      if (finished) endGameVictory(); else loadRoom();
    }, 400);
  });
  function advanceSkippedRoom() {
    // Skipping still opens the way forward but grants no relic/reward.
    Game.state.hearts = 3;
    Game.state.roomIndex += 1;
    Game.save();
    return Game.state.roomIndex >= Game.totalRooms();
  }

  // ---------------- victory ----------------
  function endGameVictory() {
    clearInterval(globalTimerInterval);
    clearInterval(roomTimerInterval);
    roomParticles.stop();
    Game.clearSave();
    audio.fanfare();
    const earned = Game.computeAchievements();
    victoryParticles.setMode("fireflies", 70);
    victoryParticles.start();

    $("#victory-stats").innerHTML = `
      <div><span class="stat-num">${Game.state.score}</span><span class="stat-label">FINAL SCORE</span></div>
      <div><span class="stat-num">${Game.formatTime(Game.state.elapsedSeconds)}</span><span class="stat-label">TIME</span></div>
      <div><span class="stat-num">${Game.state.hintsUsedTotal}</span><span class="stat-label">HINTS USED</span></div>
      <div><span class="stat-num">${Game.state.inventory.length}</span><span class="stat-label">RELICS &amp; ITEMS</span></div>
    `;
    $("#victory-achievements").innerHTML = earned.map(a => `
      <li><span class="ach-icon">${a.icon}</span><div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></li>
    `).join("");

    showScreen("screen-victory");
  }

  $("#btn-victory-save").addEventListener("click", () => {
    const name = $("#victory-name").value.trim() || "Anonymous Explorer";
    Game.addToLeaderboard({
      name, score: Game.state.score,
      time: Game.formatTime(Game.state.elapsedSeconds),
      hints: Game.state.hintsUsedTotal
    });
    $("#btn-victory-save").textContent = "Saved ✓";
    $("#btn-victory-save").disabled = true;
  });
  $("#btn-victory-menu").addEventListener("click", () => {
    victoryParticles.stop();
    refreshMenuState();
    showScreen("screen-menu");
  });

  // init game engine
  Game.init();
})();
