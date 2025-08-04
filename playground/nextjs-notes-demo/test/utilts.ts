import { waitFor } from '@testing-library/dom'
import { expect } from 'vitest'

export async function expectNavigation(pathname: string) {
  await waitFor(() =>
    expect(globalThis.onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname })
    )
  )
}
