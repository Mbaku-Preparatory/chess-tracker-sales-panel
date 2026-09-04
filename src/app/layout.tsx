import type { Metadata } from "next";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

import { GlobalLoader } from "@/components/GlobalLoader";
import { ReduxProvider } from "@/redux/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Preparatory — Sales Panel",
  description: "Internal admin panel for managing Chess Preparatory users.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning: browser extensions inject attributes onto
          <html> before React hydrates (e.g. data-scribe-recorder-ready), which
          the server HTML can't match. This suppresses attribute mismatches on
          this element only — it does not hide mismatches anywhere below. */}
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
          {/* proxy.ts enforces auth.protect() on every route except /sign-in,
              so anything below is either an authenticated admin or the sign-in
              page itself. UserButton renders nothing while signed out, which
              leaves the header as plain branding on that page. */}
          <ReduxProvider>
            <GlobalLoader />
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.svg"
                  alt=""
                  width={28}
                  height={28}
                  priority
                />
                <span className="text-sm font-semibold tracking-tight text-gray-900">
                  Chess Preparatory — Sales Panel
                </span>
              </div>
              <UserButton />
            </header>
            <main className="flex-1 p-6">{children}</main>
          </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
