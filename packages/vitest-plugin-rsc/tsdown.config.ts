import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/setup.ts", "src/testing-library.tsx"],
  format: ["esm"],
  external: [/^virtual:/, /^@vitejs\/plugin-rsc\/vendor\//],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
});
