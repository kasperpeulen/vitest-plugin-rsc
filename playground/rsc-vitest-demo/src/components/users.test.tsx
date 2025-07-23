import { expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { http } from "msw";
import { Users } from "./users.tsx";
import { getLikes } from "../lib/db.ts";
import { msw } from "../test/msw.ts";
import { api } from "../lib/api.ts";
import { waitForServerAction } from "vitest-plugin-rsc/testing-library";

test("save to db when clicked", async () => {
  msw.use(
    http.get(api("/users"), () =>
      Response.json([{ id: 5, name: "some user" }]),
    ),
  );

  await renderServer(<Users />, { rerenderOnServerAction: true });

  expect(await getLikes(5)).toBe(0);

  await page.getByRole("button", { name: "Toggle" }).first().click();
  await page.getByRole("button", { name: "Like" }).click();

  await waitForServerAction();
  expect(await getLikes(5)).toBe(1);

  await expect.element(page.getByText("+1")).toBeVisible();
});
