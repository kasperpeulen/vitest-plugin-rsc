import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { page } from "@vitest/browser/context";
import { TestServerActionError } from "./server.tsx";

test("client error boundary catches server errors", async () => {
  await renderServer(<TestServerActionError />, {
    rerenderOnServerAction: true,
  });
  await page.getByRole("button", { name: "test-server-action-error" }).click();
  await expect.element(page.getByText("ErrorBoundary caught")).toBeVisible();
  await page.getByRole("button", { name: "reset-error" }).click();
  await expect
    .element(page.getByRole("button", { name: "test-server-action-error" }))
    .toBeVisible();
});
