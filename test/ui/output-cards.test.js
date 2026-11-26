import assert from "node:assert/strict";
import test from "node:test";

import { initialiseDetailedResultToggles, renderDetailedResults, renderSummaryResults } from "../../src/ui/output-cards.js";

// Uses a minimal rendering target because summary generation only requires an innerHTML property.
test("summary cards include annual gross, monthly net and the applied IRS rate", () => {
  const container = { innerHTML: "" };

  renderSummaryResults(container, [{
    id: "offer-a",
    name: "Offer A",
    annualNet: 30000,
    annualGross: 42000,
    averageMonthlyNet: 2500,
    irsRate: 0.2,
  }]);

  assert.match(container.innerHTML, /Bruto anual/);
  assert.match(container.innerHTML, /Média mensal líquida/);
  assert.match(container.innerHTML, /IRS aplicado/);
  assert.match(container.innerHTML, /20%/);
});

test("detailed proposal groups render their line items expanded by default", () => {
  const container = { innerHTML: "" };

  renderDetailedResults(container, [{
    id: "offer-a",
    name: "Offer A",
    annualGross: 42000,
    annualNet: 30000,
    averageMonthlyNet: 2500,
    lines: [{ label: "Base salary", annualGross: 42000, annualNet: 30000 }],
  }]);

  assert.match(container.innerHTML, /class="proposal-details"/);
  assert.match(container.innerHTML, /aria-expanded="true"/);
  assert.match(container.innerHTML, /Ocultar rubricas/);
  assert.doesNotMatch(container.innerHTML, /class="detail-line" hidden/);
});

test("detailed result toggles hide and restore a proposal's line items", () => {
  const attributes = new Map([["aria-expanded", "true"]]);
  const lines = [{ hidden: false }, { hidden: false }];
  const proposalDetails = { querySelectorAll: () => lines };
  const button = {
    dataset: { showLabel: "Show lines", hideLabel: "Hide lines" },
    textContent: "Hide lines",
    getAttribute: (name) => attributes.get(name),
    setAttribute: (name, value) => attributes.set(name, value),
    closest: () => proposalDetails,
  };
  const container = {
    addEventListener: (_event, listener) => { container.listener = listener; },
  };

  initialiseDetailedResultToggles(container);
  const target = { closest: () => button };

  container.listener({ target });
  assert.deepEqual(lines.map((line) => line.hidden), [true, true]);
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(button.textContent, "Show lines");

  container.listener({ target });
  assert.deepEqual(lines.map((line) => line.hidden), [false, false]);
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(button.textContent, "Hide lines");
});
