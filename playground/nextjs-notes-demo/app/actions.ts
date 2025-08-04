'use server'

import { getUser, userCookieKey } from 'libs/session'
// import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { cookies } from 'next/headers'
import { setNote } from '../libs/notes'

export async function saveNote(
  noteId: string | null,
  title: string,
  body: string
) {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get(userCookieKey)
  const user = getUser(userCookie)

  if (!noteId) {
    noteId = Date.now().toString()
  }

  if (!user) {
    redirect('/')
  }

  const payload = {
    id: noteId,
    title: title.slice(0, 255),
    updated_at: Date.now(),
    body: body.slice(0, 2048),
    created_by: user
  }

  await setNote(noteId, payload)

  // revalidatePath('/')
  redirect(`/note/${noteId}`)
}

export async function deleteNote(noteId: string) {
  // revalidatePath('/')
  redirect('/')
}
