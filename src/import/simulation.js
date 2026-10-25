import { INCOME_TYPES, MEAL_ALLOWANCE_PAYMENT_METHODS } from "../domain/proposal.js";
import {
  ENCRYPTED_SIMULATION_FILE_FORMAT,
  PBKDF2_ITERATIONS,
  SIMULATION_FILE_FORMAT,
  SIMULATION_FILE_VERSION,
} from "../simulation/file-format.js";

const MAX_PROPOSALS = 1000;
const MAX_ITEMS_PER_PROPOSAL = 100;
const INCOME_CALCULATION_MODES = new Set([
  "fixed",
  "baseSalaryPercentage",
  "monthlyBaseSalaryPercentage",
  "familyMember",
]);
const DEDUCTION_CALCULATION_MODES = new Set([
  "fixed",
  "baseSalaryPercentage",
  "healthInsuranceFamily",
]);

// Carries translation keys instead of UI text so file validation stays locale-independent.
export class SimulationFileError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// Inspects the format before asking for a password or presenting import actions.
export function inspectSimulationFile(fileText) {
  const payload = parseJson(fileText);
  if (payload.format === SIMULATION_FILE_FORMAT) return { requiresPassword: false };
  if (payload.format === ENCRYPTED_SIMULATION_FILE_FORMAT) return { requiresPassword: true };
  throw new SimulationFileError("unsupportedFile");
}

// Decrypts when necessary, then validates and returns only fields used by the current application.
export async function readSimulationFile(fileText, password = null) {
  const payload = parseJson(fileText);
  const simulationExport = payload.format === ENCRYPTED_SIMULATION_FILE_FORMAT
    ? await decryptSimulationExport(payload, password)
    : payload;

  return validateSimulationExport(simulationExport);
}

function parseJson(fileText) {
  try {
    const payload = JSON.parse(fileText);
    if (!isRecord(payload)) throw new SimulationFileError("invalidData");
    return payload;
  } catch (error) {
    if (error instanceof SimulationFileError) throw error;
    throw new SimulationFileError("invalidJson");
  }
}

// Uses the same local AES-GCM and PBKDF2 settings as export; credentials never leave memory.
async function decryptSimulationExport(payload, password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new SimulationFileError("passwordRequired");
  }
  if (!crypto.subtle || !isValidEncryptionMetadata(payload.encryption)) {
    throw new SimulationFileError("invalidData");
  }

  try {
    const salt = base64ToBytes(payload.encryption.salt);
    const iv = base64ToBytes(payload.encryption.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) {
      throw new SimulationFileError("invalidData");
    }
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return parseJson(new TextDecoder().decode(plaintext));
  } catch (error) {
    if (error instanceof SimulationFileError) throw error;
    throw new SimulationFileError("invalidPasswordOrFile");
  }
}

function validateSimulationExport(simulationExport) {
  if (
    simulationExport.format !== SIMULATION_FILE_FORMAT
    || simulationExport.version !== SIMULATION_FILE_VERSION
    || !isRecord(simulationExport.simulation)
  ) {
    throw new SimulationFileError("unsupportedFile");
  }

  const simulation = simulationExport.simulation;
  const proposals = validateArray(simulation.proposals, validateProposal);
  if (proposals.length === 0 || proposals.length > MAX_PROPOSALS) {
    throw new SimulationFileError("invalidData");
  }
  validateUniqueIds(proposals);

  const selectedProposalId = validateRequiredString(simulation.selectedProposalId);
  if (!proposals.some((proposal) => proposal.id === selectedProposalId)) {
    throw new SimulationFileError("invalidData");
  }

  return {
    rnhEnabled: validateBoolean(simulation.rnhEnabled),
    rnhLimit: validateNumber(simulation.rnhLimit, 0, 1),
    socialSecurityRate: validateNumber(simulation.socialSecurityRate, 0, 1),
    proposals,
    selectedProposalId,
  };
}

