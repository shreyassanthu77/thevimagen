import { VimFocusManager } from "./focus.ts";

const MODES = ["normal", "insert"] as const;
export type Mode = typeof MODES[number];
export class VimMode {
  #mode: Mode = "normal";
  get value() {
    return this.#mode;
  }
  set(m: Mode) {
    this.#mode = m;
  }
}

type KeyHandlerOptions = {
  el: Element | undefined;
  fm: VimFocusManager;
  mode: VimMode;
  runDefault: () => void;
};

export type KeyHandler = (
  options: KeyHandlerOptions,
) => void;
type Ctrl = `C-` | "";
type Shift = `S-` | "";
type Alt = `A-` | "";

type Letter<L extends string, CapitalOnly extends boolean = false> =
  CapitalOnly extends true ? Uppercase<L> : L;

type NumberRow<Shift extends boolean = false> = Shift extends false
  ? "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  : "!" | "@" | "#" | "$" | "%" | "^" | "&" | "*";

type Key<CapitalOnly extends boolean = false> =
  | Letter<"a", CapitalOnly>
  | Letter<"b", CapitalOnly>
  | Letter<"c", CapitalOnly>
  | Letter<"d", CapitalOnly>
  | Letter<"e", CapitalOnly>
  | Letter<"f", CapitalOnly>
  | Letter<"g", CapitalOnly>
  | Letter<"h", CapitalOnly>
  | Letter<"i", CapitalOnly>
  | Letter<"j", CapitalOnly>
  | Letter<"k", CapitalOnly>
  | Letter<"l", CapitalOnly>
  | Letter<"m", CapitalOnly>
  | Letter<"n", CapitalOnly>
  | Letter<"o", CapitalOnly>
  | Letter<"p", CapitalOnly>
  | Letter<"q", CapitalOnly>
  | Letter<"r", CapitalOnly>
  | Letter<"s", CapitalOnly>
  | Letter<"t", CapitalOnly>
  | Letter<"u", CapitalOnly>
  | Letter<"v", CapitalOnly>
  | Letter<"w", CapitalOnly>
  | Letter<"x", CapitalOnly>
  | Letter<"y", CapitalOnly>
  | Letter<"z", CapitalOnly>
  | NumberRow<CapitalOnly>
  | ","
  | "."
  | "/"
  | ";"
  | "'"
  | "["
  | "]"
  | "\\"
  | "-"
  | "="
  | "`"
  | '"'
  | " "
  | "Tab"
  | "Enter"
  | "Escape"
  | "Space"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Backspace"
  | "Delete"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown"
  | "Insert"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F11"
  | "F12";
export type KeyCombo =
  | `${Ctrl}${Alt}${Key}`
  | `${Ctrl}${Shift}${Alt}${Key<true>}`;

export const execDefault: KeyHandler = ({ runDefault }) => runDefault();

export class KeyMap {
  #keyMap: Record<Mode, Map<KeyCombo, KeyHandler>> = {
    normal: new Map([
      ["h", ({ el, fm }) => fm.focusH(el)],
      ["j", ({ el, fm }) => fm.focusJ(el)],
      ["k", ({ el, fm }) => fm.focusK(el)],
      ["l", ({ el, fm }) => fm.focusL(el)],
      ["i", ({ mode }) => mode.set("insert")],
      ["C-Tab", execDefault],
      // devtools
      ["C-S-I", execDefault],
      ["C-S-J", execDefault],
      // ignore function keys
      ["F1", execDefault],
      ["F2", execDefault],
      ["F3", execDefault],
      ["F4", execDefault],
      ["F5", execDefault],
      ["F6", execDefault],
      ["F7", execDefault],
      ["F8", execDefault],
      ["F9", execDefault],
      ["F10", execDefault],
      ["F11", execDefault],
      ["F12", execDefault],
    ]),
    insert: new Map([
      ["Escape", ({ mode }) => mode.set("normal")],
    ]),
  };

  get(mode: Mode, keyCombo: KeyCombo) {
    return this.#keyMap[mode].get(keyCombo);
  }

  has(mode: Mode, keyCombo: KeyCombo) {
    return this.#keyMap[mode].has(keyCombo);
  }

  set(mode: Mode, keyCombo: KeyCombo, handler: KeyHandler, remap = false) {
    if (!remap && this.has(mode, keyCombo)) {
      throw new Error(`KeyCombo ${keyCombo} already exists in mode ${mode}`);
    }
    this.#keyMap[mode].set(keyCombo, handler);
  }
}
