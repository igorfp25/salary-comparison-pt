import { irsPt } from "./data/irs-pt-brackets.js";

const money = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("pt-PT", {
  style: "percent",
  maximumFractionDigits: 2,
});

export function formatMoney(value) {
  return money.format(roundCurrency(value));
}

export function formatPercent(value) {
  return percent.format(value);
}

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateProposal(input, config = {}) {
  const settings = {
    irsTable: irsPt,
    socialSecurityRate: 0.11,
    rnhEnabled: true,
    rnhLimit: 0.2,
    workingDaysPerMonth: 22,
    mealAllowanceTaxFreeDailyLimit: 10.46,
    ...config,
  };
  const salaryMonths = number(input.salaryMonths, 14);
  const baseSalary = number(input.baseSalary);
  const annualBaseSalary = baseSalary * salaryMonths;
  const baseSalaryBasis = { monthly: baseSalary, annual: annualBaseSalary };
  const incomeItems = Array.isArray(input.incomeItems) ? input.incomeItems : [];
  const deductionItems = Array.isArray(input.deductionItems) ? input.deductionItems : [];
  const mealTaxFreeDailyLimit = number(input.mealTaxFreeDailyLimit, settings.mealAllowanceTaxFreeDailyLimit);

  const annualTaxableForIrs = annualBaseSalary
    + incomeItems
      .filter((item) => item.subjectToIrs)
      .reduce((total, item) => total + annualIncomeAmount(item, baseSalaryBasis), 0)
    + annualTaxableMealAmount(input, mealTaxFreeDailyLimit, settings);
  const monthlyDeductible = annualTaxableForIrs / salaryMonths;
  const irsRate = resolveIrsRate(monthlyDeductible, settings);

  const salary = incomeLine("Salário base", annualBaseSalary, true, true, irsRate, settings.socialSecurityRate);
  const meals = mealAllowanceLines(input, mealTaxFreeDailyLimit, settings, irsRate);
  const incomeLines = incomeItems.map((item) => incomeLine(
    incomeLabel(item),
    annualIncomeAmount(item, baseSalaryBasis),
    Boolean(item.subjectToIrs),
    Boolean(item.subjectToSs),
    irsRate,
    settings.socialSecurityRate,
  ));
  const deductionLines = deductionItems.map((item) => deductionLine(
    item.label || "Desconto sem descrição",
    annualDeductionAmount(item, annualBaseSalary),
  ));
  const lines = [salary, meals.taxFree, meals.taxable, ...incomeLines, ...deductionLines];
  const totals = lines.reduce(addLine, emptyTotals());
  const annualIncome = salary.annualGross + meals.taxFree.annualGross + meals.taxable.annualGross
    + incomeLines.reduce((total, line) => total + line.annualGross, 0);

  return {
    id: input.id,
    name: input.name,
    settings,
    monthlyDeductible: roundCurrency(monthlyDeductible),
    irsRate,
    totalCostToCompany: roundCurrency(annualIncome),
    annualGross: roundCurrency(annualIncome),
    annualDeductions: roundCurrency(-deductionLines.reduce((total, line) => total + line.annualNet, 0)),
    annualTaxes: roundCurrency(totals.annualTaxes),
    annualSocialSecurity: roundCurrency(totals.annualSocialSecurity),
    annualNet: roundCurrency(totals.annualNet),
    averageMonthlyNet: roundCurrency(totals.annualNet / 12),
    netSalaryAndBonus: roundCurrency(salary.annualNet + incomeLines.reduce((total, line) => total + line.annualNet, 0)),
    lines: lines.map(roundLine),
  };
}

export function resolveIrsRate(monthlyTaxableIncome, settings) {
  if (monthlyTaxableIncome <= 0) return 0;

  const bracket = settings.irsTable.brackets.find((item) => monthlyTaxableIncome <= item.upperLimit);
  if (!bracket) return 0;

  const abatement = bracket.abatements.a * bracket.abatements.b * (bracket.abatements.c - bracket.abatements.d * monthlyTaxableIncome);
  const calculatedRate = roundToFour((bracket.marginalRate * monthlyTaxableIncome - abatement) / monthlyTaxableIncome);

  return settings.rnhEnabled && calculatedRate > settings.rnhLimit
    ? settings.rnhLimit
    : Math.max(calculatedRate, 0);
}

