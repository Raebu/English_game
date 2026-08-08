import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const ACADEMY_KEY='ks2genius-v1';
const WORLD_KEY='ks2-world-v1';
const SUBJECTS={
  maths:{name:'Math Manor',icon:'➗',color:0x4d8fe8,pos:[-8,0,2],style:'cottage'},
  english:{name:'Story Keep',icon:'📚',color:0x527de8,pos:[0,0,-5],style:'castle'},
  science:{name:'Science Lab',icon:'🔬',color:0x8c5ed8,pos:[-7,0,-5],style:'tower'},
  computing:{name:'Code Tower',icon:'💻',color:0x37a8dc,pos:[8,0,-4],style:'tower'},
  geography:{name:'Explorer Lodge',icon:'🌍',color:0x55ad65,pos:[-11,0,8],style:'lodge'},
  history:{name:'Time Temple',icon:'🏺',color:0xd28a45,pos:[8,0,3],style:'temple'},
  french:{name:'French Café',icon:'🇫🇷',color:0xef6a79,pos:[-2.8,0,4],style:'cottage'},
  art:{name:'Creator Studio',icon:'🎨',color:0xe66bc5,pos:[5,0,8],style:'cottage'},
  design:{name:'Maker Works',icon:'🛠️',color:0xe3a234,pos:[-8,0,11],style:'workshop'},
  music:{name:'Sound Stage',icon:'🎵',color:0x8268dc,pos:[-1.5,0,11],style:'hall'},
  pe:{name:'Power Arena',icon:'🏃',color:0xe9684d,pos:[5.5,0,12],style:'arena'},
  life:{name:'Think Tower',icon:'💡',color:0x39aebc,pos:[10.5,0,8],style:'tower'}
};
const BUILD_ITEMS=[
  {id:'desk',name:'Genius Desk',icon:'📚',cost:40,desc:'A study desk for your base.'},
  {id:'garden',name:'Knowledge Garden',icon:'🌳',cost:70,desc:'Grow a garden beside your base.'},
  {id:'robot',name:'Helper Robot',icon:'🤖',cost:110,desc:'A friendly robot companion.'},
  {id:'lab',name:'Mini Science Lab',icon:'🔬',cost:150,desc:'Add a lab wing to your base.'},
  {id:'tower',name:'Trophy Tower',icon:'🏆',cost:220,desc:'Build a tower showing your mastery.'},
  {id:'portal',name:'Challenge Portal',icon:'🌀',cost:300,desc:'A portal for expert challenges.'}
];
const defaultWorld=()=>({coins:0,earned:0,spent:0,owned:[],processedAttempts:[],dailyAwards:{},perfectAwards:[],player3d:{x:0,z:8}});
const read=(key,fallback={})=>{try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
let world=read(WORLD_KEY,defaultWorld());
const academy=()=>read(ACADEMY_KEY,{});

const canvas=document.getElementById('worldCanvas');
const nearbyCard=document.getElementById('worldNearby');
const nearbyName=document.getElementById('nearbyName');
const nearbyIcon=document.getElementById('nearbyIcon');
const nearbyAction=document.getElementById('nearbyAction');
const gestureHint=document.getElementById('gestureHint');
const action=document.getElementById('worldAction');
const basePanel=document.getElementById('basePanel');
const shop=document.getElementById('buildShop');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x79ccfa);
scene.fog=new THREE.FogExp2(0xb9e7ff,.018);
const camera=new THREE.PerspectiveCamera(46,1,.1,120);
const hemi=new THREE.HemisphereLight(0xdff6ff,0x5d7d49,2.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4d8,4.8);sun.position.set(-16,26,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;scene.add(sun);

function mat(color,rough=.8,metal=.02){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
function mesh(geo,color,rough=.8){const m=new THREE.Mesh(geo,mat(color,rough));m.castShadow=true;m.receiveShadow=true;return m}
function box(w,h,d,color){return mesh(new THREE.BoxGeometry(w,h,d),color)}
function cylinder(rt,rb,h,color,segments=16){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),color)}
function cone(r,h,color,segments=12){return mesh(new THREE.ConeGeometry(r,h,segments),color)}
function sphere(r,color,segments=14){return mesh(new THREE.SphereGeometry(r,segments,Math.max(8,segments-3)),color)}
function add(g,o,x=0,y=0,z=0){o.position.set(x,y,z);g.add(o);return o}

