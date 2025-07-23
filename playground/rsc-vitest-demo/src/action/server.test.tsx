import { test } from "vitest";
import { ServerCounter } from "./server.tsx";
import { renderServer } from "vitest-plugin-rsc/testing-library";

test("ServerCounter", async () => {
  await renderServer(<ServerCounter />, { rerenderOnServerAction: true });
});
