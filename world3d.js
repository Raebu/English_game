import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const ACADEMY_KEY='ks2genius-v1';
const WORLD_KEY='ks2-world-v1';
const SUBJECTS={
  maths:{name:'Number Citadel',icon:'➗',color:0x7656ff,pos:[-8,0,-6]},
  english:{name:'Story Keep',icon:'📚',color:0xff5fa2,pos:[-2.5,0,-7]},
  science:{name:'Discovery Lab',icon:'🔬',color:0x27c6a4,pos:[3,0,-6]},
  computing:{name:'Code Core',icon:'💻',color:0x35a8ff,pos:[8,0,-5]},
  geography:{name:'Explorer Lodge',icon:'🌍',color:0x54b85a,pos:[-8,0,1]},
  history:{name:'Time Temple',icon:'🏺',color:0xd48c45,pos:[-3,0,0.5]},
  french:{name:'French Café',icon:'🇫🇷',color:0xf05f62,pos:[3,0,0.5]},
  art:{name:'Creator Studio',icon:'🎨',color:0xe657d4,pos:[8,0,1]},
  design:{name:'Maker Works',icon:'🛠️',color:0xf3a53b,pos:[-7,0,7]},
  music:{name:'Sound Stage',icon:'🎵',color:0x8d6de9,pos:[-2,0,7]},
  pe:{name:'Power Arena',icon:'🏃',color:0xff744f,pos:[3.5,0,7]},
  life:{name:'Life HQ',icon:'🧠',color:0x36b6c9,pos:[8,0,7]}
};
const BUILD_ITEMS=[
  {id:'desk',name:'Genius Desk',icon:'📚',cost:40,desc:'A study desk for your base.'},
  {id:'garden',name:'Knowledge Garden',icon:'🌳',cost:70,desc:'Grow a garden beside your base.'},
  {id:'robot',name:'Helper Robot',icon:'🤖',cost:110,desc:'A friendly robot companion.'},
  {id:'lab',name:'Mini Science Lab',icon:'🔬',cost:150,desc:'Add a lab wing to your base.'},
  {id:'tower',name:'Trophy Tower',icon:'🏆',cost:220,desc:'Build a tower showing your mastery.'},
  {id:'portal',name:'Challenge Portal',icon:'🌀',cost:300,desc:'A portal for expert challenges.'}
];
const defaultWorld=()=>({coins:0,earned:0,spent:0,owned:[],processedAttempts:[],dailyAwards:{},perfectAwards:[],player3d:{x:0,z:4}});
const read=(key,fallback={})=>{try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
let world=read(WORLD_KEY,defaultWorld());
const academy=()=>read(ACADEMY_KEY,{});

const canvas=document.getElementById('worldCanvas');
const tip=document.getElementById('worldTip');
const action=document.getElementById('worldAction');
const basePanel=document.getElementById('basePanel');
const shop=document.getElementById('buildShop');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8dd8ff);
scene.fog=new THREE.Fog(0x8dd8ff,24,52);
const camera=new THREE.PerspectiveCamera(48,1,.1,100);
const hemi=new THREE.HemisphereLight(0xe9f7ff,0x4d6b34,2.2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,3.2);sun.position.set(-10,20,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);

const groundMat=new THREE.MeshStandardMaterial({color:0x78c766,roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(36,30),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const roadMat=new THREE.MeshStandardMaterial({color:0xdcc797,roughness:1});
function road(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.03,d),roadMat);m.position.set(x,.015,z);m.receiveShadow=true;scene.add(m)}
road(0,2,2.7,25);road(0,-2.2,31,2.5);road(0,5.2,31,2.2);

function box(w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));m.castShadow=true;m.receiveShadow=true;return m}
function makeLabel(text,color='#ffffff'){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(10,18,48,.88)';x.fillRect(0,0,c.width,c.height);x.fillStyle=color;x.font='bold 42px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true});const s=new THREE.Sprite(mat);s.scale.set(3.8,.95,1);return s}
function roof(width,depth,color){const g=new THREE.ConeGeometry(Math.max(width,depth)*.72,1.35,4);g.rotateY(Math.PI/4);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.8}));m.castShadow=true;return m}

const buildingMeshes=[];
for(const [id,s] of Object.entries(SUBJECTS)){
  const group=new THREE.Group();
  const body=box(3.1,2.4,2.8,s.color);body.position.y=1.2;group.add(body);
  const r=roof(3.1,2.8,0x24335c);r.position.y=3.05;group.add(r);
  const door=box(.65,1.2,.12,0xf5d76e);door.position.set(0,.6,1.46);group.add(door);
  const label=makeLabel(s.name);label.position.set(0,3.95,0);group.add(label);
  group.position.set(...s.pos);group.userData={subject:id,name:s.name};scene.add(group);buildingMeshes.push(group);
}

