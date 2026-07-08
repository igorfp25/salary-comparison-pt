import { calculateProposal, formatMoney, formatPercent } from "./calculator.js";

const initialProposals = [
  {
    id: crypto.randomUUID(),
    name: "Oferta atual",
    baseSalary: 4116.07,
    salaryMonths: 14,
    bonusRate: 15,
    bonusAmount: 0,
    monthlyBenefits: 80,
    monthlyCarAllowance: 450,
    carAllowanceSubjectToSS: false,
    remoteAllowance: 0,
    mealAllowanceDaily: 9.6,
    fuelCardAnnual: 0,
    healthInsuranceAnnual: 335.72,
  },
  {
    id: crypto.randomUUID(),
    name: "Simulação",
    baseSalary: 4000,
    salaryMonths: 14,
    bonusRate: 15,
    bonusAmount: 0,
    monthlyBenefits: 80,
    monthlyCarAllowance: 450,
    carAllowanceSubjectToSS: true,
    remoteAllowance: 0,
    mealAllowanceDaily: 9.6,
    fuelCardAnnual: 0,
    healthInsuranceAnnual: 657.48,
  },
];

const state = {
  rnhEnabled: true,
  rnhLimit: 0.2,
  socialSecurityRate: 0.11,
  proposals: initialProposals,
  selectedProposalId: initialProposals[0].id,
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
  const clone = {
    ...state.proposals[state.proposals.length - 1],
    id: crypto.randomUUID(),
    name: `Proposta ${state.proposals.length + 1}`,
  };
  state.proposals.push(clone);
  state.selectedProposalId = clone.id;
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
  const field = event.target.name;
  if (!field) return;

  const proposal = selectedProposal();
  proposal[field] = event.target.type === "checkbox" ? event.target.checked : event.target.type === "number" ? Number(event.target.value) : event.target.value;
  renderResults();
  renderSelect();
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
  const proposal = selectedProposal();
  for (const element of form.elements) {
    if (!element.name || !(element.name in proposal)) continue;
    if (element.type === "checkbox") {
      element.checked = Boolean(proposal[element.name]);
    } else {
      element.value = proposal[element.name];
    }
  }
  rnhToggle.checked = state.rnhEnabled;
  rnhLimit.value = state.rnhLimit * 100;
  ssRate.value = state.socialSecurityRate * 100;
}

function renderResults() {
  const results = state.proposals.map((proposal) =>
    calculateProposal(proposal, {
      rnhEnabled: state.rnhEnabled,
      rnhLimit: state.rnhLimit,
      socialSecurityRate: state.socialSecurityRate,
    }),
  );
  const best = [...results].sort((a, b) => b.annualNet - a.annualNet)[0];

  winnerSummary.innerHTML = `
    <span>Melhor líquido anual</span>
    <strong>${escapeHtml(best.name)} · ${formatMoney(best.annualNet)}</strong>
  `;

  comparisonCards.innerHTML = results
    .map(
      (result) => `
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
      `,
    )
    .join("");

  detailsBody.innerHTML = results
    .map(
      (result) => `
        <tr>
          <td>${escapeHtml(result.name)}</td>
          <td>${formatMoney(result.monthlyDeductible)}</td>
          <td>${formatPercent(result.irsRate)}</td>
          <td>${formatMoney(result.annualGross)}</td>
          <td>${formatMoney(result.annualTaxes)}</td>
          <td>${formatMoney(result.annualSocialSecurity)}</td>
          <td>${formatMoney(result.annualNet)}</td>
        </tr>
      `,
    )
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
