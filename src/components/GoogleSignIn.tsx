"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ADMIN_SIGN_IN_URL, GOOGLE_CLIENT_ID } from "@/lib/config";
import { saveSession } from "@/lib/session";
import { currentTheme, subscribeToTheme } from "@/lib/theme";

// The parts of Google Identity Services this uses.
interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (r: { credential: string }) => void;
    ux_mode?: "popup";
    itp_support?: boolean;
  }): void;
  renderButton(el: HTMLElement, options: Record<string, string | number>): void;
  prompt(): void;
  cancel(): void;
  disableAutoSelect(): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Stops One Tap signing the same Google account straight back in after a
 * sign-out. Safe to call before Google's script has loaded. */
export function forgetGoogleChoice() {
  window.google?.accounts.id.disableAutoSelect();
}

/**
 * Google's "Continue with Google" button, plus One Tap for someone already
 * signed in to Google in this browser. The backend checks Google's token and
 * the ADMIN_EMAILS allowlist, and answers with the panel's own session.
 * Saving it is all this does; AuthGate takes the admin to the users page.
 */
export function GoogleSignIn() {
  const dark = useSyncExternalStore(subscribeToTheme, currentTheme, () => "light") === "dark";
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async ({ credential }: { credential: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(ADMIN_SIGN_IN_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.detail ?? `Sign-in failed (${res.status}).`);
        setBusy(false);
        return;
      }
      saveSession({ token: body.token, email: body.email, expiresAt: body.expires_at });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const id = window.google?.accounts.id;
    if (!ready || !id || !holder.current) return;
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // signIn never changes, so the callback Google keeps is never stale.
      callback: (r) => signIn(r),
      ux_mode: "popup",
      itp_support: true,
    });
    // Google draws its button at a fixed pixel width, at most 400.
    id.renderButton(holder.current, {
      type: "standard",
      theme: dark ? "filled_black" : "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "center",
      width: Math.min(400, holder.current.offsetWidth || 320),
    });
    id.prompt();
    return () => id.cancel();
  }, [ready, dark, signIn]);

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      {/* Holds the button's height while Google's script loads. color-scheme:
          light matches Google's frame: when a dark page holds a light frame,
          the browser paints the frame an opaque white box. */}
      <div
        ref={holder}
        className={`flex min-h-[44px] justify-center [color-scheme:light] ${busy ? "pointer-events-none opacity-50" : ""}`}
      />
      {busy && (
        <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">Signing you in…</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
