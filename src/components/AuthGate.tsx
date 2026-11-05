"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearSession, useSession } from "@/lib/session";

const SIGN_IN = "/sign-in";

/**
 * Signed out, every page but /sign-in sends you there; signed in, /sign-in
 * sends you home. Nothing admin-only is in the page itself (every page fetches
 * from /admin-graphql/, which checks the session), so this is about where you
 * land, not about what you may see.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const onSignIn = pathname === SIGN_IN;

  useEffect(() => {
    if (session === undefined) return; // not known yet: see useSession
    if (!session && !onSignIn) router.replace(SIGN_IN);
    if (session && onSignIn) router.replace("/");
  }, [session, onSignIn, router]);

  // Sign out when the session runs out, rather than at the next refused request.
  useEffect(() => {
    if (!session) return;
    const ms = session.expiresAt * 1000 - Date.now();
    const timer = window.setTimeout(clearSession, Math.max(0, ms));
    return () => window.clearTimeout(timer);
  }, [session]);

  if (session === undefined) return null;
  if (onSignIn) return session ? null : children;
  return session ? children : null;
}
