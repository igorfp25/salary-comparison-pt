import assert from "node:assert/strict";
import test from "node:test";

import { renderSummaryResults } from "../../src/ui/output-cards.js";

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
