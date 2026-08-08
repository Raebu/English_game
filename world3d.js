import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const WORLD_KEY='ks2-world-v1';
const ACADEMY_KEY='ks2genius-v1';
const read=(k,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(k)||'{}')}}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const defaultWorld=()=>({coins:0,earned:0,spent:0,owned:[],player3d:{x:0,z:15}});
let world=read(WORLD_KEY,defaultWorld());

const SUBJECTS={
  maths:{name:'Math Manor',icon:'➗',pos:new THREE.Vector3(-8.4,0,-4.0)},
  english:{name:'Story Keep',icon:'📚',pos:new THREE.Vector3(0,0,-1.8)},
  science:{name:'Science Lab',icon:'🔬',pos:new THREE.Vector3(-7.8,0,4.7)},
  computing:{name:'Code Core',icon:'💻',pos:new THREE.Vector3(4.6,0,10.0)},
  geography:{name:'Explorer Lodge',icon:'🌍',pos:new THREE.Vector3(-2.3,0,10.2)},
  history:{name:'Time Temple',icon:'🏺',pos:new THREE.Vector3(12.2,0,7.0)},
  french:{name:'French Café',icon:'🇫🇷',pos:new THREE.Vector3(-12.0,0,9.0)},
  art:{name:'Creator Studio',icon:'🎨',pos:new THREE.Vector3(12.4,0,-1.5)},
  design:{name:'Maker Works',icon:'🛠️',pos:new THREE.Vector3(-12.5,0,-2.0)},
  music:{name:'Sound Stage',icon:'🎵',pos:new THREE.Vector3(7.2,0,1.0)},
  pe:{name:'Power Arena',icon:'🏃',pos:new THREE.Vector3(10.5,0,10.0)},
  life:{name:'Think Tower',icon:'💡',pos:new THREE.Vector3(8.5,0,5.0)}
};

const BUILD_ITEMS=[
{id:'desk',name:'Genius Desk',icon:'📚',cost:40,desc:'A study desk for your academy base.'},
{id:'garden',name:'Knowledge Garden',icon:'🌳',cost:70,desc:'A colourful knowledge garden.'},
{id:'robot',name:'Helper Robot',icon:'🤖',cost:110,desc:'A friendly learning companion.'},
{id:'lab',name:'Mini Science Lab',icon:'🔬',cost:150,desc:'A glowing experiment wing.'},
{id:'tower',name:'Trophy Tower',icon:'🏆',cost:220,desc:'Display your mastery trophies.'},
{id:'portal',name:'Challenge Portal',icon:'🌀',cost:300,desc:'Unlock an expert challenge portal.'}
];

const canvas=document.getElementById('worldCanvas');
const nearbyCard=document.getElementById('worldNearby');
const nearbyName=document.getElementById('nearbyName');
const nearbyIcon=document.getElementById('nearbyIcon');
const nearbyAction=document.getElementById('nearbyAction');
const action=document.getElementById('worldAction');
const gestureHint=document.getElementById('gestureHint');
const basePanel=document.getElementById('basePanel');
const shop=document.getElementById('buildShop');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.setClearColor(0x61bdf7);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x63bff7);
scene.fog=new THREE.Fog(0xa8ddfb,140,480);
const camera=new THREE.PerspectiveCamera(46,1,.08,650);
const hemi=new THREE.HemisphereLight(0xe5f7ff,0x4b783f,2.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1cf,4.4);sun.position.set(-18,30,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const fill=new THREE.DirectionalLight(0xaad9ff,1.2);fill.position.set(16,12,-20);scene.add(fill);

let academyModel=null;
const academyMeshes=[];
const loader=new GLTFLoader();
loader.load('/models/genius-academy.glb',gltf=>{
  academyModel=gltf.scene;
  academyModel.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    if(Array.isArray(o.material))o.material=o.material.map(m=>m?.clone?.()||m);
    else if(o.material?.clone)o.material=o.material.clone();
    academyMeshes.push(o);
  });
  scene.add(academyModel);
  document.body.classList.add('academy-model-ready');
},undefined,err=>{console.error('Failed to load Genius Academy Blender world.',err);buildFallback();});

