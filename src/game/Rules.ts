import { Grid } from "./Grid";
import { Match, Powerup, Vec2 } from "./Types";

export function findLineMatches(grid: Grid): Match[] {
  const matches: Match[] = [];
  const { width, height } = grid;

  // horizontal
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const currentCell = grid.get(x, y);
      if (currentCell.kind !== "jelly" || !currentCell.color) { x++; continue; }
      let run = 1;
      while (x + run < width) {
        const nextCell = grid.get(x + run, y);
        if (nextCell.kind === "jelly" && nextCell.color === currentCell.color) run++; else break;
      }
      if (run >= 3) {
        matches.push({ 
          kind: "line", 
          color: currentCell.color,
          cells: Array.from({length: run}, (_,i)=>({x:x+i,y})),
          orientation: "h"
        });
      }
      x += run;
    }
  }

  // vertical
  for (let x = 0; x < width; x++) {
    let y = 0;
    while (y < height) {
      const currentCell = grid.get(x, y);
      if (currentCell.kind !== "jelly" || !currentCell.color) { y++; continue; }
      let run = 1;
      while(y + run < height) {
        const nextCell = grid.get(x, y + run);
        if (nextCell.kind === "jelly" && nextCell.color === currentCell.color) run++; else break;
      }
      if (run >= 3) {
        matches.push({
          kind: "line",
          color: currentCell.color,
          cells: Array.from({length: run}, (_,i)=>({x,y:y+i})),
          orientation: "v"
        });
      }
      y += run;
    }
  }

  return mergeOverlapsIntoPlus(matches);
}


function mergeOverlapsIntoPlus(matches: Match[]): Match[] {
  const lines = matches.filter(m => m.kind === "line");
  const matchesByColor: Record<string, Match[]> = {};
  for (const match of lines) (matchesByColor[match.color] ??= []).push(match);

  const usedMatches = new Set<Match>();
  const mergedMatches: Match[] = [];

  const key = (x:number, y:number)=> `${x},${y}`;

  // Helpers to inspect line structure
  const sortHor = (cells: Vec2[]) => [...cells].sort((a,b)=>a.x-b.x);
  const sortVert = (cells: Vec2[]) => [...cells].sort((a,b)=>a.y-b.y);

  for (const color in matchesByColor) {
    const matches = matchesByColor[color];

    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const matchA = matches[i];
        const matchB = matches[j];
        const aHor = isHorizontal(matchA);
        const bHor = isHorizontal(matchB);
        if (aHor === bHor) continue; // need one Hor and one Vert

        const HorLine = aHor ? matchA : matchB;
        const VertLine = aHor ? matchB : matchA;

        // Build sets for fast intersection
        const HorSet = new Set(HorLine.cells.map(cell => key(cell.x, cell.y)));
        const intersections: Vec2[] = [];
        for (const cell of VertLine.cells) {
          if (HorSet.has(key(cell.x, cell.y))) intersections.push({x:cell.x,y:cell.y});
        }
        if (intersections.length === 0) continue;

        // Prefer the intersection that’s truly in the middle of both lines (not an endpoint)
        const sortedHor = sortHor(HorLine.cells);
        const sortedVert = sortVert(VertLine.cells);

        const isMiddleOfHor = (point: Vec2) => {
          const idx = sortedHor.findIndex(c => c.x===point.x && c.y===point.y);
          return idx > 0 && idx < sortedHor.length - 1;
        };
        const isMiddleOfVert = (point: Vec2) => {
          const idx = sortedVert.findIndex(c => c.x===point.x && c.y===point.y);
          return idx > 0 && idx < sortedVert.length - 1;
        };

        let plusCenter: Vec2 | null = null;
        for (const candidate of intersections) {
          if (isMiddleOfHor(candidate) && isMiddleOfVert(candidate)) {
            plusCenter = candidate;
            break;
          }
        }
        // If none qualifies as a true center, don’t convert to plus—keep the lines.
        if (!plusCenter) continue;

        mergedMatches.push({
          kind: "+",
          color: color as any,
          cells: [...HorLine.cells, ...VertLine.cells],
          center: plusCenter,
        });

        usedMatches.add(matchA);
        usedMatches.add(matchB);
      }
    }
  }

  // Keep all lines that were not merged into a plus
  for (const match of lines) if (!usedMatches.has(match)) mergedMatches.push(match);

  return mergedMatches;
}


function isHorizontal(match: Match) {
  return match.cells.length >= 2 && match.cells.every(c => c.y === match.cells[0].y);
}

export function powerupForMatch(match: Match): Powerup {
  if (match.kind === "+") return "colorSwap";
  const runLength = match.cells.length;
  if (runLength >= 5) return "bomb";
  if (runLength === 4) return "laser";
  return null;
}
