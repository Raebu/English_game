(() => {
  // Load the engagement/progression layer everywhere without coupling it to the quiz engine.
  if(!document.querySelector('link[data-ga-engagement]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='/engagement.css';
    link.dataset.gaEngagement='1';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-ga-engagement]')){
    const script=document.createElement('script');
    script.src='/engagement.js';
    script.defer=true;
    script.dataset.gaEngagement='1';
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-ga-engagement-extra]')){
    const script=document.createElement('script');
    script.src='/engagement-extra.js';
    script.defer=true;
    script.dataset.gaEngagementExtra='1';
    document.head.appendChild(script);
  }

  function syncWorldMode(){
    const world=document.querySelector('[data-view="world"]');
    document.body.classList.toggle('world-active',!!world&&!world.hidden);
  }
  function showWorld(){
    document.querySelectorAll('[data-view]').forEach(v=>{v.hidden=v.dataset.view!=='world'});
    syncWorldMode();
    window.scrollTo({top:0,behavior:'smooth'});
    window.dispatchEvent(new Event('resize'));
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-nav="world"]')){e.preventDefault();showWorld();return;}
    if(e.target.closest('[data-nav]'))setTimeout(syncWorldMode,0);
    if(e.target.closest('#finishReview'))setTimeout(showWorld,60);
  },true);
  const observer=new MutationObserver(syncWorldMode);
  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-view]').forEach(v=>observer.observe(v,{attributes:true,attributeFilter:['hidden']}));
    syncWorldMode();
  });
})();
