type Center = { x: number; y: number };

export type ElementNode = {
  el: Element;
  rect: DOMRect;
  center: Center;
  left?: ElementNode;
  right?: ElementNode;
  up?: ElementNode;
  down?: ElementNode;
};

export type Offset = {
  row: number;
  col: number;
};

function canFocus(el: Element) {
  if (
    el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ||
    el instanceof HTMLButtonElement
    // el.hasAttribute("tabindex") || (el as HTMLElement).isContentEditable
  ) {
    return !el.disabled;
  }

  if (el instanceof HTMLAnchorElement) {
    return el.hasAttribute("href");
  }

  if (el.hasAttribute("tabindex")) {
    return !el.hasAttribute("disabled");
  }

  if (el instanceof HTMLElement) {
    return el.isContentEditable;
  }

  return false;
}

function inSameRow(node1: ElementNode, node2: ElementNode) {
  const r1 = node1.rect;
  const r2 = node2.rect;

  return (r1.y <= r2.y && r1.bottom >= r2.bottom) ||
    (r2.y <= r1.y && r2.bottom >= r1.bottom);
}

function inSameCol(node1: ElementNode, node2: ElementNode) {
  const r1 = node1.rect;
  const r2 = node2.rect;

  return (r1.x <= r2.x && r1.right >= r2.right) ||
    (r2.x <= r1.x && r2.right >= r1.right);
}

