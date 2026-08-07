const $ = (id) => document.getElementById(id);

const state = {
  level: 1,
  score: 0,
  streak: 0,
  lives: 3,
  questionIndex: 0,
  correctThisLevel: 0,
  answeredThisLevel: 0,
  currentQuestions: [],
  sound: true,
  player: "Detective",
  maxUnlocked: 1,
};

const LEVEL_SIZE = 6;
const ranks = [
  "Rookie Detective",
  "Word Scout",
  "Noun Tracker",
  "Capital Commander",
  "Meaning Master",
  "Grammar Guardian",
  "Noun Ninja",
  "Master Detective",
];

const typeQuestions = [
  ["teacher", "Common Noun", "A teacher is a general name for a person."],
  ["bicycle", "Common Noun", "A bicycle is a general name for a thing."],
  ["computer", "Common Noun", "A computer is a general name for a thing."],
  ["river", "Common Noun", "River is a general name. A named river, such as the Thames, would be proper."],
  ["school", "Common Noun", "School is a general name for a place."],
  ["pencil", "Common Noun", "A pencil is an everyday thing, so it is a common noun."],
  ["London", "Proper Noun", "London is the specific name of a city, so it begins with a capital letter."],
  ["Friday", "Proper Noun", "Friday is the name of a particular day, so it is a proper noun."],
  ["Disney", "Proper Noun", "Disney is a specific brand name, so it is a proper noun."],
  ["Paris", "Proper Noun", "Paris is the specific name of a city."],
  ["Matilda", "Proper Noun", "Matilda is a person's specific name."],
  ["Eiffel Tower", "Proper Noun", "Eiffel Tower is the special name of a landmark."],
  ["kindness", "Abstract Noun", "Kindness is a quality. You can see kind actions, but you cannot touch kindness itself."],
  ["happiness", "Abstract Noun", "Happiness is a feeling, not a physical thing."],
  ["fear", "Abstract Noun", "Fear is a feeling that cannot be touched."],
  ["friendship", "Abstract Noun", "Friendship is an idea and relationship, not a physical object."],
  ["bravery", "Abstract Noun", "Bravery is a quality someone can show."],
  ["honesty", "Abstract Noun", "Honesty is a quality, so it is abstract."],
  ["anger", "Abstract Noun", "Anger is a feeling, so it is abstract."],
  ["joy", "Abstract Noun", "Joy is a feeling you can experience but cannot touch."],
];

const sentenceQuestions = [
  {
    instruction: "Which word is the proper noun?",
    prompt: "Maya visited Scotland during the holiday.",
    choices: ["holiday", "visited", "Scotland"],
    answer: "Scotland",
    explain: "Scotland is the specific name of a country, so it is a proper noun.",
  },
  {
    instruction: "Which word is the abstract noun?",
    prompt: "Emma showed kindness to the new pupil.",
    choices: ["Emma", "kindness", "pupil"],
    answer: "kindness",
    explain: "Kindness is a quality you cannot physically touch.",
  },
  {
    instruction: "Which word is the common noun?",
    prompt: "Daniel carried his backpack through London.",
    choices: ["Daniel", "backpack", "London"],
    answer: "backpack",
    explain: "Backpack is a general name for a thing, so it is a common noun.",
  },
  {
    instruction: "Which word is the abstract noun?",
    prompt: "The class felt excitement before the trip.",
    choices: ["class", "excitement", "trip"],
    answer: "excitement",
    explain: "Excitement is a feeling, so it is an abstract noun.",
  },
  {
    instruction: "Which word is the proper noun?",
    prompt: "On Tuesday, Leo rode his bicycle to school.",
    choices: ["Tuesday", "bicycle", "school"],
    answer: "Tuesday",
    explain: "Tuesday is the special name of a day, so it is a proper noun.",
  },
  {
    instruction: "Which word is the abstract noun?",
    prompt: "Ava showed courage when she tried something new.",
    choices: ["Ava", "courage", "something"],
    answer: "courage",
    explain: "Courage is a quality you can show but cannot hold or touch.",
  },
];

