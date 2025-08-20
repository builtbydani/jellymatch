import { describe, it, expect } from "vitest";

import { 
  scoreToLevel, 
  thresholdForLevel, 
  shouldUseSmallGrid,
  desiredGridSizeForLevel,
  maybeSpawnUnbreakables
} from "../src/game/Level";

import { RNG } from "../src/game/RNG";
import { Grid } from "../src/game/Grid";

describe("Level basics", () => {
  it("thresholds are increasing and map score→level", () => {
    const t2 = thresholdForLevel(2);
    const t3 = thresholdForLevel(3);
    expect(t3).toBeGreaterThan(t2);
    expect(scoreToLevel(0)).toBe(1);
    expect(scoreToLevel(t2)).toBeGreaterThanOrEqual(2);
  });

  it("grid size switches at >=21", () => {
    expect(shouldUseSmallGrid(20)).toBe(false);
    expect(desiredGridSizeForLevel(20)).toEqual({ width: 12, height: 10 });
    expect(shouldUseSmallGrid(21)).toBe(true);
    expect(desiredGridSizeForLevel(21)).toEqual({ width: 6, height: 5 });
  });

  it("spawns 2×2 unbreakables within bounds when active", () => {
    const g = new Grid(12, 10);
    const rng = new RNG(1337);
    // Run multiple times to catch bounds issues
    for (let i = 0; i < 5; i++) {
      maybeSpawnUnbreakables(g, rng, 15);
    }
    // Ensure no unbreakables out of bounds and are in 2x2 groupings
    // (light check: all unbreakables must have a neighbor unbreakable right or down)
    
    const belongsToTwoByTwo = (x: number, y: number) => {
      for (let oy = -1; oy <= 0; oy++) {
        for (let ox = -1; ox <= 0; ox++) {
          const sx = x + ox, sy = y + oy;
          if (sx < 0 || sy < 0 || sx + 1 >= g.width || sy + 1 >= g.height) continue;
          let cnt = 0;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              if (g.get(sx + dx, sy + dy).kind === "unbreakable") cnt++;
            }
          }
          if (cnt === 4) return true;
        }
      }
      return false;
    };

    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        if (g.get(x, y).kind === "unbreakable") {
          expect(belongsToTwoByTwo(x, y)).toBe(true);
        }
      }
    }

  });
});
