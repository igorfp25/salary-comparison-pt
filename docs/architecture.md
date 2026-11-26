# Architecture

## Purpose

Salary Comparison PT is a static, browser-based calculator for comparing employment compensation proposals in Portugal. It lets a user model one or more proposals, including base salary, meal allowance, additional income, and deductions, then compare annual and average monthly net compensation.

The application is intended as a transparent simulation tool. Its calculations are based on the versioned tax and meal-allowance data included in this repository and should be independently validated before being relied on for financial, tax, or employment decisions.

## Deployment model

The project is a dependency-free client-side web application:

- `index.html` loads the application entry point as a native ES module.
- `styles.css` provides the responsive presentation layer.
- All calculation, import, export, encryption, and rendering work happens in the browser.
- There is no backend, database, authentication, telemetry, analytics, cookie, `localStorage`, or `sessionStorage` usage.
- The project has no build step or runtime dependency; it can be served as static files, including through GitHub Pages.

The application state is held only in memory. Reloading or closing the browser tab clears it unless the user has explicitly exported a local simulation file.

## High-level component map

```text
index.html
    |
    v
src/app.js ---------------------------> src/calculator.js
    |                                      |
    |                                      +--> src/data/irs-pt-brackets.js
    |                                      +--> src/data/mealAllowance-pt.js
    |
    +--> src/domain/proposal.js
    +--> src/ui/*
    +--> src/features/import-simulation.js --> src/import/simulation.js
    |                                           |
    |                                           +--> src/simulation/file-format.js
    +--> src/features/export-simulation.js --> src/export/simulation.js
                                                |
                                                +--> src/simulation/file-format.js
```

`src/app.js` is the composition root. It owns the in-memory UI state, connects DOM events to domain factories and feature modules, recalculates every proposal after a state change, and re-renders the relevant UI regions.

## Application state and proposal domain

`src/domain/proposal.js` defines the reusable proposal model and factory functions:

- A proposal contains an ID, name, base salary, number of salary payments, meal allowance settings, additional income items, and deduction items.
- Additional income supports the `annualBonus`, `carAllowance`, `transportAllowance`, `remoteWorkAllowance`, and `otherPayment` types.
- Income and deductions support fixed amounts and the calculation modes exposed by the editor. Each income item also records whether it is subject to IRS and Social Security.
- Browser-generated UUIDs identify proposals and nested items. Cloning creates new IDs for the proposal and all nested items, preventing collisions in the UI.

The initial in-memory state contains two examples: `(exemplo) Atual` and `(exemplo) Nova oferta`. Shared calculation assumptions currently include the RNH cap toggle and limit, plus the 11% employee Social Security rate. The UI treats that Social Security rate as statutory and resets it to 11% when rendering, including after an imported replacement.

## Calculation engine

`src/calculator.js` is a pure calculation module apart from its locale formatters. `calculateProposal` accepts a proposal and optional configuration and returns a structured annual result containing totals, the applicable IRS rate, a monthly net average, and the individual calculation lines used by the detailed results table.

The engine:

- calculates annual base salary from the monthly amount and number of salary payments;
- resolves annual amounts for additional income and deductions;
- splits meal allowance into tax-free and taxable portions using the chosen cash/card daily limit, working-day assumption, and payment count;
- determines the IRS withholding rate from monthly taxable income and the configured bracket table;
- optionally caps the calculated IRS rate using the RNH limit;
- applies the configured employee Social Security rate to applicable compensation lines; and
- rounds returned monetary totals and lines to cents.

The current default assumptions are 22 working days per month, 11% employee Social Security, and an enabled 20% RNH cap. Callers may override these settings when using the calculation module directly.

## Versioned regulatory data

Regulatory inputs are isolated from the UI and engine logic:

- `src/data/irs-pt-brackets.js` contains the 2026 Portuguese Category A withholding brackets for mainland Portugal, married with one income and no dependants.
- `src/data/mealAllowance-pt.js` contains 2026 meal-allowance exemption limits: EUR 6.15 per day when paid in cash and EUR 10.46 per day when paid by card.

These values require periodic review. Updating a tax year should preserve the source and effective-date metadata and be accompanied by calculation tests.

## User interface

UI modules generate the interactive browser interface while keeping business rules outside the rendering code:

- `src/ui/input-card.js` renders the selected proposal editor and its dynamic income and deduction rows.
- `src/ui/output-cards.js` renders summary comparison cards and detailed line-item tables. It also manages accessible show/hide controls for detailed lines.
- `src/ui/collapsible-panel.js` manages the accessible collapsed state of the configuration panel.
- `src/ui/import-dialog.js` and `src/ui/export-dialog.js` render and manage the import/export dialogs.
- `src/i18n/pt.js` centralizes current Portuguese UI copy for the modular UI components and feature dialogs.

The interface escapes user-provided proposal names, labels, filenames, and messages before placing them in generated HTML.

## Local import and export

Simulation portability is implemented as separate feature, transport, and file-contract layers:

- `src/features/export-simulation.js` connects the export dialog to the current state and produces a fresh snapshot at download time.
- `src/export/simulation.js` creates plain JSON exports and optional encrypted exports, then downloads them through a temporary browser object URL.
- `src/features/import-simulation.js` coordinates local file selection, password/action prompts, state replacement or addition, and error presentation.
- `src/import/simulation.js` parses, decrypts when needed, and validates untrusted file contents before they can update application state.
- `src/simulation/file-format.js` defines the shared format identifiers, version, and password-derivation iteration count.

Plain files use the versioned `salary-comparison-pt` format (currently version 1). Encrypted files use `salary-comparison-pt-encrypted`. Encryption and decryption occur locally with Web Crypto: AES-256-GCM, a random 16-byte salt, a random 12-byte IV, and PBKDF2-SHA-256 with 600,000 iterations. Passwords are never written into export files or persisted by the application.

Imports are capped at 5 MiB and undergo structural, type, range, collection-size, and identifier-uniqueness validation. The import layer accepts older proposal exports that omit the meal-allowance payment method and defaults them to card payment. Users may either replace the current state after confirmation or add imported proposals as fresh clones while keeping the current shared assumptions.

## Privacy and security boundaries

The application keeps entered data in browser memory and does not send it to a server. Exported files may contain sensitive salary information, so the export dialog warns users and offers password protection.

Import files are untrusted input. They are validated before use, and encrypted imports are rejected when their cryptographic metadata, password, or ciphertext cannot be verified. The validation limits proposal and nested-item counts to protect the browser from excessively large structured data.

The technical privacy policy is maintained in `docs/privacy.md`.

## Quality controls

The project uses Node's built-in test runner and no test framework dependency. Tests cover:

- calculator totals, tax-rate resolution, RNH capping, and rounding;
- proposal creation and cloning;
- plain/encrypted simulation export and import validation; and
- output-card and collapsible-panel behavior using lightweight DOM doubles.

Run `npm test` to execute the suite and `npm run check` to syntax-check the application and calculator entry points. `.github/workflows/validate.yml` runs `npm test` on pushes and pull requests with Node.js 24.

## Extension guidelines

Future changes should preserve the existing boundaries:

1. Add or revise tax rules and statutory values in `src/data/` and cover them with calculator tests.
2. Keep compensation rules in `src/calculator.js` and proposal defaults or shapes in `src/domain/proposal.js`, rather than embedding them in UI modules.
3. Treat import/export format changes as versioned compatibility changes and extend the validation logic before accepting new fields.
4. Treat any server persistence, sharing feature, analytics integration, or external data source as an architectural and privacy change requiring documentation and explicit user consent design.
