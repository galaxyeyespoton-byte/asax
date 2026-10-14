// 연봉별 실수령액 페이지(salary-XXXX.html)와 sitemap.xml을 만듭니다.
// 사용법: node tools/gen-salary-pages.mjs   (요율을 바꾼 뒤 다시 실행)
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
// 사이트 주소. 도메인을 연결하면 tools/site-url.txt 한 줄만 바꾸고 다시 실행하세요.
const BASE = fs.readFileSync(path.join(ROOT, "tools/site-url.txt"), "utf8").trim().replace(/\/?$/, "/");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// 브라우저용 계산 코드를 그대로 불러와 같은 결과를 보장
const ctx = { document: { addEventListener() {} }, console };
vm.createContext(ctx);
vm.runInContext(read("assets/common.js") + "\n" + read("assets/salary-calc.js") +
  "\nthis.calcSalary = calcSalary; this.koreanMoney = koreanMoney; this.marginalRate = marginalRate; this.RATES = RATES;", ctx);
const { calcSalary, koreanMoney, marginalRate, RATES } = ctx;

const AMOUNTS = [];
for (let m = 2000; m <= 6000; m += 200) AMOUNTS.push(m);
for (let m = 6500; m <= 10000; m += 500) AMOUNTS.push(m);
AMOUNTS.push(12000, 15000);

const n = (v) => Math.round(v).toLocaleString("ko-KR");
const man = (v) => `${n(Math.round(v / 1e4))}만원`;
const label = (m) => (m >= 10000 ? `${m / 10000 % 1 ? (m / 10000).toFixed(1) : m / 10000}억` : `${m}만`);

