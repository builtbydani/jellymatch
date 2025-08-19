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

  const clearedKeySet = new Set<string>();
  const spwanedThisStep = { kind: PowerupKind, at: Vec2 }[] = [];
  let stepScore = 0;

  const width = gridWidth(workingGrid);
  const height = gridHeight(workingGrid);
  const makeKey = (p: Vec2) => `${p.x}, ${p.y}`;

  for (const match of matches) {
    for (const point of match.cells) clearedKeySet.add(makeKey(point));
    stepScore += 10 * match.cells.length;

    if (match.kind === "+") {
      resolveContext.onColorSwapGranted?.();
      continue;
    }

    const runLength = match.cells.length;
    const spawnLaser = runLength === 4;
    const spawnBomb = runLength >= 5;

    if (spawnLaser || spawnBomb) {
     const anchor = chooseAnchor(match, resolveContext);
     spawnedThisStep.push({ kind: spawnBomb ? "bomb" : "laser", at: anchor });
    }
  }

  for (const key of clearedKeySet) {
    const [x, y] = key.split(",").map(Number);
    const currentCell = workingGrid.get(x, y);
    if (currentCell.kind !== "unbreakable") {
      workingGrid.set(x, y, { kind: "empty" });
    }
  }

  const blastPoints: Vec2[] = [];
  for (const spawn of spawnedThisStep) {
    if (spawn.kind === "laser") {
      blastPoints.push(...computeLaserBlast(workingGrid, spawn.at));
      stepScore += 25;
    } else {
      blastPoints.push(...computeBombBlast(workingGrid, spawn.at, 2));
      stepScore += 50;
    }
  }

  for (const blastPoint of blastPoints) {
    const currentCell = workingGrid.get(blastPoint.x, blastPoint.y);
    if (currentCell.kind !== "unbreakable") {
      workingGrid.set(blastPoint.x, blastPoint.y, { kind: "empty" });
    }
  }

  applyGravity(workingGrid);
  refillEmpties(workingGrid);

  const clearedPositions: Vec2[] = [
    ...Array.from(clearedKeySet, key => {
      const [x, y] = key.split(",").map(Number);
      return { x, y };
    }),
    ...blastPoints,
  ];

  return {
    grid: workingGrid,
    cleared: clearedPositions,
    spawned: spawnedThisStep,
    scoreDelta: stepScore,
  };
}

/**
 * Resolve repeatedly until there are no more matches (cascades)
 * Applies a simple combo multiplier: 1x, 2x, 3x... per step
 */
export function resolveAll(
  inputGrid: Grid,
  findMatches: (grid: Grid) => Match[],
  resolveContext: ResolveContext = {}
) {
  let workingGrid = inputGrid.clone();
  let chainIndex = 0;
  let totalScore = 0;
  const steps: ResolveResult[] = [];

  while (true) {
    const foundMatches = findMatches(workingGrid);
    if (foundMatches.length === 0) break;

    const step = resolveStep(workingGrid, foundMatches, resolveContext);
    const comboMult = Math.max(1, chainIndex + 1);
    step.scoreDelta = Math.floor(step.scoreDelta * comboMult);

    totalScore += step.scoreDelta;
    steps.push(step);
    workingGrid = step.grid;
    chainIndex++;
  }

  return {
    grid: workingGrid,
    chainCount: chainIndex,
    totalScore,
    steps,
  };
}

/* ------------------------------------- HELPERS ----------------------------------*/

function chooseAnchor(match: Match, resolveContext: ResolveContext): Vec2 {
  if (match.kind === "+") {
    return match.center ?? match.cells[Math.floor(match.cells.length / 2)];
  }
}
