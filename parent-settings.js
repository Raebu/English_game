(() => {
  const KEY='ks2genius-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
  window.addEventListener('DOMContentLoaded',()=>{
    const parent=document.querySelector('[data-view="parent"]');
    if(!parent)return;
    const panel=document.createElement('section');
    panel.className='section panel';
    panel.innerHTML=`<div class="section-title"><h2>🎯 Daily learning plan</h2><small>Parent control</small></div>
      <p style="color:#6f7692;line-height:1.45">Choose how many 10-question missions should be completed each day. Genius Academy will prioritise Maths, English and Science plus the skills with the lowest mastery.</p>
      <label style="display:grid;gap:7px;font-weight:850">Daily missions
        <select id="parentDailyLevels" style="padding:12px;border:2px solid #e5e6ef;border-radius:13px;font:inherit;background:white">
          <option value="2">2 missions • about 15–20 min</option><option value="3">3 missions • about 20–30 min</option><option value="4">4 missions • about 30–40 min</option><option value="5">5 missions • about 40–50 min</option><option value="6">6 missions • about 50–60 min</option>
        </select>
      </label>
      <button id="saveParentPlan" class="primary" style="margin-top:12px;width:100%">Save daily plan</button>
      <p id="parentPlanSaved" style="color:#16815e;font-weight:800" hidden>Saved. The next daily plan will use this workload.</p>`;
    const first=parent.querySelector('.panel');
    first?.insertAdjacentElement('afterend',panel);
    const state=read();
    const select=panel.querySelector('#parentDailyLevels');
    select.value=String(state.settings?.dailyLevels||4);
    panel.querySelector('#saveParentPlan').addEventListener('click',()=>{
      const s=read();s.settings={...(s.settings||{}),dailyLevels:Number(select.value)};
      if(s.daily)s.daily.date='';
      write(s);panel.querySelector('#parentPlanSaved').hidden=false;
      setTimeout(()=>location.reload(),650);
    });
  });
})();
