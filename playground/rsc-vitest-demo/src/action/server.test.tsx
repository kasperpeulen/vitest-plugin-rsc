import { expect, test } from "vitest";
import { ServerCounter } from "./server.tsx";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { page } from "@vitest/browser/context";

test("server action", async () => {
  await renderServer(<ServerCounter />, { rerenderOnServerAction: true });

  await page.getByRole("button", { name: "server-counter: 0" }).click();
  await page.getByRole("button", { name: "server-counter: 1" }).click();
  await expect
    .element(page.getByRole("button", { name: "server-counter: 2" }))
    .toBeVisible();
  await page.getByRole("button", { name: "server-counter-reset" }).click();
  await expect
    .element(page.getByRole("button", { name: "server-counter: 0" }))
    .toBeVisible();
});
