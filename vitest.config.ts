import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "server",
          environment: "node",
          include: ["server/_tests/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/_tests/**/*.test.{ts,tsx}"],
          setupFiles: ["./client/_tests/setup.ts"],
          globals: false,
        },
      },
    ],
  },
});
