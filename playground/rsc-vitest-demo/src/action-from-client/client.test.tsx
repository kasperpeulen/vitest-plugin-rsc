import { expect, test, vi } from "vitest";
import {
  renderServer,
  waitForServerAction,
} from "vitest-plugin-rsc/testing-library";
import { page } from "@vitest/browser/context";
import { TestActionFromClient, TestUseActionState } from "./client.tsx";

test("test use action state", async () => {
  await renderServer(<TestUseActionState />, {
    rerenderOnServerAction: true,
  });

  await expect
    .element(page.getByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 0");

  await page.getByTestId("use-action-state").click();

  await expect
    .element(page.getByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 1");

  await page.getByTestId("use-action-state").click();

  await expect
    .element(page.getByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 2");
});

test("test use action state", async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});

  await renderServer(<TestActionFromClient />, {
    rerenderOnServerAction: true,
  });

  await page.getByRole("button", { name: /test-action-from-client$/ }).click();
  await waitForServerAction();
  expect(console.log).toBeCalledWith("[test-action-from-client]");

  await page
    .getByRole("button", { name: /test-action-from-client-2$/ })
    .click();
  await waitForServerAction();
  expect(console.log).toBeCalledWith("[test-action-from-client-2]");
});