// Terrain island and distant hills
const ground=mesh(new THREE.CylinderGeometry(20,22,1.2,64),0x71ca63);ground.position.y=-.62;scene.add(ground);
const lower=mesh(new THREE.CylinderGeometry(21.6,23,1.6,64),0x86715c);lower.position.y=-1.65;scene.add(lower);
const water=mesh(new THREE.CircleGeometry(34,64),0x4bb9e9,.25);water.rotation.x=-Math.PI/2;water.position.y=-1.95;water.material.transparent=true;water.material.opacity=.8;scene.add(water);

for(let i=0;i<13;i++){
  const a=i/13*Math.PI*2,r=27+Math.sin(i*2.1)*2.8;
  const hill=cone(4.5+Math.random()*2.2,9+Math.random()*4, i%3===0?0xa8bdc8:0x79a77b,7);
  hill.position.set(Math.cos(a)*r,2.3,Math.sin(a)*r-7);hill.rotation.y=Math.random();scene.add(hill);
}

function pathCurve(points,width=1.55){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.02,z)));
  const samples=curve.getPoints(80);
  for(let i=0;i<samples.length-1;i++){
    const a=samples[i],b=samples[i+1],len=a.distanceTo(b),mid=a.clone().add(b).multiplyScalar(.5);
    const p=mesh(new THREE.BoxGeometry(width,.06,len+.08),0xf2deb0);p.position.copy(mid);p.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);scene.add(p);
  }
}
pathCurve([[0,14],[0,9],[0,5],[0,1],[0,-3],[0,-8]],1.7);
pathCurve([[0,5],[-4,4],[-8,2],[-11,1]],1.3);
pathCurve([[0,3],[4,4],[8,3],[11,4]],1.3);
pathCurve([[0,8],[-4,9],[-8,11]],1.25);
pathCurve([[0,8],[4,9],[8,11]],1.25);
pathCurve([[0,0],[-4,-3],[-7,-5]],1.25);
pathCurve([[0,0],[4,-2],[8,-4]],1.25);

// Pond and bridge
const pond=mesh(new THREE.CircleGeometry(4.2,32),0x39bfe9,.2);pond.rotation.x=-Math.PI/2;pond.scale.y=.6;pond.position.set(-12,.04,4);pond.material.transparent=true;pond.material.opacity=.88;scene.add(pond);
for(let i=-3;i<=3;i++){const plank=box(.85,.14,2.2,0xa66c39);plank.position.set(-12+i*.78,.32,4);scene.add(plank)}
for(const z of [3,5]){const rail=box(5.5,.12,.12,0x8b5a34);rail.position.set(-12,.85,z);scene.add(rail);for(let i=-3;i<=3;i++){const post=box(.12,.8,.12,0x8b5a34);post.position.set(-12+i*.8,.52,z);scene.add(post)}}

function tree(x,z,s=1){const g=new THREE.Group();add(g,cylinder(.16,.22,.9,0x805337,8),0,.45,0);add(g,cone(.72*s,1.45*s,0x2f8f50,10),0,1.35*s,0);add(g,cone(.58*s,1.2*s,0x3fa85b,10),0,2.05*s,0);g.position.set(x,0,z);scene.add(g)}
function flower(x,z,color){const g=new THREE.Group();add(g,cylinder(.025,.025,.34,0x3f8a43,6),0,.17,0);add(g,sphere(.1,color,8),0,.38,0);g.position.set(x,0,z);scene.add(g)}
const treeSpots=[[-16,-2],[-15,9],[-13,14],[-10,-9],[-4,-10],[5,-10],[12,-9],[15,-4],[16,5],[14,13],[9,15],[3,15],[-4,15],[-13,6],[-6,6],[6,6]];
treeSpots.forEach((p,i)=>tree(p[0],p[1],.8+(i%3)*.12));
for(let i=0;i<42;i++){const a=Math.random()*Math.PI*2,r=5+Math.random()*12;flower(Math.cos(a)*r,Math.sin(a)*r+3,[0xff7fa4,0xffffff,0xffdd56,0xa375e8][i%4])}

