const CACHE='genius-academy-v16-full-map-readable-games';
const CORE=[
  '/',
  '/academy.css','/academy.js','/question-safety.js','/mission-quality.js','/chores.js',
  '/game-world.css','/game-world.js','/world.css','/world2d.js','/world-nav.js','/parent-settings.js',
  '/engagement.css','/engagement-core.js','/engagement-extra.js','/mini-games.css','/mini-games.js',
  '/mission-arcade.css','/mission-arcade.js','/manifest.webmanifest',
  '/assets/genius-academy-reference-map.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});await Promise.all(clients.map(async client=>{try{const url=new URL(client.url);if(url.origin!==self.location.origin)return;if(url.searchParams.get('gaV16')==='1')return;url.searchParams.set('gaV16','1');await client.navigate(url.href);}catch{}}));})());});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.pathname.startsWith('/api/'))return;if(event.request.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:'no-store'});const cache=await caches.open(CACHE);await cache.put('/',response.clone());return response;}catch{return (await caches.match('/'))||Response.error();}})());return;}event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:'no-cache'});if(response&&response.ok&&url.origin===self.location.origin){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}catch{return (await caches.match(event.request))||Response.error();}})());});