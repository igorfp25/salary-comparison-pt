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
    mealAllowanceTaxFreeDailyLimit: 10.2,
    mealAllowanceMonths: 11,
    ...config,
  };

  const baseSalary = number(input.baseSalary);
  const salaryMonths = number(input.salaryMonths, 14);
  const bonusRate = normalizeRate(input.bonusRate);
  const bonusAmount = number(input.bonusAmount);
  const monthlyBenefits = number(input.monthlyBenefits);
  const monthlyCarAllowance = number(input.monthlyCarAllowance);
  const remoteAllowance = number(input.remoteAllowance);
  const fuelCardAnnual = number(input.fuelCardAnnual);
  const healthInsuranceAnnual = number(input.healthInsuranceAnnual);
  const mealAllowanceDaily = number(input.mealAllowanceDaily);

  const annualBaseSalary = baseSalary * salaryMonths;
  const annualBonus = bonusAmount > 0 ? bonusAmount : annualBaseSalary * bonusRate;
  const monthlyBonusEquivalent = salaryMonths ? annualBonus / salaryMonths : 0;
  const monthlyDeductible = baseSalary + monthlyCarAllowance + monthlyBonusEquivalent;
  const irsRate = resolveIrsRate(monthlyDeductible, settings);

  const salary = taxableMonthlyLine("Salário base", baseSalary, salaryMonths, irsRate, settings.socialSecurityRate);
  const benefits = taxableMonthlyLine("Outros benefícios", monthlyBenefits, 12, irsRate, settings.socialSecurityRate);
  const remote = taxableMonthlyLine("Teletrabalho", remoteAllowance, 12, irsRate, settings.socialSecurityRate);
  const carSocialSecurityRate = input.carAllowanceSubjectToSS ? settings.socialSecurityRate : 0;
  const car = taxableMonthlyLine("Car allowance", monthlyCarAllowance, 12, irsRate, carSocialSecurityRate);
  const bonus = taxableAnnualLine("Bónus anual", annualBonus, irsRate, settings.socialSecurityRate);
  const meals = mealAllowanceLine(mealAllowanceDaily, settings, irsRate);
  const fuel = nonTaxableAnnualLine("Fuel card", fuelCardAnnual);
  const health = nonTaxableAnnualLine("Seguro de saúde", -Math.abs(healthInsuranceAnnual));

  const lines = [salary, benefits, remote, car, bonus, meals.taxFree, meals.taxable, fuel, health];
  const totals = lines.reduce(
    (acc, line) => ({
      annualGross: acc.annualGross + line.annualGross,
      annualTaxes: acc.annualTaxes + line.annualTaxes,
      annualSocialSecurity: acc.annualSocialSecurity + line.annualSocialSecurity,
      annualNet: acc.annualNet + line.annualNet,
    }),
    { annualGross: 0, annualTaxes: 0, annualSocialSecurity: 0, annualNet: 0 },
  );

  return {
    id: input.id,
    name: input.name,
    settings,
    monthlyDeductible: roundCurrency(monthlyDeductible),
    irsRate,
    totalCostToCompany: roundCurrency(annualBaseSalary + annualBonus + monthlyBenefits * 12 + monthlyCarAllowance * 12 + remoteAllowance * 12 + fuelCardAnnual),
    annualGross: roundCurrency(totals.annualGross),
    annualTaxes: roundCurrency(totals.annualTaxes),
    annualSocialSecurity: roundCurrency(totals.annualSocialSecurity),
    annualNet: roundCurrency(totals.annualNet),
    averageMonthlyNet: roundCurrency(totals.annualNet / 12),
    netSalaryAndBonus: roundCurrency(salary.annualNet + bonus.annualNet),
    lines: lines.map((line) => ({
      ...line,
      annualGross: roundCurrency(line.annualGross),
      annualTaxes: roundCurrency(line.annualTaxes),
      annualSocialSecurity: roundCurrency(line.annualSocialSecurity),
      annualNet: roundCurrency(line.annualNet),
    })),
  };
}

export function resolveIrsRate(monthlyTaxableIncome, settings) {
  if (monthlyTaxableIncome <= 0) return 0;

  const bracket = settings.irsTable.brackets.find((item) => monthlyTaxableIncome <= item.upperLimit);
  if (!bracket) return 0;

  const abatement =
    bracket.abatements.a *
    bracket.abatements.b *
    (bracket.abatements.c - bracket.abatements.d * monthlyTaxableIncome);
  const calculatedRate = roundToFour((bracket.marginalRate * monthlyTaxableIncome - abatement) / monthlyTaxableIncome);

  if (settings.rnhEnabled && calculatedRate > settings.rnhLimit) {
    return settings.rnhLimit;
  }

  return Math.max(calculatedRate, 0);
}

function taxableMonthlyLine(label, monthlyGross, months, irsRate, socialSecurityRate) {
  const annualGross = monthlyGross * months;
  const annualTaxes = -monthlyGross * irsRate * months;
  const annualSocialSecurity = -monthlyGross * socialSecurityRate * months;

  return {
    label,
    annualGross,
    annualTaxes,
    annualSocialSecurity,
    annualNet: annualGross + annualTaxes + annualSocialSecurity,
  };
}

function taxableAnnualLine(label, annualGross, irsRate, socialSecurityRate) {
  return {
    label,
    annualGross,
    annualTaxes: -annualGross * irsRate,
    annualSocialSecurity: -annualGross * socialSecurityRate,
    annualNet: annualGross - annualGross * irsRate - annualGross * socialSecurityRate,
  };
}

function nonTaxableAnnualLine(label, annualGross) {
  return {
    label,
    annualGross,
    annualTaxes: 0,
    annualSocialSecurity: 0,
    annualNet: annualGross,
  };
}

function mealAllowanceLine(dailyAllowance, settings, irsRate) {
  const dailyTaxFree = Math.min(dailyAllowance, settings.mealAllowanceTaxFreeDailyLimit);
  const dailyTaxable = Math.max(dailyAllowance - settings.mealAllowanceTaxFreeDailyLimit, 0);
  const factor = settings.workingDaysPerMonth * settings.mealAllowanceMonths;

  return {
    taxFree: nonTaxableAnnualLine("Subsídio refeição não tributável", dailyTaxFree * factor),
    taxable: taxableMonthlyLine(
      "Subsídio refeição tributável",
      dailyTaxable * settings.workingDaysPerMonth,
      settings.mealAllowanceMonths,
      irsRate,
      settings.socialSecurityRate,
    ),
  };
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRate(value) {
  const parsed = number(value);
  return parsed > 1 ? parsed / 100 : parsed;
}

function roundToFour(value) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
