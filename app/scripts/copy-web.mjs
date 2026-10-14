// 웹사이트 파일을 앱(www)으로 복사합니다.
// 앱 안에서는 AdSense를 쓸 수 없어서(구글 정책) 광고 스크립트와 오프라인용 서비스워커 등록을 뺍니다.
import fs from "node:fs";
import path from "node:path";

const APP = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SITE = path.resolve(APP, "..");
const OUT = path.join(APP, "www");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(SITE, "assets"), path.join(OUT, "assets"), { recursive: true });
fs.copyFileSync(path.join(SITE, "manifest.webmanifest"), path.join(OUT, "manifest.webmanifest"));

let pages = 0;
for (const f of fs.readdirSync(SITE)) {
  if (!f.endsWith(".html")) continue;
  let html = fs.readFileSync(path.join(SITE, f), "utf8");
  html = html.replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com[^>]*><\/script>\n?/g, "");
  fs.writeFileSync(path.join(OUT, f), html);
  pages++;
}
// 앱에서는 광고 자리와 서비스워커를 쓰지 않음
const common = path.join(OUT, "assets/common.js");
fs.writeFileSync(common, fs.readFileSync(common, "utf8")
  .replace('const AD_SLOT = "', 'const AD_SLOT = "" && "')
  .replace('if ("serviceWorker" in navigator)', 'if (false)'));
console.log(`copied ${pages} pages to ${path.relative(SITE, OUT)}`);
