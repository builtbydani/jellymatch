export type Vec2 = { x: number; y: number; };

export const COLORS = ["red", "green", "blue", "yellow", "purple"] as const;
export type Color = typeof COLORS[number];

export type TileKind = "jelly" | "unbreakable";

export type Tile = {
  kind: TileKind; // Jelly, or Concrete
  color?: Color;  // required only when TileKind === jelly
};

export type MatchKind = "line" | "+";

export type Match = {
  kind: MathchKind;
  color: Color;
  cells: Vec2[];
  center?: Vec2;
};

export type Powerup = "laser" | "bomb" | "colorSwap" | null;
