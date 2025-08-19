import { COLORS, Color, Tile, Vec2 } from "./Types";
import { RNG } from "./RNG";

export class Grid {
  readonly w: number;
  readonly h: number;
  private cells: Tile[];
  private rng: RNG;

  constructor(w: number, h: number, rng = new RNG(42)) {
    this.w = w;
    this.h = h;
    this.rng = rng;
    this.cells = new Array(w * h);
    // fill with random jelly (TODO: Avoid initial matches)
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { 
        kind: "jelly",
        color: COLORS[i + Math.floor(this.rng.next()*1000) % COLORS.length]
      };
    }
  }

  index(x: number, y: number) { return y * this.w + x; }
  inBounds(x: number, y: number) { return x >= 0 && x < this.w && y >= 0 && y < this.h; }

  get(x: number, y: number): Tile{ return this.cells[this.index(x, y)]; }
  set(x: number, y: number, t: Tile) { this.cells[this.index(x, y)] = t; }

  setRow(y: number, tiles: Tile[]) {
    if (tiles.length !== this.w) throw new Error("row length mismatch");
    for (let x = 0; x < this.w; x++) this.set(x, y, tiles[x]);
  }

  clone(): Grid {
    const g = new Grid(this.w, this.h, this.rng);
    g.cells = this.cells.map(t => ({ ...t }));
    return g;
  }

  swap(a: Vec2, b: Vec2) {
    const ai = this.index(a.x, a.y);
    const bi = this.index(b.x, b.y);
    const tmp = this.cells[ai];
    this.cells[ai] = this.cells[bi];
    this.cells[bi] = tmp;
  }

  /** drop jellies into empty spaces, spawn fresh at top **/
  applyGravity() {
    for (let x = 0; x < this.w; x++) {
      let write = this.h - 1;
      for (let y = this.h - 1; y >= 0; y--) {
        const t = this.get(x, y);
        if (t.kind === "jelly" && t.color) {
          if (write !== y) this.set(x, write, t);
          write--;
        }
      }
      for (let y = write; y >= 0; y--) {
        const color = COLORS[Math.floor(Math.random()*COLORS.length)];
        this.set(x, y, { kind: "jelly", color });
      }
    }
  }
}
