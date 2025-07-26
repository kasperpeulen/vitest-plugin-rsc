/// <reference types="@vitest/browser/context" />

// @ts-ignore
globalThis.process = { env: {} };

import { beforeAll, beforeEach } from "vitest";
import { cleanup } from "vitest-plugin-rsc/testing-library";
import { msw } from "./test/msw.ts";
import { setupRuntime } from "vitest-plugin-rsc/testing-library";

beforeAll(async () => {
  setupRuntime();
  await msw.start({ quiet: true, onUnhandledRequest: "bypass" });
});

beforeEach(async () => {
  msw.resetHandlers();
  await cleanup();
});
