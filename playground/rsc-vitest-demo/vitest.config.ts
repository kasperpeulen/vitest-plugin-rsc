import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";
import vitestPluginRSC from "vitest-plugin-rsc";

export default defineConfig({
  ...viteConfig,
  plugins: [vitestPluginRSC()],
  test: {
    restoreMocks: true,
    browser: {
      enabled: true,
      provider: "playwright",
      screenshotFailures: false,
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./src/vitest.setup.ts"],
  },
});
