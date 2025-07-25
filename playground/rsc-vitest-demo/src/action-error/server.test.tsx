import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestServerActionError } from "./server.tsx";

import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";

test("client error boundary catches server errors", async () => {
  await renderServer(<TestServerActionError />, {
    rerenderOnServerAction: true,
  });
  await userEvent.click(await screen.findByRole("button", { name: "test-server-action-error" }));
  expect(await screen.findByText(/ErrorBoundary caught/)).toBeVisible();
  await userEvent.click(await screen.findByRole("button", { name: "reset-error" }));
  expect(await screen.findByRole("button", { name: "test-server-action-error" })).toBeVisible();
});
