import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/setup.ts",
    "src/testing-library.tsx",
    "src/testing-library-client.tsx",
    "src/nextjs.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/, /^@vitejs\/plugin-rsc\/vendor\//],
  noExternal: ["js-tokens"],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
});
