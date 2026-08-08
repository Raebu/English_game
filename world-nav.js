(() => {
  function setWorldMode(active){
    document.body.classList.toggle('world-active', active);
    if(!active){
      document.documentElement.style.overflow='';
      document.body.style.overflow='';
    }
  }

  function showWorld(){
    document.querySelectorAll('[data-view]').forEach(v=>{v.hidden=v.dataset.view!=='world'});
    setWorldMode(true);
    window.scrollTo({top:0,behavior:'smooth'});
    window.dispatchEvent(new Event('resize'));
  }

  function leaveWorld(){
    setWorldMode(false);
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]');
    if(nav){
      const destination=nav.dataset.nav;
      if(destination==='world'){
        e.preventDefault();
        showWorld();
        return;
      }
      leaveWorld();
    }

    if(e.target.closest('#finishReview'))setTimeout(showWorld,60);
  },true);

  // Keep the scroll lock exactly in sync even when another script changes views.
  const syncWorldMode=()=>{
    const world=document.querySelector('[data-view="world"]');
    setWorldMode(Boolean(world && !world.hidden));
  };

  window.addEventListener('DOMContentLoaded',()=>{
    syncWorldMode();
    const app=document.querySelector('.app');
    if(app){
      new MutationObserver(syncWorldMode).observe(app,{subtree:true,attributes:true,attributeFilter:['hidden']});
    }
  });
})();
