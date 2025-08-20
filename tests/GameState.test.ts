import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/game/Deadlock", () => ({
    hasAnyLegalSwap: vi.fn(),
    reshuffleInPlace: vi.fn(),
}));

import {
  createGameState,
  resolvePlayerMove,
  startLevelSetup,
  ensureGridShapeForLevel
} from "../src/game/GameState";

import { Grid } from "../src/game/Grid";
import { RNG } from "../src/game/RNG";
import * as Deadlock from "../src/game/Deadlock";
import { thresholdForLevel } from "../src/game/Level";

function makeGrid(w:number,h:number){ return new Grid(w,h); }
function populateGrid(grid: Grid, rng: RNG) {
  for (let y=0;y<grid.height;y++) for (let x=0;x<grid.width;x++)
    grid.set(x,y,{kind:"jelly",color:"red"} as any);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GameState", () => {
  it("increments score and level when reports yield points", () => {
    // For THIS test: no deadlock → no reshuffle
    (Deadlock.hasAnyLegalSwap as any).mockReturnValue(true);
    (Deadlock.reshuffleInPlace as any).mockReturnValue(false);

    const rng = new RNG(2);
    const g = makeGrid(12, 10);
    const state = createGameState(g, rng);
    startLevelSetup(state, makeGrid, populateGrid);

    const fakeReports = [{ chainIndex: 0, cleared: [{x:0,y:0},{x:1,y:0},{x:2,y:0}], powerups: [] }];
    const fakeResolve = vi.fn().mockReturnValue(fakeReports);
    const toEvents = vi.fn().mockReturnValue([{ type:"clear", tiles:3, chainIndex:0 }]);
    const findMatches = vi.fn().mockReturnValue([{ positions:[{x:0,y:0},{x:1,y:0},{x:2,y:0}] }]);

    const { reshuffled } = resolvePlayerMove(state, fakeResolve, toEvents, findMatches);
    expect(reshuffled).toBe(false);          // ✅ now true→false is gone
    expect(state.score).toBeGreaterThan(0);
    expect(state.level).toBe(1);

    state.score = thresholdForLevel(2);
    resolvePlayerMove(state, fakeResolve, toEvents, findMatches);
    expect(state.level).toBeGreaterThanOrEqual(2);
  });

  it("triggers reshuffle when no moves available", () => {
    // For THIS test: deadlocked → reshuffle succeeds
    (Deadlock.hasAnyLegalSwap as any).mockReturnValue(false);
    (Deadlock.reshuffleInPlace as any).mockReturnValue(true);

    const rng = new RNG(3);
    const g = makeGrid(12, 10);
    const state = createGameState(g, rng);
    startLevelSetup(state, makeGrid, populateGrid);

    const fakeResolve = vi.fn().mockReturnValue([]);
    const toEvents = vi.fn().mockReturnValue([]);
    const findMatches = vi.fn().mockReturnValue([]);

    const result = resolvePlayerMove(state, fakeResolve, toEvents, findMatches);
    expect(Deadlock.hasAnyLegalSwap).toHaveBeenCalled();
    expect(Deadlock.reshuffleInPlace).toHaveBeenCalled();
    expect(result.reshuffled).toBe(true);
  });

  it("resizes grid at level 21", () => {
    // Irrelevant here, but keep Deadlock benign
    (Deadlock.hasAnyLegalSwap as any).mockReturnValue(true);

    const rng = new RNG(4);
    const g = makeGrid(12, 10);
    const state = createGameState(g, rng);
    state.level = 21;
    ensureGridShapeForLevel(state, makeGrid);
    expect(state.grid.width).toBe(6);
    expect(state.grid.height).toBe(5);
  });
});
