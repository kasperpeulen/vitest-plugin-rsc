import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestActionStateServer } from "./server.tsx";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";

test("use action state with jsx", async () => {
  await renderServer(<TestActionStateServer />, {
    rerenderOnServerAction: true,
  });

  await userEvent.click(await screen.findByRole("button"));

  await expect
    .element(await screen.findByTestId("use-action-state-jsx"))
    .toHaveTextContent(/\(ok\)/);

  await userEvent.click(await screen.findByRole("button"));

  await expect
    .element(await screen.findByTestId("use-action-state-jsx"))
    .toHaveTextContent(/\(ok\).*\(ok\)/);
});
