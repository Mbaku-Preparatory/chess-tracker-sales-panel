/**
 * The panel's sign-in session: the token the backend issues when someone on its
 * ADMIN_EMAILS allowlist signs in with Google (chess-tracker-backend,
 * adminpanel/session.py). It lives in localStorage, so a reload or a second tab
 * stays signed in until the token expires (8 hours).
 *
 * This is only what the browser remembers. The backend checks the token on
 * every request, and that check is what keeps the data private. Watching the
 * expiry here just spares a request the backend would refuse.
 */

import { useSyncExternalStore } from "react";

export interface PanelSession {
  token: string;
  email: string;
  /** Unix seconds, from the backend. */
  expiresAt: number;
}

const KEY = "salesPanelSession";
const listeners = new Set<() => void>();

// useSyncExternalStore needs the same object back until the session changes,
// so the parsed value is kept alongside the string it came from.
let cachedRaw: string | null = null;
let cachedSession: PanelSession | null = null;

function parse(raw: string | null): PanelSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as PanelSession;
    return s.token && s.email && s.expiresAt ? s : null;
  } catch {
    return null;
  }
}

function isLive(s: PanelSession | null): s is PanelSession {
  return !!s && s.expiresAt * 1000 > Date.now();
}

/** The current session, or null when signed out or expired. */
export function readSession(): PanelSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = parse(raw);
  }
  return isLive(cachedSession) ? cachedSession : null;
}

function notify() {
  listeners.forEach((l) => l());
}

export function saveSession(session: PanelSession) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab signing in or out writes localStorage; this tab hears it here.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The session, kept current: null when signed out, and undefined while it is
 * not yet known. The server has no localStorage to read, so the first render
 * in the browser (hydration) is undefined too, and the real answer follows a
 * moment later. Treating that first render as "signed out" sent signed-in
 * admins to /sign-in and straight back again.
 */
export function useSession(): PanelSession | null | undefined {
  return useSyncExternalStore(subscribe, readSession, () => undefined);
}
