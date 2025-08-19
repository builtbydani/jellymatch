// tests/Deadlock.test.ts
import { describe, it, expect } from "vitest";
import { Grid } from "../src/game/Grid";
import { RNG } from "../src/game/RNG";
import { findLineMatches } from "../src/game/Rules";
import { hasAnyLegalSwap, reshuffleInPlace } from "../src/game/Deadlock";

const J = (color: any) => ({ kind: "jelly" as const, color });
const U = { kind: "unbreakable" as const };

const getMatches = (g: Grid) => findLineMatches(g);

describe("Deadlock & Reshuffle (simple style)", () => {
  it("2x2 is inherently deadlocked (no possible match-3)", () => {
    const g = new Grid(2, 2);
    g.set(0, 0, J("red"));
    g.set(1, 0, J("blue"));
    g.set(0, 1, J("green"));
    g.set(1, 1, J("yellow"));

    expect(hasAnyLegalSwap(g, getMatches)).toBe(false);

    const rng = new RNG(123);
    // Even after reshuffle, 2x2 cannot ever have a legal match-3.
    const ok = reshuffleInPlace(g, rng, getMatches, { maxAttempts: 20, avoidImmediateMatches: true });
    expect(ok).toBe(false);
  });

  it("reshuffles a normal board to one with at least one legal swap", () => {
    const g = new Grid(4, 3);
    // Fill with a mix of colors; we’re not asserting initial deadlock, just that
    // after reshuffle the board is solvable and (optionally) has no premade matches.
    g.set(0, 0, J("red"));    g.set(1, 0, J("green")); g.set(2, 0, J("blue"));  g.set(3, 0, J("yellow"));
    g.set(0, 1, J("blue"));   g.set(1, 1, J("red"));   g.set(2, 1, J("green")); g.set(3, 1, J("purple"));
    g.set(0, 2, J("green"));  g.set(1, 2, J("blue"));  g.set(2, 2, J("yellow"));g.set(3, 2, J("red"));

    const rng = new RNG(42);
    const ok = reshuffleInPlace(g, rng, getMatches, { maxAttempts: 200, avoidImmediateMatches: true });
    expect(ok).toBe(true);
    expect(hasAnyLegalSwap(g, getMatches)).toBe(true);
  });

  it("preserves unbreakables during reshuffle", () => {
    const g = new Grid(4, 3);
    // Place an unbreakable at (3,2)
    g.set(3, 2, U);

    // Fill the rest with jellies
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (x === 3 && y === 2) continue;
        const color = (["red","green","blue","yellow","purple"] as const)[(x + y) % 5];
        g.set(x, y, J(color));
      }
    }

    const rng = new RNG(7);
    const ok = reshuffleInPlace(g, rng, getMatches, { maxAttempts: 200, avoidImmediateMatches: true });
    expect(ok).toBe(true);
    expect(g.get(3, 2)).toEqual(U); // stayed put
  });
});

