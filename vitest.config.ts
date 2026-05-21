import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
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