function incomeLine(label, annualGross, subjectToIrs, subjectToSs, irsRate, socialSecurityRate) {
  const annualTaxes = subjectToIrs ? -annualGross * irsRate : 0;
  const annualSocialSecurity = subjectToSs ? -annualGross * socialSecurityRate : 0;
  return { label, annualGross, annualTaxes, annualSocialSecurity, annualNet: annualGross + annualTaxes + annualSocialSecurity };
}

function deductionLine(label, annualDeduction) {
  return { label, annualGross: 0, annualTaxes: 0, annualSocialSecurity: 0, annualNet: -annualDeduction };
}

function mealAllowanceLines(input, taxFreeDailyLimit, settings, irsRate) {
  const dailyAllowance = number(input.mealAllowanceDaily);
  const payments = number(input.mealAllowanceMonths, 11);
  const taxFreeDaily = Math.min(dailyAllowance, taxFreeDailyLimit);
  const taxableDaily = Math.max(dailyAllowance - taxFreeDailyLimit, 0);
  const annualTaxFree = taxFreeDaily * settings.workingDaysPerMonth * payments;
  const annualTaxable = taxableDaily * settings.workingDaysPerMonth * payments;
  return {
    taxFree: incomeLine("Subsídio de refeição isento", annualTaxFree, false, false, irsRate, settings.socialSecurityRate),
    taxable: incomeLine("Subsídio de refeição sujeito", annualTaxable, true, true, irsRate, settings.socialSecurityRate),
  };
}

function annualTaxableMealAmount(input, taxFreeDailyLimit, settings) {
  return Math.max(number(input.mealAllowanceDaily) - taxFreeDailyLimit, 0)
    * settings.workingDaysPerMonth
    * number(input.mealAllowanceMonths, 11);
}

function annualIncomeAmount(item, baseSalary) {
  const payments = number(item.payments, 1);
  if (item.calculationMode === "baseSalaryPercentage") return baseSalary.annual * normalizeRate(item.amount);
  if (item.calculationMode === "monthlyBaseSalaryPercentage") return baseSalary.monthly * normalizeRate(item.amount) * payments;
  if (item.calculationMode === "familyMember") return number(item.amount) * number(item.familyMembers, 1) * payments;
  return number(item.amount) * payments;
}

function annualDeductionAmount(item, annualBaseSalary) {
  const payments = number(item.payments, 1);
  if (item.calculationMode === "baseSalaryPercentage") return annualBaseSalary * normalizeRate(item.amount);
  if (item.calculationMode === "healthInsuranceFamily") {
    return (number(item.amount) + number(item.dependentAmount) * number(item.dependents)) * payments;
  }
  return number(item.amount) * payments;
}

function incomeLabel(item) {
  return item.label || {
    annualBonus: "Bónus de desempenho anual",
    carAllowance: "Subsídio de viatura",
    transportAllowance: "Subsídio de transporte/combustível",
    remoteWorkAllowance: "Subsídio de teletrabalho",
    otherPayment: "Outro pagamento",
  }[item.type] || "Rendimento adicional";
}

function emptyTotals() {
  return { annualGross: 0, annualTaxes: 0, annualSocialSecurity: 0, annualNet: 0 };
}

function addLine(total, line) {
  return {
    annualGross: total.annualGross + line.annualGross,
    annualTaxes: total.annualTaxes + line.annualTaxes,
    annualSocialSecurity: total.annualSocialSecurity + line.annualSocialSecurity,
    annualNet: total.annualNet + line.annualNet,
  };
}

function roundLine(line) {
  return {
    ...line,
    annualGross: roundCurrency(line.annualGross),
    annualTaxes: roundCurrency(line.annualTaxes),
    annualSocialSecurity: roundCurrency(line.annualSocialSecurity),
    annualNet: roundCurrency(line.annualNet),
  };
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRate(value) {
  return number(value) / 100;
}

function roundToFour(value) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
