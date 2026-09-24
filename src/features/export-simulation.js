import { createEncryptedSimulationExport, createSimulationExport, downloadJson } from "../export/simulation.js";
import { createExportDialog } from "../ui/export-dialog.js";

// Connects the export UI with the current in-memory simulation state.
export function initialiseSimulationExport({ state, openButton, dialog, copy }) {
  const exportDialog = createExportDialog(dialog, copy);

  openButton.addEventListener("click", () => exportDialog.open());

  exportDialog.onSubmit(async ({ password, passwordConfirmation }) => {
    // Build a fresh snapshot at submission time so the file reflects every visible proposal.
    const simulationExport = createSimulationExport(state);
    if (password !== null) {
      validatePassword(password, passwordConfirmation, copy);
      const encryptedExport = await createEncryptedSimulationExport(simulationExport, password);
      downloadJson(encryptedExport, `${exportFilename()}-protegida.json`);
    } else {
      downloadJson(simulationExport, `${exportFilename()}.json`);
    }
    exportDialog.close();
  });

}

// Prevents users from creating an encrypted export they cannot later decrypt.
function validatePassword(password, passwordConfirmation, copy) {
  if (password !== passwordConfirmation) {
    throw new Error(copy.passwordMismatch);
  }
  if (password.length < 12) {
    throw new Error(copy.passwordMinimum);
  }
}

// Uses an ISO date to create a predictable, filesystem-safe default filename.
function exportFilename() {
  return `simulacao-salarial-${new Date().toISOString().slice(0, 10)}`;
}
