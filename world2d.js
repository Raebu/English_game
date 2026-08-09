(()=>{
const WORLD_KEY='ks2-world-v1';
const ACADEMY_KEY='ks2genius-v1';
const IMG_SRC='/assets/genius-academy-reference-map.png';
const IMG_W=1149,IMG_H=1369;
const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const defaultWorld=()=>({coins:0,earned:0,spent:0,owned:[],playerMap:{x:563,y:742}});
let world=read(WORLD_KEY,defaultWorld());
const BUILD_ITEMS=[
{id:'desk',name:'Genius Desk',icon:'📚',cost:40,desc:'A study desk for your academy base.'},{id:'garden',name:'Knowledge Garden',icon:'🌳',cost:70,desc:'A colourful knowledge garden.'},{id:'robot',name:'Helper Robot',icon:'🤖',cost:110,desc:'A friendly learning companion.'},{id:'lab',name:'Mini Science Lab',icon:'🔬',cost:150,desc:'A glowing experiment wing.'},{id:'tower',name:'Trophy Tower',icon:'🏆',cost:220,desc:'Display your mastery trophies.'},{id:'portal',name:'Challenge Portal',icon:'🌀',cost:300,desc:'Unlock an expert challenge portal.'}
];
const SUBJECTS={
 english:{name:'Story Keep',icon:'📚',x:307,y:274,r:86},maths:{name:'Math Manor',icon:'➗',x:421,y:444,r:82},design:{name:'Maker Works',icon:'🛠️',x:158,y:516,r:84},science:{name:'Science Lab',icon:'🔬',x:427,y:636,r:82},art:{name:'Creator Studio',icon:'🎨',x:907,y:362,r:86},music:{name:'Sound Stage',icon:'🎵',x:757,y:539,r:82},history:{name:'Time Temple',icon:'🏺',x:928,y:701,r:86},french:{name:'French Café',icon:'🇫🇷',x:185,y:850,r:82},geography:{name:'Explorer Lodge',icon:'🌍',x:422,y:915,r:82},computing:{name:'Code Core',icon:'💻',x:677,y:916,r:82},pe:{name:'Power Arena',icon:'🏃',x:949,y:925,r:84},life:{name:'Think Tower',icon:'💡',x:563,y:742,r:72}
};
const BASE={x:559,y:1115,r:88};
const canvas=document.getElementById('worldCanvas'),ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
const nearbyCard=document.getElementById('worldNearby'),nearbyName=document.getElementById('nearbyName'),nearbyIcon=document.getElementById('nearbyIcon'),nearbyAction=document.getElementById('nearbyAction'),action=document.getElementById('worldAction'),basePanel=document.getElementById('basePanel'),shop=document.getElementById('buildShop');
const shell=document.querySelector('.world-shell');
const image=new Image(); image.decoding='async'; image.src=IMG_SRC+'?v=16';
let player=world.playerMap||{x:563,y:742};
let camera={x:player.x,y:player.y,scale:1};
let target=null,nearby=null,drag=null,last=performance.now(),loaded=false,loadFailed=false,userPanning=false,panRelease=0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
if(shell)shell.classList.add('reference-map-world');
document.getElementById('gestureHint')?.setAttribute('hidden','');
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));ctx.setTransform(d,0,0,d,0,0);fitCamera();}
function minScale(){const r=canvas.getBoundingClientRect();return Math.min(1,Math.max(r.width/IMG_W,r.height/IMG_H,.62));}
function clampCamera(){const r=canvas.getBoundingClientRect(),mx=Math.min(IMG_W/2,r.width/(2*camera.scale)),my=Math.min(IMG_H/2,r.height/(2*camera.scale));camera.x=clamp(camera.x,mx,IMG_W-mx);camera.y=clamp(camera.y,my,IMG_H-my);}
function fitCamera(){camera.scale=clamp(camera.scale,minScale(),1.8);clampCamera();}
addEventListener('resize',resize);resize();
function worldToScreen(p){const r=canvas.getBoundingClientRect();return{x:(p.x-camera.x)*camera.scale+r.width/2,y:(p.y-camera.y)*camera.scale+r.height/2};}
function screenToWorld(x,y){const r=canvas.getBoundingClientRect();return{x:camera.x+(x-r.width/2)/camera.scale,y:camera.y+(y-r.height/2)/camera.scale};}
function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.fillStyle=loadFailed?'#10233d':'#67c85a';ctx.fillRect(0,0,r.width,r.height);if(loaded){const dw=IMG_W*camera.scale,dh=IMG_H*camera.scale,dx=r.width/2-camera.x*camera.scale,dy=r.height/2-camera.y*camera.scale;ctx.drawImage(image,dx,dy,dw,dh);}else if(loadFailed){ctx.fillStyle='#fff';ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.fillText('Map failed to load — tap to retry',r.width/2,r.height/2);}const p=worldToScreen(player);ctx.save();ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=10;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.font='26px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🧑‍🚀',p.x,p.y);ctx.restore();}
function retryImage(){loadFailed=false;image.src=IMG_SRC+'?v=16&t='+Date.now();}
image.onload=()=>{loaded=true;loadFailed=false;camera.x=player.x;camera.y=player.y;fitCamera();draw();};
image.onerror=()=>{loaded=false;loadFailed=true;draw();};
function nearestSubject(){let best=null,bd=Infinity;for(const [id,s] of Object.entries(SUBJECTS)){const d=Math.hypot(player.x-s.x,player.y-s.y);if(d<bd){bd=d;best={id,...s,d}}}return bd<120?best:null;}
function updateNearby(){nearby=nearestSubject();if(nearby){nearbyCard.hidden=false;nearbyName.textContent=nearby.name;nearbyIcon.textContent=nearby.icon;nearbyAction.textContent=nearby.d<78?'Ready to enter':'Walk closer';action.hidden=nearby.d>=78;action.textContent=`Enter ${nearby.name}`;}else{nearbyCard.hidden=true;action.hidden=true;}}
function startSubject(id){document.querySelector(`[data-subject="${id}"]`)?.click();}
action?.addEventListener('click',()=>nearby&&startSubject(nearby.id));
nearbyCard?.addEventListener('click',()=>{if(nearby)target={x:nearby.x,y:nearby.y};});
function moveToward(dt){if(!target)return;const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);if(d<5){target=null;write(WORLD_KEY,{...world,playerMap:player});return;}const speed=165;player.x+=dx/d*speed*dt;player.y+=dy/d*speed*dt;world.playerMap={x:player.x,y:player.y};if(Math.random()<.04)write(WORLD_KEY,world);}
function followCamera(){if(userPanning||performance.now()<panRelease)return;const desiredX=player.x,desiredY=player.y;camera.x+=(desiredX-camera.x)*.085;camera.y+=(desiredY-camera.y)*.085;clampCamera();}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;moveToward(dt);followCamera();updateNearby();draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
canvas.addEventListener('pointerdown',e=>{if(loadFailed){retryImage();return;}canvas.setPointerCapture?.(e.pointerId);drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,moved:false};target=null;userPanning=true;});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>7)drag.moved=true;if(drag.moved){camera.x-=dx/camera.scale;camera.y-=dy/camera.scale;clampCamera();drag.x=e.clientX;drag.y=e.clientY;}});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const r=canvas.getBoundingClientRect();if(!drag.moved){const p=screenToWorld(e.clientX-r.left,e.clientY-r.top);let hit=null,hd=Infinity;for(const [id,s] of Object.entries(SUBJECTS)){const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<hd){hd=d;hit={id,...s}}}if(hit&&hd<hit.r+24)target={x:hit.x,y:hit.y};else if(Math.hypot(p.x-BASE.x,p.y-BASE.y)<BASE.r+24){basePanel.hidden=false;renderShop();}else target={x:clamp(p.x,0,IMG_W),y:clamp(p.y,0,IMG_H)};}drag=null;userPanning=false;panRelease=performance.now()+1800;});
canvas.addEventListener('pointercancel',()=>{drag=null;userPanning=false;panRelease=performance.now()+1000;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),before=screenToWorld(e.clientX-r.left,e.clientY-r.top);camera.scale=clamp(camera.scale*(e.deltaY>0?.9:1.1),minScale(),1.8);const after=screenToWorld(e.clientX-r.left,e.clientY-r.top);camera.x+=before.x-after.x;camera.y+=before.y-after.y;clampCamera();panRelease=performance.now()+1800;},{passive:false});
let pinch=null;canvas.addEventListener('touchstart',e=>{if(e.touches.length===2){const [a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),scale:camera.scale};userPanning=true;}},{passive:true});canvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const [a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);camera.scale=clamp(pinch.scale*(d/pinch.d),minScale(),1.8);clampCamera();}},{passive:true});canvas.addEventListener('touchend',()=>{pinch=null;userPanning=false;panRelease=performance.now()+1800;},{passive:true});
function refreshHUD(){world=read(WORLD_KEY,world);const academy=read(ACADEMY_KEY,{}),xp=academy.xp||academy.totalXP||0,level=Math.max(1,Math.floor(xp/180)+1);document.querySelectorAll('#worldCoins,#shopCoins').forEach(el=>el.textContent=world.coins||0);const lv=document.getElementById('worldLevel');if(lv)lv.textContent=level;}setInterval(refreshHUD,800);refreshHUD();
function renderShop(){if(!shop)return;world=read(WORLD_KEY,world);shop.innerHTML='';BUILD_ITEMS.forEach(item=>{const owned=(world.owned||[]).includes(item.id),b=document.createElement('button');b.className='build-item'+(owned?' owned':'');b.disabled=owned||world.coins<item.cost;b.innerHTML=`<span class="build-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.desc}</small><span class="cost">${owned?'✓ Built':`🪙 ${item.cost}`}</span>`;b.onclick=()=>{world=read(WORLD_KEY,world);if(world.coins<item.cost||world.owned.includes(item.id))return;world.coins-=item.cost;world.spent=(world.spent||0)+item.cost;world.owned.push(item.id);write(WORLD_KEY,world);renderShop();refreshHUD();};shop.appendChild(b);});}
document.getElementById('openBase')?.addEventListener('click',()=>{basePanel.hidden=false;renderShop();});document.getElementById('closeBase')?.addEventListener('click',()=>basePanel.hidden=true);addEventListener('storage',refreshHUD);addEventListener('ks2coins',refreshHUD);
})();