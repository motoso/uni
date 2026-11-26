import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/__tests__/medium",
  reporter: "list",
  forbidOnly: !!process.env.CI,
});
