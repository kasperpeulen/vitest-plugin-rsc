// @ts-ignore
globalThis.process = { env: {} }
globalThis.__dirname = null!

import { userEvent } from '@testing-library/user-event'
import { beforeAll, beforeEach, vi } from 'vitest'
import { cleanup, setupRuntime } from 'vitest-plugin-rsc/testing-library'
import { RequestCookiesAdapter } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import 'app/style.css'
import {
  redirect,
  permanentRedirect,
  notFound,
  forbidden,
  unauthorized,
  RedirectType,
  ReadonlyURLSearchParams,
  unstable_rethrow
} from 'next/dist/client/components/navigation.react-server'
import MockDate from 'mockdate'

vi.mock(import('../libs/session'), { spy: true })
vi.mock(import('../libs/notes'), () => ({
  getNote: vi.fn(),
  setNote: vi.fn()
}))

vi.mock(import('next/navigation'), () => {
  return {
    redirect,
    permanentRedirect,
    notFound,
    forbidden,
    unauthorized,
    RedirectType,
    ReadonlyURLSearchParams,
    unstable_rethrow
  }
})

vi.mock('next/headers', () => ({
  cookies: async () =>
    RequestCookiesAdapter.seal(new RequestCookies(new Headers()))
}))

beforeAll(async () => {
  setupRuntime()
})

beforeEach(async (context) => {
  // msw.resetHandlers()
  await cleanup()

  MockDate.set(new Date(2012, 3, 4, 5, 6, 7))
  context.userEvent = userEvent.setup()
})

declare module 'vitest' {
  export interface TestContext {
    userEvent: ReturnType<typeof userEvent.setup>
  }
}
