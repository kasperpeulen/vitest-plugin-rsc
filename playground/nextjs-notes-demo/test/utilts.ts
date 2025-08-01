import { waitFor } from '@testing-library/dom'
import { expect } from 'vitest'

export async function expectRedirect(pathname: string) {
  await waitFor(() =>
    expect(globalThis.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'navigate',
        url: expect.objectContaining({
          pathname: '/note/1'
        })
      })
    )
  )
}
