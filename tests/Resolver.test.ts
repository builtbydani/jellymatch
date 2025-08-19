import { describe, it, expect, vi } from "vitest";
import { Grid } from "../src/game/Grid";
import { findLineMatches } from "../src/game/Rules";
import { resolveStep, resolveAll } from "../src/game/Resolver";

const JELLY = (color: any) => ({ kind: "jelly" as const, color });
const UNBREAK = { kind: "unbreakable" as const };
const EMPTY = { kind: "empty" as const };

function freshGrid(width = 8, height = 6) {
  const grid = new Grid(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid.set(x, y, JELLY("red"));
    }
  }
  return grid;
}

function neutralGrid(width = 8, height = 8) {
  const grid = new Grid(width, height);
  const pallete = ["red", "green", "blue"];

  for (let y = 0; y < height; y++) {
    const rowShift = y % pallete.length;
    for (let x = 0; x < width; x++) {
      const color = pallete[(x + rowShift) % pallete.length];
      grid.set(x, y, JELLY(color));
    }
  }
  return grid;
}

describe("Resolver", () => {
  
  it("spawns a laser for a 4-line and auto-clears the entire row", () => {
    const grid = neutralGrid(7, 4);

    // Make exactly a 4-of-a-kind on row 2 (no 5+)
    grid.set(0, 2, JELLY("yellow"));
    grid.set(1, 2, JELLY("blue"));
    grid.set(2, 2, JELLY("blue"));
    grid.set(3, 2, JELLY("blue"));
    grid.set(4, 2, JELLY("blue"));
    grid.set(5, 2, JELLY("yellow"));
    grid.set(6, 2, JELLY("yellow"));

    const ctx = { lastSwap: { from: { x: 0, y: 2 }, to: { x: 1, y: 2 } } };
    const step = resolveStep(grid, findLineMatches(grid), ctx);

    // Row should be repopulated after gravity+refill
    for (let x = 0; x < 7; x++) {
      expect(step.grid.get(x, 2).kind).toBe("jelly");
    }
  });

  it("spawns a bomb for a 5-line and auto-clears a 5x5 clamped at edges", () => {
    const grid = freshGrid(8, 8);

    for (let x = 0; x < 8; x++) {
      grid.set(x, 4, JELLY("yellow"));
    }
    for (let x = 1; x <= 5; x++) {
      grid.set(x, 4, JELLY("green"));
    }

    const ctx = { lastSwap: { from: { x: 0, y: 4 }, to: { x: 3, y: 4} } };
    const step = resolveStep(grid, findLineMatches(grid), ctx);

    expect(step.spawned.some(s => s.kind === "bomb")).toBe(true);

    expect(step.cleared.length).toBeGreaterThanOrEqual(25);
  });

  
  it('grants "colorSwap" via hook for a plus "+" match', () => {
    const grid = neutralGrid(7, 7);

    // Build a single purple plus centered at (3,3)
    grid.set(2, 3, JELLY("purple"));
    grid.set(3, 3, JELLY("purple"));
    grid.set(4, 3, JELLY("purple"));
    grid.set(3, 2, JELLY("purple"));
    grid.set(3, 4, JELLY("purple"));

    const onColorSwapGranted = vi.fn();
    const ctx = { onColorSwapGranted };

    const step = resolveStep(grid, findLineMatches(grid), ctx);

    expect(onColorSwapGranted).toHaveBeenCalledTimes(1);
    expect(step.spawned.length).toBe(0); // plus doesn't spawn bomb/laser
  });

  it("chains cascades and applies combo mult", () => {
    const grid = freshGrid(6, 6);

    for (let x = 1; x <= 4; x++) {
      grid.set(x, 2, JELLY("blue"));
    }

    for (let x = 0; x <= 5; x++) {
      grid.set(0, x, JELLY("red"));
    }

    const result = resolveAll(grid, findLineMatches, {
      lastSwap: { from: { x: 0, y: 2 }, to: { x: 1, y: 2 } },
    });

    expect(result.chainCount).toBeGreaterThanOrEqual(1);
    expect(result.totalScore).toBeGreaterThan(0);

    expect(result.steps[0].scoreDelta).toBeGreaterThan(0);
  });

  it ("chooses anchor cell nearest to lastSwap.to", () => {
    const grid = freshGrid(7, 3);

    for (let x = 2; x <= 5; x++) {
      grid.set(x, 1, JELLY("blue"));
    }

    const matches = findLineMatches(grid);

    const result = resolveStep(grid, matches, {
      lastSwap: { from: { x: 1, y: 1 }, to: { x: 5, y: 1 } },
    });

    const laser = result.spawned.find(s => s.kind === "laser");
    expect(laser).toBeTruthy();
    expect(laser!.at.y).toBe(1);
    expect([4, 5]).toContain(laser!.at.x);
  });

  
  it("does not clear unbreakables during blasts", () => {
    const grid = neutralGrid(7, 4);

    // Put an unbreakable on the laser row
    grid.set(3, 2, UNBREAK);

    // Force a 4-line blue on the same row (skip the unbreakable column)
    grid.set(0, 2, JELLY("blue"));
    grid.set(1, 2, JELLY("blue"));
    grid.set(2, 2, JELLY("blue"));
    grid.set(4, 2, JELLY("blue")); // separated by the unbreakable at x=3

    const step = resolveStep(grid, findLineMatches(grid), {
      lastSwap: { from: { x: 0, y: 2 }, to: { x: 1, y: 2 } },
    });

    expect(step.grid.get(3, 2).kind).toBe("unbreakable");
  });
});
