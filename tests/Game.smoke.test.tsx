import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Game from "../src/ui/Game";

describe("Game (smoke test)", () => {
  it("renders without crashing and shows score/level", () => {
    render(<Game />);
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByTestId("board-canvas")).toBeInTheDocument();
  });
});