function windowBox(color=0xffe083){const w=box(.42,.5,.08,color);w.material.emissive=new THREE.Color(color);w.material.emissiveIntensity=.25;return w}
function roofCone(r,h,color){const rmesh=cone(r,h,color,4);rmesh.rotation.y=Math.PI/4;return rmesh}
function signSprite(text){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,512,128);x.fillStyle='rgba(22,38,75,.92)';x.roundRect(8,8,496,112,28);x.fill();x.strokeStyle='rgba(255,226,115,.9)';x.lineWidth=5;x.stroke();x.fillStyle='#fff';x.font='900 38px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,65);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(3.5,.88,1);sp.visible=false;return sp}

function cottage(s){const g=new THREE.Group();const body=box(3.2,2.35,3,s.color);add(g,body,0,1.18,0);const roof=roofCone(2.55,1.7,0x315a99);add(g,roof,0,3.15,0);add(g,box(.7,1.25,.14,0x9c5b34),0,.63,1.56);for(const x of [-.9,.9])add(g,windowBox(),x,1.35,1.56);add(g,box(.28,1.25,.28,0xd5b05f),1.05,3.15,-.3);return g}
function tower(s){const g=new THREE.Group();const base=cylinder(1.7,1.85,3,s.color,12);add(g,base,0,1.5,0);const top=cylinder(1.45,1.45,.7,0xf0d38a,12);add(g,top,0,3.35,0);add(g,cone(1.72,2.2,0x2d6c9e,12),0,4.8,0);add(g,box(.65,1.25,.15,0x8e5734),0,.63,1.78);for(let i=0;i<4;i++){const a=i*Math.PI/2;const w=windowBox();w.position.set(Math.sin(a)*1.72,1.7,Math.cos(a)*1.72);w.rotation.y=a;g.add(w)}return g}
function castle(s){const g=new THREE.Group();add(g,box(4.5,2.8,3.2,s.color),0,1.4,0);for(const x of [-1.85,1.85]){add(g,cylinder(.72,.78,3.5,0xe4e1d1,12),x,1.75,0);add(g,cone(.9,1.65,0x2f69a9,12),x,4.15,0)}add(g,roofCone(2.4,1.7,0x315fa6),0,3.75,0);add(g,box(.85,1.55,.15,0xc98b42),0,.78,1.68);for(const x of [-1.05,1.05])add(g,windowBox(),x,1.6,1.68);return g}
function temple(s){const g=new THREE.Group();add(g,box(3.7,2.1,3.2,s.color),0,1.05,0);for(const x of [-1.35,-.45,.45,1.35])add(g,cylinder(.16,.2,2,0xf1dcaa,8),x,1.1,1.7);const roof=mesh(new THREE.ConeGeometry(2.7,1.25,4),0x724d38);roof.rotation.y=Math.PI/4;add(g,roof,0,2.85,0);return g}
function hall(s){const g=cottage(s);g.scale.set(1.2,.9,1.12);return g}
function arena(s){const g=new THREE.Group();add(g,cylinder(2.2,2.45,1.6,s.color,24),0,.8,0);add(g,cylinder(1.7,1.7,1.2,0xf4d676,24),0,1.7,0);add(g,cone(2.15,.95,0x2b4f82,24),0,2.75,0);return g}
function workshop(s){const g=cottage(s);add(g,cylinder(.18,.24,1.2,0x71503a,8),1.05,3.4,-.3);return g}
function lodge(s){const g=cottage(s);g.scale.set(1.12,.95,1.06);return g}
function createBuilding(id,s){let g;if(s.style==='tower')g=tower(s);else if(s.style==='castle')g=castle(s);else if(s.style==='temple')g=temple(s);else if(s.style==='hall')g=hall(s);else if(s.style==='arena')g=arena(s);else if(s.style==='workshop')g=workshop(s);else if(s.style==='lodge')g=lodge(s);else g=cottage(s);g.position.set(...s.pos);g.userData={subject:id,name:s.name,icon:s.icon};const label=signSprite(s.name);label.position.set(0,5.8,0);label.name='label';g.add(label);scene.add(g);return g}
const interactables=Object.entries(SUBJECTS).map(([id,s])=>createBuilding(id,s));

