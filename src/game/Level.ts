import { Tile, Vec2 } from "./Types";
import { RNG } from "./RNG";
import { Grid } from "./Grid";

// ---------- Tuning ------------
export const LEVEL_TUNING = {
  baseThreshold: 3500,       // points to go to lvl 2
  growthFactor: 1.18,        // increase per lvl
  smallGridLevel: 21,        // switch to 6x5 at >= 21
  unbreakableStartLevel: 11, // start spawning 2x2s at 11...20
  unbreakableChanceAtLevel(lvl: number) {
    if (lvl < 11 || lvl >= 21) return 0;
    const t = (lvl - 11) / 9;
    return 0.3 + 0.3 * t;
  },
  unbreakableBlocksPerLevel(lvl: number) {
    if (lvl < 16) return 1;
    return 2;
  },
};

export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  let current = LEVEL_TUNING.baseThreshold;
  for (let i = 2; i <= level; i++) {
    total += Math.round(current);
    current *= LEVEL_TUNING.growthFactor;
  }
  return total;
}

export function scoreToLevel(score: number): number {
  let level = 1;
  while (score >= thresholdForLevel(level + 1)) level++;
  return level;
}

export function shouldUseSmallGrid(level: number): number {
  return level >= LEVEL_TUNING.smallGridLevel;
}

export function desiredGridSizeForLevel(level: number): { width: number; height: number } {
  return shouldUseSmallGrid(level) ? { width: 6, height: 5 } : { width: 12, height: 10 };
}

// ----------- Unbreakables (2x2) ------------
function canPlace2x2(grid: Grid, topLeft: Vec2): boolean {
  const { x, y } = topLeft;
  if (x + 1 >= grid.width || y + 1 >= grid.height) return false;
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      const tile = grid.get(x + dx, y + dy);
      if (tile.kind === "unbreakable") return false;
    }
  }
  return true;
}

export function place2x2Unbreakable(grid: Grid, topLeft: Vec2): void {
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = 0; dx < 2; dx++) {
      grid.set(topLeft.x + dx, topLeft.y + dy, { kind: "unbreakable" } as Tile);
    }
  }
}

/**
 * Randomly spawn 2x2 unbreakable blocks at level start for levels 11...20
 * respects bounds, won't overwrite existing, never fills entire column 
 */
export function maybeSpawnUnbreakables(grid: Grid, rng: RNG, level: number): number {
  const chance = LEVEL_TUNING.unbreakableChanceAtLevel(level);
  if (chance <= 0) return 0;
  if (rng.next() > chance) return 0;

  let toPlace = LEVEL_TUNING.unbreakableBlocksPerLevel(level);
  let placed = 0;

  for (let attempts = 0; attempts < 200 && placed < toPlace; attempts++) {
    const x = rng.int(0, grid.width - 2);
    const y = rng.int(0, grid.height - 2);

    if (y === 0) continue;

    const topLeft = { x, y };
    if (!canPlace2x2(grid, topLeft)) continue;

    place2x2Unbreakable(grid, topLeft);
    placed++;
  }
  return placed;
}
