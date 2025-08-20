import "@testing-library/jest-dom";

// Mock CanvasRenderingContext2D for jsdom
if (!HTMLCanvasElement.prototype.getContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = function () {
    return {
      // no-op methods used by our renderer
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      closePath() {},
      fill() {},
      stroke() {},
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      // properties we might set
      canvas: this,
      lineWidth: 1,
      strokeStyle: "#000",
      fillStyle: "#000",
    } as unknown as CanvasRenderingContext2D;
  };
}
