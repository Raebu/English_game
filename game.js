const $ = id => document.getElementById(id);

const state = {
  level: 1, score: 0, streak: 0, lives: 3, questionIndex: 0,
  correctThisLevel: 0, answeredThisLevel: 0, currentQuestions: [],
  sound: true, player: "Detective", maxUnlocked: 1,
};
window.state = state;

const LEVEL_SIZE = 10;
const ranks = [
  "Rookie Detective","Word Scout","Noun Tracker","Capital Commander",
  "Meaning Master","Grammar Guardian","Noun Ninja","Master Detective",
  "Language Legend","Noun Champion","Word Wizard","Grammar Grandmaster"
];

const builds = [
  ["Detective Tower","tower","🏙️"], ["Word Rocket","rocket","🚀"],
  ["Grammar Castle","castle","🏰"], ["Noun Robot","robot","🤖"],
  ["Knowledge Tree","tree","🌳"], ["Moon Base","rocket","🌙"],
  ["Sky Palace","castle","☁️"], ["Mega Tower","tower","🌆"]
];

const typeQuestions = [
  ["teacher","Common Noun","A teacher is a general name for a person."],
  ["bicycle","Common Noun","A bicycle is a general name for a thing."],
  ["computer","Common Noun","A computer is a general name for a thing."],
  ["river","Common Noun","River is a general name. A named river such as the Thames is proper."],
  ["school","Common Noun","School is a general name for a place."],
  ["pencil","Common Noun","A pencil is an everyday thing, so it is a common noun."],
  ["doctor","Common Noun","Doctor is a general name for a person."],
  ["mountain","Common Noun","Mountain is a general name for a place or feature."],
  ["book","Common Noun","Book is a general name for a thing."],
  ["friend","Common Noun","Friend is a general name for a person."],
  ["London","Proper Noun","London is the specific name of a city."],
  ["Friday","Proper Noun","Friday is the special name of a day."],
  ["Disney","Proper Noun","Disney is a specific brand name."],
  ["Paris","Proper Noun","Paris is the specific name of a city."],
  ["Matilda","Proper Noun","Matilda is a person's specific name."],
  ["Eiffel Tower","Proper Noun","Eiffel Tower is the special name of a landmark."],
  ["Scotland","Proper Noun","Scotland is the specific name of a country."],
  ["April","Proper Noun","April is the name of a particular month."],
  ["Amazon","Proper Noun","Amazon is a specific company name here."],
  ["Wednesday","Proper Noun","Wednesday is the special name of a day."],
  ["kindness","Abstract Noun","Kindness is a quality you cannot physically touch."],
  ["happiness","Abstract Noun","Happiness is a feeling, not a physical thing."],
  ["fear","Abstract Noun","Fear is a feeling that cannot be touched."],
  ["friendship","Abstract Noun","Friendship is an idea and relationship."],
  ["bravery","Abstract Noun","Bravery is a quality someone can show."],
  ["honesty","Abstract Noun","Honesty is a quality, so it is abstract."],
  ["anger","Abstract Noun","Anger is a feeling, so it is abstract."],
  ["joy","Abstract Noun","Joy is a feeling you can experience but cannot touch."],
  ["freedom","Abstract Noun","Freedom is an idea or state, not a physical object."],
  ["confidence","Abstract Noun","Confidence is a quality or feeling."],
  ["patience","Abstract Noun","Patience is a quality you can show."],
  ["excitement","Abstract Noun","Excitement is a feeling."],
];

const sentenceQuestions = [
  ["Which word is the proper noun?","Maya visited Scotland during the holiday.",["holiday","visited","Scotland"],"Scotland","Scotland is the specific name of a country."],
  ["Which word is the abstract noun?","Emma showed kindness to the new pupil.",["Emma","kindness","pupil"],"kindness","Kindness is a quality you cannot touch."],
  ["Which word is the common noun?","Daniel carried his backpack through London.",["Daniel","backpack","London"],"backpack","Backpack is a general name for a thing."],
  ["Which word is the abstract noun?","The class felt excitement before the trip.",["class","excitement","trip"],"excitement","Excitement is a feeling."],
  ["Which word is the proper noun?","On Tuesday, Leo rode his bicycle to school.",["Tuesday","bicycle","school"],"Tuesday","Tuesday is the special name of a day."],
  ["Which word is the abstract noun?","Ava showed courage when she tried something new.",["Ava","courage","something"],"courage","Courage is a quality you can show."],
  ["Which word is the common noun?","Sophie opened the window on Friday.",["Sophie","window","Friday"],"window","Window is a general name for a thing."],
  ["Which word is the proper noun?","The family travelled to Spain by plane.",["family","Spain","plane"],"Spain","Spain is the specific name of a country."],
  ["Which word is the abstract noun?","His honesty earned everyone's trust.",["honesty","everyone","earned"],"honesty","Honesty is a quality."],
  ["Which word is the common noun?","Amelia put the pencil beside her notebook.",["Amelia","pencil","her"],"pencil","Pencil is a general name for a thing."],
].map(([instruction,prompt,choices,answer,explain]) => ({instruction,prompt,choices,answer,explain,icon:"🔎"}));

