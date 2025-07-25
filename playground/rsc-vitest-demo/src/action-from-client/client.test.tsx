import { expect, test, vi } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestActionFromClient, TestUseActionState } from "./client.tsx";
import { screen, waitFor } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";

test("test use action state", async () => {
  await renderServer(<TestUseActionState />, { rerenderOnServerAction: true });

  await expect
    .element(await screen.findByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 0");

  await userEvent.click(await screen.findByTestId("use-action-state"));

  await expect
    .element(await screen.findByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 1");

  await userEvent.click(await screen.findByTestId("use-action-state"));

  await expect
    .element(await screen.findByTestId("use-action-state"))
    .toHaveTextContent("test-useActionState: 2");
});

test("test use action state", async () => {
  vi.spyOn(console, "log");

  await renderServer(<TestActionFromClient />, { rerenderOnServerAction: true });

  await userEvent.click(await screen.findByRole("button", { name: /test-action-from-client$/ }));

  await waitFor(() => {
    expect(console.log).toBeCalledWith("[test-action-from-client]");
  });

  await userEvent.click(await screen.findByRole("button", { name: /test-action-from-client-2$/ }));

  await waitFor(() => {
    expect(console.log).toBeCalledWith("[test-action-from-client-2]");
  });
});
