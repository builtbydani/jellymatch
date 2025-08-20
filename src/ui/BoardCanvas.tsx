import React from "react";
import { useEffect, useRef, useState } from "react";
import { Grid } from "../game/Grid";

type Props = {
  grid: Grid;
  onSwap: (a: { x: number; y: number }, b: { x: number; y: number }) => void;
};

const TILE = 48; // px
const GAP = 2;

function colorFor(cell: any): string {
  if (!cell) return "#222";
  if (cell.kind === "unbreakable") return "#333";
  if (cell.kind === "jelly") {
    switch (cell.color) {
      case "red": return "#e74c3c";
      case "green": return "#2ecc71";
      case "blue": return "#3498db";
      case "yellow": return "#f1c40f";
      case "purple": return "#9b59b6";
    }
  }
  return "#666";
}

export default function BoardCanvas({ grid, onSwap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<{ x: number; y: number } | null>(null);

  const width = grid.width * (TILE + GAP) + GAP;
  const height = grid.height * (TILE + GAP) + GAP;

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const cell = grid.get(x, y);
        const px = GAP + x * (TILE + GAP);
        const py = GAP + y * (TILE + GAP);

        ctx.fillStyle = colorFor(cell);
        ctx.fillRect(px, py, TILE, TILE);

        if (selected && selected.x === x && selected.y === y) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#fff";
          ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
        }
      }
    }
  }, [grid, selected, width, height]);

  function posToCell(mx: number, my: number) {
    const x = Math.floor((mx - GAP) / (TILE + GAP));
    const y = Math.floor((my - GAP) / (TILE + GAP));
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null;
    return { x, y };
  }

  function areAdjacent(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    return (dx + dy) === 1;
  }

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = posToCell(mx, my);
    if (!hit) return;

    if (!selected) {
      setSelected(hit);
      return;
    }
    if (selected && areAdjacent(selected, hit)) {
      onSwap(selected, hit);
      setSelected(null);
    } else {
      setSelected(hit);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{ background: "#1a1a1a", borderRadius: 12, touchAction: "none" }}
      data-testid="board-canvas"
    />
  );
}
