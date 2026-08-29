import { formatMoney, formatPercent, roundCurrency } from "../calculator.js";
import { pt } from "../i18n/pt.js";

const MONTHS_PER_YEAR = 12;

export function renderSummaryResults(container, results) {
  const copy = pt.results.summary;
  const best = findBestResult(results);

  container.innerHTML = `
    <div class="results-heading">
      <div>
        <h2>${copy.title}</h2>
        <p>${copy.description}</p>
      </div>
      ${results.length > 1 ? bestResultNotice(best, copy) : ""}
    </div>
    <div class="summary-cards">
      ${results.map((result) => renderSummaryCard(result, best, copy, results.length)).join("")}
    </div>
  `;
}

export function renderDetailedResults(container, results) {
  const copy = pt.results.details;

  container.innerHTML = `
    <article class="panel details-card">
      <header class="details-card-heading">
        <div>
          <h2>${copy.title}</h2>
          <p>${copy.description}</p>
        </div>
      </header>
      <div class="table-wrap">
        <table class="details-table">
          <caption>${copy.caption}</caption>
          <thead>
            <tr>
              <th scope="col">${copy.item}</th>
              <th scope="col">${copy.averageMonthlyGross}</th>
              <th scope="col">${copy.annualGross}</th>
              <th scope="col">${copy.averageMonthlyDiscounts}</th>
              <th scope="col">${copy.annualDiscounts}</th>
              <th scope="col">${copy.averageMonthlyNet}</th>
              <th scope="col">${copy.annualNet}</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((result) => renderProposalDetails(result, copy)).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderSummaryCard(result, best, copy, proposalCount) {
  const isBest = proposalCount > 1 && result.id === best.id;
  const totalDiscounts = totalDiscountsFor(result);

  return `
    <article class="summary-card ${isBest ? "is-best" : ""}">
      <header class="summary-card-heading">
        <h3>${escapeHtml(result.name)}</h3>
        ${isBest ? `<span class="result-badge">${copy.bestBadge}</span>` : ""}
      </header>
      <div class="key-result">
        <span>${copy.annualNet}</span>
        <strong>${formatMoney(result.annualNet)}</strong>
      </div>
      <dl class="summary-metrics">
        ${summaryMetric(copy.averageMonthlyNet, formatMoney(result.averageMonthlyNet))}
        ${summaryMetric(copy.annualGross, formatMoney(result.annualGross))}
        ${summaryMetric(copy.irsRate, formatPercent(result.irsRate))}
        ${summaryMetric(copy.totalDiscounts, formatMoney(totalDiscounts))}
      </dl>
    </article>
  `;
}

function bestResultNotice(best, copy) {
  return `
    <p class="best-result-notice">
      <span>${copy.best}</span>
      <strong>${escapeHtml(best.name)} · ${formatMoney(best.annualNet)}</strong>
    </p>
  `;
}

function renderProposalDetails(result, copy) {
  return `
    <tr class="proposal-group-row">
      <th colspan="7" scope="rowgroup"><span>${copy.proposal}</span>${escapeHtml(result.name)}</th>
    </tr>
    ${result.lines.map((line) => renderDetailLine(line)).join("")}
    ${renderTotalRow(result, copy)}
  `;
}

function renderDetailLine(line) {
  const annualDiscounts = discountsFor(line);
  return `
    <tr>
      <th scope="row">${escapeHtml(line.label)}</th>
      <td>${formatMoney(line.annualGross / MONTHS_PER_YEAR)}</td>
      <td>${formatMoney(line.annualGross)}</td>
      <td>${formatMoney(annualDiscounts / MONTHS_PER_YEAR)}</td>
      <td>${formatMoney(annualDiscounts)}</td>
      <td>${formatMoney(line.annualNet / MONTHS_PER_YEAR)}</td>
      <td>${formatMoney(line.annualNet)}</td>
    </tr>
  `;
}

function renderTotalRow(result, copy) {
  const annualDiscounts = totalDiscountsFor(result);
  return `
    <tr class="details-total-row">
      <th scope="row">${copy.total}</th>
      <td>${formatMoney(result.annualGross / MONTHS_PER_YEAR)}</td>
      <td>${formatMoney(result.annualGross)}</td>
      <td>${formatMoney(annualDiscounts / MONTHS_PER_YEAR)}</td>
      <td>${formatMoney(annualDiscounts)}</td>
      <td>${formatMoney(result.averageMonthlyNet)}</td>
      <td>${formatMoney(result.annualNet)}</td>
    </tr>
  `;
}

function summaryMetric(label, value) {
  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function findBestResult(results) {
  return [...results].sort((first, second) => second.annualNet - first.annualNet)[0];
}

function totalDiscountsFor(result) {
  return roundCurrency(result.annualGross - result.annualNet);
}

function discountsFor(line) {
  return roundCurrency(line.annualGross - line.annualNet);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