function validateProposal(proposal) {
  if (!isRecord(proposal)) throw new SimulationFileError("invalidData");
  if (
    !Array.isArray(proposal.incomeItems)
    || !Array.isArray(proposal.deductionItems)
    || proposal.incomeItems.length > MAX_ITEMS_PER_PROPOSAL
    || proposal.deductionItems.length > MAX_ITEMS_PER_PROPOSAL
  ) {
    throw new SimulationFileError("invalidData");
  }
  const incomeItems = validateArray(proposal.incomeItems, validateIncomeItem);
  const deductionItems = validateArray(proposal.deductionItems, validateDeductionItem);
  validateUniqueIds(incomeItems);
  validateUniqueIds(deductionItems);

  return {
    id: validateRequiredString(proposal.id),
    name: validateText(proposal.name),
    baseSalary: validateNumber(proposal.baseSalary, 0),
    salaryMonths: validateInteger(proposal.salaryMonths, 1, 14),
    mealAllowanceDaily: validateNumber(proposal.mealAllowanceDaily, 0),
    mealAllowanceMonths: validateInteger(proposal.mealAllowanceMonths, 0, 12),
    mealAllowancePaymentMethod: validateMealAllowancePaymentMethod(proposal.mealAllowancePaymentMethod),
    incomeItems,
    deductionItems,
  };
}

function validateIncomeItem(item) {
  if (!isRecord(item) || !INCOME_TYPES.includes(item.type) || !INCOME_CALCULATION_MODES.has(item.calculationMode)) {
    throw new SimulationFileError("invalidData");
  }
  return {
    id: validateRequiredString(item.id),
    type: item.type,
    label: validateText(item.label),
    amount: validateNumber(item.amount, 0),
    familyMembers: validateInteger(item.familyMembers, 1, 20),
    calculationMode: item.calculationMode,
    payments: validateInteger(item.payments, 1, 24),
    subjectToIrs: validateBoolean(item.subjectToIrs),
    subjectToSs: validateBoolean(item.subjectToSs),
  };
}

function validateDeductionItem(item) {
  if (!isRecord(item) || !DEDUCTION_CALCULATION_MODES.has(item.calculationMode)) {
    throw new SimulationFileError("invalidData");
  }
  return {
    id: validateRequiredString(item.id),
    label: validateText(item.label),
    calculationMode: item.calculationMode,
    amount: validateNumber(item.amount, 0),
    payments: validateInteger(item.payments, 1, 24),
    dependentAmount: validateNumber(item.dependentAmount, 0),
    dependents: validateInteger(item.dependents, 0, 20),
  };
}

function validateMealAllowancePaymentMethod(value) {
  // Older exports do not have a payment-method field and default to the first supported method.
  if (value === undefined) return MEAL_ALLOWANCE_PAYMENT_METHODS[0];
  if (!MEAL_ALLOWANCE_PAYMENT_METHODS.includes(value)) throw new SimulationFileError("invalidData");
  return value;
}

function isValidEncryptionMetadata(metadata) {
  return isRecord(metadata)
    && metadata.algorithm === "AES-GCM"
    && metadata.kdf === "PBKDF2"
    && metadata.hash === "SHA-256"
    && metadata.iterations === PBKDF2_ITERATIONS
    && typeof metadata.salt === "string"
    && typeof metadata.iv === "string";
}

function base64ToBytes(value) {
  if (typeof value !== "string" || value.length === 0) throw new SimulationFileError("invalidData");
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function validateArray(value, validator) {
  if (!Array.isArray(value)) throw new SimulationFileError("invalidData");
  return value.map(validator);
}

function validateUniqueIds(items) {
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new SimulationFileError("invalidData");
  }
}

function validateRequiredString(value) {
  if (typeof value !== "string" || value.length === 0) throw new SimulationFileError("invalidData");
  return value;
}

function validateText(value) {
  if (typeof value !== "string") throw new SimulationFileError("invalidData");
  return value;
}

function validateBoolean(value) {
  if (typeof value !== "boolean") throw new SimulationFileError("invalidData");
  return value;
}

function validateNumber(value, minimum, maximum = Number.POSITIVE_INFINITY) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new SimulationFileError("invalidData");
  }
  return value;
}

function validateInteger(value, minimum, maximum) {
  if (!Number.isInteger(value)) throw new SimulationFileError("invalidData");
  return validateNumber(value, minimum, maximum);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
