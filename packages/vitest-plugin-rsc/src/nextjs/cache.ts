import { fn } from "@vitest/spy";

export const revalidatePath = fn();
export const revalidateTag = fn();

export { unstable_cache } from "next/dist/server/web/spec-extension/unstable-cache";
export {
  unstable_expireTag,
  unstable_expirePath,
} from "next/dist/server/web/spec-extension/revalidate";

export { unstable_noStore } from "next/dist/server/web/spec-extension/unstable-no-store";
export { cacheLife as unstable_cacheLife } from "next/dist/server/use-cache/cache-life";
export { cacheTag as unstable_cacheTag } from "next/dist/server/use-cache/cache-tag";
