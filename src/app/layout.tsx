import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

import { GlobalLoader } from "@/components/GlobalLoader";
import { Navbar } from "@/components/Navbar";
import { clerkAppearance, clerkLocalization } from "@/lib/clerkAppearance";
import { THEME_SCRIPT } from "@/lib/theme";
import { ReduxProvider } from "@/redux/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Preparatory — Sales Panel",
  description: "Internal admin panel for managing Chess Preparatory users.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization}>
      {/* suppressHydrationWarning: THEME_SCRIPT adds the `dark` class to <html>
          before React hydrates, and browser extensions inject attributes there
          too (e.g. data-scribe-recorder-ready); the server HTML can't match
          either. This suppresses attribute mismatches on this element only — it
          does not hide mismatches anywhere below. */}
      <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        </head>
        <body className="flex min-h-full flex-col">
          <ReduxProvider>
            <GlobalLoader />
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
