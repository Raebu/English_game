(() => {
  const STORE='ks2genius-v1';
  const $=id=>document.getElementById(id);
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
  const toast=document.createElement('div');
  toast.className='loot-toast';
  toast.id='lootToast';
  document.body.appendChild(toast);

  function syncHud(){
    const s=read();
    const xp=Number(s.xp||0);
    const level=Math.max(1,Math.floor(xp/250)+1);
    const energy=Math.max(0,100-(Number(s.daily?.done?.length||0)*15));
    if($('worldXP')) $('worldXP').textContent=xp;
    if($('worldLevel')) $('worldLevel').textContent=level;
    if($('worldEnergy')) $('worldEnergy').textContent=`${energy}%`;
    if($('worldStreak')) $('worldStreak').textContent=s.streakDays||1;
    if($('worldName')) $('worldName').textContent=s.childName||'Learner';
  }

  function particles(x,y,count=18){
    for(let i=0;i<count;i++){
      const p=document.createElement('i');
      p.className='pixel-spark';
      p.style.left=`${x}px`;p.style.top=`${y}px`;
      const a=Math.random()*Math.PI*2,d=30+Math.random()*80;
      p.style.setProperty('--x',`${Math.cos(a)*d}px`);
      p.style.setProperty('--y',`${Math.sin(a)*d}px`);
      p.style.background=['#ffe65b','#65f5ff','#82ff91','#ff75db'][i%4];
      document.body.appendChild(p);setTimeout(()=>p.remove(),850);
    }
  }

  function showLoot(text,source){
    const r=source?.getBoundingClientRect?.();
    if(r) particles(r.left+r.width/2,r.top+r.height/2);
    toast.textContent=`🎁 ${text}`;
    toast.classList.add('show');
    clearTimeout(showLoot.t);showLoot.t=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  function wireZones(){
    document.querySelectorAll('.zone[data-subject]').forEach(zone=>zone.addEventListener('click',()=>{
      const key=zone.dataset.subject;
      const card=[...document.querySelectorAll('.subject-card')].find(c=>c.dataset.subject===key || c.textContent.toLowerCase().includes(zone.dataset.name||key));
      if(card){showLoot(`${zone.dataset.label||'Zone'} mission unlocked!`,zone);setTimeout(()=>card.click(),260);}
      else{document.querySelector('[data-nav="home"]')?.click();const fallback=[...document.querySelectorAll('.subject-card')].find(c=>c.textContent.toLowerCase().includes(key));fallback?.click();}
    }));
  }

  function enhanceSubjectCards(){
    const obs=new MutationObserver(()=>{
      document.querySelectorAll('.subject-card').forEach((card,i)=>{
        if(card.dataset.worldEnhanced)return;
        card.dataset.worldEnhanced='1';
        const txt=card.textContent.toLowerCase();
        const keys=['maths','english','science','computing','geography','history','french','art','design','music','pe','life'];
        const key=keys.find(k=>txt.includes(k)); if(key) card.dataset.subject=key;
        card.addEventListener('click',()=>showLoot(`Entering ${card.querySelector('strong')?.textContent||'mission'} zone`,card));
      });
    });
    const root=$('subjects'); if(root)obs.observe(root,{childList:true,subtree:true});
    setTimeout(()=>obs.takeRecords(),1000);
  }

  function watchRewards(){
    const xp=$('xp'); if(!xp)return;
    let last=Number(xp.textContent||0);
    new MutationObserver(()=>{
      const now=Number(xp.textContent||0);
      if(now>last) showLoot(`+${now-last} XP earned!`,xp);
      last=now; syncHud();
    }).observe(xp,{childList:true,characterData:true,subtree:true});
  }

  syncHud();wireZones();enhanceSubjectCards();watchRewards();
  window.addEventListener('storage',syncHud);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncHud()});
})();