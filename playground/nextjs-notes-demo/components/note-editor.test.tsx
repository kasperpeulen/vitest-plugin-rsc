import { configure, screen } from '@testing-library/dom'
import { userEvent } from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { setNote } from '../libs/notes'
import { getUser } from '../libs/session'
import { expectNavigation } from '../test/utilts'
import { NextRouter } from './next-router'
import NoteEditor from './note-editor'
import { renderServer } from 'vitest-plugin-rsc/testing-library'

test('note editor saves note and redirects after submitting note', async () => {
  const created_by = 'kasper'
  vi.mocked(getUser).mockReturnValue(created_by)
  const title = 'This is a title'
  const body = 'This is a body'

  await renderServer(
    <NextRouter url="/note/edit">
      <NoteEditor noteId={null} initialTitle={title} initialBody={body} />
    </NextRouter>
  )

  await userEvent.click(await screen.findByRole('menuitem', { name: 'Done' }))
  const id = Date.now().toString()
  await expectNavigation(`/note/${id}`)
  expect(setNote).toHaveBeenLastCalledWith(id, {
    id,
    title,
    body,
    created_by,
    updated_at: Date.now()
  })
})
