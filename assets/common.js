/* 세금 도우미 공통 스크립트 */

// ── 광고 설정 ───────────────────────────────────────────────
// AdSense에서 "디스플레이 광고 단위"를 만든 뒤 슬롯 ID(숫자)를 넣으면
// 페이지의 광고 자리(.ad)에 광고가 표시됩니다. 비워두면 자동 광고만 동작합니다.
const ADSENSE_CLIENT = "ca-pub-2484423746725349";
const AD_SLOT = "";

// ── 2026년 기준 요율 ────────────────────────────────────────
const RATES = {
  year: 2026,
  pension: 0.0475,            // 국민연금 근로자 (총 9.5%)
  pensionMin: 410000,         // 기준소득월액 하한 (2026.7~)
  pensionMax: 6590000,        // 기준소득월액 상한 (2026.7~)
  health: 0.03595,            // 건강보험 근로자 (총 7.19%)
  care: 0.1314,               // 장기요양 = 건강보험료 × 13.14%
  employment: 0.009,          // 고용보험 근로자
  minWage: 10320,             // 2026 최저시급
};

// 종합소득세 / 근로소득세 기본세율 (과세표준 상한, 세율, 누진공제)
const BRACKETS = [
  [14000000, 0.06, 0],
  [50000000, 0.15, 1260000],
  [88000000, 0.24, 5760000],
  [150000000, 0.35, 15440000],
  [300000000, 0.38, 19940000],
  [500000000, 0.40, 25940000],
  [1000000000, 0.42, 35940000],
  [Infinity, 0.45, 65940000],
];
function progressiveTax(base) {
  if (base <= 0) return 0;
  for (const [limit, rate, ded] of BRACKETS) if (base <= limit) return base * rate - ded;
}
function marginalRate(base) {
  for (const [limit, rate] of BRACKETS) if (base <= limit) return rate;
}

// ── 숫자 유틸 ───────────────────────────────────────────────
const floor10 = (n) => Math.floor(n / 10) * 10;
const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
const num = (n) => Math.round(n).toLocaleString("ko-KR");
function parseNum(v) { const n = Number(String(v).replace(/[^\d.]/g, "")); return isFinite(n) ? n : 0; }

// 1234567 → "123만 4,567원" 같은 읽기 쉬운 한글 금액
function koreanMoney(n) {
  n = Math.round(n);
  if (!n) return "";
  const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
  const parts = [];
  if (eok) parts.push(eok.toLocaleString() + "억");
  if (man) parts.push(man.toLocaleString() + "만");
  if (rest && !eok) parts.push(rest.toLocaleString());
  return parts.join(" ") + "원";
}

// 금액 입력칸: 쉼표 자동 + 아래에 한글 금액 표시
function moneyInput(el) {
  const k = document.querySelector(`[data-korean-for="${el.id}"]`);
  const fmt = () => {
    const n = parseNum(el.value);
    el.value = n ? n.toLocaleString("ko-KR") : "";
    if (k) k.textContent = koreanMoney(n);
  };
  el.addEventListener("input", fmt);
  fmt();
}

