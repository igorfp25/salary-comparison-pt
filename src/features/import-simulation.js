import { cloneProposal } from "../domain/proposal.js";
import { inspectSimulationFile, readSimulationFile, SimulationFileError } from "../import/simulation.js";
import { createImportDialog } from "../ui/import-dialog.js";

const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

// Connects file selection and user decisions to the in-memory simulation state.
export function initialiseSimulationImport({ state, openButton, fileInput, dialog, copy, render }) {
  const importDialog = createImportDialog(dialog, copy);

  openButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      if (file.size > MAX_IMPORT_FILE_SIZE) throw new SimulationFileError("fileTooLarge");

      const fileText = await file.text();
      const inspection = inspectSimulationFile(fileText);
      const password = inspection.requiresPassword ? await importDialog.requestPassword(file.name) : null;
      if (inspection.requiresPassword && password === null) return;

      const importedSimulation = await readSimulationFile(fileText, password);
      const action = await importDialog.requestAction(importedSimulation.proposals.length);
      if (action === "replace") {
        replaceSimulation(state, importedSimulation);
      } else if (action === "add") {
        addProposals(state, importedSimulation.proposals);
      } else {
        return;
      }

      render();
    } catch (error) {
      importDialog.showError(importErrorMessage(error, copy));
    } finally {
      // Clear the picker so the same file can be selected again after cancellation or an error.
      fileInput.value = "";
    }
  });
}

// Applies the validated proposals and shared assumptions after replacement is confirmed.
function replaceSimulation(state, importedSimulation) {
  state.rnhEnabled = importedSimulation.rnhEnabled;
  state.rnhLimit = importedSimulation.rnhLimit;
  state.socialSecurityRate = importedSimulation.socialSecurityRate;
  state.proposals = importedSimulation.proposals;
  state.selectedProposalId = importedSimulation.selectedProposalId;
}

// Adds fresh proposal copies while keeping the current simulation's shared assumptions.
function addProposals(state, importedProposals) {
  const proposals = importedProposals.map((proposal) => cloneProposal(proposal, proposal.name));
  state.proposals.push(...proposals);
  state.selectedProposalId = proposals[0].id;
}

function importErrorMessage(error, copy) {
  if (error instanceof SimulationFileError) return copy.errors[error.code] ?? copy.errors.unknown;
  return copy.errors.unknown;
}
