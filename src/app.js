import { calculateProposal, formatMoney, formatPercent } from "./calculator.js";
import { cloneProposal, createDeductionItem, createIncomeItem, createProposal } from "./domain/proposal.js";
import { renderInputCard } from "./ui/input-card.js";

const currentProposal = { ...createProposal("Atual"), baseSalary: 1500 };
const newProposal = { ...createProposal("Nova oferta"), baseSalary: 2000 };

const state = {
  rnhEnabled: true,
  rnhLimit: 0.2,
  socialSecurityRate: 0.11,
  proposals: [currentProposal, newProposal],
  selectedProposalId: currentProposal.id,
};

const form = document.querySelector("#proposal-form");
const proposalSelect = document.querySelector("#proposal-select");
const comparisonCards = document.querySelector("#comparison-cards");
const detailsBody = document.querySelector("#details-body");
const winnerSummary = document.querySelector("#winner-summary");
const rnhToggle = document.querySelector("#rnh-enabled");
const rnhLimit = document.querySelector("#rnh-limit");
const ssRate = document.querySelector("#ss-rate");

document.querySelector("#add-proposal").addEventListener("click", () => {
  const proposal = cloneProposal(selectedProposal(), `Proposta ${state.proposals.length + 1}`);
  state.proposals.push(proposal);
  state.selectedProposalId = proposal.id;
  render();
});

document.querySelector("#remove-proposal").addEventListener("click", () => {
  if (state.proposals.length === 1) return;
  state.proposals = state.proposals.filter((proposal) => proposal.id !== state.selectedProposalId);
  state.selectedProposalId = state.proposals[0].id;
  render();
});

proposalSelect.addEventListener("change", (event) => {
  state.selectedProposalId = event.target.value;
  renderForm();
});

form.addEventListener("input", (event) => {
  const target = event.target;
  if (!target.name) return;
  updateProposalField(target);
  renderResults();
  renderSelect();
});

form.addEventListener("change", (event) => {
  const target = event.target;
  if (target.tagName !== "SELECT") return;

  const row = target.closest("[data-kind]");
  if (!row) return;
  if (row.dataset.kind === "income" && target.name === "type") {
    replaceIncomeType(row.dataset.id, target.value);
  } else {
    updateProposalField(target);
  }
  renderForm();
  renderResults();
});

form.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const proposal = selectedProposal();
  const row = button.closest("[data-kind]");
  switch (button.dataset.action) {
    case "add-income":
      proposal.incomeItems.push(createIncomeItem("annualBonus"));
      break;
    case "add-deduction":
      proposal.deductionItems.push(createDeductionItem());
      break;
    case "remove-income":
      proposal.incomeItems = proposal.incomeItems.filter((item) => item.id !== row.dataset.id);
      break;
    case "remove-deduction":
      proposal.deductionItems = proposal.deductionItems.filter((item) => item.id !== row.dataset.id);
      break;
    default:
      return;
  }
  renderForm();
  renderResults();
});

rnhToggle.addEventListener("change", () => {
  state.rnhEnabled = rnhToggle.checked;
  renderResults();
});

rnhLimit.addEventListener("input", () => {
  state.rnhLimit = Number(rnhLimit.value) / 100;
  renderResults();
});

ssRate.addEventListener("input", () => {
  state.socialSecurityRate = Number(ssRate.value) / 100;
  renderResults();
});

function selectedProposal() {
  return state.proposals.find((proposal) => proposal.id === state.selectedProposalId);
}

function updateProposalField(target) {
  const proposal = selectedProposal();
  const row = target.closest("[data-kind]");
  const value = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value;

  if (!row) {
    proposal[target.name] = value;
    return;
  }

  const items = row.dataset.kind === "income" ? proposal.incomeItems : proposal.deductionItems;
  const item = items.find((entry) => entry.id === row.dataset.id);
  if (item) item[target.name] = value;
}

function replaceIncomeType(itemId, type) {
  const proposal = selectedProposal();
  const index = proposal.incomeItems.findIndex((item) => item.id === itemId);
  if (index === -1) return;
  const current = proposal.incomeItems[index];
  proposal.incomeItems[index] = { ...createIncomeItem(type), id: current.id, label: current.label };
}

function render() {
  renderSelect();
  renderForm();
  renderResults();
}

function renderSelect() {
  proposalSelect.innerHTML = state.proposals
    .map((proposal) => `<option value="${proposal.id}">${escapeHtml(proposal.name)}</option>`)
    .join("");
  proposalSelect.value = state.selectedProposalId;
}

function renderForm() {
  renderInputCard(form, selectedProposal());
  rnhToggle.checked = state.rnhEnabled;
  rnhLimit.value = state.rnhLimit * 100;
  ssRate.value = state.socialSecurityRate * 100;
}

function renderResults() {
  const results = state.proposals.map((proposal) => calculateProposal(proposal, {
    rnhEnabled: state.rnhEnabled,
    rnhLimit: state.rnhLimit,
    socialSecurityRate: state.socialSecurityRate,
  }));
  const best = [...results].sort((a, b) => b.annualNet - a.annualNet)[0];

  winnerSummary.innerHTML = `
    <span>Melhor líquido anual</span>
    <strong>${escapeHtml(best.name)} · ${formatMoney(best.annualNet)}</strong>
  `;

  comparisonCards.innerHTML = results
    .map((result) => `
      <article class="proposal-card ${result.id === best.id ? "is-best" : ""}">
        <div>
          <h3>${escapeHtml(result.name)}</h3>
          <p>IRS aplicado: ${formatPercent(result.irsRate)}</p>
        </div>
        <dl>
          <div><dt>Líquido anual</dt><dd>${formatMoney(result.annualNet)}</dd></div>
          <div><dt>Média mensal líquida</dt><dd>${formatMoney(result.averageMonthlyNet)}</dd></div>
          <div><dt>Bruto anual</dt><dd>${formatMoney(result.annualGross)}</dd></div>
          <div><dt>Impostos + SS</dt><dd>${formatMoney(result.annualTaxes + result.annualSocialSecurity)}</dd></div>
        </dl>
      </article>
    `)
    .join("");

  detailsBody.innerHTML = results
    .map((result) => `
      <tr>
        <td>${escapeHtml(result.name)}</td>
        <td>${formatMoney(result.monthlyDeductible)}</td>
        <td>${formatPercent(result.irsRate)}</td>
        <td>${formatMoney(result.annualGross)}</td>
        <td>${formatMoney(result.annualTaxes)}</td>
        <td>${formatMoney(result.annualSocialSecurity)}</td>
        <td>${formatMoney(result.annualNet)}</td>
      </tr>
    `)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
