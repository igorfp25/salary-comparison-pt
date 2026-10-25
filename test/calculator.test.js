import assert from "node:assert/strict";
import test from "node:test";

import { calculateProposal, resolveIrsRate, roundCurrency } from "../src/calculator.js";

const noTaxTable = { brackets: [] };
const fixedTaxTable = {
  brackets: [{
    upperLimit: Number.POSITIVE_INFINITY,
    marginalRate: 0.2,
    abatements: { a: 1, b: 1, c: 0, d: 0 },
  }],
};

test("calculator returns a zero tax rate without taxable income or a matching bracket", () => {
  assert.equal(resolveIrsRate(0, { irsTable: fixedTaxTable, rnhEnabled: false }), 0);
  assert.equal(resolveIrsRate(1000, { irsTable: noTaxTable, rnhEnabled: false }), 0);
});

test("calculator applies income, meal allowance, deductions and statutory contributions", () => {
  const result = calculateProposal({
    id: "offer-1",
    name: "Offer 1",
    baseSalary: 3000,
    salaryMonths: 12,
    mealAllowanceDaily: 15,
    mealAllowanceMonths: 11,
    mealAllowancePaymentMethod: "card",
    incomeItems: [
      {
        type: "annualBonus",
        calculationMode: "baseSalaryPercentage",
        amount: 10,
        payments: 1,
        subjectToIrs: true,
        subjectToSs: true,
      },
      {
        type: "carAllowance",
        calculationMode: "fixed",
        amount: 100,
        payments: 12,
        subjectToIrs: false,
        subjectToSs: false,
      },
    ],
    deductionItems: [{ label: "Insurance", calculationMode: "fixed", amount: 50, payments: 12 }],
  }, {
    irsTable: fixedTaxTable,
    rnhEnabled: false,
    socialSecurityRate: 0.1,
    workingDaysPerMonth: 20,
  });

  assert.equal(result.totalCostToCompany, 44100);
  assert.equal(result.irsRate, 0.2);
  assert.equal(result.annualTaxes, -8119.76);
  assert.equal(result.annualSocialSecurity, -4059.88);
  assert.equal(result.annualDeductions, 600);
  assert.equal(result.annualNet, 31320.36);
  assert.equal(result.averageMonthlyNet, 2610.03);
});

test("calculator caps IRS withholding when the RNH limit is enabled", () => {
  assert.equal(resolveIrsRate(3000, { irsTable: fixedTaxTable, rnhEnabled: true, rnhLimit: 0.15 }), 0.15);
});

test("currency rounding handles floating point values", () => {
  assert.equal(roundCurrency(1.005), 1.01);
});
