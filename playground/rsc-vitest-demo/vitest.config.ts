import { defineConfig } from "vitest/config";
import vitestPluginRSC from "vitest-plugin-rsc";

export default defineConfig({
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
  resolve: {
    alias: {
      // This is somehow needed for the vite plugin to register is as a client component
      "next/link": "next/dist/client/link",
    },
  },
  environments: {
    react_client: {
      optimizeDeps: {
        // Without this I get commonjs errors
        include: ["next/link"],
      },
    },
  },
});
