import { calculateProposal } from "./calculator.js";
import { cloneProposal, createDeductionItem, createIncomeItem, createProposal } from "./domain/proposal.js";
import { initialiseSimulationExport } from "./features/export-simulation.js";
import { pt } from "./i18n/pt.js";
import { renderInputCard } from "./ui/input-card.js";
import { renderDetailedResults, renderSummaryResults } from "./ui/output-cards.js";

// Initialise the two comparison examples shown when the application first loads.
const currentProposal = { ...createProposal("Atual"), baseSalary: 1500 };
const newProposal = { ...createProposal("Nova oferta"), baseSalary: 2000 };

// The complete application state remains in memory and is never persisted automatically.
const state = {
  rnhEnabled: true,
  rnhLimit: 0.2,
  socialSecurityRate: 0.11,
  proposals: [currentProposal, newProposal],
  selectedProposalId: currentProposal.id,
};

const form = document.querySelector("#proposal-form");
const proposalSelect = document.querySelector("#proposal-select");
const summaryResults = document.querySelector("#summary-results");
const detailedResults = document.querySelector("#detailed-results");
const rnhToggle = document.querySelector("#rnh-enabled");
const rnhLimit = document.querySelector("#rnh-limit");
const ssRate = document.querySelector("#ss-rate");

// The export feature receives its copy and current state as dependencies.
const saveSimulationButton = document.querySelector("#open-export");
saveSimulationButton.textContent = pt.exportSimulation.button;
initialiseSimulationExport({
  state,
  openButton: saveSimulationButton,
  dialog: document.querySelector("#export-dialog"),
  copy: pt.exportSimulation,
});

document.querySelector("#add-proposal").addEventListener("click", () => {
  // Cloning preserves the current proposal's inputs while assigning independent identifiers.
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
  // Changing the income type resets its type-specific defaults but keeps its identity and label.
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

// Updates either a proposal field or a nested income/deduction item from a delegated form event.
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

// Replaces type-specific defaults without breaking the existing row's DOM identity.
function replaceIncomeType(itemId, type) {
  const proposal = selectedProposal();
  const index = proposal.incomeItems.findIndex((item) => item.id === itemId);
  if (index === -1) return;
  const current = proposal.incomeItems[index];
  proposal.incomeItems[index] = { ...createIncomeItem(type), id: current.id, label: current.label };
}

// Keeps all UI regions derived from the same in-memory state.
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
  renderSummaryResults(summaryResults, results);
  renderDetailedResults(detailedResults, results);
}

// Escapes proposal names before rendering select options with innerHTML.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
