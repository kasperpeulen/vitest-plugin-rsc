import type { Container } from "react-dom/client";

import { renderToReadableStream } from "@vitejs/plugin-rsc/react/rsc";

import type { JSX, Usable } from "react";
import { importReactClient } from "./utilts";

export { importReactClient };

import { setRequireModule } from "@vitejs/plugin-rsc/core/browser";
import { setRequireModule as setRequireServerModule } from "@vitejs/plugin-rsc/core/rsc";
import { setServerCallback } from "@vitejs/plugin-rsc/react/browser";
import { loadServerAction } from "@vitejs/plugin-rsc/core/rsc";

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
  // @ts-expect-error unstable_act is not typed, but exported
  const _act = React.act || React.unstable_act;
  if (typeof _act !== "function") {
    cb();
  } else {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    try {
      await _act(cb);
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    }
  }
}

export interface RenderResult {
  container: HTMLElement;
  baseElement: HTMLElement;
  unmount: () => void;
  rerender: (ui: React.ReactNode) => void;
  asFragment: () => DocumentFragment;
}

export interface ComponentRenderOptions {
  rerenderOnServerAction?: boolean;
  container?: HTMLElement;
  baseElement?: HTMLElement;
  wrapper?: React.JSXElementConstructor<{ children: React.ReactNode }>;
}

// Ideally we'd just use a WeakMap where containers are keys and roots are values.
// We use two variables so that we can bail out in constant time when we render with a new container (most common use case)
const mountedContainers = new Set<Container>();
const mountedRootEntries: {
  container: Container;
  root: ReturnType<typeof createConcurrentRoot>;
}[] = [];

export async function renderServer(
  ui: React.ReactNode,
  {
    container,
    baseElement,
    wrapper: WrapperComponent,
    rerenderOnServerAction = false,
  }: ComponentRenderOptions = {},
): Promise<RenderResult> {
  if (!baseElement) {
    // default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement("div"));
  }

  let root: ReactRoot;

  if (!mountedContainers.has(container)) {
    root = createConcurrentRoot(container);

    mountedRootEntries.push({ container, root });
    // we'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.
    mountedContainers.add(container);
  } else {
    mountedRootEntries.forEach((rootEntry) => {
      // Else is unreachable since `mountedContainers` has the `container`.
      // Only reachable if one would accidentally add the container to `mountedContainers` but not the root to `mountedRootEntries`
      /* istanbul ignore else */
      if (rootEntry.container === container) {
        root = rootEntry.root;
      }
    });
  }

  const render = async (newUi: React.ReactNode) => {
    await act(() => {
      root.render(strictModeIfNeeded(wrapUiIfNeeded(newUi, WrapperComponent)));
    });
  };

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
    unmount: async () => {
      await act(() => {
        root.unmount();
      });
    },
    rerender: render,
    asFragment: () => {
      return document
        .createRange()
        .createContextualFragment(container.innerHTML);
    },
  };
}

export interface RenderHookOptions<Props> extends ComponentRenderOptions {
  /**
   * The argument passed to the renderHook callback. Can be useful if you plan
   * to use the rerender utility to change the values passed to your hook.
   */
  initialProps?: Props | undefined;
}

export function cleanup(): void {
  mountedRootEntries.forEach(({ root, container }) => {
    act(() => {
      root.unmount();
    });
    if (container.parentNode === document.body) {
      document.body.removeChild(container);
    }
  });
  mountedRootEntries.length = 0;
  mountedContainers.clear();
}

interface ReactRoot {
  render: (element: React.ReactNode) => void;
  unmount: () => void;
}

export function Use({ value }: { value: Usable<JSX.Element> }) {
  return React.use(value);
}

function createConcurrentRoot(container: HTMLElement): ReactRoot {
  const root = createRoot(container);

  return {
    render(element) {
      root.render(
        <Use
          value={createFromReadableStream(renderToReadableStream(element))}
        />,
      );
    },
    unmount() {
      root.unmount();
    },
  };
}

export interface RenderConfiguration {
  reactStrictMode: boolean;
}

const config: RenderConfiguration = {
  reactStrictMode: false,
};

function strictModeIfNeeded(innerElement: React.ReactNode) {
  return config.reactStrictMode
    ? React.createElement(React.StrictMode, null, innerElement)
    : innerElement;
}

function wrapUiIfNeeded(
  innerElement: React.ReactNode,
  wrapperComponent?: React.JSXElementConstructor<{
    children: React.ReactNode;
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
  setRequireModule({
    load: (id) => importReactClient(id),
  });

  setRequireServerModule({
    load: (id) => import(/* @vite-ignore */ id),
  });

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
