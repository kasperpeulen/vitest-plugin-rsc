/* eslint-disable prefer-const,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-function-type */
import assert from "node:assert";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type Plugin,
  type ResolvedConfig,
  type Rollup,
  type ViteDevServer,
  normalizePath,
  parseAstAsync,
} from "vite";
import vitePluginRscCore from "@vitejs/plugin-rsc/core/plugin";

import {
  hasDirective,
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "./transforms";
import { generateEncryptionKey, toBase64 } from "./utils/encryption-utils";
import { normalizeViteImportAnalysisUrl } from "./vite-utils";

// state for build orchestration
let serverReferences: Record<string, string> = {};
let server: ViteDevServer;
let config: ResolvedConfig;

type ClientReferenceMeta = {
  importId: string;
  // same as `importId` during dev. hashed id during build.
  referenceKey: string;
  packageSource?: string;
  // build only for tree-shaking unused export
  exportNames: string[];
  renderedExports: string[];
};
let clientReferenceMetaMap: Record</* id */ string, ClientReferenceMeta> = {};

const PKG_NAME = "@vitejs/plugin-rsc";

const require = createRequire(import.meta.url);

function resolvePackage(name: string) {
  return pathToFileURL(require.resolve(name)).href;
}

export type RscPluginOptions = {
  /**
   * shorthand for configuring `environments.(name).build.rollupOptions.input.index`
   */
  entries?: Partial<Record<"react_client" | "ssr" | "client", string>>;

  /** @deprecated use `serverHandler: false` */
  disableServerHandler?: boolean;

  /** @default { enviornmentName: "client", entryName: "index" } */
  serverHandler?:
    | {
        environmentName: string;
        entryName: string;
      }
    | false;

  /** @default false */
  loadModuleDevProxy?: boolean;

  rscCssTransform?: false | { filter?: (id: string) => boolean };

  ignoredPackageWarnings?: (string | RegExp)[];

  /**
   * This option allows customizing how client build copies assets from server build.
   * By default, all assets are copied, but frameworks might want to establish some convention
   * to tighten security based on this option.
   */
  copyServerAssetsToClient?: (fileName: string) => boolean;

  defineEncryptionKey?: string;

  /**
   * Allows enabling action closure encryption for debugging purpose.
   * @default true
   */
  enableActionEncryption?: boolean;

  /** Escape hatch for Waku's `allowServer` */
  keepUseCientProxy?: boolean;
};

export function vitePluginRsc(
  rscPluginOptions: RscPluginOptions = {},
): Plugin[] {
  return [
    {
      name: "rsc",
      configResolved(config_) {
        config = config_;
      },
      configureServer(server_) {
        server = server_;
      },
    },
    ...vitePluginRscCore(),
    ...vitePluginUseClient(rscPluginOptions),
    ...vitePluginUseServer(rscPluginOptions),
    ...vitePluginDefineEncryptionKey(rscPluginOptions),
  ];
}

function normalizeRelativePath(s: string) {
  s = normalizePath(s);
  return s[0] === "." ? s : "./" + s;
}

function hashString(v: string) {
  return createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
}

function normalizeReferenceId(id: string, name: "client" | "react_client") {
  if (!server) {
    return hashString(path.relative(config.root, id));
  }

  // align with how Vite import analysis would rewrite id
  // to avoid double modules on browser and ssr.
  const environment = server.environments[name]!;
  return normalizeViteImportAnalysisUrl(environment, id);
}

function vitePluginUseClient(
  useClientPluginOptions: Pick<
    RscPluginOptions,
    "ignoredPackageWarnings" | "keepUseCientProxy"
  >,
): Plugin[] {
  const packageSources = new Map<string, string>();

  // https://github.com/vitejs/vite/blob/4bcf45863b5f46aa2b41f261283d08f12d3e8675/packages/vite/src/node/utils.ts#L175
  const bareImportRE = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/;

  return [
    {
      name: "rsc:use-client",
      async transform(code, id) {
        if (this.environment.name !== "client") return;
        if (!code.includes("use client")) return;

        const ast = await parseAstAsync(code);
        if (!hasDirective(ast.body, "use client")) return;

        let importId: string;
        let referenceKey: string;
        const packageSource = packageSources.get(id);
        if (!packageSource && id.includes("?v=")) {
          assert(this.environment.mode === "dev");
          // If non package source `?v=<hash>` reached here, this is a client boundary
          // created by a package imported on server environment, which breaks the
          // expectation on dependency optimizer on browser. Directly copying over
          // "?v=<hash>" from client optimizer in client reference can make a hashed
          // module stale, so we use another virtual module wrapper to delay such process.
          // TODO: suggest `optimizeDeps.exclude` and skip warning if that's already the case.
          const ignored = useClientPluginOptions.ignoredPackageWarnings?.some(
            (pattern) =>
              pattern instanceof RegExp
                ? pattern.test(id)
                : id.includes(`/node_modules/${pattern}/`),
          );
          if (!ignored) {
            this.warn(
              `[vite-rsc] detected an internal client boundary created by a package imported on rsc environment`,
            );
          }
          importId = `/@id/__x00__virtual:vite-rsc/client-in-server-package-proxy/${encodeURIComponent(
            id.split("?v=")[0]!,
          )}`;
          referenceKey = importId;
        } else if (packageSource) {
          if (this.environment.mode === "dev") {
            importId = `/@id/__x00__virtual:vite-rsc/client-package-proxy/${packageSource}`;
            referenceKey = importId;
          } else {
            importId = packageSource;
            referenceKey = hashString(packageSource);
          }
        } else {
          if (this.environment.mode === "dev") {
            importId = normalizeViteImportAnalysisUrl(
              server.environments.client,
              id,
            );
            referenceKey = importId;
          } else {
            importId = id;
            referenceKey = hashString(
              normalizePath(path.relative(config.root, id)),
            );
          }
        }

        const transformDirectiveProxyExport_ = withRollupError(
          this,
          transformDirectiveProxyExport,
        );
        const result = transformDirectiveProxyExport_(ast, {
          directive: "use client",
          code,
          keep: !!useClientPluginOptions.keepUseCientProxy,
          runtime: (name, meta) => {
            let proxyValue =
              `() => { throw new Error("Unexpectedly client reference export '" + ` +
              JSON.stringify(name) +
              ` + "' is called on server") }`;
            if (meta?.value) {
              proxyValue = `(${meta.value})`;
            }
            return (
              `$$ReactServer.registerClientReference(` +
              `  ${proxyValue},` +
              `  ${JSON.stringify(referenceKey)},` +
              `  ${JSON.stringify(name)})`
            );
          },
        });
        if (!result) return;
        const { output, exportNames } = result;
        clientReferenceMetaMap[id] = {
          importId,
          referenceKey,
          packageSource,
          exportNames,
          renderedExports: [],
        };
        const importSource = resolvePackage(`${PKG_NAME}/react/rsc`);
        output.prepend(`import * as $$ReactServer from "${importSource}";\n`);
        return { code: output.toString(), map: { mappings: "" } };
      },
    },
    createVirtualPlugin("vite-rsc/client-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export default {}`, map: null };
      }
      let code = "";
      for (const meta of Object.values(clientReferenceMetaMap)) {
        // vite/rollup can apply tree-shaking to dynamic import of this form
        const key = JSON.stringify(meta.referenceKey);
        const id = JSON.stringify(meta.importId);
        const exports = meta.renderedExports
          .map((name) => (name === "default" ? "default: _default" : name))
          .sort();
        code += `
          ${key}: async () => {
            const {${exports}} = await import(${id});
            return {${exports}};
          },
        `;
      }
      code = `export default {${code}};\n`;
      return { code, map: null };
    }),
    {
      name: "rsc:virtual-client-in-server-package",
      async load(id) {
        if (
          id.startsWith("\0virtual:vite-rsc/client-in-server-package-proxy/")
        ) {
          assert.equal(this.environment.mode, "dev");
          assert.notEqual(this.environment.name, "client");
          id = decodeURIComponent(
            id.slice(
              "\0virtual:vite-rsc/client-in-server-package-proxy/".length,
            ),
          );
          // TODO: avoid `export default undefined`
          return `
            export * from ${JSON.stringify(id)};
            import * as __all__ from ${JSON.stringify(id)};
            export default __all__.default;
          `;
        }
      },
    },
    {
      name: "rsc:virtual-client-package",
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          if (this.environment.name === "client" && bareImportRE.test(source)) {
            const resolved = await this.resolve(source, importer, options);
            if (resolved && resolved.id.includes("/node_modules/")) {
              packageSources.set(resolved.id, source);
              return resolved;
            }
          }
        },
      },
      async load(id) {
        if (id.startsWith("\0virtual:vite-rsc/client-package-proxy/")) {
          assert(this.environment.mode === "dev");
          const source = id.slice(
            "\0virtual:vite-rsc/client-package-proxy/".length,
          );
          const meta = Object.values(clientReferenceMetaMap).find(
            (v) => v.packageSource === source,
          )!;
          const exportNames = meta.exportNames;
          return `export {${exportNames.join(",")}} from ${JSON.stringify(
            source,
          )};\n`;
        }
      },
      generateBundle(_options, bundle) {
        if (this.environment.name !== "client") return;

        // track used exports of client references in rsc build
        // to tree shake unused exports in browser and ssr build
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "chunk") {
            for (const [id, mod] of Object.entries(chunk.modules)) {
              const meta = clientReferenceMetaMap[id];
              if (meta) {
                meta.renderedExports = mod.renderedExports;
              }
            }
          }
        }
      },
    },
  ];
}

