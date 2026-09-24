// Defines the versioned IRS withholding data consumed by the calculation engine.
/* Formula to apply: Compensation x Rate - abatements - Additional abatments x number of dependents.
Fórmula a aplicar: Remuneração x Taxa - Parcela a abater - Parcela adicional a abater x nº dependentes.
 */

// Keep tax-year metadata alongside brackets so future updates remain traceable.
export const irsPt = {
  year: 2026,
  category: "A",
  area: "Continente",
  label: "Casado - único titular, sem dependentes",
  sourceNote: "",
  brackets: [
    { upperLimit: 991, marginalRate: 0, abatements: { a: 0, b: 0, c: 0, d: 0 } },
    { upperLimit: 1042, marginalRate: 0.125, abatements: { a: 0.125, b: 2.6, c: 1372.15, d: 1 } },
    { upperLimit: 1108, marginalRate: 0.125, abatements: { a: 0.125, b: 1.35, c: 1677.85, d: 1 } },
    { upperLimit: 1119, marginalRate: 0.125, abatements: { a: 1, b: 1, c: 96.17, d: 0 } },
    { upperLimit: 1432, marginalRate: 0.1272, abatements: { a: 1, b: 1, c: 98.64, d: 0 } },
    { upperLimit: 1962, marginalRate: 0.157, abatements: { a: 1, b: 1, c: 141.32, d: 0 } },
    { upperLimit: 2240, marginalRate: 0.1938, abatements: { a: 1, b: 1, c: 213.53, d: 0 } },
    { upperLimit: 2773, marginalRate: 0.2277, abatements: { a: 1, b: 1, c: 289.47, d: 0 } },
    { upperLimit: 3389, marginalRate: 0.2570, abatements: { a: 1, b: 1, c: 370.72, d: 0 } },
    { upperLimit: 5965, marginalRate: 0.2881, abatements: { a: 1, b: 1, c: 476.12, d: 0 } },
    { upperLimit: 20265, marginalRate: 0.3843, abatements: { a: 1, b: 1, c: 1049.96, d: 0 } },
    { upperLimit: 99999999, marginalRate: 0.4717, abatements: { a: 1, b: 1, c: 2821.13, d: 0 } },
  ],
};

