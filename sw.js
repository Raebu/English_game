const CACHE='genius-academy-v9';
const CORE=['/','/academy.css','/academy.js','/question-safety.js','/mission-quality.js','/chores.js','/game-world.css','/game-world.js','/world.css','/world3d.js','/world-nav.js','/parent-settings.js','/engagement.css','/engagement-core.js','/engagement-extra.js','/manifest.webmanifest','/models/genius-academy.glb'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).pathname.startsWith('/api/'))return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))});
