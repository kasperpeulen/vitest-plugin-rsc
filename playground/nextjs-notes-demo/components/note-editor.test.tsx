import { screen } from '@testing-library/dom'
import { isNextRouterError } from 'next/dist/client/components/is-next-router-error'
import { expect, test, vi } from 'vitest'
import { renderServer } from 'vitest-plugin-rsc/testing-library'
import { setNote } from '../libs/notes'
import { getUser } from '../libs/session'
import { expectRedirect } from '../test/utilts'
import { NextRouter } from './next-router'
import NoteEditor from './note-editor'

test.only('notes can be saved', async ({ userEvent }) => {
  const created_by = 'storybookjs'
  vi.mocked(getUser).mockReturnValue(created_by)

  const title = 'This is a title'
  const body = 'This is a body'

  await renderServer(
    <NextRouter>
      <NoteEditor noteId={null} initialTitle={title} initialBody={body} />
    </NextRouter>,
    {
      rootOptions: {
        onCaughtError: (error) => {
          if (isNextRouterError(error)) return
          console.log(error)
        }
      }
    }
  )

  await userEvent.click(await screen.findByRole('menuitem', { name: 'Done' }))

  const id = Date.now().toString()
  await expectRedirect(`/note/${id}`)
  expect(setNote).toHaveBeenLastCalledWith<Parameters<typeof setNote>>(id, {
    id,
    title,
    body,
    created_by,
    updated_at: Date.now()
  })
})
