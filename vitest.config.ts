import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",          // so React Testing Library can render
    globals: true,                 // allows using `describe/it/expect` without imports
    setupFiles: "./setupTests.ts", // your custom setup file
  },
});
