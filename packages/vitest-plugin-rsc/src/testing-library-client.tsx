import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as ReactClient from "@vitejs/plugin-rsc/react/browser";
import type { RenderConfiguration } from "../dist/testing-library";

export type RscPayload = {
  root: React.ReactNode;
  returnValue?: unknown;
};

export type TestingLibraryClientRoot = Awaited<
  ReturnType<typeof createTestingLibraryClientRoot>
>;

export type FetchRsc = (actionRequest?: {
  id: string;
  args: unknown[];
}) => Promise<ReadableStream<Uint8Array>>;

export async function createTestingLibraryClientRoot(options: {
  container: HTMLElement;
  config: RenderConfiguration,
  fetchRsc: FetchRsc;
}) {
  let setPayload: (v: RscPayload) => void;

  const initialPayload = await ReactClient.createFromReadableStream<RscPayload>(
    await options.fetchRsc(),
  );

  function BrowserRoot() {
    const [payload, setPayload_] = React.useState(initialPayload);

    React.useEffect(() => {
      setPayload = (v) => React.startTransition(() => setPayload_(v));
    }, [setPayload_]);

    return payload.root;
  }

  ReactClient.setServerCallback(async (id, args) => {
    // TODO: encodeReply with temporaryReferences
    const temporaryReferences = ReactClient.createTemporaryReferenceSet();
    const payload = await ReactClient.createFromReadableStream<RscPayload>(
      await options.fetchRsc({ id, args }),
      { temporaryReferences },
    );
    setPayload(payload);
    return payload.returnValue;
  });

  let browserRoot = <BrowserRoot />;

  if (options.config.reactStrictMode) {
    browserRoot = <React.StrictMode>{browserRoot}</React.StrictMode>;
  }

  const reactRoot = ReactDOMClient.createRoot(options.container);
  reactRoot.render(browserRoot);

  function unmount() {
    reactRoot.unmount();
  }

  return {
    reactRoot,
    unmount: async () => unmount(),
    // unmount: () => act(() => unmount()),
  };
}

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// async function act<T>(callback: () => T | Promise<T>) {
//   globalThis.IS_REACT_ACT_ENVIRONMENT = true;
//   try {
//     await React.act(callback);
//   } finally {
//     globalThis.IS_REACT_ACT_ENVIRONMENT = false;
//   }
// }

export function initialize() {
  ReactClient.setRequireModule({
    load: (id) => import(/* @vite-ignore */ id),
  });
}