// ── URL 공유 상태 ──────────────────────────────────────────
function readParams(ids) {
  const p = new URLSearchParams(location.search);
  ids.forEach((id) => { if (p.has(id)) { const el = document.getElementById(id); if (el) el.value = p.get(id); } });
}
function writeParams(ids) {
  const p = new URLSearchParams();
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.value === "") return;
    const raw = el.type === "date" || el.tagName === "SELECT" || el.inputMode === "decimal";
    p.set(id, raw ? el.value : parseNum(el.value));
  });
  history.replaceState(null, "", "?" + p.toString());
}

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800);
}
async function shareResult(text) {
  const data = { title: document.title, text, url: location.href };
  if (navigator.share) {
    try { await navigator.share(data); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(text + "\n" + location.href); toast("결과를 복사했어요"); }
  catch (e) { toast("복사할 수 없어요. 주소창의 링크를 공유해 주세요"); }
}

// ── 공통 레이아웃 ──────────────────────────────────────────
const PAGES = [
  ["index.html", "홈"],
  ["salary.html", "연봉 실수령액"],
  ["freelancer.html", "3.3% 프리랜서"],
  ["business-tax.html", "자영업자 종소세"],
  ["vat-pay.html", "부가세 납부"],
  ["guide.html", "사장님 세금 가이드"],
  ["hourly.html", "시급·주휴수당"],
  ["severance.html", "퇴직금"],
  ["vat.html", "부가세 계산"],
];

// ── 개인사업자 세금 신고 일정 (매년 반복, 월은 1부터) ─────────
// 마감일이 토·일이면 다음 월요일로 미룹니다. 공휴일은 반영하지 않습니다.
const TAX_SCHEDULE = [
  { m: 1, d: 25, name: "부가세 확정신고", who: "일반과세자 (7~12월분) · 간이과세자 (1년분)" },
  { m: 2, d: 10, name: "사업장현황신고", who: "면세사업자" },
  { m: 4, d: 25, name: "부가세 예정고지 납부", who: "일반과세 개인사업자 (고지서 금액 납부)" },
  { m: 5, d: 31, name: "종합소득세 신고·납부", who: "모든 개인사업자·프리랜서 (성실신고확인대상은 6월 30일)" },
  { m: 7, d: 25, name: "부가세 확정신고", who: "일반과세자 (1~6월분)" },
  { m: 10, d: 25, name: "부가세 예정고지 납부", who: "일반과세 개인사업자 (고지서 금액 납부)" },
  { m: 11, d: 30, name: "종합소득세 중간예납", who: "개인사업자 (고지서 금액 납부)" },
];
function shiftWeekend(dt) {
  const w = dt.getDay();
  if (w === 6) dt.setDate(dt.getDate() + 2);
  if (w === 0) dt.setDate(dt.getDate() + 1);
  return dt;
}
function upcomingDeadlines(count = 3, from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const list = [];
  for (const y of [today.getFullYear(), today.getFullYear() + 1])
    for (const t of TAX_SCHEDULE) {
      const due = shiftWeekend(new Date(y, t.m - 1, t.d));
      if (due >= today) list.push({ ...t, due, dday: Math.round((due - today) / 86400000) });
    }
  return list.sort((a, b) => a.due - b.due).slice(0, count);
}
function renderDeadlines(el, count) {
  const fmt = (d) => `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} (${"일월화수목금토"[d.getDay()]})`;
  el.innerHTML = upcomingDeadlines(count).map((t) => `
    <div class="deadline"><div class="dday${t.dday <= 14 ? " soon" : ""}">${t.dday === 0 ? "D-DAY" : "D-" + t.dday}</div>
    <div><b>${t.name}</b><span>${fmt(t.due)} · ${t.who}</span></div></div>`).join("");
}
function renderChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const top = document.createElement("header");
  top.className = "top";
  top.innerHTML = `<div class="wrap"><a class="brand" href="index.html"><i>₩</i>세금 도우미</a>
    <button class="theme-btn" type="button" aria-label="화면 테마 바꾸기">🌓</button></div>`;
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `<div class="wrap">${PAGES.map(([h, t]) => `<a href="${h}" class="${h === here ? "on" : ""}">${t}</a>`).join("")}</div>`;
  document.body.prepend(nav);
  document.body.prepend(top);
  const on = nav.querySelector(".on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });

  const foot = document.createElement("footer");
  foot.innerHTML = `<div>${RATES.year}년 기준 요율로 계산한 추정치입니다. 실제 금액은 회사·개인 상황에 따라 다를 수 있습니다.</div>
    <div style="margin-top:8px"><a href="about.html">소개</a>·<a href="privacy.html">개인정보처리방침</a></div>
    <div style="margin-top:8px">© 세금 도우미</div>`;
  document.body.appendChild(foot);

  // 테마
  const btn = top.querySelector(".theme-btn");
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  btn.addEventListener("click", () => {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const cur = document.documentElement.dataset.theme || (dark ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

function renderAds() {
  document.querySelectorAll(".ad").forEach((box) => {
    if (!AD_SLOT) return;
    box.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}"
      data-ad-slot="${AD_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderChrome();
  renderAds();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
