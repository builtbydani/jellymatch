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

  const used = new Set<number>();
  const result: Match[] = [];

  const key = (x:number, y:number)=> x*1000 + y;

  const cellsFor = (m: Match) => m.cells.map(c => key(c.x, c.y));

  for (const color in byColor) {
    const ms = byColor[color];
    for (let i = 0; i < ms.length; i++) {
      for (let j = i + 1; j < ms.length; j++) {
        const a = ms[i];
        const b = ms[j];
        const aHor = isHorizontal(a);
        const bHor = isHorizontal(b);
        if (aHor === bHor) continue;
        const A = cellsFor(a);
        const B = cellsFor(b);
        const setA = new Set(A);
        let cx: number | null = null;
        let cy: number | null = null;
        for (const kb of B) if (setA.has(kb)) { cx = Math.floor(kb / 1000); cy = kb % 1000; break; }
        if (cx != null && cy != null) {
          result.push({
            kind: "+",
            color: color as any,
            cells: [...a.cells, ...b.cells],
            center: { x: cx, y: cy }
          });
          used.add(i); used.add(j);
        }
      }
    }
  }

  lines.forEach((m, idx) => { if (!used.has(idx)) result.push(m); });
  return result;
}

function isHorizontal(m: Match) {
  return m.cells.length >= 2 && m.cells.every(c => c.y === m.cells[0].y);
}

export function powerupForMatch(m: Match): Powerup {
  if (m.kind === "+") return "colorswap";
  const len = m.cells.length;
  if (len >= 5) return "bomb";
  if (len === 4) return "laser";
  return null;
}
