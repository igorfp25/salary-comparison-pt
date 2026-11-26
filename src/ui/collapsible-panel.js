// Keeps a UI panel and its toggle button in a consistent, accessible expanded state.
export function initialiseCollapsiblePanel({ panel, content, toggle, expandedLabel, collapsedLabel }) {
  function update(expanded) {
    panel.classList.toggle("is-collapsed", !expanded);
    content.hidden = !expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? expandedLabel : collapsedLabel;
  }

  // The panel starts expanded so all existing form fields remain immediately available.
  update(true);
  toggle.addEventListener("click", () => update(toggle.getAttribute("aria-expanded") !== "true"));
}
