export const INCOME_TYPES = [
  "annualBonus",
  "carAllowance",
  "transportAllowance",
  "remoteWorkAllowance",
  "otherPayment",
];

const incomeDefaults = {
  annualBonus: { calculationMode: "baseSalaryPercentage", payments: 1, subjectToIrs: true, subjectToSs: true },
  carAllowance: { calculationMode: "fixed", payments: 12, subjectToIrs: true, subjectToSs: false },
  transportAllowance: { calculationMode: "fixed", payments: 12, subjectToIrs: false, subjectToSs: false },
  remoteWorkAllowance: { calculationMode: "fixed", payments: 12, subjectToIrs: true, subjectToSs: true },
  otherPayment: { calculationMode: "fixed", payments: 1, subjectToIrs: true, subjectToSs: true },
};

export function createProposal(name = "Nova proposta") {
  return {
    id: crypto.randomUUID(),
    name,
    baseSalary: 0,
    salaryMonths: 14,
    mealAllowanceDaily: 0,
    mealAllowanceMonths: 11,
    mealTaxFreeDailyLimit: 10.46,
    incomeItems: [],
    deductionItems: [],
  };
}

export function createIncomeItem(type = "otherPayment") {
  const defaults = incomeDefaults[type] ?? incomeDefaults.otherPayment;
  return {
    id: crypto.randomUUID(),
    type,
    label: "",
    amount: 0,
    familyMembers: 1,
    ...defaults,
  };
}

export function createDeductionItem() {
  return {
    id: crypto.randomUUID(),
    label: "",
    calculationMode: "fixed",
    amount: 0,
    payments: 12,
    dependentAmount: 0,
    dependents: 0,
  };
}

export function cloneProposal(proposal, name) {
  return {
    ...proposal,
    id: crypto.randomUUID(),
    name,
    incomeItems: proposal.incomeItems.map((item) => ({ ...item, id: crypto.randomUUID() })),
    deductionItems: proposal.deductionItems.map((item) => ({ ...item, id: crypto.randomUUID() })),
  };
}
