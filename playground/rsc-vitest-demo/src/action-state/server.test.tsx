import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestActionStateServer } from "./server.tsx";
import { page } from "@vitest/browser/context";

test("use action state with jsx", async () => {
  await renderServer(<TestActionStateServer />, {
    rerenderOnServerAction: true,
  });

  await page.getByTestId("use-action-state-jsx").getByRole("button").click();
  await expect
    .element(page.getByTestId("use-action-state-jsx"))
    .toHaveTextContent(/\(ok\)/);

  await page.getByTestId("use-action-state-jsx").getByRole("button").click();
  await expect
    .element(page.getByTestId("use-action-state-jsx"))
    .toHaveTextContent(/\(ok\).*\(ok\)/);
});
