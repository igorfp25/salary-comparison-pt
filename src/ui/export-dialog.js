export function createExportDialog(dialog, copy) {
  dialog.innerHTML = `
    <form id="export-form" method="dialog">
      <h2 id="export-dialog-title">${copy.title}</h2>
      <p class="sensitive-data-warning">
        <strong>${copy.sensitiveDataHeading}</strong> ${copy.sensitiveDataWarning}
      </p>
      <p class="dialog-note">${copy.privacyNote}</p>
      <label class="toggle-row export-password-toggle">
        <input id="encrypt-export" type="checkbox">
        ${copy.passwordProtection}
      </label>
      <div id="password-fields" class="password-fields" hidden>
        <label>
          ${copy.password}
          <input id="export-password" type="password" minlength="12" autocomplete="new-password">
        </label>
        <label>
          ${copy.passwordConfirmation}
          <input id="export-password-confirmation" type="password" minlength="12" autocomplete="new-password">
        </label>
        <p class="dialog-note">${copy.passwordNote}</p>
      </div>
      <p id="export-error" class="form-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button id="cancel-export" type="button" class="secondary">${copy.cancel}</button>
        <button type="submit">${copy.download}</button>
      </div>
    </form>
  `;

  const form = dialog.querySelector("#export-form");
  const encryptExport = dialog.querySelector("#encrypt-export");
  const passwordFields = dialog.querySelector("#password-fields");
  const password = dialog.querySelector("#export-password");
  const passwordConfirmation = dialog.querySelector("#export-password-confirmation");
  const error = dialog.querySelector("#export-error");

  function reset() {
    form.reset();
    passwordFields.hidden = true;
    password.required = false;
    passwordConfirmation.required = false;
    error.hidden = true;
  }

  encryptExport.addEventListener("change", () => {
    passwordFields.hidden = !encryptExport.checked;
    password.required = encryptExport.checked;
    passwordConfirmation.required = encryptExport.checked;
    error.hidden = true;
  });

  dialog.querySelector("#cancel-export").addEventListener("click", () => {
    dialog.close();
  });

  return {
    open() {
      reset();
      dialog.showModal();
    },
    close() {
      reset();
      dialog.close();
    },
    onSubmit(handler) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        error.hidden = true;
        try {
          await handler({
            password: encryptExport.checked ? password.value : null,
            passwordConfirmation: passwordConfirmation.value,
          });
        } catch (submissionError) {
          error.textContent = submissionError instanceof Error ? submissionError.message : copy.unknownError;
          error.hidden = false;
        }
      });
    },
  };
}
