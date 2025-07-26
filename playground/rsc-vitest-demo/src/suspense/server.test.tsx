import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestSuspense } from "./server.tsx";

import { screen } from "@testing-library/dom";

test("suspense", async () => {
  await renderServer(<TestSuspense />, {
    rerenderOnServerAction: true,
  });

  expect(await screen.findByTestId("suspense")).toHaveTextContent("suspense-fallback");

  await expect
    .element(await screen.findByTestId("suspense"))
    .toHaveTextContent("suspense-resolved");
});