const capitalQuestions = [
  ["Which version is written correctly?", "sam lives in london.", ["Sam lives in London.", "Sam lives in london.", "sam lives in London."], "Sam lives in London.", "Names of people and cities are proper nouns, so Sam and London both need capital letters."],
  ["Which version is written correctly?", "we visit disney on friday.", ["We visit Disney on Friday.", "We visit disney on Friday.", "We visit Disney on friday."], "We visit Disney on Friday.", "Disney and Friday are proper nouns, so both begin with capital letters."],
  ["Which version is written correctly?", "mia travelled to france in april.", ["Mia travelled to France in April.", "Mia travelled to france in April.", "mia travelled to France in april."], "Mia travelled to France in April.", "Mia, France and April are all proper nouns."],
  ["Which version is written correctly?", "mr jones went to winchester.", ["Mr Jones went to Winchester.", "Mr jones went to Winchester.", "mr Jones went to winchester."], "Mr Jones went to Winchester.", "Mr Jones and Winchester are proper names, so they need capitals."],
];

const matchQuestions = [
  {
    instruction: "Which pair has a common noun and a matching proper noun?",
    prompt: "Find the best match",
    choices: ["country → France", "joy → Tuesday", "London → pencil"],
    answer: "country → France",
    explain: "Country is a common noun; France is the specific name of a country, so it is proper.",
  },
  {
    instruction: "Which pair contains two abstract nouns?",
    prompt: "Find the abstract pair",
    choices: ["honesty + joy", "teacher + bicycle", "Disney + Friday"],
    answer: "honesty + joy",
    explain: "Honesty is a quality and joy is a feeling. Both are abstract nouns.",
  },
  {
    instruction: "Which pair contains two proper nouns?",
    prompt: "Find the proper pair",
    choices: ["Monday + London", "school + anger", "friend + courage"],
    answer: "Monday + London",
    explain: "Monday and London are both specific names, so both are proper nouns.",
  },
  {
    instruction: "Which pair contains two common nouns?",
    prompt: "Find the common pair",
    choices: ["teacher + bicycle", "Paris + Tuesday", "love + fear"],
    answer: "teacher + bicycle",
    explain: "Teacher and bicycle are general names for everyday things or people.",
  },
];

function typeQuestion([word, answer, explain]) {
  return {
    instruction: "What type of noun is this?",
    prompt: word,
    choices: ["Common Noun", "Proper Noun", "Abstract Noun"],
    answer,
    explain,
    icon: answer === "Common Noun" ? "🎒" : answer === "Proper Noun" ? "👑" : "💭",
  };
}

function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolForLevel(level) {
  let pool = typeQuestions.map(typeQuestion);
  if (level >= 2) pool = pool.concat(sentenceQuestions);
  if (level >= 3) pool = pool.concat(capitalQuestions.map(([instruction, context, choices, answer, explain]) => ({ instruction, prompt: context, choices, answer, explain, icon: "✏️" })));
  if (level >= 4) pool = pool.concat(matchQuestions);
  if (level >= 6) {
    pool = pool.concat(sentenceQuestions.map(q => ({ ...q, choices: shuffle(q.choices), icon: "🧠" })));
  }
  return pool;
}

function prepareLevel() {
  const pool = shuffle(poolForLevel(state.level));
  state.currentQuestions = pool.slice(0, LEVEL_SIZE).map(q => ({ ...q, choices: shuffle(q.choices) }));
  state.questionIndex = 0;
  state.correctThisLevel = 0;
  state.answeredThisLevel = 0;
  state.lives = 3;
  showScreen("gameScreen");
  renderQuestion();
  save();
}

