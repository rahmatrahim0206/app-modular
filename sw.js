
  const CACHE_NAME = 'dapohub-cache-v3';
  const ASSETS_TO_CACHE = [\n    './',\n    './index.html',\n    './manifest.json',\n    './css/style.css',\n    './js/utils.js',\n    './js/storage.js',\n    './js/otp.js',\n    './js/links.js',\n    './js/pdf-tools.js',\n    './js/ping-tools.js',\n    './js/speedtest.js',\n    './js/it-tools.js',\n    './js/ui.js',\n    './js/app.js',\n    'https://cdn.tailwindcss.com',\n    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',\n    'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',\n    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',\n    'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',\n    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'\n  ];
  self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS_TO_CACHE))));
  self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));
  self.addEventListener('fetch', (e) => {
    if (!e.request.url.startsWith('http')) return;
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match('./index.html'))));
  });