function fallbackMaterial(c){return new THREE.MeshStandardMaterial({color:c,roughness:.8});}
function buildFallback(){
  const ground=new THREE.Mesh(new THREE.CircleGeometry(40,64),fallbackMaterial(0x70c85e));ground.rotation.x=-Math.PI/2;scene.add(ground);
  const path=new THREE.Mesh(new THREE.BoxGeometry(2,0.08,38),fallbackMaterial(0xe3c38c));path.position.z=3;scene.add(path);
  for(const [id,s] of Object.entries(SUBJECTS)){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(3,2.5,3),fallbackMaterial(id==='life'?0x52b9bb:0xe8d2a6));body.position.y=1.25;g.add(body);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(2.4,1.8,4),fallbackMaterial(id==='science'?0x7d43a7:0x315fad));roof.rotation.y=Math.PI/4;roof.position.y=3.3;g.add(roof);
    g.position.copy(s.pos);scene.add(g);
  }
}

function avatar(){
  const g=new THREE.Group();
  const mat=(c,r=.65)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
  add(new THREE.CapsuleGeometry(.38,.85,5,12),mat(0x176bd3),0,1.25,0);
  add(new THREE.SphereGeometry(.50,20,14),mat(0xf0b07e),0,2.25,0);
  const hair=add(new THREE.SphereGeometry(.53,16,10),mat(0x633019),0,2.48,.02);hair.scale.y=.65;
  add(new THREE.BoxGeometry(.78,.95,.32),mat(0x8b552c),0,1.28,.38);
  for(const x of [-.22,.22])add(new THREE.CapsuleGeometry(.12,.48,4,8),mat(0x18365d),x,.48,0);
  const shoes=mat(0xf5f7ff);for(const x of [-.22,.22])add(new THREE.BoxGeometry(.34,.18,.54),shoes,x,.12,-.08);
  g.scale.set(.82,.82,.82);return g;
}
const player=avatar();
player.position.set(world.player3d?.x||0,0,world.player3d?.z||15);scene.add(player);

let cameraDistance=13.5;
let cameraHeight=9.2;
const MIN_ZOOM=6.5;
const MAX_ZOOM=190;
let moveVector=new THREE.Vector2();
let targetPoint=null;
let nearby=null;
const clock=new THREE.Clock();
const pointers=new Map();
let pinchStart=0,pinchDistanceStart=0;
let gestureDismissed=false;

function heightForZoom(distance){
  if(distance<=38)return THREE.MathUtils.clamp(5.8+(distance-6.5)*.48,5.8,21);
  return THREE.MathUtils.clamp(21+(distance-38)*.44,21,88);
}
function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

function showGestureDone(){if(gestureDismissed)return;gestureDismissed=true;gestureHint?.classList.add('hide');setTimeout(()=>{if(gestureHint)gestureHint.hidden=true},550);}
function startSubject(id){const btn=document.querySelector(`[data-subject="${id}"]`);if(btn){btn.click();return;}if(window.startLevel)window.startLevel(id);}

function updateNearby(){
  let best=null,bestD=999;
  for(const [id,s] of Object.entries(SUBJECTS)){const d=player.position.distanceTo(s.pos);if(d<bestD){bestD=d;best={id,...s,d};}}
  nearby=bestD<4.2?best:null;
  if(nearby){nearbyCard.hidden=false;nearbyName.textContent=nearby.name;nearbyIcon.textContent=nearby.icon;nearbyAction.textContent=nearby.d<2.5?'Ready to enter':'Walk closer';action.hidden=nearby.d>=2.5;action.textContent=`Enter ${nearby.name}`;}
  else{nearbyCard.hidden=true;action.hidden=true;}
}
action?.addEventListener('click',()=>{if(nearby)startSubject(nearby.id);});
nearbyCard?.addEventListener('click',()=>{if(nearby){targetPoint=nearby.pos.clone();showGestureDone();}});

