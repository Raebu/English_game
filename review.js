(() => {
  const reviews = new Map();

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function ensureLevel(level) {
    if (!reviews.has(level)) reviews.set(level, []);
    return reviews.get(level);
  }

  function recordAnswer(choice) {
    const s = window.state;
    if (!s || !s.currentQuestions?.length) return;
    const q = s.currentQuestions[s.questionIndex];
    if (!q) return;
    const rows = ensureLevel(s.level);
    if (rows.some(r => r.index === s.questionIndex)) return;
    rows.push({
      index: s.questionIndex,
      number: s.questionIndex + 1,
      instruction: q.instruction,
      question: q.prompt,
      chosen: choice,
      correctAnswer: q.answer,
      correct: choice === q.answer,
      explanation: q.explain
    });
  }

  function installScreen() {
    const main = document.querySelector('.app-shell');
    if (!main || document.getElementById('reviewScreen')) return;
    const screen = document.createElement('section');
    screen.id = 'reviewScreen';
    screen.className = 'screen review-screen';
    screen.innerHTML = `
      <div class="review-card">
        <div class="review-head">
          <div class="review-icon">📋</div>
          <div>
            <p class="eyebrow">LEVEL REVIEW</p>
            <h2 id="reviewTitle">Check your answers</h2>
            <p id="reviewSummary">See exactly what you got right and what to practise.</p>
          </div>
        </div>
        <div class="review-stats">
          <div class="review-stat correct-stat"><strong id="reviewCorrect">0</strong><span>Correct</span></div>
          <div class="review-stat wrong-stat"><strong id="reviewWrong">0</strong><span>To practise</span></div>
          <div class="review-stat"><strong id="reviewPercent">0%</strong><span>Accuracy</span></div>
        </div>
        <div class="review-key"><span>✅ Correct</span><span>❌ Needs practice</span></div>
        <div id="reviewList" class="review-list"></div>
        <button id="reviewContinue" class="primary-button review-continue" type="button">Level Summary →</button>
      </div>`;
    main.appendChild(screen);

    document.getElementById('reviewContinue').addEventListener('click', () => {
      document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'levelScreen'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function renderReview() {
    const s = window.state;
    if (!s) return;
    const rows = [...ensureLevel(s.level)].sort((a,b) => a.index - b.index);
    const correct = rows.filter(r => r.correct).length;
    const wrong = rows.length - correct;
    const percent = rows.length ? Math.round(correct / rows.length * 100) : 0;

    document.getElementById('reviewTitle').textContent = `Level ${s.level} — answer review`;
    document.getElementById('reviewSummary').textContent = `${s.player || 'Detective'}, here are all ${rows.length} questions from this level. Wrong answers include the correct answer and an explanation.`;
    document.getElementById('reviewCorrect').textContent = correct;
    document.getElementById('reviewWrong').textContent = wrong;
    document.getElementById('reviewPercent').textContent = `${percent}%`;

    const list = document.getElementById('reviewList');
    list.innerHTML = rows.map(r => `
      <article class="review-item ${r.correct ? 'review-good' : 'review-bad'}">
        <div class="review-number">${r.correct ? '✅' : '❌'} <strong>Question ${r.number}</strong></div>
        <div class="review-instruction">${escapeHtml(r.instruction)}</div>
        <div class="review-question">${escapeHtml(r.question)}</div>
        <div class="review-answer-grid">
          <div class="answer-result ${r.correct ? 'answer-right' : 'answer-wrong'}">
            <small>Your answer</small><strong>${escapeHtml(r.chosen)}</strong>
          </div>
          ${r.correct ? '' : `<div class="answer-result answer-right"><small>Correct answer</small><strong>${escapeHtml(r.correctAnswer)}</strong></div>`}
        </div>
        <div class="review-explanation"><span>💡</span><p>${escapeHtml(r.explanation)}</p></div>
      </article>`).join('');
  }

  function showReview() {
    renderReview();
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'reviewScreen'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .review-screen{padding:8px 0 28px}.review-card{background:linear-gradient(180deg,#fff,#f8f8ff);color:#20213d;border-radius:30px;padding:26px;box-shadow:0 24px 70px rgba(7,7,30,.32)}
      .review-head{display:flex;align-items:center;gap:14px}.review-head h2{font-size:clamp(27px,5vw,40px);margin:2px 0 7px;letter-spacing:-.035em}.review-head>div:last-child>p:last-child{margin:0;color:#6f7190;line-height:1.45}.review-icon{width:62px;height:62px;flex:none;border-radius:20px;display:grid;place-items:center;background:#eeeaff;font-size:31px}
      .review-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0 13px}.review-stat{padding:14px;border-radius:17px;text-align:center;background:#f1efff}.review-stat strong{display:block;font-size:26px;color:#6c5ce7}.review-stat span{font-size:11px;color:#6f7190}.review-stat.correct-stat{background:#eafff8}.review-stat.correct-stat strong{color:#087453}.review-stat.wrong-stat{background:#fff0f0}.review-stat.wrong-stat strong{color:#b53d3d}
      .review-key{display:flex;gap:16px;flex-wrap:wrap;color:#6f7190;font-size:12px;font-weight:800;margin:0 3px 12px}.review-list{display:grid;gap:12px}.review-item{border:2px solid #ecebf5;border-radius:20px;padding:16px;background:#fff}.review-item.review-good{border-color:#bdeedc}.review-item.review-bad{border-color:#ffcaca;background:#fffafa}.review-number{font-size:13px;margin-bottom:8px}.review-instruction{font-size:11px;color:#6c5ce7;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.review-question{font-weight:900;font-size:18px;line-height:1.32;margin:6px 0 12px}.review-answer-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.answer-result{padding:10px 12px;border-radius:13px}.answer-result small,.answer-result strong{display:block}.answer-result small{font-size:10px;font-weight:800;margin-bottom:3px}.answer-result strong{font-size:13px;overflow-wrap:anywhere}.answer-right{background:#eafff8;color:#087453}.answer-wrong{background:#fff0f0;color:#a43434}.review-explanation{display:flex;gap:8px;align-items:flex-start;margin-top:10px;padding:10px 12px;background:#f6f4ff;border-radius:13px}.review-explanation p{margin:0;color:#5f617e;font-size:12px;line-height:1.45}.review-continue{margin:20px auto 0}
      @media(max-width:650px){.review-card{padding:20px 14px;border-radius:25px}.review-head{align-items:flex-start}.review-icon{width:50px;height:50px;border-radius:16px;font-size:25px}.review-stats{gap:6px}.review-stat{padding:11px 5px}.review-stat strong{font-size:21px}.review-answer-grid{grid-template-columns:1fr}.review-question{font-size:16px}}
    `;
    document.head.appendChild(style);
  }

  installStyles();
  installScreen();

  // Capture each player's selected answer before the game's own click handler runs.
  document.getElementById('answers')?.addEventListener('click', e => {
    const button = e.target.closest('.answer-button');
    if (!button || button.disabled) return;
    recordAnswer(button.textContent);
  }, true);

  // A 10-question level should always contain 10 questions. Three mistakes no longer
  // end the round prematurely; the learner reaches the review after question 10.
  document.getElementById('nextButton')?.addEventListener('click', e => {
    const s = window.state;
    if (!s || s.lives > 0 || s.questionIndex >= 9) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    s.questionIndex += 1;
    if (typeof window.renderQuestion === 'function') window.renderQuestion();
  }, true);

  const nextButton = document.getElementById('nextButton');
  if (nextButton) {
    new MutationObserver(() => {
      const s = window.state;
      if (s && s.lives <= 0 && s.questionIndex < 9 && !nextButton.classList.contains('hidden')) {
        nextButton.textContent = 'Next Question →';
      }
    }).observe(nextButton, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  // finishLevel() activates the normal summary; intercept that transition and show
  // the educational review first. The review button then opens the existing summary.
  const levelScreen = document.getElementById('levelScreen');
  if (levelScreen) {
    new MutationObserver(() => {
      if (levelScreen.classList.contains('active')) setTimeout(showReview, 0);
    }).observe(levelScreen, { attributes:true, attributeFilter:['class'] });
  }

  // Starting/retrying a level clears only that level's temporary review answers.
  document.getElementById('startButton')?.addEventListener('click', () => reviews.clear(), true);
  document.getElementById('retryButton')?.addEventListener('click', () => {
    const level = window.state?.level;
    if (level) reviews.set(level, []);
  }, true);
  document.getElementById('nextLevelButton')?.addEventListener('click', () => {
    const next = (window.state?.level || 1) + 1;
    reviews.set(next, []);
  }, true);
})();
