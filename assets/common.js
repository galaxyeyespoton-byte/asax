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

// ── 운영 정보 ───────────────────────────────────────────────
// 문의·제휴 메일. 비워두면 문의 페이지에 "준비 중"으로 표시됩니다.
const CONTACT_EMAIL = "";

// ── 메뉴 (그룹별) ────────────────────────────────────────────
const MENU = [
  { title: "직장인·프리랜서", items: [
    ["salary.html", "연봉 실수령액", "4대보험·세금 빼고 남는 월급", "wallet"],
    ["salary-4000.html", "연봉별 실수령액 표", "2천만~1.5억 구간별 정리", "table"],
    ["freelancer.html", "3.3% 프리랜서 세금", "세후 금액, 5월 환급 예상", "receipt"],
    ["hourly.html", "시급·주휴수당", "알바 주급·월급 계산", "clock"],
    ["severance.html", "퇴직금", "평균임금으로 계산", "gift"],
  ]},
  { title: "사장님", items: [
    ["business-tax.html", "종합소득세", "매출·경비로 5월 세금 미리 보기", "store"],
    ["vat-pay.html", "부가세 납부세액", "일반·간이과세자 모두", "calc"],
    ["vat.html", "부가세 10% 계산", "공급가액 ↔ 합계금액", "tag"],
    ["guide.html", "사장님 세금 가이드", "신고 일정과 절세 방법", "calendar"],
  ]},
  { title: "도움말", items: [
    ["about.html", "만든 이야기", "이 사이트를 만든 이유와 업데이트 기록", "leaf"],
    ["contact.html", "문의·제휴", "틀린 곳 제보, 제휴 제안", "mail"],
  ]},
];

// 둥근 선 아이콘 (24×24)
const ICONS = {
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><circle cx="16" cy="13.5" r="1.2"/>',
  table: '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M4 10h16M10 10v9"/>',
  receipt: '<path d="M6 4h12v16l-2.5-1.5L13 20l-2.5-1.5L8 20l-2-1.5z" transform="translate(0 -1)"/><path d="M9 8.5h6M9 12h6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
  gift: '<rect x="4.5" y="9" width="15" height="10" rx="2"/><path d="M3.5 9h17M12 9v10M12 9c-1.5-3-5-3.2-5-1s3 1 5 1c2 0 5 1.2 5-1s-3.5-2-5 1"/>',
  store: '<path d="M4.5 10v8.5h15V10"/><path d="M3.5 6l1.5-2h14l1.5 2v2a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z"/><path d="M10 18.5v-4h4v4"/>',
  calc: '<rect x="5.5" y="3.5" width="13" height="17" rx="2.5"/><path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01"/>',
  tag: '<path d="M4 12.5V5.5A1.5 1.5 0 0 1 5.5 4h7l7.5 7.5-8 8z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4 7l8 6 8-6"/>',
  share: '<circle cx="17" cy="6" r="2.3"/><circle cx="7" cy="12" r="2.3"/><circle cx="17" cy="18" r="2.3"/><path d="M9 11l6-3.5M9 13l6 3.5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2.2"/><path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15"/>',
  menu: '<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
};
const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
// data-icon="wallet" 처럼 써두면 아이콘으로 채웁니다.
function fillIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => { if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); });
}

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
  const links = (items) => items.map(([h, t, d, ic]) =>
    `<a href="${h}" class="${h === here ? "on" : ""}">${icon(ic)}<span>${t}<small>${d}</small></span></a>`).join("");
  const desktop = MENU.map((g) =>
    `<details class="menu-desktop${g.items.some(([h]) => h === here) ? " here" : ""}"><summary>${g.title}</summary><div class="pop">${links(g.items)}</div></details>`).join("");
  const mobile = `<details class="menu-mobile"><summary aria-label="메뉴 열기">${icon("menu")}</summary><div class="pop">${
    MENU.map((g) => `<div class="group-title">${g.title}</div>${links(g.items)}`).join("")}</div></details>`;

  const top = document.createElement("header");
  top.className = "top";
  top.innerHTML = `<div class="wrap">
    <a class="brand" href="index.html"><img src="assets/icon.svg" alt="" width="30" height="30">세금 도우미</a>
    <nav class="menu" aria-label="전체 메뉴">${desktop}${mobile}</nav>
    <button class="theme-btn" type="button" aria-label="밝게/어둡게 바꾸기">${icon("moon")}</button></div>`;
  document.body.prepend(top);

  // 메뉴는 한 번에 하나만, 바깥을 누르면 닫기
  const all = [...top.querySelectorAll(".menu details")];
  all.forEach((d) => d.addEventListener("toggle", () => { if (d.open) all.forEach((o) => o !== d && (o.open = false)); }));
  document.addEventListener("click", (e) => { if (!top.contains(e.target)) all.forEach((d) => (d.open = false)); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") all.forEach((d) => (d.open = false)); });

  const foot = document.createElement("footer");
  foot.innerHTML = `<div class="wrap">
    <div class="brandline">세금 도우미</div>
    <div>숫자만 넣으면 세금이 보이는 작은 계산기 모음입니다. ${RATES.year}년 기준 요율로 계산한 추정치라, 실제 금액은 회사나 개인 상황에 따라 조금 다를 수 있어요.</div>
    <nav><a href="about.html">만든 이야기</a><a href="contact.html">문의·제휴</a><a href="terms.html">이용약관</a><a href="privacy.html">개인정보처리방침</a></nav>
    <div>© ${new Date().getFullYear()} 세금 도우미</div></div>`;
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

// ── 제휴 영역 ───────────────────────────────────────────────
// <section class="partners" data-slot="business"></section> 자리에, assets/partners.js에서
// 링크(url)가 채워진 항목만 보여줍니다. 링크가 하나도 없으면 영역 자체가 숨겨집니다.
function renderPartners() {
  const list = typeof PARTNERS === "undefined" ? [] : PARTNERS;
  document.querySelectorAll(".partners[data-slot]").forEach((box) => {
    const items = list.filter((p) => p.url && p.slots.includes(box.dataset.slot));
    if (!items.length) { box.hidden = true; return; }
    box.hidden = false;
    box.classList.add("card");
    box.innerHTML = `<h2>함께 보면 좋은 서비스 <span class="badge">제휴</span></h2>` +
      items.map((p) => `<a class="partner" href="${p.url}" target="_blank" rel="sponsored noopener">
        <div><b>${p.title}</b><span>${p.desc}</span></div><span class="go">${p.cta || "보러 가기"} →</span></a>`).join("") +
      `<p class="disclosure">${[...new Set(items.map((p) => p.disclosure || PARTNER_DISCLOSURE))].join(" ")}</p>`;
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
  fillIcons();
  renderPartners();
  renderAds();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