const base=new THREE.Group();
const baseBody=box(3.8,2.6,3.3,0x4e6ca8);baseBody.position.y=1.3;base.add(baseBody);
const baseRoof=roof(3.8,3.3,0x20335f);baseRoof.position.y=3.25;base.add(baseRoof);
const baseDoor=box(.75,1.3,.12,0xffdc72);baseDoor.position.set(0,.65,1.72);base.add(baseDoor);
const baseLabel=makeLabel('YOUR BASE','#ffe36b');baseLabel.position.set(0,4.15,0);base.add(baseLabel);
base.position.set(0,0,-.4);base.userData={base:true,name:'Your Base'};scene.add(base);buildingMeshes.push(base);

function tree(x,z,scale=1){const g=new THREE.Group();const trunk=box(.35,1.1,.35,0x7a4f2e);trunk.position.y=.55;g.add(trunk);const crown=new THREE.Mesh(new THREE.SphereGeometry(.85*scale,10,8),new THREE.MeshStandardMaterial({color:0x3f9b52,roughness:1}));crown.position.y=1.65;crown.castShadow=true;g.add(crown);g.position.set(x,0,z);scene.add(g)}
[[-11,-8],[11,-7],[-11,8],[11,8],[-5,3],[5,3],[-5,-4],[5,-4]].forEach(p=>tree(...p,.9));

