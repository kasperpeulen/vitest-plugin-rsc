/// <reference types="@vitest/browser/context" />

// @ts-ignore
globalThis.process = { env: {} }
globalThis.__dirname = null!

import { configure } from '@testing-library/dom'
import { userEvent } from '@testing-library/user-event'
import { isNextRouterError } from 'next/dist/client/components/is-next-router-error'
import { beforeAll, beforeEach, vi } from 'vitest'
import { cleanup, initialize } from 'vitest-plugin-rsc/testing-library'
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

vi.mock(import('next/cache'), { spy: true })

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
  configure({ asyncUtilTimeout: 2000 })
  initialize({
    rootOptions: {
      onCaughtError: (error) => {
        if (isNextRouterError(error)) return
        console.log(error)
      }
    }
  })
})

beforeEach(async (context) => {
  const { revalidatePath } = await import('next/cache')

  // mock out for now
  vi.mocked(revalidatePath).mockImplementation(() => {})
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