function vitePluginDefineEncryptionKey(
  useServerPluginOptions: Pick<RscPluginOptions, "defineEncryptionKey">,
): Plugin[] {
  let defineEncryptionKey: string;
  let emitEncryptionKey = false;
  const KEY_PLACEHOLDER = "__vite_rsc_define_encryption_key";
  const KEY_FILE = "__vite_rsc_encryption_key.js";

  return [
    {
      name: "rsc:encryption-key",
      async configEnvironment(name, _config, env) {
        if (name === "client" && !env.isPreview) {
          defineEncryptionKey =
            useServerPluginOptions.defineEncryptionKey ??
            JSON.stringify(toBase64(await generateEncryptionKey()));
        }
      },
      resolveId(source) {
        if (source === "virtual:vite-rsc/encryption-key") {
          // encryption logic can be tree-shaken if action bind is not used.
          return { id: "\0" + source, moduleSideEffects: false };
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/encryption-key") {
          if (this.environment.mode === "build") {
            // during build, load key from an external file to make chunks stable.
            return `export default () => ${KEY_PLACEHOLDER}`;
          }
          return `export default () => (${defineEncryptionKey})`;
        }
      },
      renderChunk(code, chunk) {
        if (code.includes(KEY_PLACEHOLDER)) {
          assert.equal(this.environment.name, "client");
          emitEncryptionKey = true;
          const normalizedPath = normalizeRelativePath(
            path.relative(path.join(chunk.fileName, ".."), KEY_FILE),
          );
          const replacement = `import(${JSON.stringify(
            normalizedPath,
          )}).then(__m => __m.default)`;
          code = code.replaceAll(KEY_PLACEHOLDER, () => replacement);
          return { code };
        }
      },
      writeBundle() {
        if (this.environment.name === "client" && emitEncryptionKey) {
          fs.writeFileSync(
            path.join(this.environment.config.build.outDir, KEY_FILE),
            `export default ${defineEncryptionKey};\n`,
          );
        }
      },
    },
  ];
}

