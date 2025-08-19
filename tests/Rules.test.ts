import { describe, it, expect } from "vitest";
import { Grid } from "../src/game/Grid";
import { findLineMatches, powerupForMatch } from "../src/game/Rules";

const J = (c: any) => ({ kind: "jelly" as const, color: c });
const U = { kind: "unbreakable" as const };

function emptyGrid(w = 6,h = 6) {
  const g = new Grid(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.set(x, y, J("red"));
  return g;
}

describe("Rules: matching", () => {
  it("finds a horizontal 3-line", () => {
    const g = emptyGrid(5, 3);
    // Row 1: RRRGB
    for (let x = 0; x < 3; x++) g.set(x, 1, J("red"));
    g.set(3, 1, J("green"));
    g.set(4, 1, J("blue"));

    const ms = findLineMatches(g);
    const m = ms.find(m=>m.kind==="line" && m.cells.length===3);
    expect(m).toBeTruthy();
    expect(m?.color).toBe("red");
  });

  it("upgrades 4-line match to laser", () => {
    const g = emptyGrid(5, 5);
    for (let x = 0; x < 4; x++) g.set(2, x, J("green"));
    const ms = findLineMatches(g);
    const m4 = ms.find(m=>m.kind==="line" && m.cells.length===4);
    expect(powerupForMatch(m4)).toBe("laser");
  });

  it("upgrades 5-line match to bomb", () => {
    const g = emptyGrid(6, 3);
    for (let x = 0; x < 5; x++) g.set(x, 1, J("blue"));
    const ms = findLineMatches(g);
    const m5 = ms.find(m=>m.kind==="line" && m.cells.length===5)!;
    expect(powerupForMatch(m5)).toBe("bomb");
  });

  it("detects + shape and assigns colorSwap", () => {
    const g = emptyGrid(5, 5);
    for (let x = 1; x <= 3; x++) g.set(2, x, J("yellow"));
    g.set(1, 2, J("yellow"));
    g.set(3, 2, J("yellow"));
    const ms = findLineMatches(g);
    const plus = ms.find(m=>m.kind==="+");
    expect(plus).toBeTruthy();
    expect(plus?.center).toEqual({x:2,y:2});
    expect(powerupForMatch(plus!)).toBe("colorSwap");
  });

  it("ignores unbreakables in runs", () => {
    const g = emptyGrid(5, 1);
    g.set(0, 0, J("purple"));
    g.set(1, 0, U as any);
    g.set(2, 0, J("purple"));
    g.set(3, 0, J("purple"));
    const ms = findLineMatches(g);
    const havePurple3 = ms.some(m=>m.color==="purple" && m.cells.length>=3);
    expect(havePurple3).toBe(false);
  });
});
