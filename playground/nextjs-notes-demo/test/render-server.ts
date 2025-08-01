import { isNextRouterError } from 'next/dist/client/components/is-next-router-error'
import { renderServer as baseRenderServer } from 'vitest-plugin-rsc/testing-library'

export function renderServer(...args: Parameters<typeof baseRenderServer>) {
  return baseRenderServer(args[0], {
    ...args[1],
    rootOptions: {
      onCaughtError: (error) => {
        if (isNextRouterError(error)) return
        console.log(error)
      }
    }
  })
}
