(()=>{
const THEMES={
 english:{building:'Story Keep',icon:'📚',games:[['collect','Page Hunt'],['doors','Story Doors'],['tiles','Word Shelves']],accent:'story'},
 maths:{building:'Math Manor',icon:'➗',games:[['collect','Number Catch'],['doors','Equation Doors'],['tiles','Treasure Tiles']],accent:'maths'},
 science:{building:'Science Lab',icon:'🔬',games:[['collect','Specimen Scan'],['doors','Lab Chambers'],['tiles','Experiment Bench']],accent:'science'},
 computing:{building:'Code Core',icon:'💻',games:[['collect','Bug Hunt'],['doors','Logic Gates'],['tiles','Code Blocks']],accent:'computing'},
 geography:{building:'Explorer Lodge',icon:'🌍',games:[['collect','Map Pin Hunt'],['doors','Compass Gates'],['tiles','Explorer Packs']],accent:'geography'},
 history:{building:'Time Temple',icon:'🏺',games:[['collect','Relic Hunt'],['doors','Temple Doors'],['tiles','Timeline Tiles']],accent:'history'},
 french:{building:'French Café',icon:'🇫🇷',games:[['collect','Café Orders'],['doors','Menu Doors'],['tiles','Phrase Plates']],accent:'french'},
 art:{building:'Creator Studio',icon:'🎨',games:[['collect','Palette Pop'],['doors','Gallery Doors'],['tiles','Canvas Tiles']],accent:'art'},
 design:{building:'Maker Works',icon:'🛠️',games:[['collect','Tool Hunt'],['doors','Workshop Doors'],['tiles','Blueprint Build']],accent:'design'},
 music:{building:'Sound Stage',icon:'🎵',games:[['collect','Note Catch'],['doors','Sound Booths'],['tiles','Rhythm Pads']],accent:'music'},
 pe:{building:'Power Arena',icon:'🏃',games:[['collect','Target Run'],['doors','Team Gates'],['tiles','Power Pads']],accent:'pe'},
 life:{building:'Think Tower',icon:'💡',games:[['collect','Idea Catch'],['doors','Choice Doors'],['tiles','Kindness Steps']],accent:'life'}
};
let combo=0,tries=0;
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s).trim().toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ');
const shuffle3=q=>shuffle([...new Set([q.answer,...(q.choices||[])])]).filter(Boolean).slice(0,3);
function theme(){return THEMES[app.level.subject]||THEMES.english}
function hud(){const t=theme();return `<div class="mission-arcade-hud"><span>${t.icon} ${esc(t.building)}</span><span>🔥 <b id="maCombo">${combo}</b>x</span><span>⭐ ${app.level.correct}/${app.level.index}</span><span class="ma-no-rush">No rush</span></div>`}
function startArcadeLevel(subject,{daily=false}={}){combo=0;tries=0;app.level={subject,daily,number:1,index:0,total:8,correct:0,review:[],build:0};show('play');renderPlayHeader();nextArcadeChallenge();}
function nextArcadeChallenge(){if(app.level.index>=app.level.total)return finishLevel();app.answerLocked=false;tries=0;app.current=chooseAdaptiveQuestion(app.level.subject);const q=app.current,t=theme(),g=t.games[app.level.index%t.games.length];qs('#skillLabel').textContent=`${t.building} · ${g[1]}`;qs('#question').innerHTML=`${hud()}<div class="mission-prompt">${esc(q.prompt).replace(/\n/g,'<br>')}</div><div class="ma-help">Choose from just 3 answers. You can try again if you miss.</div>`;qs('#feedback').hidden=true;qs('#nextQuestion').hidden=true;renderGame(g[0],q,t,g[1]);renderPlayHeader();}
function button(txt,cls=''){const b=document.createElement('button');b.className=cls;b.dataset.value=txt;b.innerHTML=`<span>${esc(txt)}</span>`;b.onclick=()=>resolveArcade(txt,b);return b}
function renderGame(type,q,t,label){const host=qs('#answers');host.className=`answers mission-arcade-stage theme-${t.accent} game-${type}`;host.innerHTML=`<div class="ma-scene-title">${t.icon} ${esc(label)}</div>`;const opts=shuffle3(q);if(type==='collect')return renderCollect(host,opts,t);if(type==='doors')return renderDoors(host,opts,t);return renderTiles(host,opts,t);}
function renderCollect(host,opts,t){const icons={story:'📄',maths:'🔢',science:'🧪',computing:'🐞',geography:'📍',history:'🏺',french:'🥐',art:'🎨',design:'🔧',music:'🎵',pe:'🏅',life:'💡'};const tray=document.createElement('div');tray.className='ma-collect-grid';opts.forEach(o=>{const b=button(o,'ma-themed-card');b.innerHTML=`<b>${icons[t.accent]||'⭐'}</b><span>${esc(o)}</span>`;tray.append(b)});host.append(tray)}
function renderDoors(host,opts,t){const row=document.createElement('div');row.className='ma-door-row';opts.forEach((o,i)=>{const b=button(o,'ma-themed-door');b.innerHTML=`<b>${['🚪','✨','🏛️'][i]}</b><span>${esc(o)}</span>`;row.append(b)});host.append(row);const player=document.createElement('div');player.className='ma-theme-player';player.textContent='🧒';host.append(player)}
function renderTiles(host,opts,t){const row=document.createElement('div');row.className='ma-tile-grid';opts.forEach((o,i)=>{const b=button(o,'ma-themed-tile');b.innerHTML=`<b>${i+1}</b><span>${esc(o)}</span>`;row.append(b)});host.append(row)}
function resolveArcade(choice,buttonEl){if(app.answerLocked)return;const q=app.current,correct=norm(choice)===norm(q.answer);tries++;
 if(!correct&&tries<2){buttonEl?.classList.add('ma-wrong');buttonEl&&(buttonEl.disabled=true);const fb=qs('#feedback');fb.hidden=false;fb.className='feedback bad';fb.innerHTML='<strong>Nearly!</strong><p>Try one more answer — there is no time limit.</p>';return;}
 app.answerLocked=true;recordAttempt(q,choice,correct);app.level.review.push({...q,chosen:choice,correct});if(correct){combo++;app.level.correct++;app.level.build++;app.state.xp+=(combo>=3?1:0);saveState();renderBuild()}else combo=0;const fb=qs('#feedback');fb.hidden=false;fb.className='feedback '+(correct?'good':'bad');fb.innerHTML=correct?`<strong>⭐ Great job!</strong><p>${esc(q.explain)}</p>`:`<strong>Good try.</strong><p>The answer is <b>${esc(q.answer)}</b>. ${esc(q.explain)}</p>`;qs('#playBar').style.width=`${(app.level.index+1)/app.level.total*100}%`;setTimeout(()=>{app.level.index++;nextArcadeChallenge()},correct?850:1500);}
function patchLabels(){const p=qs('#playProgressText');if(p&&app.level)p.textContent=`Game ${app.level.index+1} of ${app.level.total}`}
const originalRenderPlayHeader=window.renderPlayHeader;if(typeof originalRenderPlayHeader==='function')window.renderPlayHeader=function(){originalRenderPlayHeader();patchLabels()};window.startLevel=startArcadeLevel;window.GeniusMissionArcade={start:startArcadeLevel};
})();