const capitalQuestions = [
  ["sam lives in london.",["Sam lives in London.","Sam lives in london.","sam lives in London."],"Sam lives in London.","Sam and London are proper nouns, so both need capitals."],
  ["we visit disney on friday.",["We visit Disney on Friday.","We visit disney on Friday.","We visit Disney on friday."],"We visit Disney on Friday.","Disney and Friday are proper nouns."],
  ["mia travelled to france in april.",["Mia travelled to France in April.","Mia travelled to france in April.","mia travelled to France in april."],"Mia travelled to France in April.","Mia, France and April are proper nouns."],
  ["mr jones went to winchester.",["Mr Jones went to Winchester.","Mr jones went to Winchester.","mr Jones went to winchester."],"Mr Jones went to Winchester.","Mr Jones and Winchester are proper names."],
  ["olivia visits scotland on monday.",["Olivia visits Scotland on Monday.","Olivia visits scotland on Monday.","olivia visits Scotland on monday."],"Olivia visits Scotland on Monday.","Olivia, Scotland and Monday all need capitals."],
  ["in june, leo flies to italy.",["In June, Leo flies to Italy.","In june, Leo flies to Italy.","In June, leo flies to italy."],"In June, Leo flies to Italy.","June, Leo and Italy are proper nouns."],
].map(([prompt,choices,answer,explain]) => ({instruction:"Which version is written correctly?",prompt,choices,answer,explain,icon:"✏️"}));

const matchQuestions = [
  ["Which pair has a common noun and a matching proper noun?","Find the best match",["country → France","joy → Tuesday","London → pencil"],"country → France","Country is common; France is the specific country name."],
  ["Which pair contains two abstract nouns?","Find the abstract pair",["honesty + joy","teacher + bicycle","Disney + Friday"],"honesty + joy","Honesty and joy are both abstract nouns."],
  ["Which pair contains two proper nouns?","Find the proper pair",["Monday + London","school + anger","friend + courage"],"Monday + London","Monday and London are both specific names."],
  ["Which pair contains two common nouns?","Find the common pair",["teacher + bicycle","Paris + Tuesday","love + fear"],"teacher + bicycle","Teacher and bicycle are general names."],
  ["Which pair has a place and its proper name?","Find the place match",["city → Paris","bravery → school","Friday → teacher"],"city → Paris","City is common and Paris is a specific city."],
  ["Which pair contains two abstract nouns?","Look for feelings or qualities",["fear + confidence","book + pencil","Spain + April"],"fear + confidence","Fear and confidence cannot be physically touched."],
].map(([instruction,prompt,choices,answer,explain]) => ({instruction,prompt,choices,answer,explain,icon:"🧠"}));

function typeQuestion([word,answer,explain]) {
  return {instruction:"What type of noun is this?",prompt:word,choices:["Common Noun","Proper Noun","Abstract Noun"],answer,explain,icon:answer==="Common Noun"?"🎒":answer==="Proper Noun"?"👑":"💭"};
}
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function poolForLevel(level){
  let pool=typeQuestions.map(typeQuestion);
  if(level>=2) pool=pool.concat(sentenceQuestions);
  if(level>=3) pool=pool.concat(capitalQuestions);
  if(level>=4) pool=pool.concat(matchQuestions);
  if(level>=5) pool=pool.concat(sentenceQuestions.map(q=>({...q,icon:"⚡"})));
  return pool;
}

function currentBuild(){return builds[(state.level-1)%builds.length];}
function renderBuild(){
  const grid=$("buildGrid"); if(!grid) return;
  const [name,theme,emoji]=currentBuild();
  $("buildTitle").textContent=`${emoji} ${name}`;
  grid.className=`build-grid ${theme}`;
  grid.innerHTML="";
  for(let i=0;i<LEVEL_SIZE;i++){
    const p=document.createElement("div"); p.className="build-piece"+(i<state.correctThisLevel?" built":""); grid.appendChild(p);
  }
  if(state.correctThisLevel===LEVEL_SIZE) grid.classList.add("complete");
  $("buildMessage").textContent = state.correctThisLevel===0 ? "Get an answer right to add the first piece!" : state.correctThisLevel===LEVEL_SIZE ? "Amazing — you completed the whole build!" : `${state.correctThisLevel} of ${LEVEL_SIZE} pieces built`;
}
function addBuildPiece(){
  renderBuild();
  const pieces=[...document.querySelectorAll(".build-piece.built")];
  const newest=pieces[pieces.length-1]; if(newest){newest.animate([{transform:"translateY(-18px) scale(.8)",opacity:.2},{transform:"none",opacity:1}],{duration:420,easing:"cubic-bezier(.2,1.4,.4,1)"});}
}

