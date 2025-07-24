import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";
import type { Container, Root } from "react-dom/client";
import type { JSX, JSXElementConstructor, ReactNode, Usable } from "react";
import { setRequireModule } from "@vitejs/plugin-rsc/core/browser";
import {
  loadServerAction,
  setRequireModule as setRequireServerModule,
} from "@vitejs/plugin-rsc/core/rsc";
import { setServerCallback } from "@vitejs/plugin-rsc/react/browser";
import { importReactClient } from "./utilts";

const { default: React } = await importReactClient<{
  default: typeof import("react");
}>("react");

const {
  default: { createRoot },
} = await importReactClient<{ default: typeof import("react-dom/client") }>(
  "react-dom/client",
);
const { createFromReadableStream } = await importReactClient<
  typeof import("@vitejs/plugin-rsc/react/browser")
>("@vitejs/plugin-rsc/react/browser");

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// we call act only when rendering to flush any possible effects
// usually the async nature of Vitest browser mode ensures consistency,
// but rendering is sync and controlled by React directly
async function act(cb: () => unknown) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await React.act(cb);
  } finally {
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  }
}

const mountedContainers = new Set<Container>();
const mountedRootEntries: {
  container: Container;
  root: Root;
}[] = [];

export async function renderServer(
  ui: ReactNode,
  {
    container,
    baseElement = document.body,
    wrapper: WrapperComponent,
    rerenderOnServerAction = false,
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
  rerender: (ui: ReactNode) => Promise<void>;
  asFragment: () => DocumentFragment;
}> {
  container ??= baseElement.appendChild(document.createElement("div"));

  let root: Root;

  if (!mountedContainers.has(container)) {
    root = createRoot(container);
    mountedRootEntries.push({ container, root });
    mountedContainers.add(container);
  } else {
    root = mountedRootEntries.find((it) => it.container === container)!.root;
  }

  const render = (ui: ReactNode) =>
    act(async () =>
      root.render(
        strictModeIfNeeded(
          wrapUiIfNeeded(
            <Use
              value={createFromReadableStream(renderToReadableStream(ui))}
            />,
            WrapperComponent,
          ),
        ),
      ),
    );

  if (rerenderOnServerAction) {
    setServerCallback(async (id, args) => {
      const result = await defaultServerCallback(id, args);
      React.startTransition(() => render(ui));
      return result;
    });
  }

  await render(ui);

  return {
    container,
    baseElement,
    rerender: render,
    unmount: () => act(async () => root.unmount()),
    asFragment: () => {
      return document
        .createRange()
        .createContextualFragment(container.innerHTML);
    },
  };
}

export async function cleanup() {
  for (const { root, container } of mountedRootEntries) {
    await act(async () => root.unmount());
    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  }
  mountedRootEntries.length = 0;
  mountedContainers.clear();

  setServerCallback(defaultServerCallback);
}

function Use({ value }: { value: Usable<JSX.Element> }) {
  return React.use(value);
}

export interface RenderConfiguration {
  reactStrictMode: boolean;
}

const config: RenderConfiguration = {
  reactStrictMode: false,
};

function strictModeIfNeeded(innerElement: ReactNode) {
  return config.reactStrictMode
    ? React.createElement(React.StrictMode, null, innerElement)
    : innerElement;
}

function wrapUiIfNeeded(
  innerElement: ReactNode,
  wrapperComponent?: JSXElementConstructor<{
    children: ReactNode;
  }>,
) {
  return wrapperComponent
    ? React.createElement(wrapperComponent, null, innerElement)
    : innerElement;
}

export function configure(customConfig: Partial<RenderConfiguration>): void {
  Object.assign(config, customConfig);
}

export function setupRuntime(): void {
  setRequireModule({ load: (id) => importReactClient(id) });
  setRequireServerModule({ load: (id) => import(/* @vite-ignore */ id) });
  setServerCallback(defaultServerCallback);
}

let promise: Promise<void>;

export async function waitForServerAction() {
  await promise;
}

export async function defaultServerCallback(id: string, args: unknown[]) {
  const resolvers = Promise.withResolvers<void>();
  promise = resolvers.promise;
  const action = await loadServerAction(id);
  const result = await action(...args);
  resolvers.resolve();
  return result;
}
