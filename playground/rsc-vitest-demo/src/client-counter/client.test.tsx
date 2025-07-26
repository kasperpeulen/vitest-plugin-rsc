import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";

import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";
import { ClientCounter } from "./client.tsx";

test("client counter", async () => {
  await renderServer(<ClientCounter />);
  await userEvent.click(await screen.findByRole("button", { name: "client-counter: 0" }));
  await userEvent.click(await screen.findByRole("button", { name: "client-counter: 1" }));
  expect(await screen.findByRole("button", { name: "client-counter: 2" })).toBeVisible();
});
