// 极简 Service Worker：同源 GET 走「网络优先、缓存兜底」，
// 首次访问后即可离线打开应用外壳（演示票流程本就不依赖网络）。
const CACHE = "snapledger-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // 识别请求永远走网络

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then(
            (m) =>
              m ||
              (req.mode === "navigate"
                ? caches.match(self.registration.scope + "app.html")
                : undefined)
          )
      )
  );
});
