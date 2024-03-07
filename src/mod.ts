import { VimFocusManager } from "./focus.ts";
import { KeyCombo, VimMode } from "./keymap.ts";
import { KeyMap } from "./keymap.ts";

export function init() {
  const vimFocusManager = new VimFocusManager();

  const focusableElements = document.querySelectorAll(
    "input, textarea, button, a, [tabindex], [contenteditable]",
  );
  vimFocusManager.add(focusableElements);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      vimFocusManager.add(mutation.addedNodes);
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          vimFocusManager.remove(node as Element);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return vimFocusManager;
}

const fm = init();
// @ts-ignore - globalThis is not defined
globalThis.vimFocusManager = fm;

export const vimMotions = new class VimMode {
  #enabled = true;
  get enabled() {
    return this.#enabled;
  }

  enable() {
    this.#enabled = true;
  }

  disable() {
    this.#enabled = false;
  }
}();

export const vimMode = new VimMode();
const keyMap = new KeyMap();

document.addEventListener("keydown", (e) => {
  if (!vimMotions.enabled) return;

  const ctrl = e.ctrlKey;
  const shift = e.shiftKey;
  const alt = e.altKey;
  const key = e.key.replace("Control", "").replace("Shift", "").replace(
    "Alt",
    "",
  ).trim();

  if (!key) return;

  const comboList: string[] = [];
  if (ctrl) comboList.push("C");
  if (shift) comboList.push("S");
  if (alt) comboList.push("A");
  if (key) {
    comboList.push(key);
  }

  const combo = comboList.join("-") as KeyCombo;

  console.log(combo);

  const el = document.activeElement ?? undefined;
  const mode = vimMode.value;
  const handler = keyMap.get(mode, combo);

  let shouldPreventDefault = true;
  function runDefault() {
    shouldPreventDefault = false;
  }

  if (handler && mode === "normal") {
    handler({ el, fm, mode: vimMode, runDefault });
  } else if (handler && mode === "insert") {
    handler({ el, fm, mode: vimMode, runDefault });
  } else if (!handler && mode === "insert") {
    return;
  }

  if (shouldPreventDefault) {
    e.preventDefault();
    e.stopPropagation();
  }
});
