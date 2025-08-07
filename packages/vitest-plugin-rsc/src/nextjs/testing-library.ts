import { isNextRouterError } from "next/dist/client/components/is-next-router-error";
import type { RenderConfiguration } from "../testing-library";
import { initialize as baseInitialize } from "../testing-library";

export * from "../testing-library";

export function initialize(
  customConfig: Partial<RenderConfiguration> = {},
): void {
  baseInitialize({
    rootOptions: {
      onCaughtError: (error) => {
        if (isNextRouterError(error)) return;
        console.log(error);
      },
      ...(customConfig.rootOptions ?? {}),
    },
    ...customConfig,
  });
}

export { NextRouter } from "vitest-plugin-rsc/nextjs/client";
