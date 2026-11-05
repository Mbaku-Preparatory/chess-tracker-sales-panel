"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { forgetGoogleChoice } from "@/components/GoogleSignIn";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CloseIcon, ListIcon, MenuIcon, OverviewIcon, TagIcon, UsersIcon } from "@/components/icons";
import { clearSession, useSession, type PanelSession } from "@/lib/session";
import { adminApi } from "@/redux/api/adminApi";
import { useAppDispatch } from "@/redux/hooks";

const NAV = [
  { href: "/overview", label: "Overview", Icon: OverviewIcon },
  { href: "/", label: "Users", Icon: UsersIcon },
  { href: "/plans", label: "Plans", Icon: TagIcon },
  { href: "/audit", label: "Audit", Icon: ListIcon },
];

const isCurrent = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" || pathname.startsWith("/users") : pathname.startsWith(href);

function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <Image src="/logo.svg" alt="" width={39} height={36} priority />
      <span className="flex flex-col leading-tight">
        <span className="font-bold text-gray-900 dark:text-gray-100">Chess Preparatory</span>
        <span className="text-xs font-medium text-brand-700 dark:text-brand-400">Sales Panel</span>
      </span>
    </Link>
  );
}

/** The sidebar's contents, shared by the desktop column and the phone drawer. */
function SidebarContent({ session, onNavigate }: { session: PanelSession; onNavigate?: () => void }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  function signOut() {
    forgetGoogleChoice();
    clearSession();
    // The users list stays in memory otherwise, for whoever signs in next.
    dispatch(adminApi.util.resetApiState());
  }

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <Brand />

      <nav aria-label="Sales panel" className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const current = isCurrent(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                current
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-100"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-gray-200 pt-4 dark:border-dark-border">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm text-gray-600 dark:text-gray-300" title={session.email}>
            {session.email}
          </span>
          <ThemeToggle className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-100" />
        </div>
        <button type="button" onClick={signOut} className="btn-secondary w-full">
          Sign out
        </button>
      </div>
    </div>
  );
}

/** The phone's menu: the sidebar, sliding in from the left over the page. */
function Drawer({ session, onClose }: { session: PanelSession; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreTo?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/50" onMouseDown={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl outline-none dark:bg-dark-surface"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute top-4 right-3 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-100"
        >
          <CloseIcon />
        </button>
        <SidebarContent session={session} onNavigate={onClose} />
      </div>
    </div>
  );
}

/**
 * The page frame. Signed in: a sidebar on the left from the lg breakpoint, and
 * below it a slim top bar whose menu button opens the same sidebar as a
 * drawer. Signed out (the sign-in page): a plain bar with the brand and the
 * theme switch.
 *
 * z-30 for the bars: Modal and the drawer are z-40 and must cover them, and
 * GlobalLoader is z-50 and stays above everything.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Stable, so the drawer's focus and scroll-lock effect runs once per opening,
  // not on every render of the page underneath.
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const signedIn = !!session && pathname !== "/sign-in";

  if (!signedIn) {
    return (
      <>
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-dark-border dark:bg-dark-bg/80">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Brand />
            <ThemeToggle className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-elevated dark:hover:text-gray-100" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-gray-200 bg-white lg:block dark:border-dark-border dark:bg-dark-surface">
        <SidebarContent session={session} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md lg:hidden dark:border-dark-border dark:bg-dark-bg/80">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="-ml-1 rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-elevated dark:hover:text-gray-100"
          >
            <MenuIcon />
          </button>
          <Brand />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

      {menuOpen && <Drawer session={session} onClose={closeMenu} />}
    </div>
  );
}
