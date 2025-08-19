import { Match } from "./Types";

export type ScoreEvent = 
  | { type: "clear"; tiles: number; chainIndex: number }
  | { type: "powerup"; kind: "laser" | "bomb"; tiles: number; chainIndex: number; }
  | { type: "colorSwapGranted" }
  | { type: "colorSwapUsed"; row: number };

const BASE_PER_TILE        = 10;
const LASER_BONUS_PER_TILE = 3;
const BOMB_BONUS_PER_TILE  = 4;
const COLOR_SWAP_GRANT     = 150;
const COLOR_SWAP_USE       = 100;

function chainMultiplier(chainIndex: number): number {
  return 1 + 0.5 * chainIndex;
}

export function scoreEvent(ev: ScoreEvent): number {
  switch(ev.type) {
    case "clear":
      return Math.round(ev.tiles * BASE_PER_TILE * chainMultiplier(ev.chainIndex));
    case "powerup":
      if (ev.kind === "laser") {
      return Math.round(ev.tiles *
                        (BASE_PER_TILE + LASER_BONUS_PER_TILE) * chainMultiplier(ev.chainIndex));
    } else {
      return Math.round(ev.tiles * 
                       (BASE_PER_TILE + BOMB_BONUS_PER_TILE) * chainMultiplier(ev.chainIndex));
    }
    case "colorSwapGranted":
      return COLOR_SWAP_GRANT;
    case "colorSwapUsed":
      return COLOR_SWAP_USE;
  }
}

export function scoreBatch(events: ScoreEvent[]): number {
  return events.reduce((acc, e) => acc + scoreEvent(e), 0);
}