const tpl = read("vat.html");
const head = tpl.slice(0, tpl.indexOf("<body>\n") + 7);
function pageHead(title, desc, file) {
  return head
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
    .replaceAll(/https:\/\/[^"]*vat\.html/g, BASE + file)
    .replace('<script src="assets/common.js" defer></script>', '<script src="assets/common.js" defer></script>\n<script src="assets/salary-calc.js" defer></script>');
}

function page(m, i) {
  const annual = m * 1e4;
  const r = calcSalary(annual, 200000, 1, 0);
  const file = `salary-${m}.html`;
  const title = `연봉 ${label(m)}원 실수령액 2026 · 월 ${man(r.net)} | 세금 도우미`;
  const desc = `2026년 연봉 ${label(m)}원의 월 실수령액은 약 ${n(r.net)}원입니다. 국민연금·건강보험·고용보험·소득세 공제 내역과 부양가족별 실수령액을 확인하세요.`;
  const yearDed = r.deductions * 12;
  const rate = Math.round(marginalRate(r.base) * 100);
  const fam = [[1, 0, "본인만"], [2, 0, "배우자 공제"], [3, 1, "배우자 + 자녀 1명"], [4, 2, "배우자 + 자녀 2명"]]
    .map(([f, k, t]) => { const x = calcSalary(annual, 200000, f, k); return `<tr><td>${t}</td><td>${n(x.incomeTax + x.local)}</td><td>${n(x.net)}</td></tr>`; }).join("");
  const near = AMOUNTS.slice(Math.max(0, i - 3), i + 4)
    .map((a) => { const x = calcSalary(a * 1e4, 200000, 1, 0);
      return `<tr${a === m ? ' class="hl"' : ""}><td>${a === m ? `${label(a)}` : `<a href="salary-${a}.html">${label(a)}</a>`}</td><td>${n(x.monthly)}</td><td>${n(x.net)}</td></tr>`; }).join("");
  const prev = AMOUNTS[i - 1], next = AMOUNTS[i + 1];
  const pensionNote = r.monthly - 200000 > RATES.pensionMax
    ? `월 과세소득이 국민연금 상한(${man(RATES.pensionMax)})을 넘어서 국민연금은 상한액 기준으로만 냅니다.` : "";

  return pageHead(title, desc, file) + `<main class="wrap">
  <h1>연봉 ${label(m)}원 실수령액 (2026년)</h1>
  <p class="lead">2026년 4대보험 요율과 소득세를 반영한 연봉 ${label(m)}원의 실제 월급입니다.</p>

  <div class="card result">
    <div class="label">월 실수령액</div>
    <div class="big">${n(r.net)}원</div>
    <div class="sub">세전 월 ${n(r.monthly)}원 · 연 실수령 약 ${koreanMoney(Math.round(r.net * 12 / 1e4) * 1e4)} · 공제율 ${(r.deductions / r.monthly * 100).toFixed(1)}%</div>
    <div class="actions"><button type="button" id="share">📤 결과 공유</button></div>
  </div>

  <div class="card">
    <h2>월 공제 내역</h2>
    <table class="breakdown">
      <tr><td>월 급여 (세전)</td><td>${n(r.monthly)}원</td></tr>
      <tr><td>국민연금 (4.75%)</td><td class="minus">-${n(r.pension)}원</td></tr>
      <tr><td>건강보험 (3.595%)</td><td class="minus">-${n(r.health)}원</td></tr>
      <tr><td>장기요양보험</td><td class="minus">-${n(r.care)}원</td></tr>
      <tr><td>고용보험 (0.9%)</td><td class="minus">-${n(r.emp)}원</td></tr>
      <tr><td>소득세</td><td class="minus">-${n(r.incomeTax)}원</td></tr>
      <tr><td>지방소득세</td><td class="minus">-${n(r.local)}원</td></tr>
      <tr class="total"><td>실수령액</td><td>${n(r.net)}원</td></tr>
    </table>
    <p class="note">비과세 식대 월 20만원, 부양가족 1명(본인) 기준입니다. <a href="salary.html?salary=${annual}">내 조건(비과세·부양가족)으로 다시 계산하기 →</a></p>
  </div>

  <div class="ad"></div>

  <div class="card content">
    <h2>연봉 ${label(m)}원, 한 달에 얼마 받나요?</h2>
    <p>연봉 ${label(m)}원을 12개월로 나누면 세전 월급은 <b>${n(r.monthly)}원</b>입니다. 여기서 4대보험 <b>${n(r.pension + r.health + r.care + r.emp)}원</b>과 세금 <b>${n(r.incomeTax + r.local)}원</b>이 빠져, 통장에 들어오는 돈은 약 <b>${n(r.net)}원</b>입니다.</p>
    <p>1년 동안 공제로 나가는 돈은 약 ${koreanMoney(Math.round(yearDed / 1e4) * 1e4)}이고, 과세표준 기준 한계세율은 <b>${rate}%</b> 구간입니다. ${pensionNote}</p>
    <p>시급으로 환산하면(월 209시간 기준) 세전 약 <b>${n(r.monthly / 209)}원</b>으로, 2026년 최저시급 10,320원의 약 ${(r.monthly / 209 / RATES.minWage).toFixed(1)}배입니다.</p>

    <h3>부양가족에 따라 달라지는 실수령액</h3>
    <div class="table-scroll"><table class="data">
      <tr><th>공제 조건</th><th>월 세금</th><th>월 실수령액</th></tr>${fam}
    </table></div>
    <p class="note">자녀는 8~20세 기준이며 자녀세액공제가 반영됩니다. 4대보험은 부양가족과 관계없이 같습니다.</p>

    <h3>비슷한 연봉과 비교</h3>
    <div class="table-scroll"><table class="data">
      <tr><th>연봉</th><th>월 세전</th><th>월 실수령액</th></tr>${near}
    </table></div>
    <p style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:0">
      ${prev ? `<a href="salary-${prev}.html">← 연봉 ${label(prev)}원</a>` : "<span></span>"}
      ${next ? `<a href="salary-${next}.html">연봉 ${label(next)}원 →</a>` : ""}
    </p>
  </div>

  <div class="ad"></div>

  <div class="card content">
    <h2>다른 연봉 실수령액 보기</h2>
    <p>${AMOUNTS.map((a) => (a === m ? `<b>${label(a)}</b>` : `<a href="salary-${a}.html">${label(a)}</a>`)).join(" · ")}</p>
  </div>
</main>

<script type="module">
document.getElementById("share").addEventListener("click", () => shareResult("연봉 ${label(m)}원 월 실수령액은 ${n(r.net)}원!"));
</script>
</body>
</html>
`;
}

AMOUNTS.forEach((m, i) => fs.writeFileSync(path.join(ROOT, `salary-${m}.html`), page(m, i)));

// sitemap: 고정 페이지 + 연봉별 페이지
const today = new Date().toISOString().slice(0, 10);
const fixed = ["", "salary.html", "freelancer.html", "business-tax.html", "vat-pay.html", "guide.html", "hourly.html", "severance.html", "vat.html", "about.html", "privacy.html"];
const urls = [...fixed, ...AMOUNTS.map((m) => `salary-${m}.html`)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${BASE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n") + "\n</urlset>\n");
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);
console.log(`${AMOUNTS.length} salary pages, ${urls.length} sitemap urls, base ${BASE}`);