// Player base near start
const baseData={name:'Your Base',icon:'🏠'};const base=castle({color:0x4778b9});base.scale.set(.85,.85,.85);base.position.set(0,0,5);base.userData={base:true,...baseData};const baseLabel=signSprite('Your Base');baseLabel.position.set(0,6.1,0);baseLabel.name='label';base.add(baseLabel);scene.add(base);interactables.push(base);

// Distant academy castle landmark on hill
const hill=mesh(new THREE.CylinderGeometry(5.6,7,3,32),0x639f55);hill.position.set(0,.4,-15);scene.add(hill);
const landmark=castle({color:0xe7e7db});landmark.scale.set(1.5,1.7,1.4);landmark.position.set(0,1.9,-15);scene.add(landmark);
for(const x of [-3.3,3.3]){const t=tower({color:0xe8e4d8});t.scale.set(.75,.9,.75);t.position.set(x,2,-15);scene.add(t)}

function makeAvatar(){const g=new THREE.Group();const body=box(.7,1.05,.42,0x2d72ce);add(g,body,0,1.25,0);const head=sphere(.42,0xf2b48d,14);head.scale.y=1.08;add(g,head,0,2.08,0);const hair=sphere(.44,0x6b351e,12);hair.scale.y=.55;add(g,hair,0,2.37,-.04);for(const x of [-.22,.22])add(g,box(.2,.78,.24,0x203c69),x,.48,0);for(const x of [-.48,.48])add(g,cylinder(.08,.09,.75,0xf2b48d,8),x,1.2,0);const bag=box(.58,.72,.22,0x9b5d32);add(g,bag,0,1.25,.32);g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
const player=makeAvatar();player.position.set(world.player3d?.x||0,0,world.player3d?.z||10);scene.add(player);

function applyOwned(){/* base items remain represented in Base Builder; visual expansions can be layered later */}

let nearby=null,last=performance.now();let dragPointer=null,dragStart=null,dragCurrent=null;let pinchStart=null;let cameraDistance=10.5;let cameraYaw=0;let autoTarget=null;let movedOnce=false;
function saveWorld(){world.player3d={x:player.position.x,z:player.position.z};write(WORLD_KEY,world);syncHud()}
function syncHud(){const a=academy(),xp=Number(a.xp||0);document.getElementById('worldLevel').textContent=Math.max(1,Math.floor(xp/250)+1);document.getElementById('worldCoins').textContent=Number(world.coins||0);const sc=document.getElementById('shopCoins');if(sc)sc.textContent=Number(world.coins||0)}
function distanceTo(g){return Math.hypot(player.position.x-g.position.x,player.position.z-g.position.z)}
function nearestInteractable(){let best=null,dist=Infinity;for(const b of interactables){const d=distanceTo(b);if(d<dist){best=b;dist=d}}return dist<3.6?best:null}
function launch(subject){document.querySelector(`[data-subject="${subject}"]`)?.click()}
function interact(){if(!nearby)return;if(nearby.userData.base)openBase();else launch(nearby.userData.subject)}
function openBase(){renderShop();basePanel.hidden=false}
function closeBase(){basePanel.hidden=true}
function renderShop(){syncHud();shop.innerHTML=BUILD_ITEMS.map(item=>{const owned=(world.owned||[]).includes(item.id);return `<button class="build-item ${owned?'owned':''}" data-build-item="${item.id}" ${owned?'disabled':''}><span class="build-icon">${item.icon}</span><strong>${owned?'✓ ':''}${item.name}</strong><small>${item.desc}</small><span class="cost">${owned?'Built':`🪙 ${item.cost}`}</span></button>`}).join('')}
function buy(id){const item=BUILD_ITEMS.find(x=>x.id===id);if(!item||(world.owned||[]).includes(id))return;if(Number(world.coins||0)<item.cost){toast('Not enough KS2C yet');return}world.coins-=item.cost;world.spent=Number(world.spent||0)+item.cost;world.owned=[...(world.owned||[]),id];saveWorld();renderShop();toast(`${item.name} built!`)}
function toast(text){const el=document.getElementById('coinToast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function processRewards(){const a=academy(),attempts=a.attempts||[],known=new Set(world.processedAttempts||[]);let changed=false;for(const at of attempts.slice(-160)){if(!known.has(at.id)){known.add(at.id);world.processedAttempts.push(at.id);if(at.correct){world.coins=Number(world.coins||0)+2;world.earned=Number(world.earned||0)+2}changed=true}}world.processedAttempts=world.processedAttempts.slice(-1500);const daily=a.daily||{};if(daily.date){for(const subject of daily.done||[]){const k=`${daily.date}:${subject}`;if(!world.dailyAwards[k]){world.dailyAwards[k]=1;world.coins=Number(world.coins||0)+25;world.earned=Number(world.earned||0)+25;changed=true}}}const last10=attempts.slice(-10);if(last10.length===10&&last10.every(x=>x.correct)&&new Set(last10.map(x=>x.subject)).size===1){const sig=last10.map(x=>x.id).join('|');if(!(world.perfectAwards||[]).includes(sig)){world.perfectAwards=[...(world.perfectAwards||[]),sig].slice(-40);world.coins=Number(world.coins||0)+20;world.earned=Number(world.earned||0)+20;changed=true}}if(changed)saveWorld();else syncHud()}

function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function hideHint(){if(movedOnce)return;movedOnce=true;gestureHint?.classList.add('hide');setTimeout(()=>gestureHint?.remove(),700)}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;canvas.setPointerCapture(e.pointerId);if(dragPointer===null){dragPointer=e.pointerId;dragStart=pointerPos(e);dragCurrent={...dragStart};hideHint()}});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===dragPointer)dragCurrent=pointerPos(e)});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===dragPointer){dragPointer=null;dragStart=null;dragCurrent=null;saveWorld()}});
canvas.addEventListener('pointercancel',e=>{if(e.pointerId===dragPointer){dragPointer=null;dragStart=null;dragCurrent=null}});

