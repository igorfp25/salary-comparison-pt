// Identifies the portable file format independently from the application version.
const FORMAT = "salary-comparison-pt";
const VERSION = 1;
// A deliberately expensive derivation protects password-based exports against guessing attacks.
const PBKDF2_ITERATIONS = 600000;

// Creates a versioned snapshot containing every proposal and the shared calculation settings.
export function createSimulationExport(state) {
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    simulation: {
      rnhEnabled: state.rnhEnabled,
      rnhLimit: state.rnhLimit,
      socialSecurityRate: state.socialSecurityRate,
      proposals: state.proposals,
      selectedProposalId: state.selectedProposalId,
    },
  };
}

// Encrypts a snapshot locally with AES-GCM; the password is never written to the export.
export async function createEncryptedSimulationExport(simulationExport, password) {
  if (!crypto.subtle) {
    throw new Error("A encriptação não é suportada neste navegador.");
  }

  // Fresh random values ensure that repeated exports with the same password have different ciphertexts.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // PBKDF2 derives a non-exportable encryption key from the user-provided password.
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
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(simulationExport)),
  );

  // Store only the parameters required for a future local decryption operation.
  return {
    format: `${FORMAT}-encrypted`,
    version: VERSION,
    encryption: {
      algorithm: "AES-GCM",
      kdf: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

// Triggers a browser download without uploading or persisting the exported content.
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Defer revocation until the browser has started consuming the temporary object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Converts binary encryption values to JSON-safe Base64 strings.
function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
