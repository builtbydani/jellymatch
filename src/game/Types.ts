export type Vec2 = { x: number; y: number; };

export const COLORS = ["red", "green", "blue", "yellow", "purple"] as const;
export type Color = typeof COLORS[number];

export type TileKind = "jelly" | "unbreakable" | "empty" | "powerup";

export type PowerupKind = "laser" | "bomb";
export type Powerup = PowerupKind | "colorSwap" | null;

export type MatchKind = "line" | "+";

export type Tile = {
  kind: TileKind; // Jelly, or Concrete
  color?: Color;
  pkind?: PowerupKind;
};

export type Match = {
  kind: MatchKind;
  color: Color;
  cells: Vec2[];
  center?: Vec2;
  orientation?: "h" | "v";
};
