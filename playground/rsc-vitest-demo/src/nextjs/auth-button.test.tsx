import { expect, test, vi } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";

import { screen } from "@testing-library/dom";
import AuthButton from "./auth-button.tsx";

import { RequestCookiesAdapter } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getUser } from "../lib/session.ts";

vi.mock(import("../lib/session"), { spy: true });

vi.mock("next/headers", () => ({
  cookies: async () => RequestCookiesAdapter.seal(new RequestCookies(new Headers())),
}));

test("renders login button when logged out", async () => {
  await renderServer(<AuthButton noteId={null}>Add</AuthButton>);

  expect(await screen.findByRole("menuitem", { name: "Login to Add" })).toBeVisible();
});

test("renders add button when logged in", async () => {
  vi.mocked(getUser).mockReturnValue("some-user");

  await renderServer(<AuthButton noteId={null}>Add</AuthButton>);

  expect(await screen.findByRole("menuitem", { name: /Add/ })).toBeVisible();
});

test("renders outlined edit button for a specific note", async () => {
  vi.mocked(getUser).mockReturnValue("some-user");

  await renderServer(<AuthButton noteId="1">Edit</AuthButton>);

  const menuItem = await screen.findByRole("menuitem", { name: /Edit/ });
  expect(menuItem).toBeVisible();
  expect(menuItem).toHaveClass("edit-button--outline");
});