const activeTouches=new Map();
canvas.addEventListener('touchstart',e=>{for(const t of e.changedTouches)activeTouches.set(t.identifier,{x:t.clientX,y:t.clientY});if(activeTouches.size===2){const pts=[...activeTouches.values()];pinchStart={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),cameraDistance};dragPointer=null;dragStart=null;dragCurrent=null}},{passive:false});
canvas.addEventListener('touchmove',e=>{for(const t of e.changedTouches)activeTouches.set(t.identifier,{x:t.clientX,y:t.clientY});if(activeTouches.size===2&&pinchStart){e.preventDefault();const pts=[...activeTouches.values()];const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);cameraDistance=THREE.MathUtils.clamp(pinchStart.cameraDistance*(pinchStart.distance/Math.max(20,d)),6.5,16)}},{passive:false});
canvas.addEventListener('touchend',e=>{for(const t of e.changedTouches)activeTouches.delete(t.identifier);if(activeTouches.size<2)pinchStart=null},{passive:false});

// Mouse wheel zoom for desktop
canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=THREE.MathUtils.clamp(cameraDistance+Math.sign(e.deltaY)*.8,6.5,16)},{passive:false});

// Tap a building to walk toward it
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let tapDown=null;
canvas.addEventListener('pointerdown',e=>{tapDown={x:e.clientX,y:e.clientY,time:performance.now()}});
canvas.addEventListener('pointerup',e=>{if(!tapDown)return;const dist=Math.hypot(e.clientX-tapDown.x,e.clientY-tapDown.y);if(dist<8&&performance.now()-tapDown.time<350){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(interactables,true);if(hits.length){let obj=hits[0].object;while(obj.parent&&obj.parent!==scene&&!obj.userData.subject&&!obj.userData.base)obj=obj.parent;const target=interactables.find(g=>g===obj||g.children.includes(obj)||obj.isDescendantOf?.(g));const chosen=target||interactables.find(g=>hits[0].object.parent===g||g.getObjectById(hits[0].object.id));if(chosen){autoTarget=new THREE.Vector3(chosen.position.x,0,chosen.position.z+2.7);hideHint()}}}tapDown=null});