function renderQuestion() {
  const q = state.currentQuestions[state.questionIndex];
  if (!q) return finishLevel();

  $("levelNumber").textContent = state.level;
  $("rankName").textContent = ranks[Math.min(state.level - 1, ranks.length - 1)];
  $("scoreValue").textContent = state.score;
  $("streakValue").textContent = state.streak;
  $("livesValue").textContent = state.lives;
  $("progressText").textContent = `Question ${state.questionIndex + 1} of ${LEVEL_SIZE}`;
  $("xpText").textContent = `${state.correctThisLevel} / ${LEVEL_SIZE} correct`;
  $("progressBar").style.width = `${(state.questionIndex / LEVEL_SIZE) * 100}%`;
  $("instructionText").textContent = q.instruction;
  $("questionPrompt").textContent = q.prompt;
  $("missionIcon").textContent = q.icon || "🔍";
  $("feedback").className = "feedback hidden";
  $("nextButton").classList.add("hidden");
  $("answers").innerHTML = "";

  q.choices.forEach(choice => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "answer-button";
    b.textContent = choice;
    b.addEventListener("click", () => chooseAnswer(b, choice));
    $("answers").appendChild(b);
  });
}

function chooseAnswer(button, choice) {
  const q = state.currentQuestions[state.questionIndex];
  const buttons = [...document.querySelectorAll(".answer-button")];
  if (buttons.some(b => b.disabled)) return;
  buttons.forEach(b => b.disabled = true);
  state.answeredThisLevel += 1;

  const correct = choice === q.answer;
  if (correct) {
    state.streak += 1;
    state.correctThisLevel += 1;
    const streakBonus = Math.min(state.streak - 1, 5) * 2;
    state.score += 10 + streakBonus + (state.level - 1) * 2;
    button.classList.add("correct");
    showFeedback(true, state.streak >= 3 ? `${state.streak} in a row! ${q.explain}` : q.explain);
    soundCorrect();
  } else {
    state.streak = 0;
    state.lives -= 1;
    button.classList.add("wrong");
    const correctButton = buttons.find(b => b.textContent === q.answer);
    if (correctButton) correctButton.classList.add("correct");
    showFeedback(false, `The correct answer is “${q.answer}”. ${q.explain}`);
    soundWrong();
  }

  $("scoreValue").textContent = state.score;
  $("streakValue").textContent = state.streak;
  $("livesValue").textContent = state.lives;
  $("xpText").textContent = `${state.correctThisLevel} / ${LEVEL_SIZE} correct`;
  $("progressBar").style.width = `${((state.questionIndex + 1) / LEVEL_SIZE) * 100}%`;
  $("nextButton").classList.remove("hidden");
  $("nextButton").textContent = state.lives <= 0 ? "See Results →" : (state.questionIndex === LEVEL_SIZE - 1 ? "Finish Level →" : "Next Question →");
  save();
}

function showFeedback(correct, message) {
  const box = $("feedback");
  box.classList.remove("hidden", "wrong-feedback");
  if (!correct) box.classList.add("wrong-feedback");
  $("feedbackIcon").textContent = correct ? (state.streak >= 3 ? "🔥" : "✨") : "💡";
  $("feedbackTitle").textContent = correct ? (state.streak >= 3 ? "Amazing streak!" : "Correct!") : "Not quite — here's the answer";
  $("feedbackMessage").textContent = message;
}

function nextQuestion() {
  if (state.lives <= 0) return gameOver();
  state.questionIndex += 1;
  if (state.questionIndex >= LEVEL_SIZE) return finishLevel();
  renderQuestion();
}

function finishLevel() {
  const accuracy = Math.round((state.correctThisLevel / Math.max(1, state.answeredThisLevel)) * 100);
  $("levelCorrect").textContent = `${state.correctThisLevel}/${LEVEL_SIZE}`;
  $("levelAccuracy").textContent = `${accuracy}%`;
  $("levelScore").textContent = state.score;

  const nextRank = ranks[Math.min(state.level, ranks.length - 1)];
  $("newRank").textContent = nextRank;
  $("levelEmoji").textContent = accuracy === 100 ? "🏆" : accuracy >= 70 ? "🎉" : "⭐";
  $("levelTitle").textContent = accuracy === 100 ? "Perfect detective work!" : `Level ${state.level} cleared!`;
  $("levelSummary").textContent = `${state.player}, you found ${state.correctThisLevel} of ${LEVEL_SIZE} answers. The next mission gets trickier!`;

  state.maxUnlocked = Math.max(state.maxUnlocked, state.level + 1);
  makeConfetti();
  soundLevelUp();
  showScreen("levelScreen");
  save();
}

