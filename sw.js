// 오프라인에서도 계산기를 쓸 수 있도록 페이지를 캐시합니다 (네트워크 우선).
const CACHE = "taxhelper-v4";
const PAGES = ["./", "index.html", "salary.html", "freelancer.html", "hourly.html", "severance.html", "vat.html", "business-tax.html", "vat-pay.html", "guide.html",
  "assets/style.css", "assets/common.js", "assets/salary-calc.js", "assets/partners.js", "assets/icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PAGES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
