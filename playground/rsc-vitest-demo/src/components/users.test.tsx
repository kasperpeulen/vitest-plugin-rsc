import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { http } from "msw";
import { Users } from "./users.tsx";
import { getLikes } from "../lib/db.ts";
import { msw } from "../test/msw.ts";
import { api } from "../lib/api.ts";
import { screen } from "@testing-library/dom";
import { userEvent } from "@testing-library/user-event";

test("save to db when clicked", async () => {
  msw.use(http.get(api("/users"), () => Response.json([{ id: 5, name: "some user" }])));

  await renderServer(<Users />, { rerenderOnServerAction: true });

  expect(await getLikes(5)).toBe(0);

  await userEvent.click(await screen.findByRole("button", { name: "Toggle" }));
  await userEvent.click(await screen.findByRole("button", { name: "Like" }));

  expect(await screen.findByText("+1")).toBeVisible();
  expect(await getLikes(5)).toBe(1);
});
