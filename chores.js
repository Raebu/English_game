/* Household Missions + global KS2C HUD. Closed-loop rewards with adult confirmation. */
(() => {
  const WORLD_KEY='ks2-world-v1';
  const CHORE_KEY='ks2-chores-v1';
  const today=()=>new Date().toISOString().slice(0,10);
  const read=(key,fallback={})=>{try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const CHORES=[
    {id:'washing-up',icon:'🍽️',title:'Do the washing up',desc:'Wash or help wash the dishes and leave the area tidy.'},
    {id:'tidy-space',icon:'🧹',title:'Tidy your room or shared space',desc:'Put things back where they belong and leave the space better than you found it.'},
    {id:'clothes',icon:'👕',title:'Put clothes away',desc:'Fold, sort or put clean clothes in the correct place.'},
    {id:'table',icon:'🥄',title:'Help with a meal',desc:'Set or clear the table, help prepare something simple, or safely help clean up.'},
    {id:'adult-job',icon:'🤝',title:'Ask your adult for a useful job',desc:'If the other jobs are already done, ask an adult what helpful job you can do.'}
  ];
  const COINS_PER_CHORE=10;

  function choreState(){const s=read(CHORE_KEY,{date:'',done:[],history:[]});if(s.date!==today()){s.date=today();s.done=[];write(CHORE_KEY,s)}return s}
  function worldState(){return read(WORLD_KEY,{coins:0,earned:0,spent:0,owned:[]})}
  function setWorld(s){write(WORLD_KEY,s);syncCoinHud()}
  function coinBalance(){return Number(worldState().coins||0)}

  function syncCoinHud(){
    const amount=coinBalance();
    document.querySelectorAll('[data-global-coins]').forEach(el=>el.textContent=amount);
    const wc=document.getElementById('worldCoins'); if(wc)wc.textContent=amount;
    const pc=document.getElementById('parentCoins'); if(pc)pc.textContent=amount;
  }

  function installTopCoin(){
    const actions=document.querySelector('.top-actions'); if(!actions||actions.querySelector('.global-coin-chip'))return;
    const chip=document.createElement('div');chip.className='ghost global-coin-chip';chip.innerHTML='🪙 <strong data-global-coins>0</strong> <span class="label">KS2C</span>';
    actions.insertBefore(chip,actions.firstChild);syncCoinHud();
  }

  function choreMarkup(){const s=choreState();return CHORES.map(c=>{
    const done=s.done.includes(c.id);return `<article class="chore-item ${done?'done':''}"><span class="chore-icon">${c.icon}</span><div><strong>${c.title}</strong><small>${c.desc}</small></div><button type="button" data-chore="${c.id}" ${done?'disabled':''}>${done?'✓ Done':`Do it · +${COINS_PER_CHORE} 🪙`}</button></article>`
  }).join('')}

  function renderChores(){
    const host=document.getElementById('householdMissions');if(!host)return;
    const s=choreState();host.innerHTML=`<div class="section-title"><h2>🏠 Household Missions</h2><small>${s.done.length}/${CHORES.length} today</small></div><div class="chore-list">${choreMarkup()}</div><p class="chore-note">Already finished these? Ask your adult for another useful job. Household rewards require an adult to confirm the job was actually completed.</p>`;
  }

  function installChores(){
    const home=document.querySelector('[data-view="home"]'); if(!home||document.getElementById('householdMissions'))return;
    const section=document.createElement('section');section.id='householdMissions';section.className='section panel household-missions';
    const allMissions=[...home.querySelectorAll('.section')].find(x=>x.textContent.includes('All Missions'));
    if(allMissions)home.insertBefore(section,allMissions);else home.appendChild(section);
    renderChores();
  }

  function confirmChore(id){
    const chore=CHORES.find(c=>c.id===id);const s=choreState();if(!chore||s.done.includes(id))return;
    const shade=document.createElement('div');shade.className='adult-confirm-shade';
    shade.innerHTML=`<div class="adult-confirm"><div class="adult-icon">🧑‍🧑‍🧒</div><h2>Adult check</h2><p><b>${chore.title}</b></p><p>Please ask an adult to confirm that this job has been completed properly.</p><div class="adult-actions"><button type="button" data-cancel-chore>Not yet</button><button type="button" class="confirm" data-confirm-chore>Adult confirms ✓</button></div></div>`;
    document.body.appendChild(shade);
    shade.querySelector('[data-cancel-chore]').addEventListener('click',()=>shade.remove());
    shade.querySelector('[data-confirm-chore]').addEventListener('click',()=>{
      const latest=choreState(); if(latest.done.includes(id)){shade.remove();return}
      latest.done.push(id);latest.history.push({id,title:chore.title,date:today(),at:Date.now(),reward:COINS_PER_CHORE});latest.history=latest.history.slice(-120);write(CHORE_KEY,latest);
      const w=worldState();w.coins=Number(w.coins||0)+COINS_PER_CHORE;w.earned=Number(w.earned||0)+COINS_PER_CHORE;setWorld(w);
      shade.remove();renderChores();showReward(`+${COINS_PER_CHORE} KS2C · Household mission complete!`);renderParentChores();
    });
  }

  function showReward(text){let t=document.getElementById('choreRewardToast');if(!t){t=document.createElement('div');t.id='choreRewardToast';t.className='coin-toast';document.body.appendChild(t)}t.textContent=`🪙 ${text}`;t.classList.add('show');clearTimeout(showReward.t);showReward.t=setTimeout(()=>t.classList.remove('show'),2200)}

  function renderParentChores(){
    const parent=document.querySelector('[data-view="parent"]');if(!parent)return;
    let box=document.getElementById('parentChorePanel');if(!box){box=document.createElement('section');box.id='parentChorePanel';box.className='section panel';const coin=parent.querySelector('.parent-coin-panel');if(coin)coin.insertAdjacentElement('afterend',box);else parent.appendChild(box)}
    const s=choreState(), recent=(s.history||[]).slice(-5).reverse();
    box.innerHTML=`<div class="section-title"><h2>🏠 Household missions</h2><small>${s.done.length} completed today</small></div>${recent.length?`<ul class="recent-list">${recent.map(x=>`<li class="ok"><span>✅ ${x.title}</span><small>+${x.reward} KS2C</small></li>`).join('')}</ul>`:'<p>No household missions completed yet today.</p>'}`;
  }

  function styles(){const st=document.createElement('style');st.textContent=`
    .global-coin-chip{display:flex;align-items:center;gap:5px;white-space:nowrap}.global-coin-chip strong{color:#ffe36b}
    .chore-list{display:grid;gap:9px}.chore-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;background:#f4f5fb;border:2px solid #e7e8f2;border-radius:16px;padding:11px}.chore-item.done{background:#e9fff5;border-color:#bcebd7}.chore-icon{font-size:27px}.chore-item strong,.chore-item small{display:block}.chore-item small{color:#69708b;margin-top:3px;line-height:1.35}.chore-item button{border:0;border-radius:12px;padding:10px 12px;background:#6c5ce7;color:#fff;font-weight:900;cursor:pointer}.chore-item button:disabled{background:#7ac9a9;cursor:default}.chore-note{font-size:12px;color:#6f7692;line-height:1.5;margin:11px 2px 0}
    .adult-confirm-shade{position:fixed;z-index:200;inset:0;background:rgba(5,9,28,.78);display:grid;place-items:center;padding:18px}.adult-confirm{width:min(430px,100%);background:#fff;color:#20243d;border-radius:23px;padding:22px;text-align:center}.adult-icon{font-size:42px}.adult-confirm h2{margin:5px 0}.adult-confirm p{color:#606781;line-height:1.45}.adult-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:9px;margin-top:16px}.adult-actions button{border:0;border-radius:13px;padding:12px;font-weight:900;cursor:pointer}.adult-actions .confirm{background:#6c5ce7;color:#fff}
    @media(max-width:600px){.chore-item{grid-template-columns:auto 1fr}.chore-item button{grid-column:1/3;width:100%}.global-coin-chip .label{display:none}}
  `;document.head.appendChild(st)}

  document.addEventListener('click',e=>{const b=e.target.closest('[data-chore]');if(b)confirmChore(b.dataset.chore);if(e.target.closest('[data-nav="parent"]'))setTimeout(renderParentChores,30)});
  window.addEventListener('storage',syncCoinHud);
  window.addEventListener('DOMContentLoaded',()=>{styles();installTopCoin();installChores();renderParentChores();syncCoinHud()});
})();