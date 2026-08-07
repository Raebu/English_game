(() => {
  const SCORE_KEY = "nounQuestHighScores";
  const PROFILE_KEY = "nounQuestLastPlayer";

  const getScores = () => {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || "[]"); }
    catch (_) { return []; }
  };

  const saveScores = (scores) => localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 50)));

  function cleanName(value) {
    const name = (value || "").trim().replace(/\s+/g, " ").slice(0, 18);
    return name || "Detective";
  }

  function bestFor(name) {
    const rows = getScores().filter(x => x.name.toLowerCase() === name.toLowerCase());
    return {
      score: rows.reduce((m, x) => Math.max(m, x.score || 0), 0),
      level: rows.reduce((m, x) => Math.max(m, x.level || 1), 1),
    };
  }

  function recordCurrentRun() {
    const name = cleanName(window.state?.player || document.getElementById("playerName")?.value);
    const score = Number(window.state?.score || document.getElementById("finalScore")?.textContent || 0);
    const level = Number(window.state?.level || document.getElementById("bestLevel")?.textContent || 1);
    if (!score && level <= 1) return;

    const marker = `${name}|${score}|${level}`;
    if (sessionStorage.getItem("nounQuestLastRecorded") === marker) return;
    sessionStorage.setItem("nounQuestLastRecorded", marker);

    const scores = getScores();
    scores.push({ name, score, level, date: new Date().toISOString() });
    scores.sort((a, b) => (b.score - a.score) || (b.level - a.level));
    saveScores(scores);
    renderLeaderboards();
  }

  function leaderboardMarkup(limit = 5) {
    const scores = getScores().slice(0, limit);
    if (!scores.length) return `<p class="leaderboard-empty">Complete a game to set the first high score!</p>`;
    return `<ol class="leaderboard-list">${scores.map((r, i) => `
      <li>
        <span class="leader-rank">${["🥇","🥈","🥉"][i] || `${i + 1}.`}</span>
        <strong>${escapeHtml(r.name)}</strong>
        <span>${r.score} pts</span>
        <small>Level ${r.level}</small>
      </li>`).join("")}</ol>`;
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function renderLeaderboards() {
    document.querySelectorAll("[data-highscores]").forEach(el => { el.innerHTML = leaderboardMarkup(5); });
    const input = document.getElementById("playerName");
    const name = cleanName(input?.value || localStorage.getItem(PROFILE_KEY));
    const best = bestFor(name);
    document.querySelectorAll("[data-player-best]").forEach(el => {
      el.textContent = `${name}: best ${best.score} points • level ${best.level}`;
    });
  }

  function installProfileUI() {
    const input = document.getElementById("playerName");
    if (!input) return;

    const savedName = localStorage.getItem(PROFILE_KEY);
    if (savedName && !input.value) input.value = savedName;

    input.placeholder = "Enter player name";
    input.setAttribute("autocapitalize", "words");

    const note = document.createElement("div");
    note.className = "player-best-line";
    note.setAttribute("data-player-best", "");
    input.insertAdjacentElement("afterend", note);

    input.addEventListener("input", () => {
      const name = cleanName(input.value);
      localStorage.setItem(PROFILE_KEY, name);
      renderLeaderboards();
    });

    const start = document.getElementById("startButton");
    start?.addEventListener("click", () => {
      const name = cleanName(input.value);
      input.value = name === "Detective" ? "" : name;
      localStorage.setItem(PROFILE_KEY, name);
      sessionStorage.removeItem("nounQuestLastRecorded");
    }, true);

    const board = document.createElement("section");
    board.className = "leaderboard-card";
    board.innerHTML = `<div class="leaderboard-heading"><span>🏆</span><div><small>DETECTIVE ACADEMY</small><h2>High Scores</h2></div></div><div data-highscores></div>`;
    document.getElementById("homeScreen")?.appendChild(board);

    const gameOverCard = document.querySelector("#gameOverScreen .celebration-card");
    if (gameOverCard) {
      const endBoard = document.createElement("div");
      endBoard.className = "end-leaderboard";
      endBoard.innerHTML = `<h3>🏆 Top Detectives</h3><div data-highscores></div>`;
      const firstButton = gameOverCard.querySelector("button");
      gameOverCard.insertBefore(endBoard, firstButton || null);
    }

    const levelCard = document.querySelector("#levelScreen .celebration-card");
    if (levelCard) {
      const bestLine = document.createElement("p");
      bestLine.className = "level-player-best";
      bestLine.setAttribute("data-player-best", "");
      levelCard.querySelector(".results-grid")?.insertAdjacentElement("afterend", bestLine);
    }

    renderLeaderboards();
  }

  function installStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .player-best-line{max-width:420px;margin:7px auto 0;text-align:left;color:#777995;font-size:11px;font-weight:700}
      .leaderboard-card{margin-top:14px;padding:22px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);border-radius:24px;backdrop-filter:blur(14px)}
      .leaderboard-heading{display:flex;align-items:center;gap:12px;margin-bottom:12px}.leaderboard-heading>span{font-size:34px}.leaderboard-heading small{display:block;color:#c9c6f1;font-size:9px;font-weight:900;letter-spacing:.16em}.leaderboard-heading h2{margin:2px 0 0;font-size:20px}
      .leaderboard-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.leaderboard-list li{display:grid;grid-template-columns:40px 1fr auto auto;gap:9px;align-items:center;background:rgba(255,255,255,.1);border-radius:14px;padding:10px 12px}.leaderboard-list strong{overflow:hidden;text-overflow:ellipsis}.leaderboard-list span:not(.leader-rank){font-weight:900}.leaderboard-list small{color:#c9c6f1}.leader-rank{font-size:20px;text-align:center}.leaderboard-empty{margin:5px 0;color:#c9c6f1;font-size:13px}
      .end-leaderboard{margin:18px 0;text-align:left;background:#f3f1ff;border-radius:18px;padding:15px;color:#20213d}.end-leaderboard h3{margin:0 0 10px}.end-leaderboard .leaderboard-list li{background:#fff}.end-leaderboard .leaderboard-list small{color:#6f7190}.level-player-best{margin:-13px 0 18px!important;font-size:12px!important;font-weight:800;color:#6c5ce7!important}
      @media(max-width:650px){.leaderboard-list li{grid-template-columns:34px 1fr auto}.leaderboard-list small{grid-column:2/4}.leaderboard-card{padding:17px}}
    `;
    document.head.appendChild(style);
  }

  installStyles();
  installProfileUI();

  const gameOver = document.getElementById("gameOverScreen");
  if (gameOver) {
    new MutationObserver(() => {
      if (gameOver.classList.contains("active")) {
        setTimeout(() => { recordCurrentRun(); renderLeaderboards(); }, 20);
      }
    }).observe(gameOver, { attributes: true, attributeFilter: ["class"] });
  }

  const levelScreen = document.getElementById("levelScreen");
  if (levelScreen) {
    new MutationObserver(() => {
      if (levelScreen.classList.contains("active")) renderLeaderboards();
    }).observe(levelScreen, { attributes: true, attributeFilter: ["class"] });
  }
})();