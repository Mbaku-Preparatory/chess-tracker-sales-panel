"use client";

import Image from "next/image";
import Link from "next/link";

import { forgetGoogleChoice } from "@/components/GoogleSignIn";
import { ThemeToggle } from "@/components/ThemeToggle";
import { clearSession, useSession } from "@/lib/session";
import { adminApi } from "@/redux/api/adminApi";
import { useAppDispatch } from "@/redux/hooks";

/**
 * The main app's bar, with a label to say which app this is.
 *
 * z-30, not the main app's z-50: Modal is z-40 and must cover this bar, and
 * GlobalLoader is z-50 and must stay above both.
 */
export function Navbar() {
  // Signed out, AuthGate keeps the visitor on /sign-in, where this leaves the
  // bar as plain branding plus the theme switch.
  const session = useSession();
  const dispatch = useAppDispatch();

  function signOut() {
    forgetGoogleChoice();
    clearSession();
    // The users list stays in memory otherwise, for whoever signs in next.
    dispatch(adminApi.util.resetApiState());
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-dark-border dark:bg-dark-bg/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/logo.svg" alt="" width={39} height={36} priority />
          <span className="hidden text-lg font-bold text-gray-900 sm:inline dark:text-gray-100">
            Chess Preparatory
          </span>
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            Sales Panel
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-100" />
          {session && (
            <div className="ml-2 flex min-w-0 items-center gap-3 border-l border-gray-200 pl-3 dark:border-dark-border">
              <span
                className="hidden max-w-[16rem] truncate text-sm text-gray-600 md:inline dark:text-gray-300"
                title={session.email}
              >
                {session.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-elevated dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
