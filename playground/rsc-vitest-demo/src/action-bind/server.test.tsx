import { expect, test } from "vitest";
import {
  TestServerActionBindAction,
  TestServerActionBindClient,
  TestServerActionBindSimple,
} from "./server.tsx";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";

test("test server action bind simple", async () => {
  await renderServer(<TestServerActionBindSimple />, {
    rerenderOnServerAction: true,
  });

  expect(await screen.findByTestId("test-server-action-bind-simple")).toHaveTextContent("[?]");

  await userEvent.click(
    await screen.findByRole("button", { name: "test-server-action-bind-simple" }),
  );

  await expect
    .element(await screen.findByTestId("test-server-action-bind-simple"))
    .toHaveTextContent("true");
});

test("server action bind client", async () => {
  await renderServer(<TestServerActionBindClient />, {
    rerenderOnServerAction: true,
  });

  expect(await screen.findByTestId("test-server-action-bind-client")).toHaveTextContent("[?]");

  await userEvent.click(
    await screen.findByRole("button", { name: "test-server-action-bind-client" }),
  );

  await expect
    .element(await screen.findByTestId("test-server-action-bind-client"))
    .toHaveTextContent("true");
});

test("test server action bind action", async () => {
  await renderServer(<TestServerActionBindAction />, {
    rerenderOnServerAction: true,
  });

  expect(await screen.findByTestId("test-server-action-bind-action")).toHaveTextContent("[?]");

  await userEvent.click(
    await screen.findByRole("button", { name: "test-server-action-bind-action" }),
  );

  await expect
    .element(await screen.findByTestId("test-server-action-bind-action"))
    .toHaveTextContent("[true,true]");
});
