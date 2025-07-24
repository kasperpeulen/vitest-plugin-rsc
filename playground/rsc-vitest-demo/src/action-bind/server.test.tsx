import { expect, test } from "vitest";
import {
  TestServerActionBindAction,
  TestServerActionBindClient,
  TestServerActionBindSimple,
} from "./server.tsx";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { page } from "@vitest/browser/context";

test("test server action bind simple", async () => {
  await renderServer(<TestServerActionBindSimple />, {
    rerenderOnServerAction: true,
  });

  await expect
    .element(page.getByTestId("test-server-action-bind-simple"))
    .toHaveTextContent("[?]");

  await page
    .getByRole("button", { name: "test-server-action-bind-simple" })
    .click();

  await expect
    .element(page.getByTestId("test-server-action-bind-simple"))
    .toHaveTextContent("true");
});

test("server action bind client", async () => {
  await renderServer(<TestServerActionBindClient />, {
    rerenderOnServerAction: true,
  });

  await expect
    .element(page.getByTestId("test-server-action-bind-client"))
    .toHaveTextContent("[?]");
  await page
    .getByRole("button", { name: "test-server-action-bind-client" })
    .click();

  await expect
    .element(page.getByTestId("test-server-action-bind-client"))
    .toHaveTextContent("true");
});

test("test server action bind action", async () => {
  await renderServer(<TestServerActionBindAction />, {
    rerenderOnServerAction: true,
  });

  await expect
    .element(page.getByTestId("test-server-action-bind-action"))
    .toHaveTextContent("[?]");

  await page
    .getByRole("button", { name: "test-server-action-bind-action" })
    .click();

  await expect
    .element(page.getByTestId("test-server-action-bind-action"))
    .toHaveTextContent("[true,true]");
});
