import { beforeAll, beforeEach } from "vitest";
import { cleanup } from "vitest-plugin-rsc/testing-library";
import { msw } from "./test/msw.ts";
import { setupRuntime } from "vitest-plugin-rsc/testing-library";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

beforeAll(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  setupRuntime();
  await msw.start({ quiet: true });
});

beforeEach(async () => {
  msw.resetHandlers();
  await cleanup();
});
