import { defineConfig } from "vitest/config";
import { vitestPluginRSC } from "vitest-plugin-rsc";

export default defineConfig({
  plugins: [vitestPluginRSC()],
  test: {
    restoreMocks: true,
    browser: {
      enabled: true,
      provider: "preview",
      screenshotFailures: false,
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./src/vitest.setup.ts"],
  },
});
