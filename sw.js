// MENTIS — service worker: la app funciona sin internet
const VERSION = 'mentis-v0.2.0';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'styles.css',
  'app.js', 'store.js', 'engine.js', 'generadores.js', 'ia.js', 'voz.js',
  'datos_paises.js', 'datos_vocab.js', 'datos_cultura.js',
  'fraunces.woff2', 'nunito.woff2',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  ...Array.from({ length: 8 }, (_, i) => `leylapi${i}.png`),
  ...Array.from({ length: 16 }, (_, i) => `kalipi${i}.png`),
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // las APIs externas no se guardan
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); return res;
    }).catch(() => caches.match('index.html')))
  );
});
