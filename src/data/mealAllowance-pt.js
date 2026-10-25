/**
 * Constants related to "Subsídio de alimentação" (meal allowance) in Portugal.
 *
 * IMPORTANT: These values are set annually/periodically by government portaria
 * and can change. Review and update at the start of each fiscal year (or when
 * a new portaria is published) - typically announced Dec/Jan.
 *
 * Last verified: 2026-09-01
 */

export const mealAllowance = {
  // Reference year these values apply from
  year: 2026,
  // Daily meal allowance value for Public Administration workers (reference value only) 
  // Used as the baseline for calculating private-sector tax exemption limits
  publicAdminDailyValue: 6.15,
  // Maximum daily amounts exempt from IRS and Social Security, indexed by payment method.
  // The keys match the values exposed by the meal-allowance payment-method selector.
  taxFreeDailyLimitByPaymentMethod: {
    // Allowance paid in cash or with salary.
    cash: 6.15,
    // Allowance paid by meal card, vouchers, or tickets. Formula: public-admin value * 1.70.
    card: 10.46,
  },
  // Effective dates (useful if you want to keep historical values too)
  effectiveFrom: '2026-01-01',
  // Legal reference, handy for tooltips/footnotes in the UI
  legalSource: 'Portaria n.º 51-B/2026, de 30 de janeiro',
};

// Resolves the statutory daily exemption limit for a selected payment method.
export function getMealTaxFreeDailyLimit(paymentMethod) {
  return mealAllowance.taxFreeDailyLimitByPaymentMethod[paymentMethod]
    ?? mealAllowance.taxFreeDailyLimitByPaymentMethod.card;
}

// Optional: keep prior years for historical comparisons / charts
const mealAllowanceHistory = {
  2023: { cash: 6.00, card: 10.20, source: 'Portaria n.º 107-A/2023' },
  2024: { cash: 6.00, card: 10.20, source: 'Portaria n.º 107-A/2023 (unchanged)' },
  2025: { cash: 6.00, card: 10.20, source: 'unchanged' },
  2026: { cash: 6.15, card: 10.46, source: 'Portaria n.º 51-B/2026' },
};
