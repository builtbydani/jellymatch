import { Grid } from "./Grid";
import { Match, Powerup, Vec2 } from "./Types";

export function findLineMatches(grid: Grid): Match[] {
  const matches: Match[] = [];
  const { w, h } = grid;

  // horizontal
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const t = grid.get(x, y);
      if (t.kind !== "jelly" || !t.color) { x++; continue; }
      let run = 1;
      while (x + run < w) {
        const t2 = grid.get(x + run, y);
        if (t2.kind === "jelly" && t2.color === t.color) run++; else break;
      }
      if (run >= 3) {
        matches.push({ 
          kind: "line", 
          color: t.color,
          cells: Array.from({length: run}, (_,i)=>({x:x+i,y})) 
        });
      }
      x += run;
    }
  }

  // vertical
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      const t = grid.get(x, y);
      if (t.kind !== "jelly" || !t.color) { y++; continue; }
      let run = 1;
      while(y + run < h) {
        const t2 = grid.get(x, y + run);
        if (t2.kind === "jelly" && t2.color === t.color) run++; else break;
      }
      if (run >= 3) {
        matches.push({
          kind: "line",
          color: t.color,
          cells: Array.from({length: run}, (_,i)=>({x,y:y+i})) 
        });
      }
      y += run;
    }
  }

  return mergeOverlapsIntoPlus(matches);
}


function mergeOverlapsIntoPlus(matches: Match[]): Match[] {
  const lines = matches.filter(m => m.kind === "line");
  const byColor: Record<string, Match[]> = {};
  for (const m of lines) (byColor[m.color] ??= []).push(m);

  const used = new Set<Match>();
  const result: Match[] = [];

  const key = (x:number, y:number)=> x*1000 + y;

  // Helpers to inspect line structure
  const sortH = (cells: Vec2[]) => [...cells].sort((a,b)=>a.x-b.x);
  const sortV = (cells: Vec2[]) => [...cells].sort((a,b)=>a.y-b.y);

  for (const color in byColor) {
    const ms = byColor[color];

    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i];
        const b = ms[j];
        const aHor = isHorizontal(a);
        const bHor = isHorizontal(b);
        if (aHor === bHor) continue; // need one H and one V

        const H = aHor ? a : b;
        const V = aHor ? b : a;

        // Build sets for fast intersection
        const Hset = new Set(H.cells.map(c => key(c.x, c.y)));
        const intersections: Vec2[] = [];
        for (const c of V.cells) if (Hset.has(key(c.x, c.y))) intersections.push({x:c.x,y:c.y});

        if (intersections.length === 0) continue;

        // Prefer the intersection that’s truly in the middle of both lines (not an endpoint)
        const Hsorted = sortH(H.cells);
        const Vsorted = sortV(V.cells);

        const isMiddleOfH = (p: Vec2) => {
          const idx = Hsorted.findIndex(c => c.x===p.x && c.y===p.y);
          return idx > 0 && idx < Hsorted.length - 1;
        };
        const isMiddleOfV = (p: Vec2) => {
          const idx = Vsorted.findIndex(c => c.x===p.x && c.y===p.y);
          return idx > 0 && idx < Vsorted.length - 1;
        };

        let center: Vec2 | null = null;
        for (const p of intersections) {
          if (isMiddleOfH(p) && isMiddleOfV(p)) { center = p; break; }
        }
        // If none qualifies as a true center, don’t convert to plus—keep the lines.
        if (!center) continue;

        result.push({
          kind: "+",
          color: color as any,
          cells: [...H.cells, ...V.cells],
          center
        });
        used.add(a);
        used.add(b);
      }
    }
  }

  // Keep all lines that were not merged into a plus
  for (const m of lines) if (!used.has(m)) result.push(m);

  return result;
}


function isHorizontal(m: Match) {
  return m.cells.length >= 2 && m.cells.every(c => c.y === m.cells[0].y);
}

export function powerupForMatch(m: Match): Powerup {
  if (m.kind === "+") return "colorSwap";
  const len = m.cells.length;
  if (len >= 5) return "bomb";
  if (len === 4) return "laser";
  return null;
}
