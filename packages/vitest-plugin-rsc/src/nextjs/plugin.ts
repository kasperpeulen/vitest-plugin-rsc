import type { Plugin } from "vite";

export function vitestPluginNext(): Plugin[] {
  return [
    {
      name: "next-rsc-plugin",
      config() {
        return {
          define: {
            "process.env": JSON.stringify({}),
            __dirname: JSON.stringify(null),
          },
          optimizeDeps: {
            include: ["next/dist/client/components/is-next-router-error"],
          },
          resolve: {
            alias: {
              "next/link": "next/dist/client/app-dir/link",
              "next/navigation": "vitest-plugin-rsc/dist/nextjs/navigation",
              "next/headers": "vitest-plugin-rsc/nextjs/headers",
              "next/cache": "vitest-plugin-rsc/nextjs/cache",
              "@vercel/turbopack-ecmascript-runtime/browser/dev/hmr-client/hmr-client.ts":
                "next/dist/client/dev/noop-turbopack-hmr",
              "react-server-dom-webpack/client":
                "@vitejs/plugin-rsc/vendor/react-server-dom/client.edge",
            },
          },
          environments: {
            react_client: {
              resolve: {},
              optimizeDeps: {
                include: [
                  "next/link",
                  "next/dist/client/components/router-reducer/create-initial-router-state",
                  "next/dist/shared/lib/app-router-context.shared-runtime",
                  "next/dist/shared/lib/hooks-client-context.shared-runtime",
                  "next/dist/client/components/use-action-queue",
                  "next/dist/client/components/redirect-boundary",
                  "next/dist/client/components/router-reducer/compute-changed-path",
                  "next/dist/client/components/app-router-instance",
                  "next/dist/server/app-render/types",
                ],
              },
            },
          },
        };
      },
    },
  ];
}
