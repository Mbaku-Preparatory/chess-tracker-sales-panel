/**
 * Where the users list was last left: its page, search and filters, which all
 * live in its URL. "← Users" on a user's page and the Users link in the sidebar
 * go back there, so opening one account doesn't lose the place in the list.
 *
 * sessionStorage, not localStorage: each tab keeps its own place, and a fresh
 * visit starts at the top of the list.
 */

import { useSyncExternalStore } from "react";

const KEY = "users-list-href";
const HOME = "/";

// The sidebar's Users link is on screen beside the list, so it has to hear
// each change, not just read once (the same pattern as lib/theme.ts).
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the list whenever its URL changes. */
export function rememberUsersList(href: string) {
  try {
    sessionStorage.setItem(KEY, href);
  } catch {
    // Private mode or blocked storage: the links just go to the top of the list.
  }
  listeners.forEach((listener) => listener());
}

function read(): string {
  try {
    return sessionStorage.getItem(KEY) ?? HOME;
  } catch {
    return HOME;
  }
}

/** The users list as it was last left; "/" on the server and on a fresh visit. */
export function useUsersListHref(): string {
  return useSyncExternalStore(subscribe, read, () => HOME);
}
