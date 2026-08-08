(() => {
  function showWorld(){
    document.querySelectorAll('[data-view]').forEach(v=>{v.hidden=v.dataset.view!=='world'});
    document.body.classList.add('world-active');
    window.scrollTo({top:0,behavior:'smooth'});
    window.dispatchEvent(new Event('resize'));
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-nav="world"]')){e.preventDefault();showWorld();return;}
    if(e.target.closest('#finishReview'))setTimeout(showWorld,60);
  },true);
  window.addEventListener('DOMContentLoaded',()=>{
    const world=document.querySelector('[data-view="world"]');
    if(world&&!world.hidden)document.body.classList.add('world-active');
  });
})();
