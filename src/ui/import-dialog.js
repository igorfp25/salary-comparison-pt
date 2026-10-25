// Renders import prompts with locale copy supplied by the application layer.
export function createImportDialog(dialog, copy) {
  return {
    requestPassword(fileName) {
      dialog.innerHTML = `
        <form id="import-password-form" method="dialog">
          <h2 id="import-dialog-title">${copy.passwordTitle}</h2>
          <p class="dialog-note">${copy.passwordDescription.replace("{fileName}", escapeHtml(fileName))}</p>
          <label>
            ${copy.password}
            <input id="import-password" type="password" autocomplete="current-password" required>
          </label>
          <div class="dialog-actions">
            <button id="cancel-import" type="button" class="secondary">${copy.cancel}</button>
            <button type="submit">${copy.continue}</button>
          </div>
        </form>
      `;

      return promptForPassword(dialog);
    },
    requestAction(proposalCount) {
      return promptForAction(dialog, copy, proposalCount);
    },
    showError(message) {
      dialog.innerHTML = `
        <form method="dialog">
          <h2 id="import-dialog-title">${copy.errorTitle}</h2>
          <p class="form-error">${escapeHtml(message)}</p>
          <div class="dialog-actions"><button type="submit">${copy.close}</button></div>
        </form>
      `;
      dialog.showModal();
    },
  };
}

function promptForPassword(dialog) {
  return new Promise((resolve) => {
    const form = dialog.querySelector("#import-password-form");
    const passwordInput = dialog.querySelector("#import-password");
    let password = null;

    dialog.addEventListener("close", () => resolve(password), { once: true });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      password = passwordInput.value;
      dialog.close();
    });
    dialog.querySelector("#cancel-import").addEventListener("click", () => dialog.close());
    dialog.showModal();
  });
}

function promptForAction(dialog, copy, proposalCount) {
  return new Promise((resolve) => {
    let action = null;
    dialog.addEventListener("close", () => resolve(action), { once: true });

    function renderOptions() {
      const proposalDescription = proposalCount === 1
        ? copy.singleProposal
        : copy.multipleProposals.replace("{count}", proposalCount);
      const addLabel = proposalCount === 1 ? copy.addSingle : copy.addMultiple;

      dialog.innerHTML = `
        <form method="dialog">
          <h2 id="import-dialog-title">${copy.actionTitle}</h2>
          <p class="dialog-note">${proposalDescription}</p>
          <div class="import-actions">
            <button id="add-proposals" type="button" class="secondary">${addLabel}</button>
            <button id="replace-simulation" type="button">${copy.replace}</button>
          </div>
          <p class="dialog-note">${copy.addDescription}</p>
          <div class="dialog-actions"><button type="submit" class="secondary">${copy.cancel}</button></div>
        </form>
      `;

      dialog.querySelector("#add-proposals").addEventListener("click", () => {
        action = "add";
        dialog.close();
      });
      dialog.querySelector("#replace-simulation").addEventListener("click", renderReplaceConfirmation);
    }

    function renderReplaceConfirmation() {
      dialog.innerHTML = `
        <form method="dialog">
          <h2 id="import-dialog-title">${copy.replaceConfirmationTitle}</h2>
          <p class="sensitive-data-warning">${copy.replaceConfirmationDescription}</p>
          <div class="dialog-actions">
            <button id="back-to-import-options" type="button" class="secondary">${copy.back}</button>
            <button id="confirm-replace" type="button">${copy.confirmReplace}</button>
          </div>
        </form>
      `;

      dialog.querySelector("#back-to-import-options").addEventListener("click", renderOptions);
      dialog.querySelector("#confirm-replace").addEventListener("click", () => {
        action = "replace";
        dialog.close();
      });
    }

    renderOptions();
    dialog.showModal();
  });
}

// Escapes filenames and error details before placing them in generated dialog markup.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