function closestCenter(from: ElementNode, a?: ElementNode, b?: ElementNode) {
  if (!a) return b;
  if (!b) return a;
  const aDist = Math.sqrt(
    Math.pow(from.center.x - a.center.x, 2) +
      Math.pow(from.center.y - a.center.y, 2),
  );
  const bDist = Math.sqrt(
    Math.pow(from.center.x - b.center.x, 2) +
      Math.pow(from.center.y - b.center.y, 2),
  );

  return aDist < bDist ? a : b;
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isFocusable(el: Element) {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ||
    el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement ||
    el.hasAttribute("tabindex") || (el as HTMLElement).isContentEditable;
}

export class VimFocusManager {
  #elementNodeMap: Map<Element, ElementNode>;

  #topLeftNode?: ElementNode;
  get topLeftNode() {
    return this.#topLeftNode?.el;
  }

  constructor() {
    this.#elementNodeMap = new Map();
  }

  add(els: NodeList) {
    els.forEach((el) => {
      if (!isElement(el) || !isFocusable(el)) return;
      const rect = el.getBoundingClientRect();
      const center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
      const newNode: ElementNode = { el, rect, center };
      this.#elementNodeMap.set(el, newNode);

      if (!this.#topLeftNode) {
        this.#topLeftNode = newNode;
      } else {
        const tl = this.#topLeftNode;
        if (
          tl.center.x >= newNode.center.x && tl.center.y >= newNode.center.y
        ) {
          this.#topLeftNode = newNode;
        }
      }
      this.#updateConnections(newNode);
    });
  }

  #updateConnections(newNode: ElementNode) {
    for (const node of this.#elementNodeMap.values()) {
      if (node === newNode) continue;

      if (inSameRow(node, newNode)) {
        const newLeft = closestCenter(node, node.left, newNode);
        const newRight = closestCenter(node, node.right, newNode);

        if (newLeft === newNode && newNode.rect.x <= node.rect.x) {
          newNode.right = node;
          node.left = newNode;
        } else if (newRight === newNode && newNode.rect.x >= node.rect.x) {
          newNode.left = node;
          node.right = newNode;
        }
      } else if (inSameCol(node, newNode)) {
        const newUp = closestCenter(node, node.up, newNode);
        const newDown = closestCenter(node, node.down, newNode);

        if (newUp === newNode && newNode.rect.y <= node.rect.y) {
          newNode.down = node;
          node.up = newNode;
        } else if (newDown === newNode && newNode.rect.y >= node.rect.y) {
          newNode.up = node;
          node.down = newNode;
        }
      }
    }
  }

  remove(el: Element) {
    const node = this.#elementNodeMap.get(el);
    if (!node) return;
    console.log(node.el);

    if (node.up) {
      console.log(node.up.el);
      node.up.down = node.down;
    }

    if (node.down) {
      node.down.up = node.up;
    }

    if (node.left) {
      node.left.right = node.right;
    }

    if (node.right) {
      node.right.left = node.left;
    }

    this.#elementNodeMap.delete(el);
  }

  h(el?: Element): ElementNode | undefined {
    if (!el) return;
    const node = this.#elementNodeMap.get(el);
    if (!node?.left) return;
    if (!canFocus(node.left.el)) return this.h(node.left.el);
    return node.left;
  }

  j(el?: Element): ElementNode | undefined {
    if (!el) return;
    const node = this.#elementNodeMap.get(el);
    if (!node) return;
    if (node.down) return node.down;
    // find the nearest node in the column below
    let left = node.left;
    while (left && !left.down) {
      left = left.left;
    }

    let right = node.right;
    while (right && !right.down) {
      right = right.right;
    }

    if (left && right) {
      return closestCenter(node, left.down, right.down);
    } else if (left) {
      return left.down;
    } else if (right) {
      return right.down;
    }
  }

  k(el?: Element): ElementNode | undefined {
    if (!el) return;
    const node = this.#elementNodeMap.get(el);
    if (!node) return;
    if (node.up) return node.up;
    // find the nearest node in the column above
    let left = node.left;
    let right = node.right;
    let i = 0;
    while (true) {
      if (i++ > 100) {
        console.warn("infinite loop");
        break; // prevent infinite loop
      }
      if (!left && !right) {
        break;
      } else if (left && right) {
        if (left.up && right.up) {
          if (left.rect.x < right.rect.x) {
            return left.up;
          } else {
            return right.up;
          }
        } else if (left.up) {
          return left.up;
        } else if (right.up) {
          return right.up;
        } else {
          if (left.left) left = left.left;
          if (right.right) right = right.right;
        }
      } else if (left) {
        if (left.up) {
          return left.up;
        } else left = left.left;
      } else if (right) {
        if (right.up) {
          return right.up;
        } else right = right.right;
      } else {
        break;
      }
    }
  }

  l(el?: Element): ElementNode | undefined {
    if (!el) return;
    const node = this.#elementNodeMap.get(el);
    if (!node?.right) return;
    if (!canFocus(node.right.el)) return this.l(node.right.el);
    return node.right;
  }

  focusH(el?: Element, n = 1) {
    let node = this.h(el);
    while (n > 1) {
      const nxt = this.h(node?.el);
      if (!nxt) break;
      node = nxt;
      n--;
    }
    // @ts-ignore - focus is not defined on Element but he element could be an HTMLElement
    node?.el?.focus();
  }

  focusJ(el?: Element, n = 1): void {
    let node = this.j(el);
    while (n > 1) {
      const nxt = this.j(node?.el);
      if (!nxt) break;
      node = nxt;
      n--;
    }
    // @ts-ignore - focus is not defined on Element but he element could be an HTMLElement
    node?.el.focus();
  }

  focusK(el?: Element, n = 1): void {
    let node = this.k(el);
    while (n > 1) {
      const nxt = this.k(node?.el);
      if (!nxt) break;
      node = nxt;
      n--;
    }
    // @ts-ignore - focus is not defined on Element but he element could be an HTMLElement
    node?.el.focus();
  }

  focusL(el?: Element, n = 1) {
    let node = this.l(el);
    while (n > 1) {
      const nxt = this.l(node?.el);
      if (!nxt) break;
      node = nxt;
      n--;
    }
    // @ts-ignore - focus is not defined on Element but he element could be an HTMLElement
    node?.el?.focus();
  }
}