function vitePluginUseServer(
  useServerPluginOptions: Pick<
    RscPluginOptions,
    "ignoredPackageWarnings" | "enableActionEncryption"
  >,
): Plugin[] {
  return [
    {
      name: "rsc:use-server",
      async transform(code, id) {
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);

        let normalizedId_: string | undefined;
        const getNormalizedId = () => {
          if (!normalizedId_) {
            if (id.includes("?v=")) {
              assert(this.environment.mode === "dev");
              const ignored =
                useServerPluginOptions.ignoredPackageWarnings?.some(
                  (pattern) =>
                    pattern instanceof RegExp
                      ? pattern.test(id)
                      : id.includes(`/node_modules/${pattern}/`),
                );
              if (!ignored) {
                this.warn(
                  `[vite-rsc] detected an internal server function created by a package imported on ${this.environment.name} environment`,
                );
              }
              // module runner has additional resolution step and it's not strict about
              // module identity of `import(id)` like browser, so we simply strip it off.
              id = id.split("?v=")[0]!;
            }
            normalizedId_ = normalizeReferenceId(id, "client");
          }
          return normalizedId_;
        };

        if (this.environment.name === "client") {
          const transformServerActionServer_ = withRollupError(
            this,
            transformServerActionServer,
          );
          const enableEncryption =
            useServerPluginOptions.enableActionEncryption ?? true;
          const { output } = transformServerActionServer_(code, ast, {
            runtime: (value, name) =>
              `$$ReactServer.registerServerReference(${value}, ${JSON.stringify(
                getNormalizedId(),
              )}, ${JSON.stringify(name)})`,
            rejectNonAsyncFunction: true,
            encode: enableEncryption
              ? (value) => `$$ReactServer.encryptActionBoundArgs(${value})`
              : undefined,
            decode: enableEncryption
              ? (value) =>
                  `await $$ReactServer.decryptActionBoundArgs(${value})`
              : undefined,
          });
          if (!output.hasChanged()) return;
          serverReferences[getNormalizedId()] = id;
          const importSource = resolvePackage(`${PKG_NAME}/rsc`);
          output.prepend(`import * as $$ReactServer from "${importSource}";\n`);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        } else {
          if (!hasDirective(ast.body, "use server")) return;
          const transformDirectiveProxyExport_ = withRollupError(
            this,
            transformDirectiveProxyExport,
          );
          const result = transformDirectiveProxyExport_(ast, {
            code,
            runtime: (name) =>
              `$$ReactClient.createServerReference(` +
              `${JSON.stringify(getNormalizedId() + "#" + name)},` +
              `$$ReactClient.callServer, ` +
              `undefined, ` +
              (this.environment.mode === "dev"
                ? `$$ReactClient.findSourceMapURL,`
                : "undefined,") +
              `${JSON.stringify(name)})`,
            directive: "use server",
            rejectNonAsyncFunction: true,
          });
          const output = result?.output;
          if (!output?.hasChanged()) return;
          serverReferences[getNormalizedId()] = id;
          const name =
            this.environment.name === "react_client" ? "browser" : "ssr";
          const importSource = resolvePackage(`${PKG_NAME}/react/${name}`);
          output.prepend(`import * as $$ReactClient from "${importSource}";\n`);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        }
      },
    },
    createVirtualPlugin("vite-rsc/server-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export default {}`, map: null };
      }
      const code = generateDynamicImportCode(serverReferences);
      return { code, map: null };
    }),
  ];
}

// Rethrow transform error through `this.error` with `error.pos` which is injected by `@hiogawa/transforms`
function withRollupError<F extends (...args: any[]) => any>(
  ctx: Rollup.TransformPluginContext,
  f: F,
): F {
  function processError(e: any): never {
    if (e && typeof e === "object" && typeof e.pos === "number") {
      return ctx.error(e, e.pos);
    }
    throw e;
  }
  return function (this: any, ...args: any[]) {
    try {
      const result = f.apply(this, args);
      if (result instanceof Promise) {
        return result.catch((e: any) => processError(e));
      }
      return result;
    } catch (e: any) {
      processError(e);
    }
  } as F;
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
  name = "virtual:" + name;
  return {
    name: `rsc:virtual-${name}`,
    resolveId(source) {
      return source === name ? "\0" + name : undefined;
    },
    load(id, options) {
      if (id === "\0" + name) {
        return (load as Function).apply(this, [id, options]);
      }
    },
  } satisfies Plugin;
}

function generateDynamicImportCode(map: Record<string, string>) {
  let code = Object.entries(map)
    .map(
      ([key, id]) =>
        `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
    )
    .join("\n");
  return `export default {${code}};\n`;
}
