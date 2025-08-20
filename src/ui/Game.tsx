import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "../game/Grid";
import { RNG } from "../game/RNG";
import { createGameState, resolvePlayerMove, startLevelSetup } from "../game/GameState";
import { desiredGridSizeForLevel } from "../game/Level";
import { reshuffleInPlace, hasAnyLegalSwap } from "../game/Deadlock";
import { findLineMatches } from "../game/Rules";
import { resolveAll } from "../game/Resolver";
import BoardCanvas from "./BoardCanvas";

function makeGrid(width: number, height: number) {
  // replace with your Grid constructor/factory
  return new Grid(width, height);
}

function populateGrid(grid: Grid, rng: RNG) {
  // replace with your actual fill logic; example jelly colors:
  const colors = ["red", "green", "blue", "yellow", "purple"] as const;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, y)?.kind === "unbreakable") continue;
      grid.set(x, y, { kind: "jelly", color: colors[rng.int(0, colors.length - 1)] } as any);
    }
  }
}



function resolveUntilStable(grid: Grid) {
  const result = resolveAll(grid, findLineMatches) as any;

  // If your resolver returns { grid, reports }
  if (result?.grid && result?.reports) {
    // IMPORTANT: keep state.grid in sync with resolver’s new grid
    return result.reports;
  }

  // If it returns just reports and mutates in-place:
  if (Array.isArray(result)) return result;

  // Normalize other shapes
  if (result?.reports) return result.reports;
  if (result) return [result];
  return [];
}




function toScoreEvents(reportsLike: any) {
  const reports = Array.isArray(reportsLike) ? reportsLike : (reportsLike?.reports ?? []);
  const out: any[] = [];

  for (const r of reports) {
    const chainIndex = r.chainIndex ?? r.chain ?? 0;
    const cleared = r.cleared ?? r.clears ?? [];
    const powerups = r.powerups ?? r.triggers ?? [];

    if (r.grantedColorSwap) out.push({ type: "colorSwapGranted" });
    if (cleared.length) out.push({ type: "clear", tiles: cleared.length, chainIndex });

    for (const p of powerups) {
      // try to read kind + affected tiles from common keys
      const kind = p.kind ?? p.type;
      const affected = p.affected ?? p.tiles ?? p.cells ?? [];
      out.push({ type: "powerup", kind, tiles: affected.length, chainIndex });
    }
  }
  return out;
}


export default function Game() {
  const rng = useMemo(() => new RNG(1234567), []);
  const [state, setState] = useState(() => {
    const { width, height } = desiredGridSizeForLevel(1);
    const grid = makeGrid(width, height);
    const gs = createGameState(grid, rng);
    startLevelSetup(gs, makeGrid, populateGrid);
    // ensure solvable start
    if (!hasAnyLegalSwap(gs.grid, findLineMatches)) {
      reshuffleInPlace(gs.grid, rng, findLineMatches, { avoidImmediateMatches: true });
    }
    return gs;
  });

 
  const onSwap = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const swap = (p: typeof a, q: typeof b) => {
      const tmp = state.grid.get(p.x, p.y);
      state.grid.set(p.x, p.y, state.grid.get(q.x, q.y));
      state.grid.set(q.x, q.y, tmp);
    };

    swap(a, b);

    // If no match was created, revert and bail.
    const hadMatch = findLineMatches(state.grid).length > 0;
    if (!hadMatch) {
      swap(a, b);
      setState({ ...state });
      return;
    }

    
    const { reports } = resolvePlayerMove(
      state,
      (g) => {
        const res = resolveAll(g, findLineMatches) as any;
        if (res?.grid) state.grid = res.grid; // <-- keep state.grid updated
        return Array.isArray(res) ? res : (res?.reports ?? []);
      },
      toScoreEvents,
      findLineMatches
    );


    // Handle level resize if needed
    const shape = desiredGridSizeForLevel(state.level);
    if (shape.width !== state.grid.width || shape.height !== state.grid.height) {
      startLevelSetup(state, makeGrid, populateGrid);
    }

    setState({ ...state });
    // TODO: use `reports` for animations/toasts
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-lg">Score: {state.score} &nbsp;•&nbsp; Level: {state.level}</div>
      <BoardCanvas grid={state.grid} onSwap={onSwap} />
    </div>
  );
}
