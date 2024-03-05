import { FocusManager } from "./focus.ts";
import { isInputEl } from "./utils.ts";

const MODES = ["normal", "insert"] as const;
type Mode = typeof MODES[number];

let mode: Mode = "normal";

function setMode(newMode: Mode) {
  if (mode === newMode) return;
  console.log("mode", mode, "=>", newMode);
  mode = newMode;
}

type CaretPos = "start" | "end" | "next" | number;
function setCaretPos(el: Element, pos: CaretPos) {
  if (isInputEl(el)) {
    if (pos === "start") {
      el.setSelectionRange(0, 0);
    } else if (pos === "end") {
      el.setSelectionRange(el.value.length, el.value.length);
    } else if (pos === "next") {
      const end = el.selectionEnd ?? el.selectionStart ?? 0;
      el.setSelectionRange(end + 1, end + 1);
    } else {
      el.setSelectionRange(pos, pos);
    }
  }

  if (el.hasAttribute("contenteditable")) {
    const range = document.createRange();
    // deno-lint-ignore no-window
    const sel = window.getSelection();
    const node = el.childNodes[0];
    if (!node) return;
    if (pos === "start") {
      range.setStart(node, 0);
      range.setEnd(node, 0);
    } else if (pos === "end") {
      range.setStart(node, node?.textContent?.length ?? 0);
      range.setEnd(node, node?.textContent?.length ?? 0);
    } else if (pos === "next") {
      const end = sel?.focusOffset ?? 0;
      range.setStart(node, end + 1);
      range.setEnd(node, end + 1);
    } else {
      range.setStart(node, pos);
      range.setEnd(node, pos);
    }

    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

let focusManager!: FocusManager;

function normalMode(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();

  const activeElement = document.activeElement as HTMLElement | null;
  if (e.key === "i") {
    setMode("insert");
    return;
  } else if (e.key === "I") {
    if (activeElement) {
      setCaretPos(activeElement, "start");
    }
    setMode("insert");
  } else if (e.key === "a") {
    if (activeElement) {
      setCaretPos(activeElement, "next");
    }
    setMode("insert");
  } else if (e.key === "A") {
    if (activeElement) {
      setCaretPos(activeElement, "end");
    }
    setMode("insert");
  } else if (e.key === "h") {
    if (!activeElement) {
      focusManager.topLeft.el.focus();
      return;
    }
    const pos = focusManager.find(activeElement);
    pos?.left?.el?.focus();
    if (!pos) {
      focusManager.topLeft.el.focus();
    }
  } else if (e.key === "j") {
    if (!activeElement) {
      focusManager.topLeft.el.focus();
      return;
    }
    const pos = focusManager.find(activeElement);
    pos?.down?.el?.focus();
    if (!pos) {
      focusManager.topLeft.el.focus();
    }
  } else if (e.key === "k") {
    if (!activeElement) {
      focusManager.topLeft.el.focus();
      return;
    }
    console.log(activeElement);
    return;
    // const pos = focusManager.find(activeElement);
    // console.log(pos);
    // pos?.up?.el?.focus();
    // if (!pos) {
    //   focusManager.topLeft.el.focus();
    // }
  } else if (e.key === "l") {
    if (!activeElement) {
      focusManager.topLeft.el.focus();
      return;
    }
    const pos = focusManager.find(activeElement);
    pos?.right?.el?.focus();
    if (!pos) {
      focusManager.topLeft.el.focus();
    }
  }
}

function insertMode(e: KeyboardEvent) {
  if (e.key === "Escape") {
    setMode("normal");
  }
}

const modeHandlers = {
  normal: normalMode,
  insert: insertMode,
} as const;

document.addEventListener("DOMContentLoaded", () => {
  const focusableElements = document.querySelectorAll(
    "input, textarea, button, a, [tabindex], [contenteditable]",
  ) as NodeListOf<HTMLElement>;
  const _focusManager = new FocusManager(focusableElements);
  focusManager = _focusManager;
  // @ts-ignore for debugging
  globalThis.focusManager = _focusManager;
  document.addEventListener("keydown", (e) => {
    modeHandlers[mode](e);
  });

  setMode("normal");
});
