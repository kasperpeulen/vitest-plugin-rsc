import { test } from "vitest";
import {
  TestServerActionBindAction,
  TestServerActionBindClient,
  TestServerActionBindReset,
  TestServerActionBindSimple,
} from "./server.tsx";
import { renderServer } from "vitest-plugin-rsc/testing-library";

test("TestServerActionBindReset", async () => {
  await renderServer(
    <>
      <TestServerActionBindReset />
      <TestServerActionBindSimple />
      <TestServerActionBindClient />
      <TestServerActionBindAction />
    </>,
    {
      rerenderOnServerAction: true,
    },
  );
});