function gameOver() {
  $("finalScore").textContent = state.score;
  $("bestLevel").textContent = Math.max(state.level, state.maxUnlocked);
  showScreen("gameOverScreen");
  save();
}

function startNewGame() {
  state.player = $("playerName").value.trim() || "Detective";
  state.level = 1;
  state.score = 0;
  state.streak = 0;
  state.maxUnlocked = Math.max(1, state.maxUnlocked);
  prepareLevel();
  soundStart();
}

function retryLevel() {
  state.streak = 0;
  prepareLevel();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function makeConfetti() {
  const box = document.querySelector(".confetti");
  box.innerHTML = "";
  const colors = ["#6c5ce7", "#ff6bcb", "#ffd166", "#2ed6a1", "#4aa8ff"];
  for (let i = 0; i < 34; i++) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-20 - Math.random() * 150}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * .55}s`;
    piece.style.animationDuration = `${1.2 + Math.random() * 1.2}s`;
    box.appendChild(piece);
  }
}

let audioCtx;
function audio() {
  if (!state.sound) return null;
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function tone(freq, duration, type = "sine", delay = 0, gain = .07) {
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + delay + .015);
  vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  osc.connect(vol).connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + .02);
}
function soundCorrect(){ tone(520,.14,"sine",0,.06); tone(660,.17,"sine",.09,.06); tone(820,.2,"sine",.18,.05); }
function soundWrong(){ tone(250,.18,"triangle",0,.055); tone(185,.25,"triangle",.12,.045); }
function soundLevelUp(){ [392,523,659,784].forEach((f,i)=>tone(f,.28,"sine",i*.1,.055)); }
function soundStart(){ tone(330,.12,"sine"); tone(494,.18,"sine",.1); }

function toggleSound() {
  state.sound = !state.sound;
  $("soundButton").textContent = state.sound ? "🔊" : "🔇";
  save();
  if (state.sound) soundStart();
}

function save() {
  localStorage.setItem("nounQuestSave", JSON.stringify({
    level: state.level,
    score: state.score,
    streak: state.streak,
    player: state.player,
    maxUnlocked: state.maxUnlocked,
    sound: state.sound,
  }));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem("nounQuestSave") || "null");
    if (!saved) return;
    state.player = saved.player || "Detective";
    state.maxUnlocked = saved.maxUnlocked || 1;
    state.sound = saved.sound !== false;
    $("playerName").value = state.player === "Detective" ? "" : state.player;
    $("soundButton").textContent = state.sound ? "🔊" : "🔇";
    if (saved.level > 1 || saved.score > 0) {
      $("continueButton").classList.remove("hidden");
      $("continueButton").textContent = `Continue from Level ${saved.level || 1}`;
      $("continueButton").onclick = () => {
        state.level = saved.level || 1;
        state.score = saved.score || 0;
        state.streak = saved.streak || 0;
        prepareLevel();
      };
    }
  } catch (_) {}
}

$("startButton").addEventListener("click", startNewGame);
$("nextButton").addEventListener("click", nextQuestion);
$("nextLevelButton").addEventListener("click", () => { state.level += 1; prepareLevel(); });
$("retryButton").addEventListener("click", retryLevel);
$("homeButton").addEventListener("click", () => showScreen("homeScreen"));
$("soundButton").addEventListener("click", toggleSound);
$("helpButton").addEventListener("click", () => $("guideDialog").showModal());
$("closeGuideButton").addEventListener("click", () => $("guideDialog").close());
$("guideDialog").addEventListener("click", e => { if (e.target === $("guideDialog")) $("guideDialog").close(); });
$("playerName").addEventListener("keydown", e => { if (e.key === "Enter") startNewGame(); });

load();