function movementVector(){if(autoTarget){const v=autoTarget.clone().sub(player.position);v.y=0;if(v.length()<.25){autoTarget=null;return new THREE.Vector3()}return v.normalize()}if(!dragStart||!dragCurrent)return new THREE.Vector3();const dx=dragCurrent.x-dragStart.x,dy=dragCurrent.y-dragStart.y;const mag=Math.min(1,Math.hypot(dx,dy)/70);if(mag<.08)return new THREE.Vector3();const forward=new THREE.Vector3(Math.sin(cameraYaw),0,-Math.cos(cameraYaw));const right=new THREE.Vector3(Math.cos(cameraYaw),0,Math.sin(cameraYaw));return forward.multiplyScalar(-dy).add(right.multiplyScalar(dx)).normalize().multiplyScalar(mag)}
function update(dt){const mv=movementVector();if(mv.lengthSq()>0){const speed=4.6;player.position.x=THREE.MathUtils.clamp(player.position.x+mv.x*speed*dt,-17,17);player.position.z=THREE.MathUtils.clamp(player.position.z+mv.z*speed*dt,-11,16);player.rotation.y=Math.atan2(mv.x,mv.z);player.position.y=Math.sin(performance.now()/110)*.025}else player.position.y=0;
  nearby=nearestInteractable();for(const b of interactables){const label=b.getObjectByName('label');if(label)label.visible=b===nearby}
  if(nearby){nearbyCard.hidden=false;nearbyName.textContent=nearby.userData.name;nearbyIcon.textContent=nearby.userData.icon||'🏠';nearbyAction.textContent=nearby.userData.base?'Open Base Builder':'Tap Enter to start mission';action.hidden=false;action.textContent=nearby.userData.base?'Open Base':'Enter'}else{nearbyCard.hidden=true;action.hidden=true}
  const target=new THREE.Vector3(player.position.x+Math.sin(cameraYaw)*cameraDistance*.42,5.4+cameraDistance*.22,player.position.z+Math.cos(cameraYaw)*cameraDistance*.72);camera.position.lerp(target,1-Math.pow(.0007,dt));camera.lookAt(player.position.x,1.2,player.position.z-1.4)}
function resize(){const r=canvas.getBoundingClientRect();const w=Math.max(320,Math.floor(r.width)),h=Math.max(420,Math.floor(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(frame)}

action.addEventListener('click',interact);document.getElementById('openBase')?.addEventListener('click',openBase);document.getElementById('closeBase')?.addEventListener('click',closeBase);shop?.addEventListener('click',e=>{const b=e.target.closest('[data-build-item]');if(b)buy(b.dataset.buildItem)});window.addEventListener('resize',resize);window.addEventListener('storage',()=>{world=read(WORLD_KEY,defaultWorld());processRewards()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){world=read(WORLD_KEY,defaultWorld());processRewards()}});

// Keep world fullscreen when active and refresh rewards after missions.
function watchView(){const worldView=document.querySelector('[data-view="world"]');if(!worldView)return;new MutationObserver(()=>{const active=!worldView.hidden;document.body.classList.toggle('world-active',active);if(active){world=read(WORLD_KEY,defaultWorld());processRewards();resize()}}).observe(worldView,{attributes:true,attributeFilter:['hidden']});document.body.classList.toggle('world-active',!worldView.hidden)}
processRewards();resize();watchView();camera.position.set(0,7.7,19);camera.lookAt(0,1,5);requestAnimationFrame(frame);
