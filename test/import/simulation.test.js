import assert from "node:assert/strict";
import test from "node:test";

import { createEncryptedSimulationExport, createSimulationExport } from "../../src/export/simulation.js";
import {
  inspectSimulationFile,
  readSimulationFile,
  SimulationFileError,
} from "../../src/import/simulation.js";
import { createProposal } from "../../src/domain/proposal.js";
import {
  ENCRYPTED_SIMULATION_FILE_FORMAT,
  SIMULATION_FILE_FORMAT,
} from "../../src/simulation/file-format.js";

function makeFileText() {
  const proposal = createProposal("Imported offer");
  const snapshot = createSimulationExport({
    rnhEnabled: true,
    rnhLimit: 0.2,
    socialSecurityRate: 0.11,
    proposals: [proposal],
    selectedProposalId: proposal.id,
  });
  return { proposal, fileText: JSON.stringify(snapshot) };
}

test("valid simulation export files can be inspected and read", async () => {
  const { proposal, fileText } = makeFileText();

  assert.deepEqual(inspectSimulationFile(fileText), { requiresPassword: false });
  const simulation = await readSimulationFile(fileText);
  assert.equal(simulation.selectedProposalId, proposal.id);
  assert.equal(simulation.proposals[0].name, "Imported offer");
  assert.equal(simulation.proposals[0].mealAllowancePaymentMethod, "card");
});

test("legacy proposals default to card meal allowance payment method", async () => {
  const { fileText } = makeFileText();
  const payload = JSON.parse(fileText);
  delete payload.simulation.proposals[0].mealAllowancePaymentMethod;

  const simulation = await readSimulationFile(JSON.stringify(payload));
  assert.equal(simulation.proposals[0].mealAllowancePaymentMethod, "card");
});

test("encrypted files are recognized and password requirements are validated", async () => {
  const encrypted = {
    format: ENCRYPTED_SIMULATION_FILE_FORMAT,
    encryption: {},
  };

  assert.deepEqual(inspectSimulationFile(JSON.stringify(encrypted)), { requiresPassword: true });
  await assert.rejects(
    readSimulationFile(JSON.stringify(encrypted)),
    (error) => error instanceof SimulationFileError && error.code === "passwordRequired",
  );
});

test("encrypted simulation exports round-trip and reject an incorrect password", async () => {
  const { fileText } = makeFileText();
  const snapshot = JSON.parse(fileText);
  const encrypted = await createEncryptedSimulationExport(snapshot, "test-password");
  const encryptedText = JSON.stringify(encrypted);

  assert.equal(inspectSimulationFile(encryptedText).requiresPassword, true);
  const imported = await readSimulationFile(encryptedText, "test-password");
  assert.equal(imported.proposals[0].name, "Imported offer");
  await assert.rejects(
    readSimulationFile(encryptedText, "incorrect-password"),
    { code: "invalidPasswordOrFile" },
  );
});

test("malformed JSON, unsupported versions, invalid values and duplicate IDs are rejected", async () => {
  const { fileText, proposal } = makeFileText();
  const base = JSON.parse(fileText);

  assert.throws(() => inspectSimulationFile("{"), { code: "invalidJson" });
  assert.throws(() => inspectSimulationFile(JSON.stringify({ format: "unknown" })), { code: "unsupportedFile" });

  const badVersion = structuredClone(base);
  badVersion.version += 1;
  await assert.rejects(readSimulationFile(JSON.stringify(badVersion)), { code: "unsupportedFile" });

  const badAmount = structuredClone(base);
  badAmount.simulation.proposals[0].baseSalary = -1;
  await assert.rejects(readSimulationFile(JSON.stringify(badAmount)), { code: "invalidData" });

  const duplicateIds = structuredClone(base);
  duplicateIds.simulation.proposals.push({ ...proposal });
  await assert.rejects(readSimulationFile(JSON.stringify(duplicateIds)), { code: "invalidData" });
});

test("selected proposal must be present in the imported proposal list", async () => {
  const { fileText } = makeFileText();
  const payload = JSON.parse(fileText);
  payload.simulation.selectedProposalId = "missing-proposal";

  await assert.rejects(readSimulationFile(JSON.stringify(payload)), { code: "invalidData" });
});

test("plain exports carry the expected file contract", () => {
  const { fileText } = makeFileText();
  const payload = JSON.parse(fileText);

  assert.equal(payload.format, SIMULATION_FILE_FORMAT);
  assert.equal(payload.version, 1);
  assert.equal(typeof payload.exportedAt, "string");
});