function prepareLevel(){
  const pool=shuffle(poolForLevel(state.level));
  state.currentQuestions=pool.slice(0,LEVEL_SIZE).map(q=>({...q,choices:shuffle(q.choices)}));
  state.questionIndex=0; state.correctThisLevel=0; state.answeredThisLevel=0; state.lives=3;
  showScreen("gameScreen"); renderBuild(); renderQuestion(); save();
}
function renderQuestion(){
  const q=state.currentQuestions[state.questionIndex]; if(!q) return finishLevel();
  $("levelNumber").textContent=state.level;
  $("rankName").textContent=ranks[Math.min(state.level-1,ranks.length-1)];
  $("scoreValue").textContent=state.score; $("streakValue").textContent=state.streak; $("livesValue").textContent=state.lives;
  $("progressText").textContent=`Question ${state.questionIndex+1} of ${LEVEL_SIZE}`;
  $("xpText").textContent=`${state.correctThisLevel} / ${LEVEL_SIZE} correct`;
  $("progressBar").style.width=`${(state.questionIndex/LEVEL_SIZE)*100}%`;
  $("instructionText").textContent=q.instruction; $("questionPrompt").textContent=q.prompt; $("missionIcon").textContent=q.icon||"🔍";
  $("feedback").className="feedback hidden"; $("nextButton").classList.add("hidden"); $("answers").innerHTML="";
  q.choices.forEach(choice=>{const b=document.createElement("button");b.type="button";b.className="answer-button";b.textContent=choice;b.addEventListener("click",()=>chooseAnswer(b,choice));$("answers").appendChild(b);});
}
function chooseAnswer(button,choice){
  const q=state.currentQuestions[state.questionIndex]; const buttons=[...document.querySelectorAll(".answer-button")];
  if(buttons.some(b=>b.disabled)) return; buttons.forEach(b=>b.disabled=true); state.answeredThisLevel++;
  const correct=choice===q.answer;
  if(correct){state.streak++;state.correctThisLevel++;const bonus=Math.min(state.streak-1,5)*2;state.score+=10+bonus+(state.level-1)*2;button.classList.add("correct");showFeedback(true,state.streak>=3?`${state.streak} in a row! ${q.explain}`:q.explain);addBuildPiece();soundCorrect();}
  else{state.streak=0;state.lives--;button.classList.add("wrong");const cb=buttons.find(b=>b.textContent===q.answer);if(cb)cb.classList.add("correct");showFeedback(false,`The correct answer is “${q.answer}”. ${q.explain}`);soundWrong();}
  $("scoreValue").textContent=state.score;$("streakValue").textContent=state.streak;$("livesValue").textContent=state.lives;
  $("xpText").textContent=`${state.correctThisLevel} / ${LEVEL_SIZE} correct`;$("progressBar").style.width=`${((state.questionIndex+1)/LEVEL_SIZE)*100}%`;
  $("nextButton").classList.remove("hidden");$("nextButton").textContent=state.lives<=0?"See Results →":state.questionIndex===LEVEL_SIZE-1?"Finish Level →":"Next Question →";save();
}
function showFeedback(correct,message){const box=$("feedback");box.classList.remove("hidden","wrong-feedback");if(!correct)box.classList.add("wrong-feedback");$("feedbackIcon").textContent=correct?(state.streak>=3?"🔥":"✨"):"💡";$("feedbackTitle").textContent=correct?(state.streak>=3?"Amazing streak!":"Correct — build piece added!"):"Not quite — here's the answer";$("feedbackMessage").textContent=message;}
function nextQuestion(){if(state.lives<=0)return gameOver();state.questionIndex++;if(state.questionIndex>=LEVEL_SIZE)return finishLevel();renderQuestion();}
function finishLevel(){
  const accuracy=Math.round((state.correctThisLevel/Math.max(1,state.answeredThisLevel))*100);
  $("levelCorrect").textContent=`${state.correctThisLevel}/${LEVEL_SIZE}`;$("levelAccuracy").textContent=`${accuracy}%`;$("levelScore").textContent=state.score;
  const nextRank=ranks[Math.min(state.level,ranks.length-1)];$("newRank").textContent=nextRank;
  $("levelEmoji").textContent=accuracy===100?"🏆":accuracy>=70?"🎉":"⭐";
  $("levelTitle").textContent=accuracy===100?"Perfect build completed!":`Level ${state.level} cleared!`;
  $("levelSummary").textContent=`${state.player}, you answered ${state.correctThisLevel} of ${LEVEL_SIZE} correctly and built ${state.correctThisLevel} pieces. Level ${state.level+1} is ready!`;
  state.maxUnlocked=Math.max(state.maxUnlocked,state.level+1);makeConfetti();soundLevelUp();showScreen("levelScreen");save();
}
function gameOver(){$("finalScore").textContent=state.score;$("bestLevel").textContent=Math.max(state.level,state.maxUnlocked);showScreen("gameOverScreen");save();}
function startNewGame(){state.player=$("playerName").value.trim()||"Detective";state.level=1;state.score=0;state.streak=0;state.maxUnlocked=Math.max(1,state.maxUnlocked);prepareLevel();soundStart();}
function retryLevel(){state.streak=0;prepareLevel();}
function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id===id));window.scrollTo({top:0,behavior:"smooth"});}
function makeConfetti(){const box=document.querySelector(".confetti");box.innerHTML="";const colors=["#6c5ce7","#ff6bcb","#ffd166","#2ed6a1","#4aa8ff"];for(let i=0;i<34;i++){const p=document.createElement("i");p.style.left=`${Math.random()*100}%`;p.style.top=`${-20-Math.random()*150}px`;p.style.background=colors[i%colors.length];p.style.animationDelay=`${Math.random()*.55}s`;p.style.animationDuration=`${1.2+Math.random()*1.2}s`;box.appendChild(p);}}

