"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * The main app's bar, with a label to say which app this is.
 *
 * z-30, not the main app's z-50: Modal is z-40 and must cover this bar, and
 * GlobalLoader is z-50 and must stay above both.
 */
export function Navbar() {
  // proxy.ts lets a signed-out visitor reach only /sign-in, where this leaves
  // the bar as plain branding plus the theme switch.
  const { isSignedIn } = useAuth();

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
          {isSignedIn && (
            <div className="ml-2 flex items-center border-l border-gray-200 pl-3 dark:border-dark-border">
              <UserButton />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
