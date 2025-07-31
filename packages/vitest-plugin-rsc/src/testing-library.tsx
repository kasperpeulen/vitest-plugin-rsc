// import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";
import type { Container } from "react-dom/client";
import type { JSXElementConstructor, ReactNode } from "react";
// import { setRequireModule } from "@vitejs/plugin-rsc/core/browser";
// import {
//   loadServerAction,
//   setRequireModule as setRequireServerModule,
// } from "@vitejs/plugin-rsc/core/rsc";
// import { setServerCallback } from "@vitejs/plugin-rsc/react/browser";
import { importReactClient } from "./utilts";
import type {
  FetchRsc,
  RscPayload,
  TestingLibraryClientRoot,
} from "./testing-library-client";
import * as ReactServer from "@vitejs/plugin-rsc/react/rsc";

const client = await importReactClient<
  typeof import("./testing-library-client")
>("vitest-plugin-rsc/testing-library-client");
// const { React, ReactDOMClient: { createRoot } } = client;

// const { default: React } = await importReactClient<{
//   default: typeof import("react");
// }>("react");

// const {
//   default: { createRoot },
// } = await importReactClient<{ default: typeof import("react-dom/client") }>(
//   "react-dom/client",
// );
// const { createFromReadableStream } = await importReactClient<
//   typeof import("@vitejs/plugin-rsc/react/browser")
// >("@vitejs/plugin-rsc/react/browser");

// declare global {
//   var IS_REACT_ACT_ENVIRONMENT: boolean;
// }

// we call act only when rendering to flush any possible effects
// usually the async nature of Vitest browser mode ensures consistency,
// but rendering is sync and controlled by React directly
// async function act<T>(callback: () => T | Promise<T>) {
//   globalThis.IS_REACT_ACT_ENVIRONMENT = true;
//   try {
//     await React.act(callback);
//   } finally {
//     globalThis.IS_REACT_ACT_ENVIRONMENT = false;
//   }
// }

const mountedContainers = new Set<Container>();
const mountedRootEntries: {
  container: Container;
  root: TestingLibraryClientRoot;
}[] = [];

export async function renderServer(
  ui: ReactNode,
  {
    container,
    baseElement = document.body,
    // wrapper: WrapperComponent,
    // rerenderOnServerAction = false,
  }: {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    wrapper?: JSXElementConstructor<{ children: ReactNode }>;
    rerenderOnServerAction?: boolean;
  } = {},
): Promise<{
  container: HTMLElement;
  baseElement: HTMLElement;
  unmount: () => Promise<void>;
  // rerender: (ui: ReactNode) => Promise<void>;
  asFragment: () => DocumentFragment;
}> {
  container ??= baseElement.appendChild(document.createElement("div"));

  let root: TestingLibraryClientRoot;

  if (!mountedContainers.has(container)) {
    const fetchRsc: FetchRsc = async (actionRequest) => {
      // TODO: decodeReply with temporaryReferences
      let returnValue: unknown;
      if (actionRequest) {
        const { id, args } = actionRequest;
        const action = await ReactServer.loadServerAction(id);
        returnValue = await action.apply(null, args);
      }
      const stream = ReactServer.renderToReadableStream<RscPayload>({
        root: ui,
        returnValue,
      });
      return stream;
    }
    root = await client.createTestingLibraryClientRoot({
      container,
      config,
      fetchRsc
    });
    mountedRootEntries.push({ container, root });
    mountedContainers.add(container);
  } else {
    root = mountedRootEntries.find((it) => it.container === container)!.root;
  }

  // const render = async (ui: ReactNode) => {
  //   const element = await createFromReadableStream<ReactNode>(
  //     renderToReadableStream(ui),
  //   );
  //   return root.render(
  //     strictModeIfNeeded(wrapUiIfNeeded(element, WrapperComponent)),
  //   );
  // };

  // if (rerenderOnServerAction) {
  //   setServerCallback(async (id, args) => {
  //     const result = await defaultServerCallback(id, args);
  //     await act(() => React.startTransition(() => render(ui)));
  //     return result;
  //   });
  // }

  // await render(ui);

  return {
    container,
    baseElement,
    // rerender: (ui) => act(async () => render(ui)),
    unmount: root.unmount,
    asFragment: () => {
      return document
        .createRange()
        .createContextualFragment(container.innerHTML);
    },
  };
}

export async function cleanup() {
  for (const { root, container } of mountedRootEntries) {
    await root.unmount();
    // await act(async () => root.unmount());
    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  }
  mountedRootEntries.length = 0;
  mountedContainers.clear();

  // setServerCallback(defaultServerCallback);
}

export interface RenderConfiguration {
  reactStrictMode: boolean;
}

const config: RenderConfiguration = {
  reactStrictMode: false,
};

// function strictModeIfNeeded(innerElement: ReactNode) {
//   return config.reactStrictMode
//     ? React.createElement(React.StrictMode, null, innerElement)
//     : innerElement;
// }

// function wrapUiIfNeeded(
//   innerElement: ReactNode,
//   wrapperComponent?: JSXElementConstructor<{
//     children: ReactNode;
//   }>,
// ) {
//   return wrapperComponent
//     ? React.createElement(wrapperComponent, null, innerElement)
//     : innerElement;
// }

export function configure(customConfig: Partial<RenderConfiguration>): void {
  Object.assign(config, customConfig);
}

declare let __vite_rsc_raw_import__: (id: string) => Promise<unknown>;

export function setupRuntime(): void {
  // setRequireModule({ load: (id) => importReactClient(id) });
  // setRequireServerModule({ load: (id) => import(/* @vite-ignore */ id) });
  // setServerCallback(defaultServerCallback);
  ReactServer.setRequireModule({
    load: (id) => __vite_rsc_raw_import__(id),
  });
  client.initialize();
}

// let promise: Promise<void>;

// export async function waitForServerAction() {
//   await promise;
// }

// export async function defaultServerCallback(id: string, args: unknown[]) {
//   const resolvers = Promise.withResolvers<void>();
//   promise = resolvers.promise;
//   const action = await loadServerAction(id);
//   const result = await action(...args);
//   resolvers.resolve();
//   return result;
// }