function pointerDown(e){
  canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});targetPoint=null;
  if(pointers.size===2){const p=[...pointers.values()];pinchStart=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);pinchDistanceStart=cameraDistance;moveVector.set(0,0);}
}
function pointerMove(e){
  const p=pointers.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
  if(pointers.size===1){const dx=p.x-p.startX,dy=p.y-p.startY,mag=Math.hypot(dx,dy);if(mag>8){moveVector.set(dx,-dy).divideScalar(Math.max(60,mag));moveVector.clampLength(0,1);showGestureDone();}}
  else if(pointers.size===2){const ps=[...pointers.values()];const dist=Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y);if(pinchStart>0&&dist>8){cameraDistance=THREE.MathUtils.clamp(pinchDistanceStart*(pinchStart/dist),MIN_ZOOM,MAX_ZOOM);cameraHeight=heightForZoom(cameraDistance);showGestureDone();}}
}
function pointerUp(e){pointers.delete(e.pointerId);moveVector.set(0,0);if(pointers.size<2)pinchStart=0;}
canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
canvas.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=THREE.MathUtils.clamp(cameraDistance+e.deltaY*.05,MIN_ZOOM,MAX_ZOOM);cameraHeight=heightForZoom(cameraDistance);},{passive:false});

const groundRaycaster=new THREE.Raycaster();
canvas.addEventListener('click',e=>{
  if(pointers.size)return;
  const rect=canvas.getBoundingClientRect();const ndc=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  groundRaycaster.setFromCamera(ndc,camera);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const point=new THREE.Vector3();
  if(groundRaycaster.ray.intersectPlane(plane,point)){point.x=THREE.MathUtils.clamp(point.x,-24,24);point.z=THREE.MathUtils.clamp(point.z,-24,24);targetPoint=point;showGestureDone();}
});

const sightRaycaster=new THREE.Raycaster();
let fadedMeshes=[];
function materialsOf(mesh){return Array.isArray(mesh.material)?mesh.material:[mesh.material];}
function restoreOccluders(){
  for(const mesh of fadedMeshes){for(const m of materialsOf(mesh)){if(!m?.userData?.gaFadeState)continue;const s=m.userData.gaFadeState;m.transparent=s.transparent;m.opacity=s.opacity;m.depthWrite=s.depthWrite;delete m.userData.gaFadeState;}}
  fadedMeshes=[];
}
function fadeMesh(mesh){
  if(!mesh?.isMesh)return;
  let changed=false;
  for(const m of materialsOf(mesh)){
    if(!m||m.userData.gaFadeState)continue;
    m.userData.gaFadeState={transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite};
    m.transparent=true;m.opacity=Math.min(m.opacity??1,.20);m.depthWrite=false;m.needsUpdate=true;changed=true;
  }
  if(changed)fadedMeshes.push(mesh);
}
function applyOcclusionFade(){
  restoreOccluders();
  if(!academyModel)return;
  const target=new THREE.Vector3(player.position.x,player.position.y+1.55,player.position.z);
  const toTarget=target.clone().sub(camera.position);const maxDistance=toTarget.length();if(maxDistance<.5)return;
  sightRaycaster.set(camera.position,toTarget.normalize());sightRaycaster.far=Math.max(0,maxDistance-.45);
  const hits=sightRaycaster.intersectObjects(academyMeshes,false);
  const seen=new Set();
  for(const hit of hits){if(seen.has(hit.object))continue;seen.add(hit.object);fadeMesh(hit.object);if(seen.size>=8)break;}
}

