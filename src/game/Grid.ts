import { COLORS, Color, Tile, Vec2 } from "./Types";
import { RNG } from "./RNG";

export class Grid {
  readonly width: number;
  readonly height: number;

  private cells: Tile[];
  private rng: RNG;

  constructor(width: number, height: number, rng = new RNG(42)) {
    this.width = width;
    this.height = height;
    this.rng = rng;

    this.cells = new Array(width * height);
    // fill with random jelly (NOTE: initial matches okay for now; resolve later)
    for (let i = 0; i < this.cells.length; i++) {
      const color = COLORS[Math.floor(this.rng.next() * COLORS.length)];
      this.cells[i] = { kind: "jelly", color };
    }
  }

  private index(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x: number, y: number): Tile{
    return this.cells[this.index(x, y)];
  }

  set(x: number, y: number, t: Tile) {
    this.cells[this.index(x, y)] = t;
  }

  clone(): Grid {
    const cloned = new Grid(this.width, this.height, this.rng);
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      cloned.cells[i] = cell ? { ...cell } : cell;
    }
    return cloned;
  }

  swap(a: Vec2, b: Vec2) {
    const indexA = this.index(a.x, a.y);
    const indexB = this.index(b.x, b.y);
    const temp = this.cells[indexA];
    this.cells[indexA] = this.cells[indexB]
    this.cells[indexB] = temp;
  }

  /**
  * Apply gravity within column segments separated by unbreakables
  * Moves non-empty tiles down; keeps unbreakables fixed;
  * leaves "empty" above, then refill()
  * */
  applyGravity(): void {
    for (let x = 0; x < this.width; x++) {
      let scanRow = this.height - 1;

      while (scanRow >= 0) {
        let segBot = scanRow;
        while (segBot >= 0 && this.get(x, segBot).kind === "unbreakable") {
          segBot--;
        }

        let segTop = segBot;
        while (segTop >= 0 && this.get(x, segTop).kind !== "unbreakable") {
          segTop--;
        }

        const movableTop = segTop + 1;
        const movableBot = segBot;
        if (movableTop <= movableBot) {
          const stack: Tile[] = [];
          for (let y = movableBot; y >= movableTop; y--) {
            const currentCell = this.get(x, yy);
            if (currentCell.kind !== "empty") stack.push(currentCell);
          }

          let writeRow = movableBot;
          for (const tile of stack) this.set(x, writeRow--, tile);
          while (writeRow >= movableTop) this.set(x, writeRow--, { kind: "empty" });
        }

        scanRow = segTop;
        while (scanRow >= 0 && this.get(x, scanRow).kind === "unbreakable") {
          scanRow--;
        }
      }
    }
  }

  refill() {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const currentCell = this.get(x, y);
        if (currentCell.kind === "empty") {
          const color = COLORS[Math.floor(this.rng.next() * COLORS.length)];
          this.set(x, y, { kind: "jelly", color });
        }
      }
    }
  }
}
