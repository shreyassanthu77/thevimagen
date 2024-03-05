export function isInputEl(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement {
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA";
}
