import assert from "node:assert/strict";
import test from "node:test";

import { initialiseCollapsiblePanel } from "../../src/ui/collapsible-panel.js";

// Provides the minimal element behaviour needed to test the panel's UI state without a browser.
function createElement() {
  const attributes = new Map();
  const listeners = new Map();
  const classes = new Set();

  return {
    hidden: false,
    textContent: "",
    classList: {
      toggle(className, force) {
        if (force) classes.add(className);
        else classes.delete(className);
      },
      contains(className) {
        return classes.has(className);
      },
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    click() {
      listeners.get("click")?.();
    },
  };
}

test("collapsible panel updates visible content and accessible toggle state", () => {
  const panel = createElement();
  const content = createElement();
  const toggle = createElement();

  initialiseCollapsiblePanel({
    panel,
    content,
    toggle,
    expandedLabel: "Hide",
    collapsedLabel: "Show configuration",
  });

  assert.equal(content.hidden, false);
  assert.equal(toggle.textContent, "Hide");
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(panel.classList.contains("is-collapsed"), false);

  toggle.click();

  assert.equal(content.hidden, true);
  assert.equal(toggle.textContent, "Show configuration");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(panel.classList.contains("is-collapsed"), true);
});
