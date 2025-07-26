// import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import Link from "next/link";
import { getUser, userCookieKey } from "../lib/session.ts";

export default async function AuthButton({
  children,
  noteId,
}: {
  children: ReactNode;
  noteId: string | null;
}) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(userCookieKey);
  const user = getUser(userCookie?.value);
  const isDraft = noteId == null;

  console.log(user);
  if (user) {
    return (
      // Use hard link
      <Link href={`/note/edit/${noteId || ""}`} className="link--unstyled">
        <button
          className={["edit-button", isDraft ? "edit-button--solid" : "edit-button--outline"].join(
            " ",
          )}
          role="menuitem"
        >
          {children}
          <img
            src={`https://avatars.githubusercontent.com/${user}?s=40`}
            alt="User Avatar"
            title={user}
            className="avatar"
          />
        </button>
      </Link>
    );
  }

  return (
    <a href="/auth" className="link--unstyled">
      <button
        className={["edit-button", isDraft ? "edit-button--solid" : "edit-button--outline"].join(
          " ",
        )}
        role="menuitem"
      >
        Login to Add
      </button>
    </a>
  );
}
