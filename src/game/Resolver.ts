import { Grid } from "./Grid";
import { Match, PowerupKind, Vec2, Color } from "./Types";

function gridWidth(grid: Grid): number {
  return (grid as any).width;
}

function gridHeight(grid: Grid): number {
  return (grid as any).height;
}

export interface ResolveContext {
  lastSwap?: { from: Vec2, to: Vec2 };

  onColorSwapGranted?: () => void;
}

export interface ResolveResult {
  grid: Grid;
  cleared: Vec2[];
  spawned: { kind: PowerupKind, at: Vec2 }[];
  scoreDelta: number;
}

/**
 * Resolve one step:
 * - clear matched cells
 * - spawn powerups at anchors
 * - auto-fire spawned powerups
 * - apply gravity and refill
 */
export function resolveStep(
  inputGrid: Grid,
  matches: Match[],
  resolveContext: ResolveContext
): ResolveResult {
  const workingGrid = inputGrid.clone();
}
