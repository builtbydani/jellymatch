// tests/Scoring.test.ts
import { describe, it, expect } from "vitest";
import { scoreEvent, scoreBatch, type ScoreEvent } from "../src/game/Scoring";

describe("Scoring", () => {
  it("scores a basic clear with no chain", () => {
    const pts = scoreEvent({ type: "clear", tiles: 3, chainIndex: 0 });
    // BASE_PER_TILE = 10, multiplier(0) = 1.0 → 3 * 10 * 1 = 30
    expect(pts).toBe(30);
  });

  it("applies chain multiplier for later cascades", () => {
    const pts = scoreEvent({ type: "clear", tiles: 4, chainIndex: 2 });
    // multiplier(2) = 1 + 0.5*2 = 2.0 → 4 * 10 * 2 = 80
    expect(pts).toBe(80);
  });

  it("adds laser bonus per tile and applies chain multiplier", () => {
    const pts = scoreEvent({ type: "powerup", kind: "laser", tiles: 10, chainIndex: 1 });
    // per-tile = 10 + 3 = 13; multiplier(1) = 1.5 → 10 * 13 * 1.5 = 195
    expect(pts).toBe(195);
  });

  it("adds bomb bonus per tile and applies chain multiplier", () => {
    const pts = scoreEvent({ type: "powerup", kind: "bomb", tiles: 12, chainIndex: 3 });
    // per-tile = 10 + 4 = 14; multiplier(3) = 2.5 → 12 * 14 * 2.5 = 420
    expect(pts).toBe(420);
  });

  it("rounds fractional results correctly (bankers beware)", () => {
    const pts = scoreEvent({ type: "powerup", kind: "laser", tiles: 7, chainIndex: 1 });
    // 7 * 13 * 1.5 = 136.5 → Math.round → 137
    expect(pts).toBe(137);
  });

  it("grants fixed bonus for color swap grant", () => {
    const pts = scoreEvent({ type: "colorSwapGranted" });
    expect(pts).toBe(150);
  });

  it("grants fixed bonus for color swap use", () => {
    const pts = scoreEvent({ type: "colorSwapUsed", row: 3 });
    expect(pts).toBe(100);
  });

  it("sums a batch of mixed events", () => {
    const events: ScoreEvent[] = [
      { type: "clear", tiles: 3, chainIndex: 0 },               // 30
      { type: "powerup", kind: "laser", tiles: 5, chainIndex: 0 }, // 5 * 13 * 1 = 65
      { type: "colorSwapGranted" },                              // 150
      { type: "clear", tiles: 4, chainIndex: 1 },                // 4 * 10 * 1.5 = 60
      { type: "powerup", kind: "bomb", tiles: 9, chainIndex: 2 },  // 9 * 14 * 2 = 252
      { type: "colorSwapUsed", row: 0 },                         // 100
    ];
    expect(scoreBatch(events)).toBe(30 + 65 + 150 + 60 + 252 + 100); // 657
  });

  it("batch equals manual sum of individual events", () => {
    const events: ScoreEvent[] = [
      { type: "clear", tiles: 5, chainIndex: 0 },
      { type: "powerup", kind: "laser", tiles: 10, chainIndex: 1 },
      { type: "powerup", kind: "bomb", tiles: 6, chainIndex: 0 },
      { type: "colorSwapGranted" },
      { type: "colorSwapUsed", row: 2 },
    ];
    const manual = events.map(scoreEvent).reduce((a, b) => a + b, 0);
    expect(scoreBatch(events)).toBe(manual);
  });
});