let audioCtx;
function audio(){if(!state.sound)return null;audioCtx||=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function tone(freq,duration,type="sine",delay=0,gain=.07){const ctx=audio();if(!ctx)return;const osc=ctx.createOscillator(),vol=ctx.createGain();osc.type=type;osc.frequency.value=freq;vol.gain.setValueAtTime(.0001,ctx.currentTime+delay);vol.gain.exponentialRampToValueAtTime(gain,ctx.currentTime+delay+.015);vol.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+duration);osc.connect(vol).connect(ctx.destination);osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+duration+.02);}
function soundCorrect(){tone(520,.14,"sine",0,.06);tone(660,.17,"sine",.09,.06);tone(820,.2,"sine",.18,.05);}function soundWrong(){tone(250,.18,"triangle",0,.055);tone(185,.25,"triangle",.12,.045);}function soundLevelUp(){[392,523,659,784].forEach((f,i)=>tone(f,.28,"sine",i*.1,.055));}function soundStart(){tone(330,.12,"sine");tone(494,.18,"sine",.1);}
function toggleSound(){state.sound=!state.sound;$("soundButton").textContent=state.sound?"🔊":"🔇";save();if(state.sound)soundStart();}
function save(){localStorage.setItem("nounQuestSave",JSON.stringify({level:state.level,score:state.score,streak:state.streak,player:state.player,maxUnlocked:state.maxUnlocked,sound:state.sound}));}
function load(){try{const saved=JSON.parse(localStorage.getItem("nounQuestSave")||"null");if(!saved)return;state.player=saved.player||"Detective";state.maxUnlocked=saved.maxUnlocked||1;state.sound=saved.sound!==false;$("playerName").value=state.player==="Detective"?"":state.player;$("soundButton").textContent=state.sound?"🔊":"🔇";if(saved.level>1||saved.score>0){$("continueButton").classList.remove("hidden");$("continueButton").textContent=`Continue from Level ${saved.level||1}`;$("continueButton").onclick=()=>{state.level=saved.level||1;state.score=saved.score||0;state.streak=saved.streak||0;prepareLevel();};}}catch(_){}}

$("startButton").addEventListener("click",startNewGame);$("nextButton").addEventListener("click",nextQuestion);$("nextLevelButton").addEventListener("click",()=>{state.level++;prepareLevel();});$("retryButton").addEventListener("click",retryLevel);$("homeButton").addEventListener("click",()=>showScreen("homeScreen"));$("soundButton").addEventListener("click",toggleSound);$("helpButton").addEventListener("click",()=>$("guideDialog").showModal());$("closeGuideButton").addEventListener("click",()=>$("guideDialog").close());$("guideDialog").addEventListener("click",e=>{if(e.target===$("guideDialog"))$("guideDialog").close();});$("playerName").addEventListener("keydown",e=>{if(e.key==="Enter")startNewGame();});
load();
