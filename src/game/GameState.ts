import { Grid } from "./Grid";
import { RNG } from "./RNG";
import { scoreBatch, type ScoreEvent } from "./Scoring";
import { scoreToLevel, desiredGridSizeForLevel, maybeSpawnUnbreakables } from "./Level";
import { hasAnyLegalSwap, reshuffleInPlace } from "./Deadlock";

export type ResolutionReport = {
  chainIndex: number;
  cleared: { x: number; y: number }[];
  powerups: { kind: "laser" | "bomb"; affected: { x: number; y: number }[] }[];
  grantedColorSwap?: boolean;
};

export type ResolveFn = (grid: Grid) => ResolutionReport[];   // you provide from Resolver
export type MatchFinder = (grid: Grid) => any[];              // you provide from Rules

export type GameState = {
  grid: Grid;
  rng: RNG;
  score: number;
  level: number;
  pendingColorSwap?: { rowIndex: number } | null;
};

export function createGameState(grid: Grid, rng: RNG): GameState {
  return { grid, rng, score: 0, level: 1, pendingColorSwap: null };
}

export function ensureGridShapeForLevel(state: GameState, makeGrid: (w: number, h: number) => Grid) {
  const { width, height } = desiredGridSizeForLevel(state.level);
  if (state.grid.width !== width || state.grid.height !== height) {
    state.grid = makeGrid(width, height);
  }
}

export function startLevelSetup(
  state: GameState,
  makeGrid: (w: number, h: number) => Grid,
  populateGrid: (grid: Grid, rng: RNG) => void
) {
  ensureGridShapeForLevel(state, makeGrid);
  populateGrid(state.grid, state.rng);
  // may place 2x2 unbreakables for 11..20
  maybeSpawnUnbreakables(state.grid, state.rng, state.level);
}

/**
 * Run one player move resolution (including cascades, scoring, and deadlock reshuffle).
 * Returns the last batch of resolution reports (for animations).
 */
export function resolvePlayerMove(
  state: GameState,
  resolveUntilStable: ResolveFn,
  toScoreEvents: (reports: ResolutionReport[]) => ScoreEvent[],
  findMatches: MatchFinder
): { reports: ResolutionReport[]; reshuffled: boolean } {
  const reports = resolveUntilStable(state.grid);

  // scoring
  const events = toScoreEvents(reports);
  const gained = scoreBatch(events);
  state.score += gained;

  // level up?
  const newLevel = scoreToLevel(state.score);
  if (newLevel !== state.level) state.level = newLevel;

  // deadlock handling
  let reshuffled = false;
  if (!hasAnyLegalSwap(state.grid, findMatches)) {
    // avoid immediate matches so the next move is player-driven
    reshuffled = reshuffleInPlace(state.grid, state.rng, findMatches, {
      avoidImmediateMatches: true,
      maxAttempts: 200,
    });
  }

  return { reports, reshuffled };
}
