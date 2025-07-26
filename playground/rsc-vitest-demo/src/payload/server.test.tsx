import { expect, test } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { TestPayloadServer } from "./server.tsx";
import { screen } from "@testing-library/dom";

test("payload", async () => {
  await renderServer(<TestPayloadServer />);

  expect(await screen.findByTestId("rsc-payload")).toHaveTextContent(/.*true.*true.*true.*true/);
});
