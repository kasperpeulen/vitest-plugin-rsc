import { beforeAll, beforeEach } from "vitest";
import { cleanup } from "vitest-plugin-rsc/testing-library";
import { msw } from "./test/msw.ts";
import { setupRuntime } from "vitest-plugin-rsc/testing-library";

beforeAll(async () => {
  setupRuntime();
  await msw.start({ quiet: true });
});

beforeEach(() => {
  msw.resetHandlers();
  cleanup();
});
