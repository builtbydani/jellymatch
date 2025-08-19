import { describe, it, expect } from "vitest";
import { Grid } from "../src/game/Grid";

const J = (color: any) => ({ kind: "jelly" as const, color });
const U = { kind: "unbreakable" as const };

describe("Grid basics", () => {
  it("stores and retrieves tiles", () => {
    const g = new Grid(3, 2);
    g.set(0, 0, J("red"));
    g.set(1, 0, U);
    expect(g.get(0, 0)).toEqual(J("red"));
    expect(g.get(1, 0)).toEqual(U);
  });

  it("swaps two tiles", () => {
    const g = new Grid(2, 1);
    g.set(0, 0, J("red"));
    g.set(1, 0, J("blue"));
    g.swap({x:0, y:0}, {x:1, y:0});
    expect(g.get(0, 0).color).toBe("blue");
    expect(g.get(1, 0).color).toBe("red");
  });
});
