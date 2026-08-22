import { INCOME_TYPES } from "../domain/proposal.js";
import { pt } from "../i18n/pt.js";

const numberInput = (name, value, options = {}) => `
  <input name="${name}" type="number" min="${options.min ?? 0}" ${options.max ? `max="${options.max}"` : ""} step="${options.step ?? "0.01"}" value="${value}">
`;

const field = (label, input) => `<label>${label}${input}</label>`;

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function renderInputCard(form, proposal) {
  form.innerHTML = `
    <section class="input-section">
      <div class="section-heading"><h2>${pt.sections.mandatory}</h2><span>Por proposta</span></div>
      <div class="mandatory-fields">
        ${mandatoryRow(pt.mandatoryGroups.proposal, field(pt.proposal.name, `<input name="name" type="text" autocomplete="off" value="${escapeHtml(proposal.name)}">`))}
        ${mandatoryRow(pt.mandatoryGroups.baseSalary, `${field(pt.proposal.baseSalary, numberInput("baseSalary", proposal.baseSalary))}${field(pt.proposal.salaryMonths, numberInput("salaryMonths", proposal.salaryMonths, { min: 1, max: 14, step: 1 }))}`)}
        ${mandatoryRow(pt.mandatoryGroups.mealAllowance, `${field(pt.proposal.mealAllowanceDaily, numberInput("mealAllowanceDaily", proposal.mealAllowanceDaily))}${field(pt.proposal.mealAllowanceMonths, numberInput("mealAllowanceMonths", proposal.mealAllowanceMonths, { min: 0, max: 12, step: 1 }))}${field(pt.proposal.mealTaxFreeDailyLimit, numberInput("mealTaxFreeDailyLimit", proposal.mealTaxFreeDailyLimit))}`)}
      </div>
    </section>
    <section class="input-section">
      <div class="section-heading"><div><h2>${pt.sections.income}</h2><p>Pagamentos além do salário base e subsídio de refeição.</p></div></div>
      <div id="income-items" class="item-list">
        ${proposal.incomeItems.map(renderIncomeItem).join("") || emptyState("Ainda não adicionou rendimentos adicionais.")}
      </div>
      <button class="add-row" type="button" data-action="add-income">+ ${pt.income.add}</button>
    </section>
    <section class="input-section">
      <div class="section-heading"><div><h2>${pt.sections.deductions}</h2><p>${pt.deduction.note}</p></div></div>
      <div id="deduction-items" class="item-list">
        ${proposal.deductionItems.map(renderDeductionItem).join("") || emptyState("Ainda não adicionou descontos ou encargos.")}
      </div>
      <button class="add-row" type="button" data-action="add-deduction">+ ${pt.deduction.add}</button>
    </section>
  `;
}

function renderIncomeItem(item) {
  const calculationFields = incomeCalculationFields(item);

  return `
    <fieldset class="entry-row" data-kind="income" data-id="${item.id}">
      <legend>Rendimento adicional</legend>
      <div class="entry-main-grid">
        ${field(pt.income.type, select("type", item.type, INCOME_TYPES.map((type) => [type, pt.incomeTypes[type]])))}
        ${field(pt.income.label, `<input name="label" type="text" placeholder="Opcional" value="${escapeHtml(item.label)}">`)}
        ${field(pt.income.calculation, select("calculationMode", item.calculationMode, [["fixed", pt.calculationModes.fixed], ["baseSalaryPercentage", pt.calculationModes.baseSalaryPercentage], ["monthlyBaseSalaryPercentage", pt.calculationModes.monthlyBaseSalaryPercentage], ["familyMember", pt.calculationModes.familyMember]]))}
        ${calculationFields}
        ${field(pt.income.payments, numberInput("payments", item.payments, { min: 1, max: 24, step: 1 }))}
      </div>
      <div class="entry-options">
        <label class="toggle-row"><input name="subjectToIrs" type="checkbox" ${item.subjectToIrs ? "checked" : ""}>${pt.income.irs}</label>
        <label class="toggle-row"><input name="subjectToSs" type="checkbox" ${item.subjectToSs ? "checked" : ""}>${pt.income.ss}</label>
        <button type="button" class="text-button danger" data-action="remove-income" aria-label="${pt.income.remove}">${pt.income.remove}</button>
      </div>
    </fieldset>
  `;
}

function incomeCalculationFields(item) {
  if (item.calculationMode === "baseSalaryPercentage") {
    return field(pt.income.annualRate, numberInput("amount", item.amount));
  }
  if (item.calculationMode === "monthlyBaseSalaryPercentage") {
    return field(pt.income.monthlyRate, numberInput("amount", item.amount));
  }
  if (item.calculationMode === "familyMember") {
    return `${field(pt.income.memberAmount, numberInput("amount", item.amount))}${field(pt.income.familyMembers, numberInput("familyMembers", item.familyMembers, { min: 1, max: 20, step: 1 }))}`;
  }
  return field(pt.income.amount, numberInput("amount", item.amount));
}

function renderDeductionItem(item) {
  const isFamily = item.calculationMode === "healthInsuranceFamily";
  const amountField = item.calculationMode === "baseSalaryPercentage"
    ? field(pt.deduction.rate, numberInput("amount", item.amount))
    : field(pt.deduction.amount, numberInput("amount", item.amount));
  const calculationFields = isFamily
    ? `${field(pt.deduction.memberAmount, numberInput("amount", item.amount))}${field(pt.deduction.dependentAmount, numberInput("dependentAmount", item.dependentAmount))}${field(pt.deduction.dependents, numberInput("dependents", item.dependents, { min: 0, max: 20, step: 1 }))}`
    : amountField;

  return `
    <fieldset class="entry-row" data-kind="deduction" data-id="${item.id}">
      <legend>Desconto ou encargo</legend>
      <div class="entry-main-grid deduction-grid">
        ${field(pt.deduction.label, `<input name="label" type="text" placeholder="Ex.: Seguro de saúde" value="${escapeHtml(item.label)}">`)}
        ${field(pt.deduction.calculation, select("calculationMode", item.calculationMode, [["fixed", pt.calculationModes.fixed], ["baseSalaryPercentage", pt.calculationModes.baseSalaryPercentage], ["healthInsuranceFamily", pt.calculationModes.healthInsuranceFamily]]))}
        ${calculationFields}
        ${field(pt.deduction.payments, numberInput("payments", item.payments, { min: 1, max: 24, step: 1 }))}
      </div>
      <div class="entry-options entry-options-end"><button type="button" class="text-button danger" data-action="remove-deduction" aria-label="${pt.deduction.remove}">${pt.deduction.remove}</button></div>
    </fieldset>
  `;
}

function select(name, currentValue, options) {
  return `<select name="${name}">${options.map(([value, label]) => `<option value="${value}" ${value === currentValue ? "selected" : ""}>${label}</option>`).join("")}</select>`;
}

function mandatoryRow(title, fields) {
  return `<div class="mandatory-row"><h3>${title}</h3><div class="mandatory-row-fields">${fields}</div></div>`;
}

function emptyState(message) {
  return `<p class="empty-state">${message}</p>`;
}
