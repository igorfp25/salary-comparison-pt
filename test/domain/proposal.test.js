import assert from "node:assert/strict";
import test from "node:test";

import { cloneProposal, createDeductionItem, createIncomeItem, createProposal } from "../../src/domain/proposal.js";

test("proposal factories create independent proposals and item defaults", () => {
  const proposal = createProposal("Offer A");
  const income = createIncomeItem("annualBonus");
  const deduction = createDeductionItem();

  assert.equal(proposal.name, "Offer A");
  assert.equal(proposal.salaryMonths, 14);
  assert.notEqual(createProposal().id, proposal.id);
  assert.deepEqual(
    [income.calculationMode, income.payments, income.subjectToIrs, income.subjectToSs],
    ["baseSalaryPercentage", 1, true, true],
  );
  assert.equal(deduction.calculationMode, "fixed");
  assert.equal(deduction.payments, 12);
});

test("cloning a proposal creates new identifiers for the proposal and its items", () => {
  const proposal = createProposal("Original");
  proposal.incomeItems = [createIncomeItem("carAllowance")];
  proposal.deductionItems = [createDeductionItem()];
  const clone = cloneProposal(proposal, "Copy");

  assert.equal(clone.name, "Copy");
  assert.notEqual(clone.id, proposal.id);
  assert.notEqual(clone.incomeItems[0].id, proposal.incomeItems[0].id);
  assert.notEqual(clone.deductionItems[0].id, proposal.deductionItems[0].id);
  assert.equal(clone.incomeItems[0].amount, proposal.incomeItems[0].amount);
});
