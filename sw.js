/* 月汐 SULEN · 离线缓存
   页面（HTML）走网络优先，避免改了首页还看到旧的；
   静态资源走缓存优先，断网也能用。 */
const CACHE = "yuexi-v8";
const ASSETS = [
  "./", "./index.html", "./about.html", "./manifest.json",
  "./assets/base.css", "./assets/engine.js", "./assets/pwa.js", "./assets/icon.svg",
  "./games/_template/index.html", "./games/_template/game.js",
  "./games/zz-test/index.html",
  "./games/cyrene/icon-192.png",
  "./games/cyrene/icon-512.png",
  "./games/cyrene/index.html",
  "./games/cyrene/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 体积大的 Godot 导出不走缓存，避免手机存 80MB
const NO_CACHE = /\/games\/buzd\//;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (NO_CACHE.test(new URL(req.url).pathname)) return;

  // 页面：先要网络的，失败了再用缓存
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // 其他资源：缓存优先
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => new Response("", { status: 504 }))
    )
  );
});
