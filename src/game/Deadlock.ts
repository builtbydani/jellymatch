import { RNG } from "./RNG";
import { Tile, Vec2 } from "./Types";
import { Grid } from "./Grid";

export type GetMatches = (grid: Grid) => Array<{ positions: Vec2[] }>;

function canSwapCells(tileA: Tile, tileB: Tile): boolean {
  if (tileA.kind === "unbreakable" || tileB.kind === "unbreakable") return false;
  return true;
}

function swapInGrid(grid: Grid, a: Vec2, b: Vec2): void {
  const temp = grid.get(a.x, a.y);
  grid.set(a.x, a.y, grid.get(b.x, b.y));
  grid.set(b.x, b.y, temp);
}

export function findFirstLegalSwap(
  grid: Grid,
  getMatches: GetMatches
): { a: Vec2, b: Vec2 } | null {
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const current = { x, y };
      const right = { x: x + 1, y };
      const down = { x, y: y + 1 };

      const currentTile = grid.get(x, y);

      if (x + 1 < grid.width) {
        const rightTile = grid.get(x + 1, y);
        if (canSwapCells(currentTile, rightTile)) {
          swapInGrid(grid, current, right);
          const makesMatch = getMatches(grid).length > 0;
          swapInGrid(grid, current, right);
          if (makesMatch) return { a: current, b: right };
        }
      }

      if (y + 1 < grid.height) {
        const downTile = grid.get(x, y + 1);
        if (canSwapCells(currentTile, downTile)) {
          swapInGrid(grid, current, down);
          const makesMatch = getMatches(grid).length > 0;
          swapInGrid(grid, current, down);
          if (makesMatch) return { a: current, b: down };
        }
      }
    }
  }
  return null;
}

export function hasAnyLegalSwap(grid: Grid, getMatches: GetMatches): boolean {
  return findFirstLegalSwap(grid, getMatches) !== null;
}

function isMovable(tile: Tile): boolean {
  return tile.kind !== "unbreakable";
}

function collectMovableCoords(grid: Grid): Vec2[] {
  const movable: Vec2[] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (isMovable(grid.get(x, y))) movable.push({ x, y });
    }
  }
  return movable;
}

function fisherYates<T>(array: T[], rng: RNG): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export type ReshuffleOptions = {
  maxAttempts?: number;
  avoidImmediateMatches?: boolean;
};

export function reshuffleInPlace(
  grid: Grid,
  rng: RNG,
  getMatches: GetMatches,
  options: ReshuffleOptions = {}
): boolean {
  const { maxAttempts = 50, avoidImmediateMatches = true } = options;
  
  const coords = collectMovableCoords(grid);
  if (coords.length < 2) return false; // nothing to shuffle

  const extracted: Tile[] = coords.map(({ x, y }) => grid.get(x, y));

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    fisherYates(extracted, rng);

    for (let i = 0; i < coords.length; i++) {
      const { x, y } = coords[i];
      grid.set(x, y, extracted[i]);
    }

    const immediateMatches = getMatches(grid).length > 0;
    if (avoidImmediateMatches && immediateMatches) {
      continue;
    }

    if (hasAnyLegalSwap(grid, getMatches)) {
      return true;
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    fisherYates(extracted, rng);
    for (let i = 0; i < coords.length; i++) {
      const { x, y } = coords[i];
      grid.set(x, y, extracted[i]);
    }
    if (hasAnyLegalSwap(grid, getMatches)) {
      return true;
    }
  }

  return false;
}
