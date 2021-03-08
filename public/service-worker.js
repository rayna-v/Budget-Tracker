const CACHE_NAME = "Static Cache";
const DATA_CACHE_NAME = "Data Cache";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

// install step that caches assets
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Files pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE)
        })
    );
    evt.waitUntil(
        caches.open(DATA_CACHE_NAME).then(cache => {
            console.log("Data pre-cached successfully!");
            return cache.add('/api/transaction')
        })
    );

    self.skipWaiting();
});

// activation step that manages old caches and will control all pages under its scope after service worker is activated
self.addEventListener("activate", (evt) => {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                // maps over array of cache keys and deletes any old cache for that key
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data: ", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // causes the pages to be controlled immediately 
    self.clients.claim();
})

// fetch
self.addEventListener("fetch", (evt) => {
    const { url } = evt.request;
    if (url.includes("/api/transaction")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        console.log(err)
                        return cache.match(evt.request);
                    });
            })
                .catch(err => {
                    console.log(err)
                })
        )
        return;
    }

    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            // checks cache first for requests; sends a fetch request if there is no match
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
});