/* 근로소득 월 실수령액 계산 (연간 기준 추정). common.js 다음에 불러옵니다. */
function earnedDeduction(g) {
  let d;
  if (g <= 5e6) d = g * 0.7;
  else if (g <= 15e6) d = 3.5e6 + (g - 5e6) * 0.4;
  else if (g <= 45e6) d = 7.5e6 + (g - 15e6) * 0.15;
  else if (g <= 1e8) d = 12e6 + (g - 45e6) * 0.05;
  else d = 14.75e6 + (g - 1e8) * 0.02;
  return Math.min(d, 20e6);
}
function earnedCredit(calc, g) {
  const c = calc <= 1.3e6 ? calc * 0.55 : 715000 + (calc - 1.3e6) * 0.3;
  let lim;
  if (g <= 33e6) lim = 740000;
  else if (g <= 70e6) lim = Math.max(660000, 740000 - (g - 33e6) * 0.008);
  else if (g <= 120e6) lim = Math.max(500000, 660000 - (g - 70e6) * 0.5);
  else lim = Math.max(200000, 500000 - (g - 120e6) * 0.5);
  return Math.min(c, lim);
}
function childCredit(n) {
  if (n <= 0) return 0;
  if (n === 1) return 250000;
  return 550000 + (n - 2) * 400000;
}

function calcSalary(annual, nontaxM = 200000, family = 1, kids = 0) {
  const monthly = annual / 12;
  const nontax = Math.min(nontaxM, monthly);
  const taxable = monthly - nontax;
  const pBase = Math.floor(Math.min(Math.max(taxable, RATES.pensionMin), RATES.pensionMax) / 1000) * 1000;
  const pension = taxable > 0 ? floor10(pBase * RATES.pension) : 0;
  const health = floor10(taxable * RATES.health);
  const care = floor10(health * RATES.care);
  const emp = floor10(taxable * RATES.employment);

  const g = taxable * 12;
  const income = g - earnedDeduction(g);
  const base = Math.max(0, income - 1.5e6 * Math.max(1, family) - pension * 12 - (health + care + emp) * 12);
  const computed = progressiveTax(base);
  const annualTax = Math.max(0, computed - earnedCredit(computed, g) - childCredit(kids));
  const incomeTax = floor10(annualTax / 12);
  const local = floor10(incomeTax * 0.1);
  const deductions = pension + health + care + emp + incomeTax + local;
  return { monthly, pension, health, care, emp, incomeTax, local, deductions, net: monthly - deductions, base };
}
