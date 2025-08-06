import { isNextRouterError } from "next/dist/client/components/is-next-router-error";
// import {
//   forbidden,
//   notFound,
//   permanentRedirect,
//   ReadonlyURLSearchParams,
//   redirect,
//   RedirectType,
//   unauthorized,
//   unstable_rethrow,
// } from "next/dist/client/components/navigation.react-server";
// import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
// import { HeadersAdapter } from "next/dist/server/web/spec-extension/adapters/headers";
// import { RequestCookiesAdapter } from "next/dist/server/web/spec-extension/adapters/request-cookies";
// import { vi } from "vitest";
import type { RenderConfiguration } from "../testing-library";
import { initialize as baseInitialize } from "../testing-library";
// vi.mock(import("next/navigation"), () => {
//   return {
//     redirect,
//     permanentRedirect,
//     notFound,
//     forbidden,
//     unauthorized,
//     RedirectType,
//     ReadonlyURLSearchParams,
//     unstable_rethrow,
//   };
// });
//
// vi.mock(import("next/headers"), () => {
//   const headers = new HeadersAdapter({});
//   return {
//     headers: async () => headers,
//     cookies: async () =>
//       RequestCookiesAdapter.seal(new RequestCookies(headers)),
//   };
// });
//
// vi.mock(import("next/cache"), async () => {
//   return {
//     revalidatePath: vi.fn(),
//     revalidateTag: vi.fn(),
//   };
// });

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

export { NextRouter } from "./next-router";
