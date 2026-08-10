(()=>{
const WORLD_KEY='ks2-world-v1';
const ACADEMY_KEY='ks2genius-v1';
const IMG_SRC='/assets/genius-academy-map.svg';
const IMG_W=1149,IMG_H=1369;
const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const defaultWorld=()=>({coins:0,earned:0,spent:0,owned:[],playerMap:{x:570,y:810}});
let world=read(WORLD_KEY,defaultWorld());
const BUILD_ITEMS=[
{id:'desk',name:'Genius Desk',icon:'📚',cost:40,desc:'A study desk for your academy base.'},
{id:'garden',name:'Knowledge Garden',icon:'🌳',cost:70,desc:'A colourful knowledge garden.'},
{id:'robot',name:'Helper Robot',icon:'🤖',cost:110,desc:'A friendly learning companion.'},
{id:'lab',name:'Mini Science Lab',icon:'🔬',cost:150,desc:'A glowing experiment wing.'},
{id:'tower',name:'Trophy Tower',icon:'🏆',cost:220,desc:'Display your mastery trophies.'},
{id:'portal',name:'Challenge Portal',icon:'🌀',cost:300,desc:'Unlock an expert challenge portal.'}
];
const SUBJECTS={
 english:{name:'Story Keep',icon:'📚',x:307,y:274,r:86,entry:{x:318,y:438},img:'/assets/houses/story_keep.png'},
 maths:{name:'Math Manor',icon:'➗',x:421,y:444,r:82,entry:{x:470,y:350},img:'/assets/houses/math_manor.png'},
 design:{name:'Maker Works',icon:'🛠️',x:158,y:516,r:84,entry:{x:160,y:505},img:'/assets/houses/maker_works.png'},
 science:{name:'Science Lab',icon:'🔬',x:427,y:636,r:82,entry:{x:405,y:611},img:'/assets/houses/science_lab.png'},
 art:{name:'Creator Studio',icon:'🎨',x:907,y:362,r:86,entry:{x:900,y:347},img:'/assets/houses/creator_studio.png'},
 music:{name:'Sound Stage',icon:'🎵',x:757,y:539,r:82,entry:{x:745,y:559},img:'/assets/houses/sound_stage.png'},
 history:{name:'Time Temple',icon:'🏺',x:928,y:701,r:86,entry:{x:970,y:665},img:'/assets/houses/time_temple.png'},
 french:{name:'French Café',icon:'🇫🇷',x:185,y:850,r:82,entry:{x:161,y:807},img:'/assets/houses/french_cafe.png'},
 geography:{name:'Explorer Lodge',icon:'🌍',x:422,y:915,r:82,entry:{x:385,y:913},img:'/assets/houses/explorer_lodge.png'},
 computing:{name:'Code Core',icon:'💻',x:677,y:916,r:82,entry:{x:723,y:853},img:'/assets/houses/code_core.png'},
 pe:{name:'Power Arena',icon:'🏃',x:949,y:925,r:84,entry:{x:988,y:948},img:'/assets/houses/power_arena.png'},
 life:{name:'Think Tower',icon:'💡',x:563,y:742,r:72,entry:{x:570,y:742},img:'/assets/houses/think_tower.png'}
};
const LANDMARKS=[
{id:'academy',name:'Genius Academy',x:576,y:236,w:220,h:220,img:'/assets/houses/genius_academy.png'},
{id:'bank',name:'Genius Bank',x:800,y:1110,w:170,h:170,img:'/assets/houses/genius_bank.png'},
{id:'mission',name:'Mission Control',x:380,y:1120,w:180,h:180,img:'/assets/houses/mission_control.png'},
{id:'museum',name:'Discovery Museum',x:1020,y:515,w:175,h:175,img:'/assets/houses/discovery_museum.png'},
{id:'hall',name:'Hall of Achievement',x:750,y:760,w:175,h:175,img:'/assets/houses/hall_of_achievement.png'},
{id:'colosseum',name:'Challenge Colosseum',x:985,y:1165,w:210,h:190,img:'/assets/houses/challenge_colosseum.png'},
{id:'garden',name:'Community Garden',x:225,y:1150,w:175,h:175,img:'/assets/houses/community_garden.png'},
{id:'spacecraft',name:'Genius Spacecraft',x:915,y:180,w:185,h:185,img:'/assets/houses/genius_spacecraft.png'},
{id:'baseLab',name:'Base Build Lab',x:575,y:1115,w:190,h:190,img:'/assets/houses/base_build_lab.png'}
];
const BASE={x:575,y:1115,r:100,entry:{x:568,y:1043}};
const ROAD_LINES=[
[[576,250],[572,330],[572,390],[572,442],[571,608],[570,810],[568,1043],[570,1215]],
[[572,330],[470,350],[393,385],[318,438],[199,497],[117,505]],
[[572,390],[675,393],[748,385],[825,357],[956,338],[1052,365]],
[[571,608],[473,599],[405,611],[335,652],[226,731],[161,807]],
[[571,608],[663,576],[745,559],[826,573],[900,620],[1010,705]],
[[570,810],[477,817],[425,857],[385,913],[310,996],[204,1021]],
[[570,810],[662,812],[723,853],[768,906],[864,973],[988,948]],
[[568,1043],[687,1028],[801,1042],[920,1121]]
];
const canvas=document.getElementById('worldCanvas'),ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
const nearbyCard=document.getElementById('worldNearby'),nearbyName=document.getElementById('nearbyName'),nearbyIcon=document.getElementById('nearbyIcon'),nearbyAction=document.getElementById('nearbyAction'),action=document.getElementById('worldAction'),basePanel=document.getElementById('basePanel'),shop=document.getElementById('buildShop');
const shell=document.querySelector('.world-shell');
const image=new Image();image.decoding='async';image.src=IMG_SRC+'?v=20';
const assetImages=new Map();
function getAsset(src){if(!src)return null;if(assetImages.has(src))return assetImages.get(src);const im=new Image();im.decoding='async';im.src=src;im.onload=()=>draw();assetImages.set(src,im);return im;}
[...Object.values(SUBJECTS),...LANDMARKS].forEach(x=>getAsset(x.img));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
if(shell)shell.classList.add('reference-map-world');
const hint=document.getElementById('gestureHint');if(hint){hint.hidden=false;hint.classList.remove('hide');hint.innerHTML='<div class="gesture-hand">☝️</div><strong>Hold and drag to walk</strong><small>Release your finger and your character stops</small>';setTimeout(()=>hint.classList.add('hide'),5000);}

// Sample the visible road network into a navigation graph.
const graph=[];
function addNode(p){for(let i=0;i<graph.length;i++)if(Math.hypot(graph[i].x-p.x,graph[i].y-p.y)<8)return i;graph.push({x:p.x,y:p.y,links:[]});return graph.length-1;}
function connect(a,b){if(a===b)return;const d=Math.hypot(graph[a].x-graph[b].x,graph[a].y-graph[b].y);if(!graph[a].links.some(x=>x.i===b))graph[a].links.push({i:b,d});if(!graph[b].links.some(x=>x.i===a))graph[b].links.push({i:a,d});}
ROAD_LINES.forEach(line=>{let prev=null;for(let s=0;s<line.length-1;s++){const a=line[s],b=line[s+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(len/20));for(let k=0;k<=steps;k++){if(s>0&&k===0)continue;const t=k/steps,id=addNode({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});if(prev!==null)connect(prev,id);prev=id;}}});
function nearestRoadNode(p){let best=0,bd=Infinity;for(let i=0;i<graph.length;i++){const d=(graph[i].x-p.x)**2+(graph[i].y-p.y)**2;if(d<bd){bd=d;best=i;}}return best;}
function shortestPath(start,end){if(start===end)return[start];const dist=Array(graph.length).fill(Infinity),prev=Array(graph.length).fill(-1),used=Array(graph.length).fill(false);dist[start]=0;for(let n=0;n<graph.length;n++){let u=-1,b=Infinity;for(let i=0;i<graph.length;i++)if(!used[i]&&dist[i]<b){b=dist[i];u=i;}if(u<0||u===end)break;used[u]=true;for(const e of graph[u].links){const nd=dist[u]+e.d;if(nd<dist[e.i]){dist[e.i]=nd;prev[e.i]=u;}}}const out=[];for(let at=end;at!==-1;at=prev[at])out.push(at);return out.reverse();}
function roadEntry(item){if(item._roadEntry)return item._roadEntry;const h=item.h||172;const approx=item.entry||{x:item.x,y:item.y+h*.31};const n=graph[nearestRoadNode(approx)];item._roadEntry={x:n.x,y:n.y};return item._roadEntry;}
function buildingDoor(item){const h=item.h||172;return{x:item.x,y:item.y+h*.29};}

let startNode=nearestRoadNode(world.playerMap||defaultWorld().playerMap);
let player={x:graph[startNode].x,y:graph[startNode].y};
world.playerMap={...player};write(WORLD_KEY,world);
let camera={x:player.x,y:player.y,scale:1};
let route=[],routeIndex=0,nearby=null,last=performance.now(),loaded=false,loadFailed=false,pointer=null,pinch=null,lastRouteAt=0;
function clearRoute(save=true){route=[];routeIndex=0;if(save){world.playerMap={x:player.x,y:player.y};write(WORLD_KEY,world);}}
function setRouteTo(p){if(!pointer)return;const now=performance.now();if(now-lastRouteAt<35)return;lastRouteAt=now;const s=nearestRoadNode(player),e=nearestRoadNode(p),ids=shortestPath(s,e);route=ids.slice(1).map(i=>({x:graph[i].x,y:graph[i].y}));routeIndex=0;}
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));ctx.setTransform(d,0,0,d,0,0);fitCamera();}
function minScale(){const r=canvas.getBoundingClientRect();return Math.min(1,Math.max(r.width/IMG_W,r.height/IMG_H,.62));}
function clampCamera(){const r=canvas.getBoundingClientRect(),mx=Math.min(IMG_W/2,r.width/(2*camera.scale)),my=Math.min(IMG_H/2,r.height/(2*camera.scale));camera.x=clamp(camera.x,mx,IMG_W-mx);camera.y=clamp(camera.y,my,IMG_H-my);}
function fitCamera(){camera.scale=clamp(camera.scale,minScale(),1.65);clampCamera();}
addEventListener('resize',resize);resize();
function worldToScreen(p){const r=canvas.getBoundingClientRect();return{x:(p.x-camera.x)*camera.scale+r.width/2,y:(p.y-camera.y)*camera.scale+r.height/2};}
function screenToWorld(x,y){const r=canvas.getBoundingClientRect();return{x:camera.x+(x-r.width/2)/camera.scale,y:camera.y+(y-r.height/2)/camera.scale};}
function drawDriveway(item){const a=worldToScreen(roadEntry(item)),b=worldToScreen(buildingDoor(item));const width=Math.max(12,30*camera.scale);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#d6b96f';ctx.lineWidth=width+5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#f2d98f';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='rgba(255,248,209,.9)';ctx.lineWidth=Math.max(2,4*camera.scale);ctx.setLineDash([10*camera.scale,10*camera.scale]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
function drawBuilding(item,w=170,h=170){const im=getAsset(item.img);if(!im||!im.complete||!im.naturalWidth)return;const p=worldToScreen(item),dw=w*camera.scale,dh=h*camera.scale;ctx.save();ctx.shadowColor='rgba(16,45,28,.28)';ctx.shadowBlur=14*camera.scale;ctx.shadowOffsetY=8*camera.scale;ctx.drawImage(im,p.x-dw/2,p.y-dh*.7,dw,dh);ctx.restore();}
function draw(){const r=canvas.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);ctx.fillStyle=loadFailed?'#10233d':'#67c85a';ctx.fillRect(0,0,r.width,r.height);if(loaded){const dw=IMG_W*camera.scale,dh=IMG_H*camera.scale,dx=r.width/2-camera.x*camera.scale,dy=r.height/2-camera.y*camera.scale;ctx.drawImage(image,dx,dy,dw,dh);}else if(loadFailed){ctx.fillStyle='#fff';ctx.font='700 18px system-ui';ctx.textAlign='center';ctx.fillText('Map failed to load — tap to retry',r.width/2,r.height/2);}LANDMARKS.forEach(drawDriveway);Object.values(SUBJECTS).forEach(drawDriveway);LANDMARKS.forEach(l=>drawBuilding(l,l.w,l.h));Object.values(SUBJECTS).forEach(s=>drawBuilding(s,172,172));const p=worldToScreen(player),moving=!!pointer&&routeIndex<route.length;ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=10;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,20,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';ctx.font=`${moving?29:28}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.translate(p.x,p.y+(moving?Math.sin(performance.now()/90)*2:0));ctx.fillText('🧒',0,0);ctx.restore();}
function retryImage(){loadFailed=false;image.src=IMG_SRC+'?v=20&t='+Date.now();}
image.onload=()=>{loaded=true;loadFailed=false;camera.x=player.x;camera.y=player.y;fitCamera();draw();};image.onerror=()=>{loaded=false;loadFailed=true;draw();};
function nearestSubject(){let best=null,bd=Infinity;for(const [id,s] of Object.entries(SUBJECTS)){const entry=roadEntry(s),d=Math.hypot(player.x-entry.x,player.y-entry.y);if(d<bd){bd=d;best={id,...s,entry,d}}}return bd<105?best:null;}
function updateNearby(){nearby=nearestSubject();if(nearby){nearbyCard.hidden=false;nearbyName.textContent=nearby.name;nearbyIcon.textContent=nearby.icon;nearbyAction.textContent=nearby.d<42?'Ready to enter':'Hold toward the entrance';action.hidden=nearby.d>=42;action.textContent=`Enter ${nearby.name}`;}else{nearbyCard.hidden=true;action.hidden=true;}}
function startSubject(id){document.querySelector(`[data-subject="${id}"]`)?.click();}
action?.addEventListener('click',()=>nearby&&startSubject(nearby.id));
// The nearby card no longer starts autonomous walking; movement only happens while the canvas is actively pressed.
function moveAlongRoad(dt){if(!pointer||routeIndex>=route.length)return;const t=route[routeIndex],dx=t.x-player.x,dy=t.y-player.y,d=Math.hypot(dx,dy),step=150*dt;if(d<=step+1){player.x=t.x;player.y=t.y;routeIndex++;}else{player.x+=dx/d*step;player.y+=dy/d*step;}world.playerMap={x:player.x,y:player.y};}
function followCamera(){camera.x+=(player.x-camera.x)*.12;camera.y+=(player.y-camera.y)*.12;clampCamera();}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;moveAlongRoad(dt);followCamera();updateNearby();draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
function pointerWorld(e){const r=canvas.getBoundingClientRect();return screenToWorld(e.clientX-r.left,e.clientY-r.top);}
function destinationFromPoint(p){let hit=null,hd=Infinity;for(const [id,s] of Object.entries(SUBJECTS)){const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<hd){hd=d;hit={id,...s}}}if(hit&&hd<hit.r+40)return roadEntry(hit);if(Math.hypot(p.x-BASE.x,p.y-BASE.y)<BASE.r+40)return roadEntry(BASE);return p;}
function beginWalk(e){if(loadFailed){retryImage();return;}if(pinch)return;canvas.setPointerCapture?.(e.pointerId);pointer={id:e.pointerId};setRouteTo(destinationFromPoint(pointerWorld(e)));}
function updateWalk(e){if(!pointer||pointer.id!==e.pointerId||pinch)return;setRouteTo(destinationFromPoint(pointerWorld(e)));}
function stopWalk(e){if(pointer&&(!e||pointer.id===e.pointerId)){pointer=null;clearRoute(true);}}
canvas.addEventListener('pointerdown',beginWalk);
canvas.addEventListener('pointermove',updateWalk);
canvas.addEventListener('pointerup',stopWalk);
canvas.addEventListener('pointercancel',stopWalk);
canvas.addEventListener('lostpointercapture',stopWalk);
canvas.addEventListener('wheel',e=>{e.preventDefault();camera.scale=clamp(camera.scale*(e.deltaY>0?.92:1.08),minScale(),1.65);clampCamera();},{passive:false});
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2){stopWalk();const[a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),scale:camera.scale};}},{passive:true});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const[a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);camera.scale=clamp(pinch.scale*(d/pinch.d),minScale(),1.65);clampCamera();}},{passive:true});
canvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;},{passive:true});
function refreshHUD(){world=read(WORLD_KEY,world);const academy=read(ACADEMY_KEY,{}),xp=academy.xp||academy.totalXP||0,level=Math.max(1,Math.floor(xp/180)+1);document.querySelectorAll('#worldCoins,#shopCoins').forEach(el=>el.textContent=world.coins||0);const lv=document.getElementById('worldLevel');if(lv)lv.textContent=level;}setInterval(refreshHUD,800);refreshHUD();
function renderShop(){if(!shop)return;world=read(WORLD_KEY,world);shop.innerHTML='';BUILD_ITEMS.forEach(item=>{const owned=(world.owned||[]).includes(item.id),b=document.createElement('button');b.className='build-item'+(owned?' owned':'');b.disabled=owned||world.coins<item.cost;b.innerHTML=`<span class="build-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.desc}</small><span class="cost">${owned?'✓ Built':`🪙 ${item.cost}`}</span>`;b.onclick=()=>{world=read(WORLD_KEY,world);if(world.coins<item.cost||world.owned.includes(item.id))return;world.coins-=item.cost;world.spent=(world.spent||0)+item.cost;world.owned.push(item.id);write(WORLD_KEY,world);renderShop();refreshHUD();};shop.appendChild(b);});}
document.getElementById('openBase')?.addEventListener('click',()=>{basePanel.hidden=false;renderShop();});
document.getElementById('closeBase')?.addEventListener('click',()=>basePanel.hidden=true);
addEventListener('storage',refreshHUD);addEventListener('ks2coins',refreshHUD);
})();