const collisionRaycaster=new THREE.Raycaster();
function resolveCameraPosition(desired,target){
  if(!academyModel||cameraDistance>48)return desired;
  const direction=desired.clone().sub(target);const length=direction.length();if(length<1)return desired;
  collisionRaycaster.set(target,direction.normalize());collisionRaycaster.far=length;
  const hits=collisionRaycaster.intersectObjects(academyMeshes,false);
  if(!hits.length)return desired;
  const first=hits[0];
  if(first.distance>=length-1.0)return desired;
  const safeDistance=Math.max(3.1,first.distance-1.0);
  const safe=target.clone().add(direction.normalize().multiplyScalar(safeDistance));
  safe.y=Math.max(safe.y,first.point.y+3.8,target.y+6.4);
  return safe;
}

function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);let moving=false;let vx=0,vz=0;
  if(moveVector.lengthSq()>.005){vx=moveVector.x;vz=-moveVector.y;moving=true;targetPoint=null;}
  else if(targetPoint){const dir=targetPoint.clone().sub(player.position);dir.y=0;if(dir.length()>1.15){dir.normalize();vx=dir.x;vz=dir.z;moving=true;}else targetPoint=null;}
  if(moving){
    const speed=5.0;player.position.x+=vx*speed*dt;player.position.z+=vz*speed*dt;player.position.x=THREE.MathUtils.clamp(player.position.x,-24,24);player.position.z=THREE.MathUtils.clamp(player.position.z,-24,24);
    const desired=Math.atan2(vx,vz);player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,desired,.18);player.position.y=Math.abs(Math.sin(performance.now()*.009))*.05;
  }else player.position.y=THREE.MathUtils.lerp(player.position.y,0,.2);

  world.player3d={x:player.position.x,z:player.position.z};if(Math.random()<.025)write(WORLD_KEY,world);updateNearby();

  const overview=Math.max(0,(cameraDistance-38)/(MAX_ZOOM-38));
  const lookAhead=THREE.MathUtils.lerp(4,18,overview);
  const target=new THREE.Vector3(player.position.x,player.position.y+1.55,player.position.z-THREE.MathUtils.lerp(1.8,6,overview));
  const desiredCamera=new THREE.Vector3(player.position.x,target.y+cameraHeight,player.position.z+cameraDistance);
  const resolvedCamera=resolveCameraPosition(desiredCamera,target);
  camera.position.lerp(resolvedCamera,.10);
  camera.lookAt(player.position.x,THREE.MathUtils.lerp(1.45,0,overview),player.position.z-lookAhead);
  if(cameraDistance<65)applyOcclusionFade();else restoreOccluders();
  renderer.render(scene,camera);
}
animate();

function refreshHUD(){
  world=read(WORLD_KEY,world);const academy=read(ACADEMY_KEY,{});const xp=academy.xp||academy.totalXP||0;const level=Math.max(1,Math.floor(xp/180)+1);
  document.querySelectorAll('#worldCoins,#shopCoins').forEach(el=>el.textContent=world.coins||0);const lv=document.getElementById('worldLevel');if(lv)lv.textContent=level;
}
setInterval(refreshHUD,800);refreshHUD();

function renderShop(){
  if(!shop)return;world=read(WORLD_KEY,world);shop.innerHTML='';
  BUILD_ITEMS.forEach(item=>{const owned=(world.owned||[]).includes(item.id);const b=document.createElement('button');b.className='build-item'+(owned?' owned':'');b.disabled=owned||world.coins<item.cost;b.innerHTML=`<span class="build-icon">${item.icon}</span><strong>${item.name}</strong><small>${item.desc}</small><span class="cost">${owned?'✓ Built':`🪙 ${item.cost}`}</span>`;b.onclick=()=>{world=read(WORLD_KEY,world);if(world.coins<item.cost||world.owned.includes(item.id))return;world.coins-=item.cost;world.spent=(world.spent||0)+item.cost;world.owned.push(item.id);write(WORLD_KEY,world);renderShop();refreshHUD();};shop.appendChild(b);});
}
document.getElementById('openBase')?.addEventListener('click',()=>{basePanel.hidden=false;renderShop();});
document.getElementById('closeBase')?.addEventListener('click',()=>basePanel.hidden=true);
window.addEventListener('storage',refreshHUD);window.addEventListener('ks2coins',refreshHUD);