function makeAvatar(){const g=new THREE.Group();const torso=box(.72,1,.45,0x6450e6);torso.position.y=1.15;g.add(torso);const head=box(.62,.62,.62,0xf0b48e);head.position.y=1.95;g.add(head);const hair=box(.65,.18,.65,0x34263e);hair.position.y=2.28;g.add(hair);const leg1=box(.27,.75,.3,0x243d76);leg1.position.set(-.2,.38,0);g.add(leg1);const leg2=leg1.clone();leg2.position.x=.2;g.add(leg2);g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
const player=makeAvatar();player.position.set(world.player3d?.x||0,0,world.player3d?.z||4);scene.add(player);

function applyOwned(){
  const old=scene.getObjectByName('baseExtras');if(old)scene.remove(old);
  const extras=new THREE.Group();extras.name='baseExtras';const owned=world.owned||[];
  if(owned.includes('garden')){tree(-2.6,-.1,.65);tree(2.6,-.1,.65)}
  if(owned.includes('robot')){const r=box(.55,.75,.45,0xb6c8dc);r.position.set(2.35,.38,-1.65);extras.add(r)}
  if(owned.includes('lab')){const l=box(1.5,1.5,1.7,0x36b9bb);l.position.set(-2.65,.75,-.5);extras.add(l)}
  if(owned.includes('tower')){const t=box(.9,3,.9,0x7656ff);t.position.set(2.6,1.5,-.7);extras.add(t)}
  if(owned.includes('portal')){const torus=new THREE.Mesh(new THREE.TorusGeometry(.75,.13,10,32),new THREE.MeshStandardMaterial({color:0x56ebff,emissive:0x1a8290,emissiveIntensity:2}));torus.rotation.y=Math.PI/2;torus.position.set(-2.6,1.1,-1.8);extras.add(torus)}
  extras.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(extras);
}
applyOwned();

const keys={};let nearby=null,last=performance.now();
function saveWorld(){world.player3d={x:player.position.x,z:player.position.z};write(WORLD_KEY,world);syncHud()}
function syncHud(){const a=academy(),xp=Number(a.xp||0);document.getElementById('worldLevel').textContent=Math.max(1,Math.floor(xp/250)+1);document.getElementById('worldCoins').textContent=Number(world.coins||0);const sc=document.getElementById('shopCoins');if(sc)sc.textContent=Number(world.coins||0)}
function distanceTo(g){const dx=player.position.x-g.position.x,dz=player.position.z-g.position.z;return Math.hypot(dx,dz)}
function nearestInteractable(){let best=null,dist=Infinity;for(const b of buildingMeshes){const d=distanceTo(b);if(d<dist){best=b;dist=d}}return dist<3.3?best:null}
function launch(subject){const btn=document.querySelector(`[data-subject="${subject}"]`);if(btn)btn.click()}
function interact(){if(!nearby)return;if(nearby.userData.base)openBase();else launch(nearby.userData.subject)}

function openBase(){renderShop();basePanel.hidden=false}
function closeBase(){basePanel.hidden=true}
function renderShop(){syncHud();shop.innerHTML=BUILD_ITEMS.map(item=>{const owned=(world.owned||[]).includes(item.id);return `<button class="build-item ${owned?'owned':''}" data-build-item="${item.id}" ${owned?'disabled':''}><span class="build-icon">${item.icon}</span><strong>${owned?'✓ ':''}${item.name}</strong><small>${item.desc}</small><span class="cost">${owned?'Built':`🪙 ${item.cost}`}</span></button>`}).join('')}
function buy(id){const item=BUILD_ITEMS.find(x=>x.id===id);if(!item||(world.owned||[]).includes(id))return;if(Number(world.coins||0)<item.cost){toast('Not enough KS2C yet');return}world.coins-=item.cost;world.spent=Number(world.spent||0)+item.cost;world.owned=[...(world.owned||[]),id];saveWorld();renderShop();applyOwned();toast(`${item.name} built!`)}
function toast(text){let el=document.getElementById('coinToast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}

function processRewards(){
  const a=academy(), attempts=a.attempts||[], known=new Set(world.processedAttempts||[]);let changed=false;
  for(const at of attempts.slice(-150)){if(!known.has(at.id)){known.add(at.id);world.processedAttempts.push(at.id);if(at.correct){world.coins=Number(world.coins||0)+2;world.earned=Number(world.earned||0)+2}changed=true}}
  world.processedAttempts=world.processedAttempts.slice(-1500);
  const daily=a.daily||{};if(daily.date){for(const subject of daily.done||[]){const k=`${daily.date}:${subject}`;if(!world.dailyAwards[k]){world.dailyAwards[k]=1;world.coins=Number(world.coins||0)+25;world.earned=Number(world.earned||0)+25;changed=true}}}
  const last10=attempts.slice(-10);if(last10.length===10&&last10.every(x=>x.correct)&&new Set(last10.map(x=>x.subject)).size===1){const sig=last10.map(x=>x.id).join('|');if(!(world.perfectAwards||[]).includes(sig)){world.perfectAwards=[...(world.perfectAwards||[]),sig].slice(-40);world.coins=Number(world.coins||0)+20;world.earned=Number(world.earned||0)+20;changed=true}}
  if(changed)saveWorld();else syncHud();
}

function update(dt){
  let dx=0,dz=0;if(keys.ArrowLeft||keys.a)dx-=1;if(keys.ArrowRight||keys.d)dx+=1;if(keys.ArrowUp||keys.w)dz-=1;if(keys.ArrowDown||keys.s)dz+=1;
  if(dx||dz){const l=Math.hypot(dx,dz);dx/=l;dz/=l;const speed=4.2;const nx=THREE.MathUtils.clamp(player.position.x+dx*speed*dt,-12,12),nz=THREE.MathUtils.clamp(player.position.z+dz*speed*dt,-10,10);player.position.x=nx;player.position.z=nz;player.rotation.y=Math.atan2(dx,dz);}
  nearby=nearestInteractable();
  if(nearby){tip.hidden=false;tip.textContent=nearby.userData.base?'Your Base · press ENTER':`${nearby.userData.name} · press ENTER`;action.hidden=false;action.textContent=nearby.userData.base?'BUILD':'ENTER'}else{tip.hidden=true;action.hidden=true}
  const target=new THREE.Vector3(player.position.x+7,7.8,player.position.z+10.5);camera.position.lerp(target,1-Math.pow(.002,dt));camera.lookAt(player.position.x,1.1,player.position.z-1.1);
}
function resize(){const r=canvas.getBoundingClientRect();const w=Math.max(320,Math.floor(r.width)),h=Math.max(360,Math.floor(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(frame)}

function bindHold(button,key){if(!button)return;const on=e=>{e.preventDefault();keys[key]=true};const off=e=>{e.preventDefault();keys[key]=false};button.addEventListener('pointerdown',on);button.addEventListener('pointerup',off);button.addEventListener('pointercancel',off);button.addEventListener('pointerleave',off)}
document.querySelectorAll('[data-move]').forEach(b=>bindHold(b,b.dataset.move));
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){keys[e.key]=true;e.preventDefault()}if((e.key==='Enter'||e.key==='e')&&!basePanel.hidden===false)interact()});
window.addEventListener('keyup',e=>{keys[e.key]=false});
action?.addEventListener('click',interact);document.getElementById('openBase')?.addEventListener('click',openBase);document.getElementById('closeBase')?.addEventListener('click',closeBase);shop?.addEventListener('click',e=>{const b=e.target.closest('[data-build-item]');if(b)buy(b.dataset.buildItem)});

const observer=new MutationObserver(()=>{const worldView=document.querySelector('[data-view="world"]');const active=worldView&&!worldView.hidden;document.body.classList.toggle('world-active',active);if(active){processRewards();resize();setTimeout(resize,50)}});observer.observe(document.querySelector('main.app'),{subtree:true,attributes:true,attributeFilter:['hidden']});
window.addEventListener('resize',resize);window.addEventListener('storage',()=>{world=read(WORLD_KEY,defaultWorld());syncHud();applyOwned()});
processRewards();syncHud();resize();document.body.classList.add('world-active');requestAnimationFrame(frame);
