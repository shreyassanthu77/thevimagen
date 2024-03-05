type Position = {
  el: HTMLElement;
  pos: {
    x: number;
    y: number;
  };
  left?: Position;
  right?: Position;
  up?: Position;
  down?: Position;
};

export class FocusManager {
  root!: Position;
  topLeft!: Position;
  constructor(
    elements: NodeListOf<HTMLElement>,
  ) {
    const addEl = this.#addEl.bind(this);
    elements.forEach(addEl);
  }

  #addEl(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const x = rect.x;
    const y = rect.y;

    if (!this.root) {
      this.root = {
        el,
        pos: { x, y },
      };
    } else {
      const upRes = this.#uo(this.root, { el, pos: { x, y } });
      if (upRes) return;
      this.#left(this.root, { el, pos: { x, y } });
    }

    if (!this.topLeft) {
      this.topLeft = this.root;
    } else if (x < this.topLeft.pos.x && y < this.topLeft.pos.y) {
      this.topLeft = { el, pos: { x, y } };
    }
  }

  #uo(root: Position, el: Position): boolean {
    if (el.pos.y < root.pos.y) {
      if (root.up) {
        return this.#uo(root.up, el);
      } else {
        el.down = root;
        root.up = el;
        return true;
      }
    } else if (el.pos.y > root.pos.y) {
      if (root.down) {
        return this.#uo(root.down, el);
      } else {
        el.up = root;
        root.down = el;
        return true;
      }
    } else {
      return false;
    }
  }

  #left(root: Position, el: Position): boolean {
    if (el.pos.x < root.pos.x) {
      if (root.left) {
        return this.#left(root.left, el);
      } else {
        el.right = root;
        root.left = el;
        return true;
      }
    } else if (el.pos.x > root.pos.x) {
      if (root.right) {
        return this.#left(root.right, el);
      } else {
        el.left = root;
        root.right = el;
        return true;
      }
    } else {
      return false;
    }
  }

  #find(el: HTMLElement, root: Position): Position | undefined {
    const rect = el.getBoundingClientRect();
    const x = rect.x;
    const y = rect.y;

    if (root.el === el) {
      return root;
    }

    if (x < root.pos.x && root.left) {
      return this.#find(el, root.left);
    } else if (x > root.pos.x && root.right) {
      return this.#find(el, root.right!);
    } else if (y < root.pos.y && root.up) {
      return this.#find(el, root.up);
    } else if (y > root.pos.y && root.down) {
      return this.#find(el, root.down);
    } else {
      return undefined;
    }
  }

  find(el: HTMLElement): Position | undefined {
    return this.#find(el, this.root);
  }
}
