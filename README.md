# vitest-plugin-rsc

> 🔬 **Experimental** Vitest plugin that brings first‑class **unit testing for [React Server Components](https://react.dev/reference/rsc)** (RSC) into your project.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

- Seamlessly **renders RSCs** inside Vitest
- Familiar **Testing‑Library API** (`renderServer`, `cleanup`).
- Supports **server actions** (`"use server"`) and async data fetching.

---

## 📋 Requirements

> **Heads‑up:** The plugin currently **requires Vitest’s browser mode**. Node‑only test runs are not supported _yet_.

## ⚡ Quick start

### 1. Register the plugin in `vitest.config.ts`

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vitestPluginRSC from "vitest-plugin-rsc";

export default defineConfig({
  plugins: [vitestPluginRSC()],
  test: {
    restoreMocks: true,
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./src/vitest.setup.ts"],
  },
});
```

### 2. Boot the runtime

```ts
// src/vitest.setup.ts
import { beforeAll, beforeEach } from "vitest";
import { cleanup, setupRuntime } from "vitest-plugin-rsc/testing-library";

beforeAll(() => {
  setupRuntime(); // ⬅️ spins up the RSC runtime
});

beforeEach(async () => {
  await cleanup(); // ⬅️ reset DOM between tests
});
```

### 3. Write your first RSC test

```tsx
import { expect, test, screen } from "vitest";
import { renderServer } from "vitest-plugin-rsc/testing-library";
import { userEvent } from "@testing-library/user-event";
import { http } from "msw";

import { Users } from "./users";
import { api } from "../lib/api";
import { getLikes } from "../lib/db";
import { msw } from "../test/msw";

test("increments likes on click", async () => {
  msw.use(
    http.get(api("/users"), () => Response.json([{ id: 5, name: "Ada" }])),
  );

  await renderServer(<Users />, { rerenderOnServerAction: true });

  expect(await getLikes(5)).toBe(0);

  await userEvent.click(await screen.findByRole("button", { name: /toggle/i }));

  await userEvent.click(await screen.findByRole("button", { name: /like/i }));

  expect(await screen.findByText("+1")).toBeVisible();
  expect(await getLikes(5)).toBe(1);
});
```

---

## 🛠️ How it works

### 1. Serialize the server tree (in the browser)

We render the RSC tree to a React Flight **ReadableStream** directly in the browser:

```tsx
import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";

const flightStream = renderToReadableStream(<ServerComponent />);
```

We can only use this API in the browser by setting the `react-server` [resolve condition](https://nodejs.org/api/packages.html#conditions) in the Vite client environment.

### 2. Rewrite `"use client"` components to server references

During bundling every component annotated with the `"use client"` directive is rewritten into a **server reference** so that the server can later request the client bundle:

```tsx
"use client";
import { useState } from "react";

export function Like() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>Like</button>
      <span>{count ? ` +${count} ` : ""}</span>
    </>
  );
}
```

⬇️ becomes ⬇️

```tsx
import { registerClientReference } from "@vitejs/plugin-rsc/vendor/react-server-dom/server";

export const Like = registerClientReference(
  /* fallback */ () => null,
  "file:///my-app/components/like.tsx",
  "Like"
);
```

We have now copied some of that of the transformations from the vite-rsc-plugin:

https://github.com/vitejs/vite-plugin-react/blob/fa60127be46d48ecd8a8b0d0e7e6751ed11303e2/packages/plugin-rsc/src/plugin.ts#L856-L861

As they were not easily available outside of the plugin.

### 3. Deserialize the Flight stream on the client

Once the Flight stream is available we hydrate it back to JSX:

```tsx
import { createFromReadableStream } from "@vitejs/plugin-rsc/react/browser";

const jsx = await createFromReadableStream(flightStream);
```

### 4. Dedicated Vite environment

The only problem is that this API should not have `react-server` condition set, and the client components should be resolved using different transform. For that reason we create a new vite environment called `react_client` with different resolve conditions and transforms.

We can import the API from the correct environment using:

```tsx
import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";

const { createFromReadableStream } = await importReactClient(
  "@vitejs/plugin-rsc/react/browser"
);

const flightStream = renderToReadableStream(<ServerComponent />);
const jsx = await createFromReadableStream(flightStream);
```

### 5. Runtime helper (`importReactClient`)

`importReactClient` is backed by Vite’s `ModuleRunner`, which evaluates the module in an ESM sandbox and proxies `invoke` calls back to the `react_client` environment:

```ts
import { ESModulesEvaluator, ModuleRunner } from "vite/module-runner";

const runner = new ModuleRunner(
  {
    sourcemapInterceptor: false,
    transport: {
      invoke: async (payload) => {
        const res = await fetch(
          "/@vite/invoke-react-client?" +
            new URLSearchParams({ data: JSON.stringify(payload) })
        );
        return res.json();
      },
    },
    hmr: false,
  },
  new ESModulesEvaluator()
);

export const importReactClient = runner.import.bind(runner);
```

#### Server middleware

```ts
export function rscVitestMiddleware() {
  return {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === "/@vite/invoke-react-client") {
          const payload = JSON.parse(url.searchParams.get("data")!);
          const result = await server.environments["react_client"]!.hot.handleInvoke(
            payload
          );
          res.end(JSON.stringify(result));
          return;
        }
        next();
      });
    },
  };
}
```

That’s the core loop: **serialize → deserialize** — all inside Vitest’s browser context. 🚀
